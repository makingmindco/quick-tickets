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

    if (!user.is_admin) {
      return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 });
    }

    const { id } = await params;
    const { status, prazo } = await req.json();

    const ticket = await ticketRepository.findById(parseInt(id));
    if (!ticket) {
      return NextResponse.json({ erro: 'Ticket não encontrado.' }, { status: 404 });
    }

    const sucesso = await ticketRepository.updateStatus(parseInt(id), {
      status,
      prazo: prazo || null,
      admin_id: user.id
    });

    if (!sucesso) {
      return NextResponse.json({ erro: 'Não foi possível atualizar o ticket.' }, { status: 400 });
    }

    // Enviar e-mails e criar notificações internas
    if (ticket.usuario_id) {
      const notificationRepository = (await import('@/lib/repositories/notificationRepository')).default;
      if (status === 'em_andamento') {
        await notificationRepository.create({
          usuarioId: ticket.usuario_id,
          titulo: 'Chamado em atendimento 💬',
          mensagem: `Seu chamado #${ticket.id} (${ticket.titulo || ticket.categoria}) foi assumido e está em atendimento.`,
          tipo: 'atendimento',
          link: `/dashboard`
        });
      } else if (status === 'finalizado') {
        await notificationRepository.create({
          usuarioId: ticket.usuario_id,
          titulo: 'Chamado resolvido! ✅',
          mensagem: `Seu chamado #${ticket.id} (${ticket.titulo || ticket.categoria}) foi finalizado por ${user.nome}.`,
          tipo: 'finalizado',
          link: `/dashboard`
        });
      }
    }

    if (ticket.cliente_email && ticket.cliente_nome) {
      if (status === 'em_andamento') {
        await emailService.enviarNotificacaoAtendimento(
          ticket.cliente_email,
          ticket.cliente_nome,
          ticket.id,
          ticket.titulo || ticket.categoria || 'Chamado'
        );
      } else if (status === 'finalizado') {
        await emailService.enviarNotificacaoFinalizado(
          ticket.cliente_email,
          ticket.cliente_nome,
          ticket.id,
          ticket.titulo || ticket.categoria || 'Chamado',
          user.nome
        );
      }
    }

    return NextResponse.json({ mensagem: 'Ticket atualizado com sucesso.' }, { status: 200 });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Erro ao atualizar o ticket.' }, { status: 500 });
  }
}
