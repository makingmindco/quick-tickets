import fs from 'fs';
import mysql from 'mysql2/promise';

// Parse .env manually
function loadEnv() {
  try {
    const envPath = './.env';
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      envContent.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.slice(1, -1);
          }
          process.env[key] = value.trim();
        }
      });
    }
  } catch (e) {
    console.error('Error loading env:', e);
  }
}

loadEnv();

const dbConfig = {
  host: process.env.DB_HOST || 'zephyr.proxy.rlwy.net',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 47015,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'MuaLFdEXHFoijbzkCkiNHcUJjGCZaItp',
  database: process.env.DB_NAME || 'railway',
};

async function seed() {
  console.log('[Seed] Conectando ao banco de dados...', dbConfig.host);
  const connection = await mysql.createConnection(dbConfig);

  try {
    // 1. Limpar tabelas existentes para garantir consistência
    console.log('[Seed] Limpando dados anteriores para evitar duplicações...');
    await connection.execute('DELETE FROM mensagens');
    await connection.execute('DELETE FROM notificacoes');
    await connection.execute('DELETE FROM tickets');
    await connection.execute('DELETE FROM avisos');
    await connection.execute('DELETE FROM usuarios');
    console.log('[Seed] Tabelas limpas com sucesso!');

    // 2. Garantir categorias padrão
    console.log('[Seed] Criando categorias...');
    await connection.execute('INSERT IGNORE INTO categorias (id, nome) VALUES (1, "Acadêmico"), (2, "Infraestrutura"), (3, "Financeiro / Secretaria")');

    // Senha hash para a senha em texto plano "fatec123"
    const senhaHash = '$2b$10$/jYWT3lG0AxHK5fX0YBFYeyIBsO2c0JJ7cRlrfRofGzleNXVqAJ8W';

    // 3. Inserir Administradores
    console.log('[Seed] Cadastrando administradores/técnicos...');
    const [adm1] = await connection.execute<any>(
      'INSERT INTO usuarios (nome, email, senha_hash, is_admin, cargo, email_confirmado) VALUES (?, ?, ?, 1, ?, 1)',
      ['Amanda Costa', 'amanda.suporte@quicktickets.com', senhaHash, 'Supervisora de TI']
    );
    const admin1Id = adm1.insertId;

    const [adm2] = await connection.execute<any>(
      'INSERT INTO usuarios (nome, email, senha_hash, is_admin, cargo, email_confirmado) VALUES (?, ?, ?, 1, ?, 1)',
      ['Bruno Souza', 'bruno.infra@quicktickets.com', senhaHash, 'Técnico de Infraestrutura']
    );
    const admin2Id = adm2.insertId;

    const [adm3] = await connection.execute<any>(
      'INSERT INTO usuarios (nome, email, senha_hash, is_admin, cargo, email_confirmado) VALUES (?, ?, ?, 1, ?, 1)',
      ['Suporte Geral', 'suporte@quicktickets.com', senhaHash, 'Administrador Geral']
    );
    const admin3Id = adm3.insertId;

    console.log(`[Seed] Admins criados: Amanda (ID ${admin1Id}), Bruno (ID ${admin2Id}), Geral (ID ${admin3Id})`);

    // 4. Inserir Estudantes
    console.log('[Seed] Cadastrando estudantes...');
    const [est1] = await connection.execute<any>(
      'INSERT INTO usuarios (nome, email, senha_hash, is_admin, email_confirmado) VALUES (?, ?, ?, 0, 1)',
      ['Caio Henrique', 'caio.aluno@fatec.sp.gov.br', senhaHash]
    );
    const estudante1Id = est1.insertId;

    const [est2] = await connection.execute<any>(
      'INSERT INTO usuarios (nome, email, senha_hash, is_admin, email_confirmado) VALUES (?, ?, ?, 0, 1)',
      ['Mariana Santos', 'mariana.aluno@fatec.sp.gov.br', senhaHash]
    );
    const estudante2Id = est2.insertId;

    const [est3] = await connection.execute<any>(
      'INSERT INTO usuarios (nome, email, senha_hash, is_admin, email_confirmado) VALUES (?, ?, ?, 0, 1)',
      ['Rodrigo Lima', 'rodrigo.aluno@fatec.sp.gov.br', senhaHash]
    );
    const estudante3Id = est3.insertId;

    console.log(`[Seed] Estudantes criados: Caio (ID ${estudante1Id}), Mariana (ID ${estudante2Id}), Rodrigo (ID ${estudante3Id})`);

    // 5. Inserir Mural de Avisos Geral
    console.log('[Seed] Criando avisos gerais...');
    await connection.execute(
      'INSERT INTO avisos (titulo, mensagem, admin_id) VALUES (?, ?, ?)',
      [
        'Manutenção Programada no Servidor da Secretaria',
        'Informamos que no dia 05/06/2026 o sistema de emissão de boletos estará indisponível das 22h às 02h para atualização tecnológica periódica da infraestrutura.',
        admin1Id
      ]
    );

    // 6. Inserir Tickets com conversas e status reais

    // Chamado 1: Caio Henrique - Categoria Acadêmico - PENDENTE
    console.log('[Seed] Criando chamado 1...');
    const [t1] = await connection.execute<any>(
      'INSERT INTO tickets (usuario_id, categoria_id, titulo, descricao, status, criado_em) VALUES (?, 1, ?, ?, ?, NOW() - INTERVAL 1 HOUR)',
      [
        estudante1Id,
        'Dúvida sobre matrícula em Cálculo II',
        'Gostaria de saber se ainda posso solicitar inclusão na turma de Cálculo II do período da manhã. Perdi o prazo padrão da secretaria por problemas no portal acadêmico.',
        'pendente'
      ]
    );
    const t1Id = t1.insertId;
    await connection.execute(
      'INSERT INTO mensagens (ticket_id, usuario_id, mensagem, tipo, criado_em) VALUES (?, ?, ?, "texto", NOW() - INTERVAL 1 HOUR)',
      [t1Id, estudante1Id, 'Gostaria de saber se ainda posso solicitar inclusão na turma de Cálculo II do período da manhã. Perdi o prazo padrão da secretaria por problemas no portal acadêmico.']
    );

    // Chamado 2: Caio Henrique - Categoria Infraestrutura - EM ANDAMENTO (Bruno Souza)
    console.log('[Seed] Criando chamado 2...');
    const [t2] = await connection.execute<any>(
      'INSERT INTO tickets (usuario_id, categoria_id, titulo, descricao, status, admin_id, criado_em) VALUES (?, 2, ?, ?, ?, ?, NOW() - INTERVAL 3 HOUR)',
      [
        estudante1Id,
        'Projetor da Sala 102 não liga',
        'O projetor da Sala 102 (laboratório de Redes) parou de responder ao controle remoto e o LED indicador está piscando em vermelho. Precisamos para a aula de hoje à noite.',
        'em_andamento',
        admin2Id
      ]
    );
    const t2Id = t2.insertId;
    await connection.execute(
      'INSERT INTO mensagens (ticket_id, usuario_id, mensagem, tipo, criado_em) VALUES (?, ?, ?, "texto", NOW() - INTERVAL 3 HOUR)',
      [t2Id, estudante1Id, 'O projetor da Sala 102 (laboratório de Redes) parou de responder ao controle remoto e o LED indicador está piscando em vermelho. Precisamos para a aula de hoje à noite.']
    );
    await connection.execute(
      'INSERT INTO mensagens (ticket_id, usuario_id, mensagem, tipo, criado_em) VALUES (?, ?, ?, "texto", NOW() - INTERVAL 2 HOUR)',
      [t2Id, admin2Id, 'Olá Caio! Entendido. Esse sintoma geralmente indica superaquecimento ou necessidade de troca da lâmpada. Estou subindo com a escada e uma lâmpada reserva para fazer a troca em 20 minutos.']
    );
    await connection.execute(
      'INSERT INTO mensagens (ticket_id, usuario_id, mensagem, tipo, criado_em) VALUES (?, ?, ?, "texto", NOW() - INTERVAL 1 HOUR)',
      [t2Id, estudante1Id, 'Excelente Bruno! Estaremos te esperando aqui. Muito obrigado pela agilidade!']
    );

    // Chamado 3: Mariana Santos - Categoria Financeiro - FINALIZADO (Amanda Costa)
    console.log('[Seed] Criando chamado 3...');
    const [t3] = await connection.execute<any>(
      'INSERT INTO tickets (usuario_id, categoria_id, titulo, descricao, status, admin_id, criado_em) VALUES (?, 3, ?, ?, ?, ?, NOW() - INTERVAL 24 HOUR)',
      [
        estudante2Id,
        'Erro no boleto de Rematrícula',
        'Meu boleto de rematrícula veio cobrando o valor integral, porém tenho direito a desconto de bolsa de monitoria de 25%. Podem me ajudar com a reemissão?',
        'finalizado',
        admin1Id
      ]
    );
    const t3Id = t3.insertId;
    await connection.execute(
      'INSERT INTO mensagens (ticket_id, usuario_id, mensagem, tipo, criado_em) VALUES (?, ?, ?, "texto", NOW() - INTERVAL 24 HOUR)',
      [t3Id, estudante2Id, 'Meu boleto de rematrícula veio cobrando o valor integral, porém tenho direito a desconto de bolsa de monitoria de 25%. Podem me ajudar com a reemissão?']
    );
    await connection.execute(
      'INSERT INTO mensagens (ticket_id, usuario_id, mensagem, tipo, criado_em) VALUES (?, ?, ?, "texto", NOW() - INTERVAL 20 HOUR)',
      [t3Id, admin1Id, 'Olá Mariana! Identifiquei o erro no lote de faturamento. Sua bolsa já foi homologada e a reemissão do boleto com 25% de desconto foi feita. Você já pode acessar a nova linha digitável no seu portal acadêmico.']
    );
    await connection.execute(
      'INSERT INTO mensagens (ticket_id, usuario_id, mensagem, tipo, criado_em) VALUES (?, ?, ?, "texto", NOW() - INTERVAL 19 HOUR)',
      [t3Id, estudante2Id, 'Consegui baixar aqui Amanda! Tudo certinho agora. Muito obrigada pela ajuda! Pode fechar o chamado.']
    );

    // 7. Inserir Notificações
    console.log('[Seed] Criando notificações para os usuários...');
    // Para Caio Henrique
    await connection.execute(
      'INSERT INTO notificacoes (usuario_id, titulo, mensagem, lida, tipo, link) VALUES (?, ?, ?, 0, "sucesso", ?)',
      [estudante1Id, 'Atualização no chamado do projetor', 'O técnico Bruno Souza respondeu ao seu chamado.', `/dashboard?ticket=${t2Id}`]
    );
    // Para Mariana
    await connection.execute(
      'INSERT INTO notificacoes (usuario_id, titulo, mensagem, lida, tipo, link) VALUES (?, ?, ?, 1, "info", ?)',
      [estudante2Id, 'Chamado Finalizado', 'Seu chamado sobre o boleto de rematrícula foi finalizado.', `/dashboard?ticket=${t3Id}`]
    );

    console.log('[Seed] Semeamento finalizado com sucesso!');
  } catch (err) {
    console.error('[Seed] Erro crítico ao semear o banco de dados:', err);
  } finally {
    await connection.end();
  }
}

seed();
