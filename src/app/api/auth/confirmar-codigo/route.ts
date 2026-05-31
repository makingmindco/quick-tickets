import { NextRequest, NextResponse } from 'next/server';
import userRepository from '@/lib/repositories/userRepository';

export async function POST(req: NextRequest) {
  try {
    const { email, codigo } = await req.json();

    if (!email || !codigo) {
      return NextResponse.json({ erro: 'E-mail e código são obrigatórios.' }, { status: 400 });
    }

    const usuario = await userRepository.findByEmail(email);
    if (!usuario) {
      return NextResponse.json({ erro: 'Usuário não encontrado.' }, { status: 400 });
    }

    if (usuario.email_confirmado === 1) {
      return NextResponse.json({ mensagem: 'E-mail já confirmado!' }, { status: 200 });
    }

    if (usuario.token_confirmacao !== codigo) {
      return NextResponse.json({ erro: 'Código de confirmação incorreto.' }, { status: 400 });
    }

    if (!usuario.token_expiracao || new Date(usuario.token_expiracao) < new Date()) {
      return NextResponse.json({ erro: 'O código de confirmação expirou. Por favor, cadastre-se novamente.' }, { status: 400 });
    }

    await userRepository.confirmEmail(usuario.id);

    return NextResponse.json({ mensagem: 'E-mail verificado com sucesso! Agora você pode fazer login.' }, { status: 200 });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Erro ao confirmar código de verificação.' }, { status: 500 });
  }
}
