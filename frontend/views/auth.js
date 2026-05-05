// views/auth.js
// --- LEMBRAR E-MAIL ---
window.onload = () => {
    const emailSalvo = localStorage.getItem('lembrar_email_qt');
    if (emailSalvo) {
        document.getElementById('email').value = emailSalvo;
        document.getElementById('lembrarEmail').checked = true;
    }
};

// MAPEAMENTO DOS ELEMENTOS DAS CAIXAS
const boxLogin = document.getElementById('boxLogin');
const boxCadastro = document.getElementById('boxCadastro');
const linkIrParaCadastro = document.getElementById('linkIrParaCadastro');
const linkIrParaLogin = document.getElementById('linkIrParaLogin');

// LÓGICA PARA ALTERNAR ENTRE LOGIN E CADASTRO
linkIrParaCadastro.addEventListener('click', (evento) => {
    evento.preventDefault();
    boxLogin.style.display = 'none';
    boxCadastro.style.display = 'block';
});

linkIrParaLogin.addEventListener('click', (evento) => {
    evento.preventDefault();
    boxCadastro.style.display = 'none';
    boxLogin.style.display = 'block';
});

// LÓGICA DE LOGIN
document.getElementById('loginForm').addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    try {
        const resposta = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const dados = await resposta.json();

        // --- COMEÇO DA SUBSTITUIÇÃO ---
        if (resposta.ok) {
            // Lógica do Lembrar E-mail
            if (document.getElementById('lembrarEmail').checked) {
                localStorage.setItem('lembrar_email_qt', email);
            } else {
                localStorage.removeItem('lembrar_email_qt');
            }

            localStorage.setItem('usuarioLogado', JSON.stringify(dados.usuario));
            
            // VERIFICAÇÃO DE TROCA OBRIGATÓRIA DA SENHA
            if (dados.usuario.trocar_senha_obrigatorio) {
                window.location.href = 'change-password.html'; // Joga para a tela de nova senha
            } else if (dados.usuario.is_admin) {
                window.location.href = 'admin-dashboard.html'; // Joga pro painel Admin
            } else {
                window.location.href = 'user-dashboard.html'; // Joga pro painel Comum
            }
        } else {
            alert('Erro ao logar: ' + dados.erro);
        }
        // --- FIM DA SUBSTITUIÇÃO ---

    } catch (erro) {
        console.error('Erro na conexão:', erro);
        alert('Servidor Node.js está desligado ou inacessível.');
    }
});

// LÓGICA DE CADASTRO REAL DO USUÁRIO
document.getElementById('cadastroForm').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    
    // Captura o que o usuário digitou
    const nome = document.getElementById('nomeCadastro').value;
    const email = document.getElementById('emailCadastro').value;
    const senha = document.getElementById('senhaCadastro').value;

    try {
        const resposta = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            alert('Conta criada com sucesso! Agora você pode fazer o login.');
            // Limpa o formulário de cadastro
            document.getElementById('cadastroForm').reset();
            
            // Voltar automaticamente para a tela de login
            boxCadastro.style.display = 'none';
            boxLogin.style.display = 'block';
            
            // Já preenche o e-mail no login para facilitar a vida do usuário
            document.getElementById('email').value = email;
            document.getElementById('senha').focus();
        } else {
            alert('Erro ao cadastrar: ' + dados.erro);
        }
    } catch (erro) {
        console.error('Erro ao cadastrar:', erro);
        alert('Erro de conexão com o servidor.');
    }
});
// --- ESQUECI MINHA SENHA ---
const linkEsqueciSenha = document.getElementById('linkEsqueciSenha');

if (linkEsqueciSenha) {
    linkEsqueciSenha.addEventListener('click', async (e) => {
        e.preventDefault(); // Evita que a página recarregue ao clicar no link
        
        // Pede o e-mail do usuário
        const email = prompt('Digite o e-mail cadastrado na sua conta para recuperar a senha:');
        
        // Se o usuário clicar em "Cancelar" ou deixar vazio, encerra a função
        if (!email) return; 

        try {
            const resposta = await fetch('http://localhost:3000/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const dados = await resposta.json();
            
            // Exibe o aviso que as instruções foram enviadas
            alert(dados.mensagem); 
            
        } catch (erro) {
            console.error('Erro:', erro);
            alert('Erro ao processar a solicitação. Verifique se o servidor está rodando.');
        }
    });
}