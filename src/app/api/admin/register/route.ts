import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import userRepository from '@/lib/repositories/userRepository';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 });
    }

    if (!user.is_admin) {
      return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 });
    }

    const { nome, email, senha, cargo } = await req.json();

    if (!nome || !email || !senha) {
      return NextResponse.json({ erro: 'Todos os campos são obrigatórios.' }, { status: 400 });
    }

    const usuarioExistente = await userRepository.findByEmail(email);
    if (usuarioExistente) {
      return NextResponse.json({ erro: 'Este e-mail já está cadastrado.' }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    await userRepository.create({
      nome,
      email,
      senhaHash,
      isAdmin: true,
      trocarSenhaObrigatorio: true,
      cargo: cargo || 'Administrador',
      tokenConfirmacao: null,
      tokenExpiracao: null
    });

    return NextResponse.json({ mensagem: 'Novo administrador cadastrado com sucesso!' }, { status: 201 });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Erro ao cadastrar administrador.' }, { status: 500 });
  }
}
