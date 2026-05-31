import { NextRequest, NextResponse } from 'next/server';
import avisoRepository from '@/lib/repositories/avisoRepository';
import { getAuthUser } from '@/lib/auth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 });
    }

    if (!user.is_admin) {
      return NextResponse.json({ erro: 'Acesso negado. Apenas administradores.' }, { status: 403 });
    }

    const { id } = await params;
    const sucesso = await avisoRepository.delete(parseInt(id));
    if (!sucesso) {
      return NextResponse.json({ erro: 'Aviso não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ mensagem: 'Aviso removido com sucesso!' }, { status: 200 });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Erro ao remover aviso.' }, { status: 500 });
  }
}
