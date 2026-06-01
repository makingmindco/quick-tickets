import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import userRepository from '@/lib/repositories/userRepository';
import { generateToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, senha } = await req.json();

    if (!email || !senha) {
      return NextResponse.json({ erro: 'E-mail e senha são obrigatórios.' }, { status: 400 });
    }

    const usuario = await userRepository.findByEmail(email);
    if (!usuario) {
      return NextResponse.json({ erro: 'E-mail ou senha incorretos.' }, { status: 400 });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) {
      return NextResponse.json({ erro: 'E-mail ou senha incorretos.' }, { status: 400 });
    }

    if (usuario.email_confirmado === 0 && usuario.is_admin === 0) {
      return NextResponse.json({ erro: 'Por favor, confirme seu e-mail antes de fazer login.' }, { status: 403 });
    }

    const token = generateToken({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      is_admin: usuario.is_admin === 1,
      cargo: usuario.cargo || undefined
    });

    return NextResponse.json({
      mensagem: 'Login realizado com sucesso',
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        is_admin: usuario.is_admin,
        trocar_senha_obrigatorio: usuario.trocar_senha_obrigatorio,
        cargo: usuario.cargo,
        foto_url: usuario.foto_url,
        tema_escuro: usuario.tema_escuro
      }
    }, { status: 200 });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Erro interno no servidor.' }, { status: 500 });
  }
}
