import { NextRequest, NextResponse } from 'next/server';
import ticketRepository from '@/lib/repositories/ticketRepository';
import emailService from '@/lib/emailService';
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
    const ticket = await ticketRepository.findById(parseInt(id));
    if (!ticket) {
      return NextResponse.json({ erro: 'Ticket não encontrado.' }, { status: 404 });
    }

    const sucesso = await ticketRepository.closeByUser(parseInt(id), user.id);
    if (!sucesso) {
      return NextResponse.json({ erro: 'Permissão negada ou ticket já finalizado.' }, { status: 403 });
    }

    try {
      const updatedTicket = await ticketRepository.findById(parseInt(id));
      if (updatedTicket) {
        const { serverEvents } = await import('@/lib/events');
        serverEvents.emit(`status_update_${id}`, updatedTicket);
      }
    } catch (eventErr) {
      console.error('Erro ao emitir status_update em close:', eventErr);
    }

    if (ticket.cliente_email && ticket.cliente_nome) {
      await emailService.enviarNotificacaoFinalizado(
        ticket.cliente_email,
        ticket.cliente_nome,
        ticket.id,
        ticket.titulo || ticket.categoria || 'Chamado',
        user.nome
      );
    }

    return NextResponse.json({ mensagem: 'Ticket encerrado com sucesso.' }, { status: 200 });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Erro ao encerrar o ticket.' }, { status: 500 });
  }
}
