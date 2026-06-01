import { NextRequest, NextResponse } from 'next/server';
import userRepository from '@/lib/repositories/userRepository';
import { getAuthUser } from '@/lib/auth';

export async function PUT(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 });
    }

    const { nome, tema_escuro } = await req.json();

    if (!nome) {
      return NextResponse.json({ erro: 'Nome é obrigatório.' }, { status: 400 });
    }

    const userDb = await userRepository.findById(user.id);
    if (!userDb) {
      return NextResponse.json({ erro: 'Usuário não encontrado.' }, { status: 404 });
    }

    const finalTemaEscuro = tema_escuro !== undefined ? (tema_escuro ? 1 : 0) : userDb.tema_escuro;

    // Update user profile details
    const sucesso = await userRepository.updateUser(user.id, {
      nome: nome.trim(),
      email: userDb.email, // Lock email field to DB value
      cargo: userDb.cargo || 'Estudante',
      is_admin: userDb.is_admin === 1,
      tema_escuro: finalTemaEscuro
    });

    if (!sucesso) {
      return NextResponse.json({ erro: 'Erro ao salvar alterações no perfil.' }, { status: 500 });
    }

    // Return the updated user object
    const updatedUser = {
      id: user.id,
      nome: nome.trim(),
      email: userDb.email,
      cargo: userDb.cargo || 'Estudante',
      is_admin: userDb.is_admin === 1,
      foto_url: userDb.foto_url,
      tema_escuro: finalTemaEscuro === 1
    };

    return NextResponse.json({
      mensagem: 'Perfil atualizado com sucesso!',
      usuario: updatedUser
    }, { status: 200 });

  } catch (erro) {
    console.error('[Profile API] Erro ao atualizar perfil:', erro);
    return NextResponse.json({ erro: 'Erro interno ao processar solicitação.' }, { status: 500 });
  }
}
