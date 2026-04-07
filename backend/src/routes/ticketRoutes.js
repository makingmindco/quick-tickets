// src/routes/ticketRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/tickets/public - Lista todos os tickets em aberto (Comunidade)
router.get('/public', async (req, res) => {
    try {
        const sql = `
            SELECT t.id, t.descricao, t.status, t.criado_em, c.nome AS categoria 
            FROM tickets t
            JOIN categorias c ON t.categoria_id = c.id
            WHERE t.status != 'finalizado'
            ORDER BY t.criado_em DESC
        `;
        const [tickets] = await db.execute(sql);
        res.status(200).json(tickets);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar chamados da comunidade.' });
    }
});

// POST /api/tickets - Cria um novo chamado (botão central)
router.post('/', async (req, res) => {
    try {
        const { usuario_id, categoria_id, descricao } = req.body;

        if (!usuario_id || !categoria_id || !descricao) {
            return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
        }

        const sql = `
            INSERT INTO tickets (usuario_id, categoria_id, descricao, status) 
            VALUES (?, ?, ?, 'pendente')
        `;
        const [resultado] = await db.execute(sql, [usuario_id, categoria_id, descricao]);

        res.status(201).json({ 
            mensagem: 'Ticket aberto com sucesso!',
            ticket_id: resultado.insertId 
        });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro interno ao criar o ticket.' });
    }
});

// GET /api/tickets/me/:usuario_id - Lista os tickets do próprio usuário
router.get('/me/:usuario_id', async (req, res) => {
    try {
        const { usuario_id } = req.params;
        
        const sql = `
            SELECT t.id, t.descricao, t.status, t.criado_em, c.nome AS categoria 
            FROM tickets t
            JOIN categorias c ON t.categoria_id = c.id
            WHERE t.usuario_id = ?
            ORDER BY t.criado_em DESC
        `;
        const [tickets] = await db.execute(sql, [usuario_id]);
        res.status(200).json(tickets);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar os tickets.' });
    }
});

// PUT /api/tickets/:id/close - Permite que o usuário encerre seu próprio ticket
router.put('/:id/close', async (req, res) => {
    try {
        const { id } = req.params;
        const { usuario_id } = req.body; 

        const sql = `
            UPDATE tickets 
            SET status = 'finalizado' 
            WHERE id = ? AND usuario_id = ?
        `;
        const [resultado] = await db.execute(sql, [id, usuario_id]);
        
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ erro: 'Ticket não encontrado ou permissão negada.' });
        }
        res.status(200).json({ mensagem: 'Ticket encerrado com sucesso.' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao encerrar o ticket.' });
    }
});

module.exports = router;