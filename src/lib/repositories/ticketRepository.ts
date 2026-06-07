import { db } from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface TicketDB extends RowDataPacket {
  id: number;
  usuario_id: number;
  categoria_id: number;
  titulo: string | null;
  descricao: string;
  status: 'pendente' | 'em_andamento' | 'finalizado';
  prazo: Date | null;
  admin_id: number | null;
  criado_em: Date;
  categoria?: string;
  cliente?: string;
  admin_nome?: string;
  cliente_nome?: string;
  cliente_email?: string;
  urgencia_solicitada?: number;
  atendido_em?: Date | string | null;
  finalizado_em?: Date | string | null;
  db_time?: Date | string | null;
}

class TicketRepository {
  async findPublicActive(): Promise<TicketDB[]> {
    const sql = `
      SELECT t.id, t.titulo, t.descricao, t.status, t.criado_em, c.nome AS categoria 
      FROM tickets t
      JOIN categorias c ON t.categoria_id = c.id
      WHERE t.status != 'finalizado'
      ORDER BY t.criado_em DESC
    `;
    const [rows] = await db.execute<TicketDB[]>(sql);
    return rows;
  }

  async create({
    usuario_id,
    categoria_id,
    titulo,
    descricao
  }: {
    usuario_id: number;
    categoria_id: number;
    titulo: string;
    descricao: string;
  }): Promise<number> {
    const sql = `
      INSERT INTO tickets (usuario_id, categoria_id, titulo, descricao, status) 
      VALUES (?, ?, ?, ?, 'pendente')
    `;
    const [result] = await db.execute<ResultSetHeader>(sql, [usuario_id, categoria_id, titulo, descricao]);
    return result.insertId;
  }

  async findByUserId(usuario_id: number): Promise<TicketDB[]> {
    const sql = `
      SELECT t.id, t.titulo, t.descricao, t.status, t.criado_em, 
             t.urgencia_solicitada, t.atendido_em, t.finalizado_em,
             t.avaliacao_nota, t.avaliacao_comentario,
             c.nome AS categoria, NOW() as db_time 
      FROM tickets t
      JOIN categorias c ON t.categoria_id = c.id
      WHERE t.usuario_id = ?
      ORDER BY t.criado_em DESC
    `;
    const [rows] = await db.execute<TicketDB[]>(sql, [usuario_id]);
    return rows;
  }

  async closeByUser(id: number, usuario_id: number): Promise<boolean> {
    const sql = `
      UPDATE tickets 
      SET status = 'finalizado', finalizado_em = NOW() 
      WHERE id = ? AND usuario_id = ?
    `;
    const [result] = await db.execute<ResultSetHeader>(sql, [id, usuario_id]);
    return result.affectedRows > 0;
  }

  async requestUrgency(id: number, usuario_id: number): Promise<boolean> {
    const sql = `
      UPDATE tickets 
      SET urgencia_solicitada = 1 
      WHERE id = ? AND usuario_id = ?
    `;
    const [result] = await db.execute<ResultSetHeader>(sql, [id, usuario_id]);
    return result.affectedRows > 0;
  }

  async saveFeedback(id: number, usuario_id: number, nota: number, comentario: string | null): Promise<boolean> {
    const sql = `
      UPDATE tickets 
      SET avaliacao_nota = ?, avaliacao_comentario = ? 
      WHERE id = ? AND usuario_id = ? AND status = 'finalizado'
    `;
    const [result] = await db.execute<ResultSetHeader>(sql, [nota, comentario, id, usuario_id]);
    return result.affectedRows > 0;
  }

  async findAdminQueue(): Promise<TicketDB[]> {
    const sql = `
      SELECT t.id, t.titulo, t.descricao, t.status, t.prazo, t.criado_em, 
             t.urgencia_solicitada, t.atendido_em, t.finalizado_em,
             c.nome AS categoria, u.nome AS cliente, NOW() as db_time 
      FROM tickets t
      JOIN categorias c ON t.categoria_id = c.id
      JOIN usuarios u ON t.usuario_id = u.id
      WHERE t.status != 'finalizado'
      ORDER BY t.criado_em ASC
    `;
    const [rows] = await db.execute<TicketDB[]>(sql);
    return rows;
  }

  async updateStatus(
    id: number,
    { status, prazo, admin_id }: { status: 'pendente' | 'em_andamento' | 'finalizado'; prazo: string | null; admin_id: number | null }
  ): Promise<boolean> {
    let statusSql = '';
    const params: any[] = [status, prazo, admin_id];

    if (status === 'em_andamento') {
      statusSql = ', atendido_em = COALESCE(atendido_em, NOW())';
    } else if (status === 'finalizado') {
      statusSql = ', finalizado_em = COALESCE(finalizado_em, NOW()), atendido_em = COALESCE(atendido_em, NOW())';
    } else if (status === 'pendente') {
      statusSql = ', atendido_em = NULL, finalizado_em = NULL';
    }

    const sql = `
      UPDATE tickets 
      SET status = ?, prazo = ?, admin_id = ? ${statusSql}
      WHERE id = ?
    `;
    params.push(id);
    const [result] = await db.execute<ResultSetHeader>(sql, params);
    return result.affectedRows > 0;
  }

  async getStatusCounts(): Promise<{ status: string; total: number }[]> {
    const sql = `
      SELECT status, COUNT(*) as total 
      FROM tickets 
      GROUP BY status
    `;
    const [rows] = await db.execute<any[]>(sql);
    return rows;
  }

  async findAdminFinished(): Promise<TicketDB[]> {
    const sql = `
      SELECT t.id, t.titulo, t.descricao, t.status, t.criado_em, 
             t.urgencia_solicitada, t.atendido_em, t.finalizado_em,
             t.avaliacao_nota, t.avaliacao_comentario,
             c.nome AS categoria, u.nome AS cliente, a.nome AS admin_nome, NOW() as db_time 
      FROM tickets t
      JOIN categorias c ON t.categoria_id = c.id
      JOIN usuarios u ON t.usuario_id = u.id
      LEFT JOIN usuarios a ON t.admin_id = a.id
      WHERE t.status = 'finalizado'
      ORDER BY t.criado_em DESC
    `;
    const [rows] = await db.execute<TicketDB[]>(sql);
    return rows;
  }

  async getReports(periodo: string): Promise<TicketDB[]> {
    let filtroData = '';
    if (periodo === 'dia') {
      filtroData = 'WHERE t.criado_em >= NOW() - INTERVAL 1 DAY';
    } else if (periodo === 'semana') {
      filtroData = 'WHERE t.criado_em >= NOW() - INTERVAL 7 DAY';
    } else if (periodo === 'mes') {
      filtroData = 'WHERE t.criado_em >= NOW() - INTERVAL 1 MONTH';
    }

    const sql = `
      SELECT t.id, t.titulo, t.status, t.criado_em, 
             c.nome AS categoria, u.nome AS cliente 
      FROM tickets t
      JOIN categorias c ON t.categoria_id = c.id
      JOIN usuarios u ON t.usuario_id = u.id
      ${filtroData}
      ORDER BY t.criado_em DESC
    `;
    const [rows] = await db.execute<TicketDB[]>(sql);
    return rows;
  }

  async findById(id: number): Promise<TicketDB | undefined> {
    const sql = `
      SELECT t.*, u.nome AS cliente_nome, u.email AS cliente_email, c.nome AS categoria, NOW() as db_time
      FROM tickets t
      JOIN usuarios u ON t.usuario_id = u.id
      JOIN categorias c ON t.categoria_id = c.id
      WHERE t.id = ?
    `;
    const [rows] = await db.execute<TicketDB[]>(sql, [id]);
    return rows[0];
  }
}

export default new TicketRepository();
