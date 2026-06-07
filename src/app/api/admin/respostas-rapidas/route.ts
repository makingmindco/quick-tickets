import { NextRequest, NextResponse } from 'next/server';
import cannedResponseRepository from '@/lib/repositories/cannedResponseRepository';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 });
    }

    // Even students can fetch canned responses? Wait!
    // The implementation plan says "dentro do chat do admin... respostas rápidas".
    // But wait, it's safer if only admins can access it, or let's allow admins.
    if (!user.is_admin) {
      return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 });
    }

    const responses = await cannedResponseRepository.findAll();
    return NextResponse.json(responses, { status: 200 });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Erro ao listar respostas rápidas.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 });
    }

    if (!user.is_admin) {
      return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 });
    }

    const { titulo, mensagem } = await req.json();
    if (!titulo || !mensagem) {
      return NextResponse.json({ erro: 'Título e mensagem são obrigatórios.' }, { status: 400 });
    }

    const insertId = await cannedResponseRepository.create(titulo, mensagem);
    return NextResponse.json({ mensagem: 'Resposta rápida criada com sucesso.', id: insertId }, { status: 201 });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Erro ao salvar resposta rápida.' }, { status: 500 });
  }
}
