import { db } from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface AvisoDB extends RowDataPacket {
  id: number;
  titulo: string;
  mensagem: string;
  admin_id: number | null;
  data_criacao: Date;
  autor?: string;
}

class AvisoRepository {
  async findAll(): Promise<AvisoDB[]> {
    const sql = `
      SELECT a.*, u.nome AS autor 
      FROM avisos a 
      LEFT JOIN usuarios u ON a.admin_id = u.id 
      ORDER BY a.data_criacao DESC
      LIMIT 5
    `;
    const [rows] = await db.execute<AvisoDB[]>(sql);
    return rows;
  }

  async create({
    titulo,
    mensagem,
    admin_id
  }: {
    titulo: string;
    mensagem: string;
    admin_id: number | null;
  }): Promise<number> {
    const sql = 'INSERT INTO avisos (titulo, mensagem, admin_id) VALUES (?, ?, ?)';
    const [result] = await db.execute<ResultSetHeader>(sql, [titulo, mensagem, admin_id]);
    return result.insertId;
  }

  async delete(id: number): Promise<boolean> {
    const sql = 'DELETE FROM avisos WHERE id = ?';
    const [result] = await db.execute<ResultSetHeader>(sql, [id]);
    return result.affectedRows > 0;
  }
}

export default new AvisoRepository();
