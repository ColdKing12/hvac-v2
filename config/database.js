const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Erro banco de dados:', err.message);
  } else {
    console.log('PostgreSQL conectado!');
    release();
    criarTabelas();
  }
});

async function criarTabelas() {
  const sql = `
    CREATE TABLE IF NOT EXISTS clientes (
      id SERIAL PRIMARY KEY, nome VARCHAR(150) NOT NULL,
      cnpj VARCHAR(30), resp VARCHAR(100), tel VARCHAR(30),
      email VARCHAR(100), endereco TEXT, criado_em TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS tecnicos (
      id SERIAL PRIMARY KEY, nome VARCHAR(100) NOT NULL,
      ini VARCHAR(5), tel VARCHAR(30), email VARCHAR(100),
      ativo BOOLEAN DEFAULT true, criado_em TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS equipamentos (
      id SERIAL PRIMARY KEY, cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
      marca VARCHAR(80), modelo VARCHAR(80), capacidade VARCHAR(40),
      num_serie VARCHAR(80), patrimonio VARCHAR(80), localizacao VARCHAR(100),
      dt_instalacao DATE, dt_ult_manut DATE, criado_em TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ordens_servico (
      id SERIAL PRIMARY KEY, codigo VARCHAR(20) UNIQUE NOT NULL,
      cliente_id INTEGER REFERENCES clientes(id),
      equip_id INTEGER REFERENCES equipamentos(id),
      tecnico_id INTEGER REFERENCES tecnicos(id),
      tipo VARCHAR(30) NOT NULL, status VARCHAR(30) DEFAULT 'Aberta',
      data_agenda DATE, hora_agenda TIME, observacoes TEXT,
      assinado BOOLEAN DEFAULT false,
      criado_em TIMESTAMP DEFAULT NOW(), atualizado_em TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS checklist (
      id SERIAL PRIMARY KEY, os_id INTEGER REFERENCES ordens_servico(id) ON DELETE CASCADE,
      item VARCHAR(150) NOT NULL, ok BOOLEAN DEFAULT false
    );
    CREATE TABLE IF NOT EXISTS medicoes (
      id SERIAL PRIMARY KEY, os_id INTEGER REFERENCES ordens_servico(id) ON DELETE CASCADE,
      temp_amb VARCHAR(10), temp_insuf VARCHAR(10), temp_ret VARCHAR(10),
      alta_pres VARCHAR(10), baixa_pres VARCHAR(10), corrente VARCHAR(10), tensao VARCHAR(10)
    );
    CREATE TABLE IF NOT EXISTS fotos (
      id SERIAL PRIMARY KEY, os_id INTEGER REFERENCES ordens_servico(id) ON DELETE CASCADE,
      tipo VARCHAR(20), url TEXT, criado_em TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY, nome VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL, senha VARCHAR(255) NOT NULL,
      perfil VARCHAR(20) DEFAULT 'tecnico', ativo BOOLEAN DEFAULT true,
      criado_em TIMESTAMP DEFAULT NOW()
    );
    INSERT INTO usuarios (nome, email, senha, perfil)
    VALUES ('Administrador', 'admin@hvac.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
    ON CONFLICT (email) DO NOTHING;
  `;
  try {
    await pool.query(sql);
    console.log('Tabelas criadas com sucesso!');
  } catch (err) {
    console.error('Erro ao criar tabelas:', err.message);
  }
}

module.exports = pool;
