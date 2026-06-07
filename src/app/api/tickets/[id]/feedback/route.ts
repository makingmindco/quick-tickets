import { NextRequest, NextResponse } from 'next/server';
import ticketRepository from '@/lib/repositories/ticketRepository';
import { getAuthUser } from '@/lib/auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 });
    }

    const { id } = await params;
    const ticketId = parseInt(id);

    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) {
      return NextResponse.json({ erro: 'Ticket não encontrado.' }, { status: 404 });
    }

    if (ticket.usuario_id !== user.id) {
      return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 });
    }

    if (ticket.status !== 'finalizado') {
      return NextResponse.json({ erro: 'O chamado precisa estar finalizado para ser avaliado.' }, { status: 400 });
    }

    const { nota, comentario } = await req.json();

    if (typeof nota !== 'number' || nota < 1 || nota > 5) {
      return NextResponse.json({ erro: 'A nota deve ser um número inteiro de 1 a 5.' }, { status: 400 });
    }

    const sucesso = await ticketRepository.saveFeedback(ticketId, user.id, nota, comentario || null);
    if (!sucesso) {
      return NextResponse.json({ erro: 'Não foi possível salvar a avaliação.' }, { status: 400 });
    }

    return NextResponse.json({ mensagem: 'Avaliação enviada com sucesso.' }, { status: 200 });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Erro ao salvar avaliação.' }, { status: 500 });
  }
}
