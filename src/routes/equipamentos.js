const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const auth = require('../middleware/auth');

router.get('/', auth, async (req,res) => { try { res.json((await pool.query('SELECT e.*,c.nome as cliente_nome FROM equipamentos e LEFT JOIN clientes c ON c.id=e.cliente_id ORDER BY c.nome,e.marca')).rows); } catch(e){ res.status(500).json({erro:e.message}); }});
router.get('/cliente/:cid', auth, async (req,res) => { try { res.json((await pool.query('SELECT * FROM equipamentos WHERE cliente_id=$1 ORDER BY marca',[req.params.cid])).rows); } catch(e){ res.status(500).json({erro:e.message}); }});
router.get('/:id', auth, async (req,res) => { try { const r=await pool.query('SELECT * FROM equipamentos WHERE id=$1',[req.params.id]); r.rows[0]?res.json(r.rows[0]):res.status(404).json({erro:'Não encontrado'}); } catch(e){ res.status(500).json({erro:e.message}); }});
router.post('/', auth, async (req,res) => { const {cliente_id,marca,modelo,capacidade,num_serie,patrimonio,localizacao,dt_instalacao,dt_ult_manut}=req.body; if(!cliente_id||!marca)return res.status(400).json({erro:'Cliente e marca obrigatórios'}); try { res.status(201).json((await pool.query('INSERT INTO equipamentos (cliente_id,marca,modelo,capacidade,num_serie,patrimonio,localizacao,dt_instalacao,dt_ult_manut) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',[cliente_id,marca,modelo,capacidade,num_serie,patrimonio,localizacao,dt_instalacao||null,dt_ult_manut||null])).rows[0]); } catch(e){ res.status(500).json({erro:e.message}); }});
router.put('/:id', auth, async (req,res) => { const {cliente_id,marca,modelo,capacidade,num_serie,patrimonio,localizacao,dt_instalacao,dt_ult_manut}=req.body; try { res.json((await pool.query('UPDATE equipamentos SET cliente_id=$1,marca=$2,modelo=$3,capacidade=$4,num_serie=$5,patrimonio=$6,localizacao=$7,dt_instalacao=$8,dt_ult_manut=$9 WHERE id=$10 RETURNING *',[cliente_id,marca,modelo,capacidade,num_serie,patrimonio,localizacao,dt_instalacao||null,dt_ult_manut||null,req.params.id])).rows[0]); } catch(e){ res.status(500).json({erro:e.message}); }});
router.delete('/:id', auth, async (req,res) => { try { await pool.query('DELETE FROM equipamentos WHERE id=$1',[req.params.id]); res.json({mensagem:'Excluído'}); } catch(e){ res.status(500).json({erro:e.message}); }});

module.exports = router;
