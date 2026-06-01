import { db } from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface UserDB extends RowDataPacket {
  id: number;
  nome: string;
  email: string;
  senha_hash: string;
  token_confirmacao: string | null;
  token_expiracao: Date | null;
  cargo: string | null;
  is_admin: number; // 0 or 1 in MySQL
  trocar_senha_obrigatorio: number;
  email_confirmado: number;
  token_recuperacao: string | null;
  expiracao_recuperacao: Date | null;
  criado_em: Date;
  foto_url: string | null;
  tema_escuro: number;
}

class UserRepository {
  async findById(id: number): Promise<UserDB | undefined> {
    const [rows] = await db.execute<UserDB[]>('SELECT * FROM usuarios WHERE id = ?', [id]);
    return rows[0];
  }

  async findByEmail(email: string): Promise<UserDB | undefined> {
    const [rows] = await db.execute<UserDB[]>('SELECT * FROM usuarios WHERE email = ?', [email]);
    return rows[0];
  }

  async findByConfirmToken(token: string): Promise<{ id: number } | undefined> {
    const [rows] = await db.execute<UserDB[]>('SELECT id FROM usuarios WHERE token_confirmacao = ? AND token_expiracao > NOW()', [token]);
    return rows[0];
  }

  async findByRecoveryToken(token: string): Promise<{ id: number } | undefined> {
    const [rows] = await db.execute<UserDB[]>('SELECT id FROM usuarios WHERE token_recuperacao = ? AND expiracao_recuperacao > NOW()', [token]);
    return rows[0];
  }

  async create({
    nome,
    email,
    senhaHash,
    tokenConfirmacao,
    tokenExpiracao,
    cargo,
    isAdmin = false,
    trocarSenhaObrigatorio = false
  }: {
    nome: string;
    email: string;
    senhaHash: string;
    tokenConfirmacao: string | null;
    tokenExpiracao: Date | null;
    cargo: string | null;
    isAdmin?: boolean;
    trocarSenhaObrigatorio?: boolean;
  }): Promise<number> {
    const sql = 'INSERT INTO usuarios (nome, email, senha_hash, token_confirmacao, token_expiracao, cargo, is_admin, trocar_senha_obrigatorio) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const [result] = await db.execute<ResultSetHeader>(sql, [
      nome,
      email,
      senhaHash,
      tokenConfirmacao,
      tokenExpiracao,
      cargo,
      isAdmin ? 1 : 0,
      trocarSenhaObrigatorio ? 1 : 0
    ]);
    return result.insertId;
  }

  async confirmEmail(id: number): Promise<void> {
    await db.execute('UPDATE usuarios SET email_confirmado = 1, token_confirmacao = NULL, token_expiracao = NULL WHERE id = ?', [id]);
  }

  async updatePassword(id: number, senhaHash: string, trocarSenhaObrigatorio = false): Promise<void> {
    await db.execute('UPDATE usuarios SET senha_hash = ?, trocar_senha_obrigatorio = ? WHERE id = ?', [senhaHash, trocarSenhaObrigatorio ? 1 : 0, id]);
  }

  async setRecoveryToken(id: number, token: string, expiracao: Date): Promise<void> {
    await db.execute('UPDATE usuarios SET token_recuperacao = ?, expiracao_recuperacao = ? WHERE id = ?', [token, expiracao, id]);
  }

  async resetPassword(id: number, senhaHash: string): Promise<void> {
    await db.execute('UPDATE usuarios SET senha_hash = ?, token_recuperacao = NULL, expiracao_recuperacao = NULL WHERE id = ?', [senhaHash, id]);
  }

  async deleteExpiredUnconfirmed(): Promise<number> {
    const sql = 'DELETE FROM usuarios WHERE email_confirmado = 0 AND token_expiracao < NOW()';
    const [result] = await db.execute<ResultSetHeader>(sql);
    return result.affectedRows;
  }

  async findAll(): Promise<Partial<UserDB>[]> {
    const sql = 'SELECT id, nome, email, is_admin, cargo, criado_em, email_confirmado FROM usuarios ORDER BY nome ASC';
    const [rows] = await db.execute<UserDB[]>(sql);
    return rows;
  }

  async delete(id: number): Promise<boolean> {
    const sql = 'DELETE FROM usuarios WHERE id = ?';
    const [result] = await db.execute<ResultSetHeader>(sql, [id]);
    return result.affectedRows > 0;
  }

  async updateUser(
    id: number,
    {
      nome,
      email,
      cargo,
      is_admin,
      foto_url,
      tema_escuro
    }: {
      nome: string;
      email: string;
      cargo: string;
      is_admin: boolean;
      foto_url?: string | null;
      tema_escuro?: boolean | number;
    }
  ): Promise<boolean> {
    const user = await this.findById(id);
    if (!user) return false;

    const finalFotoUrl = foto_url !== undefined ? foto_url : user.foto_url;
    const finalTemaEscuro = tema_escuro !== undefined ? (tema_escuro ? 1 : 0) : user.tema_escuro;

    const sql = 'UPDATE usuarios SET nome = ?, email = ?, cargo = ?, is_admin = ?, foto_url = ?, tema_escuro = ? WHERE id = ?';
    const [result] = await db.execute<ResultSetHeader>(sql, [
      nome,
      email,
      cargo,
      is_admin ? 1 : 0,
      finalFotoUrl,
      finalTemaEscuro,
      id
    ]);
    return result.affectedRows > 0;
  }
}

export default new UserRepository();
