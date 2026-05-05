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
// --- ROTINA DE LIMPEZA (RODA A CADA 1 HORA) ---
setInterval(async () => {
    try {
        const db = require('./config/db'); // Chame a conexão do banco
        // Apaga todo mundo que não confirmou o e-mail E que a data de expiração já passou
        const sql = 'DELETE FROM usuarios WHERE email_confirmado = 0 AND token_expiracao < NOW()';
        const [resultado] = await db.execute(sql);
        
        if (resultado.affectedRows > 0) {
            console.log(`[Faxina] ${resultado.affectedRows} contas fantasmas excluídas.`);
        }
    } catch (erro) {
        console.error('Erro na rotina de limpeza:', erro);
    }
}, 3600000); // <-- Mudei aqui para 3600000 (1 hora)
// ----------------------------------------------
app.listen(PORT, () => {
    console.log(`Servidor QuickTickets em execução na porta ${PORT}`);
});