import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import userRepository from '@/lib/repositories/userRepository';
import { getAuthUser } from '@/lib/auth';

export async function PUT(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 });
    }

    const { usuario_id, novaSenha } = await req.json();

    if (user.id !== parseInt(usuario_id) && !user.is_admin) {
      return NextResponse.json({ erro: 'Não autorizado.' }, { status: 403 });
    }

    const hasLength = novaSenha.length >= 8;
    const hasUpper = /[A-Z]/.test(novaSenha);
    const hasLower = /[a-z]/.test(novaSenha);
    const hasNumber = /[0-9]/.test(novaSenha);
    const hasSpecial = /[^A-Za-z0-9]/.test(novaSenha);

    if (!hasLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return NextResponse.json({ erro: 'A nova senha não atende aos requisitos mínimos de segurança.' }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(novaSenha, salt);

    await userRepository.updatePassword(parseInt(usuario_id), senhaHash, false);

    return NextResponse.json({ mensagem: 'Senha atualizada com sucesso!' }, { status: 200 });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Erro ao atualizar a senha.' }, { status: 500 });
  }
}
