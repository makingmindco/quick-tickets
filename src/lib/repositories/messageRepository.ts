import { db } from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface MessageDB extends RowDataPacket {
  id: number;
  ticket_id: number;
  usuario_id: number;
  mensagem: string | null;
  tipo: 'texto' | 'imagem' | 'audio';
  arquivo_url: string | null;
  criado_em: Date;
  usuario_nome?: string;
  usuario_is_admin?: number;
}

class MessageRepository {
  async create({
    ticket_id,
    usuario_id,
    mensagem,
    tipo = 'texto',
    arquivo_url = null
  }: {
    ticket_id: number;
    usuario_id: number;
    mensagem: string | null;
    tipo?: 'texto' | 'imagem' | 'audio';
    arquivo_url?: string | null;
  }): Promise<number> {
    const sql = `
      INSERT INTO mensagens (ticket_id, usuario_id, mensagem, tipo, arquivo_url) 
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute<ResultSetHeader>(sql, [
      ticket_id,
      usuario_id,
      mensagem || null,
      tipo,
      arquivo_url
    ]);
    return result.insertId;
  }

  async findByTicketId(ticket_id: number): Promise<MessageDB[]> {
    const sql = `
      SELECT m.*, u.nome AS usuario_nome, u.is_admin AS usuario_is_admin 
      FROM mensagens m
      JOIN usuarios u ON m.usuario_id = u.id
      WHERE m.ticket_id = ?
      ORDER BY m.criado_em ASC
    `;
    const [rows] = await db.execute<MessageDB[]>(sql, [ticket_id]);
    return rows;
  }
}

export default new MessageRepository();
