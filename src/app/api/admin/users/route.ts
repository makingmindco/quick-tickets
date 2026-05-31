import { NextRequest, NextResponse } from 'next/server';
import userRepository from '@/lib/repositories/userRepository';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 });
    }

    if (!user.is_admin) {
      return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 });
    }

    const users = await userRepository.findAll();
    return NextResponse.json(users, { status: 200 });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Erro ao listar usuários.' }, { status: 500 });
  }
}
