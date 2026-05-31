import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import userRepository from '@/lib/repositories/userRepository';

export async function POST(req: NextRequest) {
  try {
    const { token, novaSenha } = await req.json();

    if (!token || !novaSenha) {
      return NextResponse.json({ erro: 'Token e nova senha são obrigatórios.' }, { status: 400 });
    }

    const usuario = await userRepository.findByRecoveryToken(token);
    if (!usuario) {
      return NextResponse.json({ erro: 'Link inválido ou expirado. Por favor, solicite a recuperação novamente.' }, { status: 400 });
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

    await userRepository.resetPassword(usuario.id, senhaHash);

    return NextResponse.json({ mensagem: 'Senha alterada com sucesso! Você já pode fazer login com a nova senha.' }, { status: 200 });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Erro ao redefinir a senha.' }, { status: 500 });
  }
}
