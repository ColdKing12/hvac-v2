const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const auth = require('../middleware/auth');

const CK_PADRAO = [
  "Limpeza dos filtros","Limpeza da evaporadora","Limpeza da condensadora",
  "Verificação de vazamentos","Medição de corrente elétrica","Medição de tensão",
  "Verificação de pressão","Temperatura de insuflação","Temperatura de retorno","Teste de funcionamento"
];

// Listar todas as OS
router.get('/', auth, async (req,res) => {
  try {
    const r = await pool.query(`
      SELECT os.*,
        c.nome as cliente_nome, c.resp as cliente_resp, c.tel as cliente_tel, c.endereco as cliente_end,
        e.marca as equip_marca, e.modelo as equip_modelo, e.capacidade as equip_cap,
        e.num_serie as equip_serie, e.patrimonio as equip_pat, e.localizacao as equip_local,
        t.nome as tecnico_nome, t.ini as tecnico_ini, t.tel as tecnico_tel
      FROM ordens_servico os
      LEFT JOIN clientes c ON c.id = os.cliente_id
      LEFT JOIN equipamentos e ON e.id = os.equip_id
      LEFT JOIN tecnicos t ON t.id = os.tecnico_id
      ORDER BY os.data_agenda DESC, os.hora_agenda ASC
    `);
    res.json(r.rows);
  } catch(e){ res.status(500).json({erro:e.message}); }
});

// Buscar uma OS com checklist e medições
router.get('/:id', auth, async (req,res) => {
  try {
    const os = await pool.query(`
      SELECT os.*,
        c.nome as cliente_nome, c.resp as cliente_resp, c.tel as cliente_tel, c.endereco as cliente_end,
        e.marca as equip_marca, e.modelo as equip_modelo, e.capacidade as equip_cap,
        e.num_serie as equip_serie, e.patrimonio as equip_pat, e.localizacao as equip_local,
        t.nome as tecnico_nome, t.ini as tecnico_ini, t.tel as tecnico_tel
      FROM ordens_servico os
      LEFT JOIN clientes c ON c.id = os.cliente_id
      LEFT JOIN equipamentos e ON e.id = os.equip_id
      LEFT JOIN tecnicos t ON t.id = os.tecnico_id
      WHERE os.id = $1
    `, [req.params.id]);
    if (!os.rows[0]) return res.status(404).json({erro:'OS não encontrada'});
    const ck  = await pool.query('SELECT * FROM checklist WHERE os_id=$1 ORDER BY id', [req.params.id]);
    const med = await pool.query('SELECT * FROM medicoes WHERE os_id=$1', [req.params.id]);
    const fot = await pool.query('SELECT * FROM fotos WHERE os_id=$1 ORDER BY id', [req.params.id]);
    res.json({ ...os.rows[0], checklist: ck.rows, medicoes: med.rows[0]||{}, fotos: fot.rows });
  } catch(e){ res.status(500).json({erro:e.message}); }
});

// Criar nova OS
router.post('/', auth, async (req,res) => {
  const {cliente_id,equip_id,tecnico_id,tipo,data_agenda,hora_agenda,observacoes,checklist_personalizado} = req.body;
  if (!cliente_id||!tecnico_id||!tipo) return res.status(400).json({erro:'Cliente, técnico e tipo são obrigatórios'});
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const count = await client.query('SELECT COUNT(*) FROM ordens_servico');
    const codigo = `OS-${String(parseInt(count.rows[0].count)+1).padStart(3,'0')}`;
    const os = await client.query(
      `INSERT INTO ordens_servico (codigo,cliente_id,equip_id,tecnico_id,tipo,status,data_agenda,hora_agenda,observacoes)
       VALUES ($1,$2,$3,$4,$5,'Aberta',$6,$7,$8) RETURNING *`,
      [codigo,cliente_id,equip_id||null,tecnico_id,tipo,data_agenda||null,hora_agenda||null,observacoes||'']
    );
    const itens = checklist_personalizado || CK_PADRAO;
    for (const item of itens) {
      await client.query('INSERT INTO checklist (os_id,item,ok) VALUES ($1,$2,false)', [os.rows[0].id, item]);
    }
    await client.query('INSERT INTO medicoes (os_id) VALUES ($1)', [os.rows[0].id]);
    await client.query('COMMIT');
    res.status(201).json(os.rows[0]);
  } catch(e){
    await client.query('ROLLBACK');
    res.status(500).json({erro:e.message});
  } finally { client.release(); }
});

// Atualizar OS
router.put('/:id', auth, async (req,res) => {
  const {tecnico_id,tipo,status,data_agenda,hora_agenda,observacoes,assinado} = req.body;
  try {
    const r = await pool.query(
      `UPDATE ordens_servico SET tecnico_id=$1,tipo=$2,status=$3,data_agenda=$4,
       hora_agenda=$5,observacoes=$6,assinado=$7,atualizado_em=NOW() WHERE id=$8 RETURNING *`,
      [tecnico_id,tipo,status,data_agenda||null,hora_agenda||null,observacoes,assinado||false,req.params.id]
    );
    res.json(r.rows[0]);
  } catch(e){ res.status(500).json({erro:e.message}); }
});

// Atualizar checklist
router.patch('/:id/checklist', auth, async (req,res) => {
  const {itens} = req.body;
  try {
    for (const item of itens) {
      await pool.query('UPDATE checklist SET ok=$1 WHERE id=$2 AND os_id=$3',[item.ok,item.id,req.params.id]);
    }
    res.json({mensagem:'Checklist atualizado'});
  } catch(e){ res.status(500).json({erro:e.message}); }
});

// Atualizar medições
router.patch('/:id/medicoes', auth, async (req,res) => {
  const {temp_amb,temp_insuf,temp_ret,alta_pres,baixa_pres,corrente,tensao} = req.body;
  try {
    await pool.query(
      `UPDATE medicoes SET temp_amb=$1,temp_insuf=$2,temp_ret=$3,alta_pres=$4,
       baixa_pres=$5,corrente=$6,tensao=$7 WHERE os_id=$8`,
      [temp_amb,temp_insuf,temp_ret,alta_pres,baixa_pres,corrente,tensao,req.params.id]
    );
    res.json({mensagem:'Medições salvas'});
  } catch(e){ res.status(500).json({erro:e.message}); }
});

// Excluir OS
router.delete('/:id', auth, async (req,res) => {
  try {
    await pool.query('DELETE FROM ordens_servico WHERE id=$1',[req.params.id]);
    res.json({mensagem:'OS excluída'});
  } catch(e){ res.status(500).json({erro:e.message}); }
});

module.exports = router;
