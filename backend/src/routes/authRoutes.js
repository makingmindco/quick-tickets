// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); // Biblioteca para encriptar senhas
const db = require('../config/db');
const nodemailer = require('nodemailer');
const crypto = require('crypto'); // Biblioteca nativa do Node para gerar códigos aleatórios
// POST /api/auth/register - Cadastro de novo usuário

// Configuração do "Carteiro" (Exemplo usando Gmail)
// ATENÇÃO: Você precisa usar uma "Senha de Aplicativo" do Google, não a sua senha normal.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'testeapps616@gmail.com', 
        pass: 'iwki uvoc qqcj psiw' 
    }
});
// POST /api/auth/register - Cadastro com envio de E-mail
router.post('/register', async (req, res) => {
    try {
        const { nome, email, senha } = req.body;

        const [usuariosExistentes] = await db.execute('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (usuariosExistentes.length > 0) return res.status(400).json({ erro: 'Este e-mail já está cadastrado.' });

        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        // 1. Gera um Token único e define a validade (ex: 24 horas a partir de agora)
        const token = crypto.randomBytes(20).toString('hex');
        const dataExpiracao = new Date();
        dataExpiracao.setMinutes(dataExpiracao.getMinutes() + 1); // Limite de 24 horas

        // 2. Salva no banco com o email_confirmado = false (0)
        const sql = 'INSERT INTO usuarios (nome, email, senha_hash, token_confirmacao, token_expiracao) VALUES (?, ?, ?, ?, ?)';
        await db.execute(sql, [nome, email, senhaHash, token, dataExpiracao]);

        // 3. Envia o e-mail
        const linkConfirmacao = `http://localhost:3000/api/auth/confirmar/${token}`;
        
        const emailConfig = {
            from: 'testeapps616@gmail.com',
            to: email,
            subject: 'QuickTickets - Confirme seu cadastro',
            html: `
                <h2>Bem-vindo ao QuickTickets, ${nome}!</h2>
                <p>Para ativar sua conta, por favor confirme seu e-mail clicando no link abaixo:</p>
                <a href="${linkConfirmacao}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Confirmar Meu E-mail</a>
                <p><strong>Atenção:</strong> Este link expira em 24 horas. Após esse prazo, seu cadastro será cancelado.</p>
            `
        };

        await transporter.sendMail(emailConfig);

        res.status(201).json({ mensagem: 'Usuário cadastrado! Verifique seu e-mail para ativar a conta.' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao cadastrar usuário.' });
    }
});


// GET /api/auth/confirmar/:token - Rota que o usuário acessa ao clicar no e-mail
router.get('/confirmar/:token', async (req, res) => {
    try {
        const token = req.params.token;

        // Procura se existe alguém com esse token e se ainda não passou do prazo
        const [usuarios] = await db.execute('SELECT id FROM usuarios WHERE token_confirmacao = ? AND token_expiracao > NOW()', [token]);

        if (usuarios.length === 0) {
            return res.status(400).send('<h1>Erro</h1><p>Este link de confirmação é inválido ou já expirou. Por favor, cadastre-se novamente.</p>');
        }

        const userId = usuarios[0].id;

        // Atualiza o banco: ativa a conta e limpa o token
        await db.execute('UPDATE usuarios SET email_confirmado = 1, token_confirmacao = NULL, token_expiracao = NULL WHERE id = ?', [userId]);

        // Redireciona o usuário para a tela inicial para ele fazer login
        res.status(200).send(`
            <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px; background: #f8fafc; padding: 40px; border-radius: 8px; max-width: 500px; margin: 50px auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h1 style="color: #10b981;">E-mail Confirmado!</h1>
                <p style="color: #334155; font-size: 16px;">Sua conta no QuickTickets foi ativada com sucesso.</p>
                <p style="color: #64748b; margin-top: 20px;">Você já pode fechar esta aba e voltar para a tela de Login.</p>
            </div>
        `);

    } catch (erro) {
        console.error(erro);
        res.status(500).send('Erro ao confirmar e-mail.');
    }
});

// POST /api/auth/login - Autenticação do usuário
router.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        // 1. Busca o usuário no banco (com o asterisco * para trazer todas as colunas)
        const [usuarios] = await db.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
        
        if (usuarios.length === 0) {
            return res.status(400).json({ erro: 'E-mail ou senha incorretos.' });
        }

        // 2. Coloca os dados encontrados em uma variável padrão chamada 'user'
        const user = usuarios[0];

        // 3. Verifica a senha
        const senhaValida = await bcrypt.compare(senha, user.senha_hash);
        if (!senhaValida) {
            return res.status(400).json({ erro: 'E-mail ou senha incorretos.' });
        }

        // 4. VERIFICA SE O E-MAIL FOI CONFIRMADO (Ignora se for admin)
        if (user.email_confirmado === 0 && user.is_admin === 0) {
            return res.status(403).json({ erro: 'Por favor, confirme seu e-mail antes de fazer login.' });
        }

        // 5. Devolve os dados para o Frontend (usando a variável 'user' que criamos acima)
        res.status(200).json({
            mensagem: 'Login realizado com sucesso',
            usuario: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                is_admin: user.is_admin,
                trocar_senha_obrigatorio: user.trocar_senha_obrigatorio
            }
        });

    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro interno no servidor.' });
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