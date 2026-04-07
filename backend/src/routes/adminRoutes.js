// src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/admin/tickets - Retorna os tickets pendentes/em andamento para o Admin
router.get('/tickets', async (req, res) => {
    try {
        const sql = `
            SELECT t.id, t.descricao, t.status, t.prazo, t.criado_em, 
                   c.nome AS categoria, u.nome AS cliente 
            FROM tickets t
            JOIN categorias c ON t.categoria_id = c.id
            JOIN usuarios u ON t.usuario_id = u.id
            WHERE t.status != 'finalizado'
            ORDER BY t.criado_em ASC
        `;
        const [tickets] = await db.execute(sql);
        res.status(200).json(tickets);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao carregar o painel de chamados.' });
    }
});

// PUT /api/admin/tickets/:id/status - Admin atualiza status, aceita e define prazo
router.put('/tickets/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, prazo, admin_id } = req.body;

        const sql = `
            UPDATE tickets 
            SET status = ?, prazo = ?, admin_id = ? 
            WHERE id = ?
        `;
        const [resultado] = await db.execute(sql, [status, prazo, admin_id, id]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ erro: 'Ticket não encontrado.' });
        }

        res.status(200).json({ mensagem: 'Ticket atualizado com sucesso.' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao atualizar o ticket.' });
    }
});

// GET /api/admin/dashboard - Retorna estatísticas para ilustrar os gráficos
router.get('/dashboard', async (req, res) => {
    try {
        // Conta a quantidade de tickets por status
        const sql = `
            SELECT status, COUNT(*) as total 
            FROM tickets 
            GROUP BY status
        `;
        const [contagem] = await db.execute(sql);
        
        // Formata os dados de forma amigável para o Chart.js no frontend
        const estatisticas = {
            pendente: 0,
            em_andamento: 0,
            finalizado: 0
        };

        contagem.forEach(item => {
            if(estatisticas[item.status] !== undefined) {
                estatisticas[item.status] = item.total;
            }
        });

        res.status(200).json(estatisticas);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao gerar dados do dashboard.' });
    }
});

const bcrypt = require('bcrypt'); // Adicione esta linha no TOPO do arquivo, junto dos outros requires

// GET /api/admin/tickets/finalizados - Retorna os tickets resolvidos (Histórico)
router.get('/tickets/finalizados', async (req, res) => {
    try {
        const sql = `
            SELECT t.id, t.descricao, t.status, t.criado_em, 
                   c.nome AS categoria, u.nome AS cliente, a.nome AS admin_nome 
            FROM tickets t
            JOIN categorias c ON t.categoria_id = c.id
            JOIN usuarios u ON t.usuario_id = u.id
            LEFT JOIN usuarios a ON t.admin_id = a.id
            WHERE t.status = 'finalizado'
            ORDER BY t.criado_em DESC
        `;
        const [tickets] = await db.execute(sql);
        res.status(200).json(tickets);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao carregar o histórico de chamados.' });
    }
});
// ... (suas rotas anteriores) ...

// POST /api/admin/register - Cadastra um novo administrador
router.post('/register', async (req, res) => {
    try {
        const { nome, email, senha } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
        }

        // Verifica se o email já existe
        const [usuariosExistentes] = await db.execute('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (usuariosExistentes.length > 0) {
            return res.status(400).json({ erro: 'Este e-mail já está cadastrado.' });
        }

        // Criptografa a senha
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        // Insere no banco forçando o is_admin como TRUE (1 no MySQL)
        const sql = 'INSERT INTO usuarios (nome, email, senha_hash, is_admin, trocar_senha_obrigatorio) VALUES (?, ?, ?, true, true)';
        await db.execute(sql, [nome, email, senhaHash]);

        res.status(201).json({ mensagem: 'Novo administrador cadastrado com sucesso!' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao cadastrar administrador.' });
    }
});
// GET /api/admin/reports - Gera relatório com filtros de data
router.get('/reports', async (req, res) => {
    try {
        const { periodo } = req.query; // Pega o filtro da URL (ex: ?periodo=semana)
        let filtroData = '';

        // Monta o filtro SQL com base na escolha do painel
        if (periodo === 'dia') {
            filtroData = 'WHERE t.criado_em >= NOW() - INTERVAL 1 DAY';
        } else if (periodo === 'semana') {
            filtroData = 'WHERE t.criado_em >= NOW() - INTERVAL 7 DAY';
        } else if (periodo === 'mes') {
            filtroData = 'WHERE t.criado_em >= NOW() - INTERVAL 1 MONTH';
        }

        const sql = `
            SELECT t.id, t.status, t.criado_em, 
                   c.nome AS categoria, u.nome AS cliente 
            FROM tickets t
            JOIN categorias c ON t.categoria_id = c.id
            JOIN usuarios u ON t.usuario_id = u.id
            ${filtroData}
            ORDER BY t.criado_em DESC
        `;
        
        const [tickets] = await db.execute(sql);
        res.status(200).json(tickets);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao gerar o relatório.' });
    }
});
module.exports = router;