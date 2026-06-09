import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import userRepository from '@/lib/repositories/userRepository';
import { transporter } from '@/lib/mailer';

export async function POST(req: NextRequest) {
  try {
    const { nome, email, senha, cargo } = await req.json();

    if (!nome || !email || !senha || !cargo) {
      return NextResponse.json({ erro: 'Todos os campos são obrigatórios.' }, { status: 400 });
    }

    const hasLength = senha.length >= 8;
    const hasUpper = /[A-Z]/.test(senha);
    const hasLower = /[a-z]/.test(senha);
    const hasNumber = /[0-9]/.test(senha);
    const hasSpecial = /[^A-Za-z0-9]/.test(senha);

    if (!hasLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return NextResponse.json({ erro: 'A senha não atende aos requisitos mínimos de segurança.' }, { status: 400 });
    }

    const usuarioExistente = await userRepository.findByEmail(email);
    if (usuarioExistente) {
      return NextResponse.json({ erro: 'Este e-mail já está cadastrado.' }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const dataExpiracao = new Date();
    dataExpiracao.setMinutes(dataExpiracao.getMinutes() + 15);

    await userRepository.create({
      nome,
      email,
      senhaHash,
      tokenConfirmacao: token,
      tokenExpiracao: dataExpiracao,
      cargo
    });

    const emailConfig = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'QuickTickets - Código de confirmação',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f62ac; text-align: center;">Bem-vindo ao QuickTickets, ${nome}!</h2>
          <p style="color: #334155; font-size: 16px; text-align: center;">Seu código de verificação é:</p>
          <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; font-size: 28px; font-weight: 800; text-align: center; letter-spacing: 4px; color: #0f62ac; margin: 20px 0;">
            ${token}
          </div>
          <p style="color: #64748b; font-size: 14px; text-align: center;"><strong>Atenção:</strong> Este código expira em 15 minutos.</p>
        </div>
      `
    };

    let isEmailSent = true;
    try {
      await transporter.sendMail(emailConfig);
    } catch (emailErr) {
      console.error('[Mailer] Erro ao enviar e-mail de confirmação de cadastro:', emailErr);
      console.log(`[Confirmação] Código para o e-mail (${email}): ${token}`);
      isEmailSent = false;
    }

    return NextResponse.json({ 
      mensagem: 'Usuário cadastrado! Digite o código de 6 dígitos enviado ao seu e-mail para ativar a conta.',
      devCode: !isEmailSent ? token : undefined
    }, { status: 201 });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Erro ao cadastrar usuário.' }, { status: 500 });
  }
}
