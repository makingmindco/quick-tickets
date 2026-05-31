import { NextRequest, NextResponse } from 'next/server';
import userRepository from '@/lib/repositories/userRepository';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const usuario = await userRepository.findByConfirmToken(token);
    if (!usuario) {
      return new NextResponse(
        '<h1>Erro</h1><p>Este link de confirmação é inválido ou já expirou. Por favor, cadastre-se novamente.</p>',
        {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
          status: 400
        }
      );
    }

    await userRepository.confirmEmail(usuario.id);

    return new NextResponse(
      `
        <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px; background: #f8fafc; padding: 40px; border-radius: 8px; max-width: 500px; margin: 50px auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h1 style="color: #10b981;">E-mail Confirmado!</h1>
            <p style="color: #334155; font-size: 16px;">Sua conta no QuickTickets foi ativada com sucesso.</p>
            <p style="color: #64748b; margin-top: 20px;">Você já pode fechar esta aba e voltar para a tela de Login.</p>
        </div>
      `,
      {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        status: 200
      }
    );
  } catch (erro) {
    console.error(erro);
    return new NextResponse(
      '<h1>Erro</h1><p>Erro interno ao confirmar e-mail.</p>',
      {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        status: 500
      }
    );
  }
}
