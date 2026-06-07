import mysql from 'mysql2/promise';

let pool: mysql.Pool;

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'quickticket',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

if (process.env.NODE_ENV === 'production') {
  pool = mysql.createPool(dbConfig);
} else {
  if (!(global as any)._mysqlPool) {
    (global as any)._mysqlPool = mysql.createPool(dbConfig);
  }
  pool = (global as any)._mysqlPool;
}

async function initDatabase() {
  try {
    console.log('[Banco] Iniciando verificação de tabelas...');
    
    // Verificar e criar colunas na tabela usuarios caso não existam
    try {
      const [cols] = await pool.execute('SHOW COLUMNS FROM usuarios');
      const columnNames = (cols as any[]).map((c: any) => c.Field);
      
      if (!columnNames.includes('foto_url')) {
        await pool.execute('ALTER TABLE usuarios ADD COLUMN foto_url VARCHAR(255) DEFAULT NULL');
        console.log('[Banco] Coluna "foto_url" adicionada à tabela "usuarios".');
      }
      
      if (!columnNames.includes('tema_escuro')) {
        await pool.execute('ALTER TABLE usuarios ADD COLUMN tema_escuro TINYINT(1) DEFAULT 0');
        console.log('[Banco] Coluna "tema_escuro" adicionada à tabela "usuarios".');
      }
    } catch (colErr) {
      console.warn('[Banco] Aviso ao verificar/adicionar colunas em "usuarios" (a tabela pode não existir ainda):', colErr);
    }

    // Verificar e criar colunas na tabela tickets caso não existam
    try {
      const [cols] = await pool.execute('SHOW COLUMNS FROM tickets');
      const columnNames = (cols as any[]).map((c: any) => c.Field);
      
      if (!columnNames.includes('urgencia_solicitada')) {
        await pool.execute('ALTER TABLE tickets ADD COLUMN urgencia_solicitada TINYINT(1) DEFAULT 0');
        console.log('[Banco] Coluna "urgencia_solicitada" adicionada à tabela "tickets".');
      }
      
      if (!columnNames.includes('atendido_em')) {
        await pool.execute('ALTER TABLE tickets ADD COLUMN atendido_em DATETIME DEFAULT NULL');
        console.log('[Banco] Coluna "atendido_em" adicionada à tabela "tickets".');
      }
      
      if (!columnNames.includes('finalizado_em')) {
        await pool.execute('ALTER TABLE tickets ADD COLUMN finalizado_em DATETIME DEFAULT NULL');
        console.log('[Banco] Coluna "finalizado_em" adicionada à tabela "tickets".');
      }
    } catch (colErr) {
      console.warn('[Banco] Aviso ao verificar/adicionar colunas em "tickets":', colErr);
    }
    
    // 1. Criar tabela de avisos caso não exista
    const createAvisosTable = `
      CREATE TABLE IF NOT EXISTS avisos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        mensagem TEXT NOT NULL,
        admin_id INT,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_id) REFERENCES usuarios(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await pool.execute(createAvisosTable);
    console.log('[Banco] Tabela "avisos" verificada/criada.');

    // 2. Criar tabela de mensagens do chat caso não exista
    const createMensagensTable = `
      CREATE TABLE IF NOT EXISTS mensagens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_id INT NOT NULL,
        usuario_id INT NOT NULL,
        mensagem TEXT,
        tipo VARCHAR(20) DEFAULT 'texto',
        arquivo_url VARCHAR(255),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await pool.execute(createMensagensTable);
    console.log('[Banco] Tabela "mensagens" verificada/criada.');

    // 3. Criar tabela de notificações caso não exista
    const createNotificacoesTable = `
      CREATE TABLE IF NOT EXISTS notificacoes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        mensagem TEXT NOT NULL,
        lida TINYINT(1) DEFAULT 0,
        tipo VARCHAR(50) DEFAULT 'info',
        link VARCHAR(255) NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await pool.execute(createNotificacoesTable);
    console.log('[Banco] Tabela "notificacoes" verificada/criada.');

    console.log('[Banco] Estrutura do banco de dados verificada com sucesso!');
  } catch (erro) {
    console.error('[Banco] Erro ao inicializar o banco de dados:', erro);
  }
}

// Executar verificação de tabelas na inicialização do pool
initDatabase();

export const db = pool;
