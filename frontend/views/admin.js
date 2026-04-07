// views/admin.js

// 1. VERIFICAÇÃO DE SEGURANÇA (Acesso Restrito a Admins)
const usuarioString = localStorage.getItem('usuarioLogado');

if (!usuarioString) {
    alert('Acesso negado. Por favor, faça o login.');
    window.location.href = 'login.html';
}

const adminLogado = JSON.parse(usuarioString);

// Se o usuário logado não for admin, manda de volta para o painel comum
if (!adminLogado.is_admin) {
    alert('Você não tem privilégios de administrador para acessar esta área.');
    window.location.href = 'user-dashboard.html';
}

// Mostra o nome do admin na tela
document.getElementById('nomeAdmin').innerText = `Admin: ${adminLogado.nome}`;


// 2. MAPEAMENTO DOS ELEMENTOS DO MENU E SESSÕES
const menuFila = document.getElementById('menuFila');
const menuDashboard = document.getElementById('menuDashboard');
const menuNovoAdmin = document.getElementById('menuNovoAdmin');
const btnSairAdmin = document.getElementById('btnSairAdmin');

const sessaoFila = document.getElementById('sessaoFila');
const sessaoDashboard = document.getElementById('sessaoDashboard');
const sessaoNovoAdmin = document.getElementById('sessaoNovoAdmin');

const menuFinalizados = document.getElementById('menuFinalizados');
const sessaoFinalizados = document.getElementById('sessaoFinalizados');
const containerTicketsFinalizados = document.getElementById('containerTicketsFinalizados');

const menuRelatorio = document.getElementById('menuRelatorio');
const sessaoRelatorio = document.getElementById('sessaoRelatorio');


// 3. LÓGICA DE NAVEGAÇÃO ENTRE AS ABAS
function alternarSessao(menuAtivo, sessaoAtiva) {
    [menuFila, menuDashboard, menuNovoAdmin, menuFinalizados, menuRelatorio].forEach(m => m.classList.remove('ativo'));
    [sessaoFila, sessaoDashboard, sessaoNovoAdmin, sessaoFinalizados, sessaoRelatorio].forEach(s => s.classList.remove('ativa'));
    
    menuAtivo.classList.add('ativo');
    sessaoAtiva.classList.add('ativa');
}

menuRelatorio.addEventListener('click', () => {
    alternarSessao(menuRelatorio, sessaoRelatorio);
});

// Adicione o evento de clique do novo menu:
menuFinalizados.addEventListener('click', () => {
    alternarSessao(menuFinalizados, sessaoFinalizados);
    carregarTicketsFinalizados(); // Chama a função que busca no banco
});

menuFila.addEventListener('click', () => {
    alternarSessao(menuFila, sessaoFila);
    carregarFilaTickets(); // Atualiza os dados do banco sempre que abre a fila
});

menuDashboard.addEventListener('click', () => {
    alternarSessao(menuDashboard, sessaoDashboard);
    carregarGrafico(); // Puxa os dados para o gráfico
});

menuNovoAdmin.addEventListener('click', () => {
    alternarSessao(menuNovoAdmin, sessaoNovoAdmin);
});

btnSairAdmin.addEventListener('click', () => {
    localStorage.removeItem('usuarioLogado');
    window.location.href = 'login.html';
});


// 4. CARREGAR A FILA DE CHAMADOS DO BANCO
const containerTicketsAdmin = document.getElementById('containerTicketsAdmin');

async function carregarFilaTickets() {
    try {
        const resposta = await fetch('http://localhost:3000/api/admin/tickets');
        const tickets = await resposta.json();

        containerTicketsAdmin.innerHTML = ''; 

        if (tickets.length === 0) {
            containerTicketsAdmin.innerHTML = '<p style="color: #64748b;">Nenhum chamado pendente no momento. A fila está limpa!</p>';
            return;
        }

        tickets.forEach(ticket => {
            let corStatus = ticket.status === 'pendente' ? '#f59e0b' : '#3b82f6';
            
            const card = document.createElement('div');
            card.className = 'card-ticket';
            card.style.borderTopColor = corStatus;

            // Variáveis para montar os botões dinamicamente
            let areaAcao = '';

            if (ticket.status === 'pendente') {
                // Se está pendente, mostra o campo de Data e o botão de Assumir
                areaAcao = `
                    <div style="margin: 15px 0 10px 0; border-top: 1px dashed #cbd5e1; padding-top: 10px;">
                        <label for="prazo-${ticket.id}" style="font-size: 12px; color: #475569; font-weight: bold;">Definir Prazo (Opcional):</label>
                        <input type="date" id="prazo-${ticket.id}" style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #cbd5e1; border-radius: 4px; font-family: inherit;">
                    </div>
                    <button class="btn-acao" onclick="atualizarStatus(${ticket.id}, 'em_andamento')" style="background: #3b82f6;">Assumir Chamado</button>
                `;
            } else if (ticket.status === 'em_andamento') {
                // Se está em andamento, mostra a data do prazo (se houver) e o botão de Finalizar
                let textoPrazo = '';
                if (ticket.prazo) {
                    // timeZone: 'UTC' evita que o fuso horário mostre um dia a menos
                    const dataPrazo = new Date(ticket.prazo).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
                    textoPrazo = `<p style="font-size: 13px; color: #ef4444; margin-bottom: 10px; background: #fee2e2; padding: 6px; border-radius: 4px; text-align: center;"><strong>Prazo:</strong> ${dataPrazo}</p>`;
                }

                // Repassamos a data do prazo atual para não apagá-la do banco ao finalizar
                areaAcao = `
                    ${textoPrazo}
                    <button class="btn-acao" onclick="atualizarStatus(${ticket.id}, 'finalizado', '${ticket.prazo || ''}')" style="background: #10b981;">Marcar como Finalizado</button>
                `;
            }

            card.innerHTML = `
                <div class="card-header">
                    <h4 style="font-size: 15px; color: #0f172a; margin: 0;">#${ticket.id} - ${ticket.categoria}</h4>
                    <span class="badge" style="background: ${corStatus}; color: white;">${ticket.status.replace('_', ' ')}</span>
                </div>
                <p style="font-size: 13px; color: #64748b; margin-bottom: 10px;">Cliente: <strong>${ticket.cliente}</strong></p>
                <p style="font-size: 14px; margin-bottom: 15px; color: #334155;">${ticket.descricao}</p>
                ${areaAcao}
            `;

            containerTicketsAdmin.appendChild(card);
        });
    } catch (erro) {
        console.error(erro);
        containerTicketsAdmin.innerHTML = '<p style="color: #ef4444;">Erro ao carregar a fila de chamados.</p>';
    }
}


// 5. ATUALIZAR STATUS E PRAZO DO TICKET
async function atualizarStatus(idTicket, novoStatus, prazoAtual = null) {
    let prazoParaSalvar = prazoAtual;

    // Se estiver assumindo o chamado agora, pega a data que o admin digitou no input
    if (novoStatus === 'em_andamento') {
        const inputPrazo = document.getElementById(`prazo-${idTicket}`);
        if (inputPrazo && inputPrazo.value) {
            prazoParaSalvar = inputPrazo.value;
        }
    }

    try {
        const resposta = await fetch(`http://localhost:3000/api/admin/tickets/${idTicket}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                status: novoStatus, 
                prazo: prazoParaSalvar || null, 
                admin_id: adminLogado.id 
            })
        });

        if (resposta.ok) {
            carregarFilaTickets(); // Atualiza a tela
            // Atualiza o gráfico do Dashboard na mesma hora
            carregarGrafico(); 
        } else {
            alert('Erro ao atualizar o chamado.');
        }
    } catch (erro) {
        console.error('Erro ao atualizar status:', erro);
    }
}


// 6. RENDERIZAR O GRÁFICO (Chart.js)
let meuGrafico = null; 

async function carregarGrafico() {
    try {
        const resposta = await fetch('http://localhost:3000/api/admin/dashboard');
        const dados = await resposta.json();

        const ctx = document.getElementById('graficoStatus').getContext('2d');
        
        // Destrói o gráfico anterior para que a animação recarregue corretamente
        if (meuGrafico) {
            meuGrafico.destroy();
        }

        // Desenha o gráfico de rosca (Doughnut)
        meuGrafico = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Pendentes', 'Em Andamento', 'Finalizados'],
                datasets: [{
                    data: [dados.pendente || 0, dados.em_andamento || 0, dados.finalizado || 0],
                    backgroundColor: ['#f59e0b', '#3b82f6', '#10b981'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    } catch (erro) {
        console.error('Erro ao gerar gráfico:', erro);
    }
}

// 7. FORMULÁRIO DE NOVO ADMIN (Lógica Real)
document.getElementById('formNovoAdmin').addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const nome = document.getElementById('nomeNovoAdmin').value;
    const email = document.getElementById('emailNovoAdmin').value;
    const senha = document.getElementById('senhaNovoAdmin').value;

    try {
        const resposta = await fetch('http://localhost:3000/api/admin/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            alert('Administrador cadastrado com sucesso!');
            document.getElementById('formNovoAdmin').reset(); // Limpa os campos
        } else {
            alert('Erro: ' + dados.erro);
        }
    } catch (erro) {
        console.error('Erro ao cadastrar admin:', erro);
        alert('Erro de conexão com o servidor.');
    }
});
// 8. CARREGAR HISTÓRICO DE FINALIZADOS
async function carregarTicketsFinalizados() {
    try {
        const resposta = await fetch('http://localhost:3000/api/admin/tickets/finalizados');
        const tickets = await resposta.json();

        containerTicketsFinalizados.innerHTML = '';

        if (tickets.length === 0) {
            containerTicketsFinalizados.innerHTML = '<p style="color: #64748b;">Nenhum chamado finalizado até o momento.</p>';
            return;
        }

        tickets.forEach(ticket => {
            const dataFormatada = new Date(ticket.criado_em).toLocaleDateString('pt-BR');
            // Se o usuário fechou o próprio ticket, não terá ID de admin
            const adminNome = ticket.admin_nome ? ticket.admin_nome : 'Fechado pelo Cliente';

            const card = document.createElement('div');
            card.className = 'card-ticket';
            card.style.borderTopColor = '#10b981'; // Verde
            card.style.opacity = '0.85'; // Levemente transparente para indicar que é inativo

            card.innerHTML = `
                <div class="card-header">
                    <h4 style="font-size: 15px; color: #0f172a; margin: 0;">#${ticket.id} - ${ticket.categoria}</h4>
                    <span class="badge" style="background: #10b981; color: white;">FINALIZADO</span>
                </div>
                <p style="font-size: 13px; color: #64748b; margin-bottom: 5px;">Cliente: <strong>${ticket.cliente}</strong></p>
                <p style="font-size: 13px; color: #64748b; margin-bottom: 10px;">Resolvido por: <strong>${adminNome}</strong></p>
                <p style="font-size: 14px; margin-bottom: 15px; color: #334155;">${ticket.descricao}</p>
                <div style="font-size: 11px; color: #94a3b8; text-align: right; border-top: 1px solid #e2e8f0; padding-top: 8px;">Aberto em: ${dataFormatada}</div>
            `;

            containerTicketsFinalizados.appendChild(card);
        });
    } catch (erro) {
        console.error(erro);
        containerTicketsFinalizados.innerHTML = '<p style="color: #ef4444;">Erro ao carregar o histórico de chamados.</p>';
    }
}
// 9. GERAR RELATÓRIOS (Tabela)
async function gerarRelatorio(periodo) {
    const tabela = document.getElementById('tabelaRelatorio');
    tabela.innerHTML = '<tr><td colspan="5" style="padding: 20px; text-align: center;">Carregando dados...</td></tr>';

    try {
        const resposta = await fetch(`http://localhost:3000/api/admin/reports?periodo=${periodo}`);
        const tickets = await resposta.json();

        tabela.innerHTML = '';

        if (tickets.length === 0) {
            tabela.innerHTML = '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #64748b;">Nenhum chamado encontrado neste período.</td></tr>';
            return;
        }

        tickets.forEach(ticket => {
            const data = new Date(ticket.criado_em).toLocaleDateString('pt-BR');
            let corStatus = ticket.status === 'finalizado' ? '#10b981' : (ticket.status === 'pendente' ? '#f59e0b' : '#3b82f6');

            const linha = document.createElement('tr');
            linha.style.borderBottom = '1px solid #e2e8f0';
            
            linha.innerHTML = `
                <td style="padding: 15px; font-weight: 500;">#${ticket.id}</td>
                <td style="padding: 15px; color: #64748b;">${data}</td>
                <td style="padding: 15px; color: #0f172a;">${ticket.cliente}</td>
                <td style="padding: 15px; color: #475569;">${ticket.categoria}</td>
                <td style="padding: 15px;"><span style="background: ${corStatus}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase;">${ticket.status}</span></td>
            `;
            tabela.appendChild(linha);
        });

    } catch (erro) {
        console.error('Erro ao gerar relatório:', erro);
        tabela.innerHTML = '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #ef4444;">Erro ao carregar o relatório.</td></tr>';
    }
}

// Inicializa a tela carregando os tickets
carregarFilaTickets();