const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../config/database');

router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ erro: 'Email e senha obrigatórios' });
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email=$1 AND ativo=true', [email]);
    const usuario = result.rows[0];
    if (!usuario) return res.status(401).json({ erro: 'Usuário não encontrado' });
    const ok = await bcrypt.compare(senha, usuario.senha);
    if (!ok) return res.status(401).json({ erro: 'Senha incorreta' });
    const token = jwt.sign({ id: usuario.id, nome: usuario.nome, perfil: usuario.perfil }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, usuario: { id: usuario.id, nome: usuario.nome, perfil: usuario.perfil } });
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

router.post('/registro', async (req, res) => {
  const { nome, email, senha, perfil } = req.body;
  if (!nome || !email || !senha) return res.status(400).json({ erro: 'Dados obrigatórios' });
  try {
    const hash = await bcrypt.hash(senha, 10);
    const result = await pool.query(
      'INSERT INTO usuarios (nome,email,senha,perfil) VALUES ($1,$2,$3,$4) RETURNING id,nome,email,perfil',
      [nome, email, hash, perfil||'tecnico']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ erro: 'E-mail já cadastrado' });
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
