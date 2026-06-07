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

    if (ticket.urgencia_solicitada) {
      return NextResponse.json({ erro: 'Urgência já solicitada para este chamado.' }, { status: 400 });
    }

    const sucesso = await ticketRepository.requestUrgency(ticketId, user.id);
    if (!sucesso) {
      return NextResponse.json({ erro: 'Permissão negada ou não foi possível solicitar urgência.' }, { status: 403 });
    }

    return NextResponse.json({ mensagem: 'Solicitação de urgência registrada com sucesso.' }, { status: 200 });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Erro ao solicitar urgência.' }, { status: 500 });
  }
}
