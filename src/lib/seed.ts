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
    // 1. Limpar tabelas existentes
    console.log('[Seed] Limpando chamados e mensagens existentes...');
    await connection.execute('DELETE FROM mensagens');
    await connection.execute('DELETE FROM tickets');
    console.log('[Seed] Tabelas de chamados e mensagens limpas com sucesso!');

    // 2. Garantir categorias
    await connection.execute('INSERT IGNORE INTO categorias (id, nome) VALUES (1, "Acadêmico"), (2, "Infraestrutura"), (3, "Financeiro / Secretaria")');

    // 3. Obter ou criar usuário aluno (cliente)
    let alunoId = 16;
    const [alunos] = await connection.execute<any[]>('SELECT id FROM usuarios WHERE is_admin = 0 LIMIT 1');
    if (alunos.length > 0) {
      alunoId = alunos[0].id;
      console.log(`[Seed] Usando estudante existente (ID: ${alunoId})`);
    } else {
      // Criar estudante de teste se não houver
      const [res] = await connection.execute<any>(
        'INSERT INTO usuarios (nome, email, senha_hash, is_admin, email_confirmado) VALUES (?, ?, ?, 0, 1)',
        ['Caio Henrique', 'caioheenrique36@gmail.com', '$2b$10$1RdWlTVvpAptEIiEhHxwh.VLRT/oyazFoN3m60NDIRkoYp4IvYAVq']
      );
      alunoId = res.insertId;
      console.log(`[Seed] Estudante de teste criado (ID: ${alunoId})`);
    }

    // 4. Obter ou criar usuário administrador (atendente)
    let adminId = 1;
    const [admins] = await connection.execute<any[]>('SELECT id FROM usuarios WHERE is_admin = 1 LIMIT 1');
    if (admins.length > 0) {
      adminId = admins[0].id;
      console.log(`[Seed] Usando administrador existente (ID: ${adminId})`);
    } else {
      // Criar admin de teste se não houver
      const [res] = await connection.execute<any>(
        'INSERT INTO usuarios (nome, email, senha_hash, is_admin, email_confirmado) VALUES (?, ?, ?, 1, 1)',
        ['Suporte QuickTickets', 'suporte@quicktickets.com', '$2b$10$1RdWlTVvpAptEIiEhHxwh.VLRT/oyazFoN3m60NDIRkoYp4IvYAVq']
      );
      adminId = res.insertId;
      console.log(`[Seed] Administrador de teste criado (ID: ${adminId})`);
    }

    // 5. Inserir Ticket 1: Pendente
    console.log('[Seed] Criando Ticket 1 (Pendente)...');
    const [t1Res] = await connection.execute<any>(
      'INSERT INTO tickets (usuario_id, categoria_id, titulo, descricao, status, criado_em) VALUES (?, 1, ?, ?, ?, NOW() - INTERVAL 2 HOUR)',
      [
        alunoId,
        'Dúvida sobre matrícula em Cálculo II',
        'Gostaria de saber se ainda é possível solicitar ajuste de horário ou inclusão na turma de Cálculo II do período da manhã. Perdi o prazo padrão da secretaria.',
        'pendente'
      ]
    );
    const t1Id = t1Res.insertId;
    // Mensagem inicial
    await connection.execute(
      'INSERT INTO mensagens (ticket_id, usuario_id, mensagem, tipo, criado_em) VALUES (?, ?, ?, "texto", NOW() - INTERVAL 2 HOUR)',
      [t1Id, alunoId, 'Gostaria de saber se ainda é possível solicitar ajuste de horário ou inclusão na turma de Cálculo II do período da manhã. Perdi o prazo padrão da secretaria.']
    );

    // 6. Inserir Ticket 2: Em Atendimento (Com conversa ativa)
    console.log('[Seed] Criando Ticket 2 (Em Atendimento)...');
    const [t2Res] = await connection.execute<any>(
      'INSERT INTO tickets (usuario_id, categoria_id, titulo, descricao, status, admin_id, criado_em) VALUES (?, 2, ?, ?, ?, ?, NOW() - INTERVAL 5 HOUR)',
      [
        alunoId,
        'Ar condicionado fazendo barulho excessivo',
        'O ar condicionado da sala 204 está com um estalo muito alto e não está resfriando adequadamente a sala durante as aulas da tarde.',
        'em_andamento',
        adminId
      ]
    );
    const t2Id = t2Res.insertId;
    // Mensagens da conversa
    await connection.execute(
      'INSERT INTO mensagens (ticket_id, usuario_id, mensagem, tipo, criado_em) VALUES (?, ?, ?, "texto", NOW() - INTERVAL 5 HOUR)',
      [t2Id, alunoId, 'O ar condicionado da sala 204 está com um estalo muito alto e não está resfriando adequadamente a sala durante as aulas da tarde.']
    );
    await connection.execute(
      'INSERT INTO mensagens (ticket_id, usuario_id, mensagem, tipo, criado_em) VALUES (?, ?, ?, "texto", NOW() - INTERVAL 4 HOUR)',
      [t2Id, adminId, 'Olá! Recebemos sua solicitação sobre o ar condicionado da sala 204. Já repassamos para a equipe de manutenção de infraestrutura predial verificar o termostato e o ventilador interno.']
    );
    await connection.execute(
      'INSERT INTO mensagens (ticket_id, usuario_id, mensagem, tipo, criado_em) VALUES (?, ?, ?, "texto", NOW() - INTERVAL 3 HOUR)',
      [t2Id, alunoId, 'Muito obrigado pelo retorno rápido! Realmente está inviável assistir aula lá à tarde. Fico no aguardo.']
    );

    // 7. Inserir Ticket 3: Finalizado
    console.log('[Seed] Criando Ticket 3 (Finalizado)...');
    const [t3Res] = await connection.execute<any>(
      'INSERT INTO tickets (usuario_id, categoria_id, titulo, descricao, status, admin_id, criado_em) VALUES (?, 3, ?, ?, ?, ?, NOW() - INTERVAL 24 HOUR)',
      [
        alunoId,
        'Erro na emissão do boleto da mensalidade',
        'Meu boleto deste mês veio com o valor integral, mas eu possuo bolsa de 50%. Poderiam corrigir para que eu efetue o pagamento com o desconto?',
        'finalizado',
        adminId
      ]
    );
    const t3Id = t3Res.insertId;
    await connection.execute(
      'INSERT INTO mensagens (ticket_id, usuario_id, mensagem, tipo, criado_em) VALUES (?, ?, ?, "texto", NOW() - INTERVAL 24 HOUR)',
      [t3Id, alunoId, 'Meu boleto deste mês veio com o valor integral, mas eu possuo bolsa de 50%. Poderiam corrigir para que eu efetue o pagamento com o desconto?']
    );
    await connection.execute(
      'INSERT INTO mensagens (ticket_id, usuario_id, mensagem, tipo, criado_em) VALUES (?, ?, ?, "texto", NOW() - INTERVAL 22 HOUR)',
      [t3Id, adminId, 'Olá, Caio. Verificamos no financeiro e seu desconto de bolsa não havia sido aplicado automaticamente devido a uma atualização cadastral. Acabamos de reemitir o boleto com o valor correto de 50%. Você já pode baixá-lo no portal financeiro.']
    );
    await connection.execute(
      'INSERT INTO mensagens (ticket_id, usuario_id, mensagem, tipo, criado_em) VALUES (?, ?, ?, "texto", NOW() - INTERVAL 21 HOUR)',
      [t3Id, alunoId, 'Perfeito, acabei de conferir e o valor está corrigido. Já efetuei o pagamento. Muito obrigado pela agilidade! Pode encerrar o chamado.']
    );

    console.log('[Seed] Banco de dados semeado com sucesso com 3 tickets representativos!');
  } catch (err) {
    console.error('[Seed] Erro ao semear o banco de dados:', err);
  } finally {
    await connection.end();
  }
}

seed();
