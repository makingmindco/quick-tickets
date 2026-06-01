import { db } from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface NotificationDB extends RowDataPacket {
  id: number;
  usuario_id: number;
  titulo: string;
  mensagem: string;
  lida: number; // 0 or 1
  tipo: string;
  link: string | null;
  criado_em: Date;
}

class NotificationRepository {
  async create({
    usuarioId,
    titulo,
    mensagem,
    tipo = 'info',
    link = null
  }: {
    usuarioId: number;
    titulo: string;
    mensagem: string;
    tipo?: string;
    link?: string | null;
  }): Promise<number> {
    const sql = 'INSERT INTO notificacoes (usuario_id, titulo, mensagem, tipo, link) VALUES (?, ?, ?, ?, ?)';
    const [result] = await db.execute<ResultSetHeader>(sql, [usuarioId, titulo, mensagem, tipo, link]);
    return result.insertId;
  }

  async findAllByUserId(usuarioId: number): Promise<NotificationDB[]> {
    const sql = 'SELECT * FROM notificacoes WHERE usuario_id = ? ORDER BY criado_em DESC LIMIT 50';
    const [rows] = await db.execute<NotificationDB[]>(sql, [usuarioId]);
    return rows;
  }

  async markAsRead(id: number, usuarioId: number): Promise<boolean> {
    const sql = 'UPDATE notificacoes SET lida = 1 WHERE id = ? AND usuario_id = ?';
    const [result] = await db.execute<ResultSetHeader>(sql, [id, usuarioId]);
    return result.affectedRows > 0;
  }

  async markAllAsRead(usuarioId: number): Promise<void> {
    const sql = 'UPDATE notificacoes SET lida = 1 WHERE usuario_id = ?';
    await db.execute(sql, [usuarioId]);
  }

  async notifyAllUsers({
    titulo,
    mensagem,
    tipo = 'info',
    link = null
  }: {
    titulo: string;
    mensagem: string;
    tipo?: string;
    link?: string | null;
  }): Promise<void> {
    // Buscar todos os usuários
    const [users] = await db.execute<{ id: number }[] & RowDataPacket[]>('SELECT id FROM usuarios');
    
    // Inserir notificação para cada usuário
    for (const user of users) {
      await this.create({
        usuarioId: user.id,
        titulo,
        mensagem,
        tipo,
        link
      });
    }
  }

  async notifyAllStudents({
    titulo,
    mensagem,
    tipo = 'info',
    link = null
  }: {
    titulo: string;
    mensagem: string;
    tipo?: string;
    link?: string | null;
  }): Promise<void> {
    // Buscar todos os usuários não administradores
    const [users] = await db.execute<{ id: number }[] & RowDataPacket[]>('SELECT id FROM usuarios WHERE is_admin = 0');
    
    // Inserir notificação para cada aluno
    for (const user of users) {
      await this.create({
        usuarioId: user.id,
        titulo,
        mensagem,
        tipo,
        link
      });
    }
  }
}

export default new NotificationRepository();
