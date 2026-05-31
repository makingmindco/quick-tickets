import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import userRepository from '@/lib/repositories/userRepository';
import { transporter } from '@/lib/mailer';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    const usuario = await userRepository.findByEmail(email);
    if (!usuario) {
      // Generic message for security to prevent email enumeration
      return NextResponse.json({ mensagem: 'Se o e-mail estiver cadastrado, você receberá as instruções em instantes.' }, { status: 200 });
    }

    const token = crypto.randomBytes(20).toString('hex');
    const dataExpiracao = new Date();
    dataExpiracao.setHours(dataExpiracao.getHours() + 1);

    await userRepository.setRecoveryToken(usuario.id, token, dataExpiracao);

    // Dynamically resolve origin from the incoming request (handles localhost:3000 or custom ports)
    const resetUrl = `${new URL(req.url).origin}/reset-password?token=${token}`;

    const emailConfig = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'QuickTickets - Recuperação de Senha',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f62ac; text-align: center;">Olá, ${usuario.nome}!</h2>
          <p style="color: #334155; font-size: 16px;">Recebemos um pedido para redefinir a sua senha no QuickTickets.</p>
          <p style="color: #334155; font-size: 16px;">Para criar uma nova senha, clique no botão abaixo:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetUrl}" style="background: #f59e0b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Redefinir Minha Senha</a>
          </div>
          <p style="color: #64748b; font-size: 14px; text-align: center;"><strong>Atenção:</strong> Este link é válido por apenas 1 hora. Se você não solicitou essa alteração, basta ignorar este e-mail.</p>
        </div>
      `
    };

    await transporter.sendMail(emailConfig);

    return NextResponse.json({ mensagem: 'Se o e-mail estiver cadastrado, você receberá as instruções em instantes.' }, { status: 200 });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Erro ao processar a solicitação.' }, { status: 500 });
  }
}
