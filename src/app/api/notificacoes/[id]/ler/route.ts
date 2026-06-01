import { NextRequest, NextResponse } from 'next/server';
import notificationRepository from '@/lib/repositories/notificationRepository';
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
    const sucesso = await notificationRepository.markAsRead(parseInt(id), user.id);
    if (!sucesso) {
      return NextResponse.json({ erro: 'Notificação não encontrada ou não pertence a você.' }, { status: 404 });
    }

    return NextResponse.json({ mensagem: 'Notificação marcada como lida.' }, { status: 200 });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Erro ao marcar notificação como lida.' }, { status: 500 });
  }
}
