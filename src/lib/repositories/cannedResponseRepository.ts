import { db } from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface CannedResponseDB extends RowDataPacket {
  id: number;
  titulo: string;
  mensagem: string;
  criado_em: Date;
}

class CannedResponseRepository {
  async findAll(): Promise<CannedResponseDB[]> {
    const sql = `
      SELECT * FROM respostas_rapidas 
      ORDER BY titulo ASC
    `;
    const [rows] = await db.execute<CannedResponseDB[]>(sql);
    return rows;
  }

  async create(titulo: string, mensagem: string): Promise<number> {
    const sql = `
      INSERT INTO respostas_rapidas (titulo, mensagem) 
      VALUES (?, ?)
    `;
    const [result] = await db.execute<ResultSetHeader>(sql, [titulo, mensagem]);
    return result.insertId;
  }
}

export default new CannedResponseRepository();
