// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); // Biblioteca para encriptar senhas
const db = require('../config/db');

// POST /api/auth/register - Cadastro de novo usuário
router.post('/register', async (req, res) => {
    try {
        const { nome, email, senha } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
        }

        // Verifica se o email já existe no banco
        const [usuariosExistentes] = await db.execute('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (usuariosExistentes.length > 0) {
            return res.status(400).json({ erro: 'Este e-mail já está em uso.' });
        }

        // Criptografa a senha antes de salvar (nível de segurança 10)
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        // Insere no banco
        const sql = 'INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)';
        await db.execute(sql, [nome, email, senhaHash]);

        res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso!' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao cadastrar usuário.' });
    }
});

// POST /api/auth/login - Autenticação no sistema
router.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        // Busca o usuário pelo e-mail
        const [usuarios] = await db.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
        
        if (usuarios.length === 0) {
            return res.status(404).json({ erro: 'Usuário não encontrado.' });
        }

        const usuario = usuarios[0];

        // Compara a senha digitada com o hash salvo no banco
        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
        if (!senhaValida) {
            return res.status(401).json({ erro: 'Senha incorreta.' });
        }

        // Se deu tudo certo, devolve os dados (sem a senha) para o frontend salvar na sessão
        res.status(200).json({
            mensagem: 'Login realizado com sucesso!',
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                is_admin: usuario.is_admin,
                trocar_senha_obrigatorio: usuario.trocar_senha_obrigatorio
            }
        });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao fazer login.' });
    }
});
// PUT /api/auth/update-password - Troca a senha provisória pela definitiva
router.put('/update-password', async (req, res) => {
    try {
        const { usuario_id, novaSenha } = req.body;

        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(novaSenha, salt);

        // Atualiza a senha e DESATIVA a trava de troca obrigatória
        const sql = 'UPDATE usuarios SET senha_hash = ?, trocar_senha_obrigatorio = false WHERE id = ?';
        await db.execute(sql, [senhaHash, usuario_id]);

        res.status(200).json({ mensagem: 'Senha atualizada com sucesso!' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao atualizar a senha.' });
    }
});

module.exports = router;