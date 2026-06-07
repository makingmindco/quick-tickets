import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 });
    }

    const [rows]: any = await db.execute('SELECT NOW() as db_time');
    return NextResponse.json({ db_time: rows[0]?.db_time }, { status: 200 });
  } catch (erro) {
    console.error('Erro ao buscar hora do banco de dados:', erro);
    return NextResponse.json({ erro: 'Erro ao obter hora do servidor.' }, { status: 500 });
  }
}
