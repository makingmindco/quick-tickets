import { NextRequest, NextResponse } from 'next/server';
import userRepository from '@/lib/repositories/userRepository';
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
    const { nome, email, cargo, is_admin } = await req.json();

    if (!nome || !email) {
      return NextResponse.json({ erro: 'Nome e E-mail são obrigatórios.' }, { status: 400 });
    }

    const sucesso = await userRepository.updateUser(parseInt(id), {
      nome,
      email,
      cargo: cargo || '',
      is_admin: !!is_admin
    });

    if (!sucesso) {
      return NextResponse.json({ erro: 'Usuário não encontrado ou sem alterações.' }, { status: 404 });
    }

    return NextResponse.json({ mensagem: 'Usuário atualizado com sucesso!' }, { status: 200 });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Erro ao atualizar usuário.' }, { status: 500 });
  }
}

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
      return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 });
    }

    const { id } = await params;

    if (parseInt(id) === user.id) {
      return NextResponse.json({ erro: 'Você não pode excluir a sua própria conta.' }, { status: 400 });
    }

    const sucesso = await userRepository.delete(parseInt(id));
    if (!sucesso) {
      return NextResponse.json({ erro: 'Usuário não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ mensagem: 'Usuário removido com sucesso!' }, { status: 200 });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Erro ao remover usuário.' }, { status: 500 });
  }
}
