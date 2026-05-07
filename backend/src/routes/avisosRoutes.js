const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET - Busca todos os avisos (aberto para admins e usuários comuns)
router.get('/', async (req, res) => {
    try {
        // Traz os 5 avisos mais recentes
        const sql = `
            SELECT a.*, u.nome AS autor 
            FROM avisos a 
            LEFT JOIN usuarios u ON a.admin_id = u.id 
            ORDER BY a.data_criacao DESC
            LIMIT 5
        `;
        const [avisos] = await db.execute(sql);
        res.status(200).json(avisos);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar avisos.' });
    }
});

// POST - Cria um novo aviso (Feito pelo Admin)
router.post('/', async (req, res) => {
    try {
        const { titulo, mensagem, admin_id } = req.body;
        await db.execute('INSERT INTO avisos (titulo, mensagem, admin_id) VALUES (?, ?, ?)', [titulo, mensagem, admin_id]);
        res.status(201).json({ mensagem: 'Aviso publicado com sucesso!' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao publicar aviso.' });
    }
});

// DELETE - Apaga um aviso (Feito pelo Admin)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM avisos WHERE id = ?', [id]);
        res.status(200).json({ mensagem: 'Aviso removido com sucesso!' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao remover aviso.' });
    }
});

module.exports = router;