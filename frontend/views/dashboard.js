// views/dashboard.js

// 1. VERIFICAÇÃO DE SEGURANÇA (Autenticação)
// Busca os dados do usuário que salvamos no localStorage durante o login
const usuarioString = localStorage.getItem('usuarioLogado');

if (!usuarioString) {
    // Se não tiver ninguém logado, expulsa de volta para a tela de login
    alert('Você precisa fazer login primeiro!');
    window.location.href = 'login.html'; // Ajuste se o nome do seu arquivo de login for outro
}

// Converte a string de volta para objeto JavaScript
const usuarioLogado = JSON.parse(usuarioString);

// Atualiza o nome no menu lateral
document.getElementById('nomeUsuario').innerText = `Olá, ${usuarioLogado.nome}`;


// 2. MAPEAMENTO DOS ELEMENTOS DA TELA
const btnAbrirChamado = document.getElementById('btnAbrirChamado');
const btnNovoChamadoMenu = document.getElementById('btnNovoChamadoMenu');
const btnSair = document.getElementById('btnSair');
const caixaFormulario = document.getElementById('caixaFormulario');
const formTicket = document.getElementById('formTicket');
const mensagemSucesso = document.getElementById('mensagemSucesso');
const areaTickets = document.getElementById('areaTickets');
const btnComunidade = document.getElementById('btnComunidade');
const tituloAreaTickets = document.querySelector('#areaTickets h2'); // Para mudarmos o título dinamicamente


// 3. LÓGICA DE NAVEGAÇÃO E INTERFACE
function exibirFormulario() {
    // Esconde o botão grande e a área de tickets
    btnAbrirChamado.style.display = 'none';
    areaTickets.style.display = 'none';
    
    // Mostra o formulário
    caixaFormulario.classList.add('ativo');
}

// Aciona a função tanto no botão central quanto no menu lateral
btnAbrirChamado.addEventListener('click', exibirFormulario);
btnNovoChamadoMenu.addEventListener('click', exibirFormulario);

// Função de Logout (Usuário)
btnSair.addEventListener('click', (evento) => {
    evento.preventDefault(); // Impede o navegador de tentar abrir um link em branco
    
    // Remove os dados do usuário da memória do navegador
    localStorage.removeItem('usuarioLogado'); 
    
    // Redireciona para a tela inicial de login
    window.location.href = 'login.html'; 
});


// 4. INTEGRAÇÃO COM O BACKEND (Criar Chamado)
formTicket.addEventListener('submit', async (evento) => {
    evento.preventDefault(); // Evita que a página recarregue

    // Captura os dados preenchidos
    const categoria_id = document.getElementById('categoriaTicket').value;
    const descricao = document.getElementById('descricaoTicket').value;

    try {
        // Dispara a requisição POST para a nossa rota no Node.js
        const resposta = await fetch('http://localhost:3000/api/tickets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                usuario_id: usuarioLogado.id, // Pega o ID do usuário da sessão
                categoria_id: categoria_id,
                descricao: descricao
            })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            // Sucesso! Mostra o alerta verde
            mensagemSucesso.style.display = 'block';
            
            // Limpa os campos do formulário
            formTicket.reset();

            // Esconde a mensagem de sucesso após 3 segundos
            setTimeout(() => {
                mensagemSucesso.style.display = 'none';
                
                // Opcional: Esconder o formulário e voltar ao estado inicial
                // caixaFormulario.classList.remove('ativo');
                // btnAbrirChamado.style.display = 'block';
            }, 3000);

        } else {
            alert('Erro ao abrir o chamado: ' + dados.erro);
        }
    } catch (erro) {
        console.error('Erro na conexão:', erro);
        alert('Não foi possível conectar ao servidor. Verifique se o Node.js está rodando.');
    }
});
// ... (seu código anterior do dashboard.js)

// 5. LISTAGEM DOS TICKETS DO USUÁRIO
const listaTickets = document.getElementById('listaTickets');
const btnMeusTickets = document.getElementById('btnMeusTickets');

// Função que busca os tickets no banco e desenha os cards
async function carregarMeusTickets() {
    try {
        // Faz a requisição para a nossa API passando o ID do usuário logado
        const resposta = await fetch(`http://localhost:3000/api/tickets/me/${usuarioLogado.id}`);
        const tickets = await resposta.json();

        // Limpa a área antes de desenhar os novos cards
        listaTickets.innerHTML = '';

        if (tickets.length === 0) {
            listaTickets.innerHTML = '<p style="color: #64748b;">Você ainda não possui chamados abertos.</p>';
            return;
        }

        // Para cada ticket devolvido pelo banco, cria um card HTML
        tickets.forEach(ticket => {
            // Define a cor da "etiqueta" (badge) de acordo com o status
            let corStatus = '#f59e0b'; // Amarelo para 'pendente'
            if (ticket.status === 'em_andamento') corStatus = '#3b82f6'; // Azul
            if (ticket.status === 'finalizado') corStatus = '#10b981'; // Verde

            // Formata a data para o padrão brasileiro
            const dataFormatada = new Date(ticket.criado_em).toLocaleDateString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            // Cria o elemento Div do Card
            const card = document.createElement('div');
            // CSS direto no JavaScript para criar o visual do Card
            card.style.cssText = `background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-left: 5px solid ${corStatus};`;
            
            // Monta o conteúdo HTML do Card (usando crases ` ` para permitir múltiplas linhas)
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4 style="margin: 0; color: #0f172a; font-size: 16px;">Chamado #${ticket.id} - ${ticket.categoria}</h4>
                    <span style="background-color: ${corStatus}; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase;">${ticket.status}</span>
                </div>
                <p style="color: #475569; font-size: 14px; margin-bottom: 15px;">${ticket.descricao}</p>
                
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                    <span>Criado em: ${dataFormatada}</span>
                    
                    ${ticket.status !== 'finalizado' ? 
                        `<button onclick="encerrarTicket(${ticket.id})" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; transition: 0.2s;">Encerrar Chamado</button>` 
                        : '<span style="color: #10b981; font-weight: bold;">Resolvido</span>'
                    }
                </div>
            `;

            // Adiciona o card pronto na tela
            listaTickets.appendChild(card);
        });
    } catch (erro) {
        console.error('Erro ao buscar tickets:', erro);
        listaTickets.innerHTML = '<p style="color: #ef4444;">Erro ao carregar os chamados. Verifique a conexão.</p>';
    }
}


// 6. FUNÇÃO PARA ENCERRAR O TICKET (Acionada pelo botão do card)
async function encerrarTicket(idTicket) {
    if (!confirm('Tem certeza que deseja marcar este chamado como finalizado?')) return;

    try {
        const resposta = await fetch(`http://localhost:3000/api/tickets/${idTicket}/close`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario_id: usuarioLogado.id }) // Segurança: Garante que só o dono pode fechar
        });

        if (resposta.ok) {
            alert('Chamado encerrado com sucesso!');
            carregarMeusTickets(); // Recarrega a lista na mesma hora para atualizar a tela
        } else {
            alert('Erro ao encerrar o chamado.');
        }
    } catch (erro) {
        console.error('Erro ao fechar ticket:', erro);
    }
}


// Função auxiliar para mudar a cor do menu
function ativarMenu(menuClicado) {
    document.querySelectorAll('.sidebar .menu-item').forEach(item => item.classList.remove('ativo'));
    menuClicado.classList.add('ativo');
}

// 7. ALTERNAR TELAS (Menu lateral)
btnMeusTickets.addEventListener('click', () => {
    ativarMenu(btnMeusTickets);
    caixaFormulario.classList.remove('ativo');
    btnAbrirChamado.style.display = 'block';
    areaTickets.style.display = 'block';
    
    tituloAreaTickets.innerText = 'Meus Chamados Recentes'; // Volta o título original
    carregarMeusTickets();
});

btnComunidade.addEventListener('click', () => {
    ativarMenu(btnComunidade);
    caixaFormulario.classList.remove('ativo');
    btnAbrirChamado.style.display = 'block';
    areaTickets.style.display = 'block';
    
    tituloAreaTickets.innerText = 'Mural da Comunidade'; // Muda o título
    carregarComunidade();
});

btnNovoChamadoMenu.addEventListener('click', () => {
    ativarMenu(btnNovoChamadoMenu);
    exibirFormulario();
});
// 8. LISTAGEM DO MURAL DA COMUNIDADE
async function carregarComunidade() {
    try {
        const resposta = await fetch('http://localhost:3000/api/tickets/public');
        const tickets = await resposta.json();

        listaTickets.innerHTML = '';

        if (tickets.length === 0) {
            listaTickets.innerHTML = '<p style="color: #64748b;">Não há chamados em aberto na escola no momento.</p>';
            return;
        }

        tickets.forEach(ticket => {
            let corStatus = ticket.status === 'pendente' ? '#f59e0b' : '#3b82f6';
            const dataFormatada = new Date(ticket.criado_em).toLocaleDateString('pt-BR');

            const card = document.createElement('div');
            card.style.cssText = `background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-left: 5px solid ${corStatus};`;
            
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4 style="margin: 0; color: #0f172a; font-size: 16px;">Chamado #${ticket.id} - ${ticket.categoria}</h4>
                    <span style="background-color: ${corStatus}; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase;">${ticket.status}</span>
                </div>
                <p style="color: #475569; font-size: 14px; margin-bottom: 15px;">${ticket.descricao}</p>
                <div style="font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                    Aberto em: ${dataFormatada}
                </div>
            `;
            listaTickets.appendChild(card);
        });
    } catch (erro) {
        console.error('Erro ao buscar comunidade:', erro);
        listaTickets.innerHTML = '<p style="color: #ef4444;">Erro ao carregar o mural da comunidade.</p>';
    }
}