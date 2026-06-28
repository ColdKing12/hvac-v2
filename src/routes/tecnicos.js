const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const auth = require('../middleware/auth');

router.get('/',     auth, async (req,res) => { try { res.json((await pool.query('SELECT * FROM tecnicos WHERE ativo=true ORDER BY nome')).rows); } catch(e){ res.status(500).json({erro:e.message}); }});
router.get('/:id',  auth, async (req,res) => { try { const r=await pool.query('SELECT * FROM tecnicos WHERE id=$1',[req.params.id]); r.rows[0]?res.json(r.rows[0]):res.status(404).json({erro:'Não encontrado'}); } catch(e){ res.status(500).json({erro:e.message}); }});
router.post('/',    auth, async (req,res) => { const {nome,tel,email}=req.body; if(!nome)return res.status(400).json({erro:'Nome obrigatório'}); const ini=nome.split(' ').slice(0,2).map(p=>p[0]).join('').toUpperCase(); try { res.status(201).json((await pool.query('INSERT INTO tecnicos (nome,ini,tel,email) VALUES ($1,$2,$3,$4) RETURNING *',[nome,ini,tel,email])).rows[0]); } catch(e){ res.status(500).json({erro:e.message}); }});
router.put('/:id',  auth, async (req,res) => { const {nome,tel,email}=req.body; const ini=nome?nome.split(' ').slice(0,2).map(p=>p[0]).join('').toUpperCase():''; try { res.json((await pool.query('UPDATE tecnicos SET nome=$1,ini=$2,tel=$3,email=$4 WHERE id=$5 RETURNING *',[nome,ini,tel,email,req.params.id])).rows[0]); } catch(e){ res.status(500).json({erro:e.message}); }});
router.delete('/:id',auth,async (req,res) => { try { await pool.query('UPDATE tecnicos SET ativo=false WHERE id=$1',[req.params.id]); res.json({mensagem:'Desativado'}); } catch(e){ res.status(500).json({erro:e.message}); }});

module.exports = router;
