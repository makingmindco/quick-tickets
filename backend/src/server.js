// src/server.js
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware para processar JSON
app.use(cors());
app.use(express.json());

// Importação dos arquivos de rotas
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Definição dos prefixos das rotas
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor QuickTickets em execução na porta ${PORT}`);
});