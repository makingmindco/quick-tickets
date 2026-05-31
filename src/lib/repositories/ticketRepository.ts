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
      SELECT t.id, t.titulo, t.descricao, t.status, t.criado_em, c.nome AS categoria 
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
      SET status = 'finalizado' 
      WHERE id = ? AND usuario_id = ?
    `;
    const [result] = await db.execute<ResultSetHeader>(sql, [id, usuario_id]);
    return result.affectedRows > 0;
  }

  async findAdminQueue(): Promise<TicketDB[]> {
    const sql = `
      SELECT t.id, t.titulo, t.descricao, t.status, t.prazo, t.criado_em, 
             c.nome AS categoria, u.nome AS cliente 
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
    const sql = `
      UPDATE tickets 
      SET status = ?, prazo = ?, admin_id = ? 
      WHERE id = ?
    `;
    const [result] = await db.execute<ResultSetHeader>(sql, [status, prazo, admin_id, id]);
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
             c.nome AS categoria, u.nome AS cliente, a.nome AS admin_nome 
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
      SELECT t.*, u.nome AS cliente_nome, u.email AS cliente_email, c.nome AS categoria
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
