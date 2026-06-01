import { NextRequest, NextResponse } from 'next/server';
import notificationRepository from '@/lib/repositories/notificationRepository';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 });
    }

    let notificacoes = await notificationRepository.findAllByUserId(user.id);
    if (notificacoes.length === 0) {
      await notificationRepository.create({
        usuarioId: user.id,
        titulo: 'Bem-vindo ao QuickTickets! 🎉',
        mensagem: 'Sua central de chamados acadêmicos e de infraestrutura. Abra um ticket se precisar de ajuda.',
        tipo: 'info'
      });
      await notificationRepository.create({
        usuarioId: user.id,
        titulo: 'Atualização do Sistema v1.2 🚀',
        mensagem: 'Novo realinhamento visual de tabelas, menus e login concluídos. Ajustes de conta e notificações em tempo real adicionados.',
        tipo: 'system'
      });
      notificacoes = await notificationRepository.findAllByUserId(user.id);
    }
    return NextResponse.json(notificacoes, { status: 200 });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Erro ao buscar notificações.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 });
    }

    await notificationRepository.markAllAsRead(user.id);
    return NextResponse.json({ mensagem: 'Todas as notificações marcadas como lidas.' }, { status: 200 });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Erro ao marcar notificações como lidas.' }, { status: 500 });
  }
}
