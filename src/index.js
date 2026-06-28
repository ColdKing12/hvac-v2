const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/auth',         require('./routes/auth'));
app.use('/api/clientes',     require('./routes/clientes'));
app.use('/api/tecnicos',     require('./routes/tecnicos'));
app.use('/api/equipamentos', require('./routes/equipamentos'));
app.use('/api/os',           require('./routes/os'));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`HVAC System rodando na porta ${PORT}`);
});
