import { NextRequest, NextResponse } from 'next/server';
import avisoRepository from '@/lib/repositories/avisoRepository';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 });
    }

    const avisos = await avisoRepository.findAll();
    return NextResponse.json(avisos, { status: 200 });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Erro ao buscar avisos.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 });
    }

    if (!user.is_admin) {
      return NextResponse.json({ erro: 'Acesso negado. Apenas administradores.' }, { status: 403 });
    }

    const { titulo, mensagem } = await req.json();

    if (!titulo || !mensagem) {
      return NextResponse.json({ erro: 'Título e mensagem são obrigatórios.' }, { status: 400 });
    }

    await avisoRepository.create({
      titulo,
      mensagem,
      admin_id: user.id
    });

    const notificationRepository = (await import('@/lib/repositories/notificationRepository')).default;
    await notificationRepository.notifyAllStudents({
      titulo: 'Novo Aviso da Coordenação 📢',
      mensagem: `A coordenação publicou um novo aviso: "${titulo}"`,
      tipo: 'aviso',
      link: '/dashboard'
    });

    return NextResponse.json({ mensagem: 'Aviso publicado com sucesso!' }, { status: 201 });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Erro ao publicar aviso.' }, { status: 500 });
  }
}
