const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const auth = require('../middleware/auth');

router.get('/',     auth, async (req,res) => { try { res.json((await pool.query('SELECT * FROM clientes ORDER BY nome')).rows); } catch(e){ res.status(500).json({erro:e.message}); }});
router.get('/:id',  auth, async (req,res) => { try { const r=await pool.query('SELECT * FROM clientes WHERE id=$1',[req.params.id]); r.rows[0]?res.json(r.rows[0]):res.status(404).json({erro:'Não encontrado'}); } catch(e){ res.status(500).json({erro:e.message}); }});
router.post('/',    auth, async (req,res) => { const {nome,cnpj,resp,tel,email,endereco}=req.body; if(!nome)return res.status(400).json({erro:'Nome obrigatório'}); try { res.status(201).json((await pool.query('INSERT INTO clientes (nome,cnpj,resp,tel,email,endereco) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',[nome,cnpj,resp,tel,email,endereco])).rows[0]); } catch(e){ res.status(500).json({erro:e.message}); }});
router.put('/:id',  auth, async (req,res) => { const {nome,cnpj,resp,tel,email,endereco}=req.body; try { res.json((await pool.query('UPDATE clientes SET nome=$1,cnpj=$2,resp=$3,tel=$4,email=$5,endereco=$6 WHERE id=$7 RETURNING *',[nome,cnpj,resp,tel,email,endereco,req.params.id])).rows[0]); } catch(e){ res.status(500).json({erro:e.message}); }});
router.delete('/:id',auth,async (req,res) => { try { await pool.query('DELETE FROM clientes WHERE id=$1',[req.params.id]); res.json({mensagem:'Excluído'}); } catch(e){ res.status(500).json({erro:e.message}); }});

module.exports = router;
