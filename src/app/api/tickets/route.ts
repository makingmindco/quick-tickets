import { NextRequest, NextResponse } from 'next/server';
import ticketRepository from '@/lib/repositories/ticketRepository';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 });
    }

    const tickets = await ticketRepository.findByUserId(user.id);
    return NextResponse.json(tickets, { status: 200 });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Erro ao buscar os tickets.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 });
    }

    const { categoria_id, titulo, descricao } = await req.json();

    if (!categoria_id || !titulo || !descricao) {
      return NextResponse.json({ erro: 'Todos os campos são obrigatórios.' }, { status: 400 });
    }

    const ticketId = await ticketRepository.create({
      usuario_id: user.id,
      categoria_id: parseInt(categoria_id),
      titulo,
      descricao
    });

    return NextResponse.json({
      mensagem: 'Ticket aberto com sucesso!',
      ticket_id: ticketId
    }, { status: 201 });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Erro interno ao criar o ticket.' }, { status: 500 });
  }
}
