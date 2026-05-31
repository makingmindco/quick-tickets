import { NextRequest, NextResponse } from 'next/server';
import ticketRepository from '@/lib/repositories/ticketRepository';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 });
    }

    if (!user.is_admin) {
      return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 });
    }

    const contagem = await ticketRepository.getStatusCounts();
    
    const estatisticas: Record<string, number> = {
      pendente: 0,
      em_andamento: 0,
      finalizado: 0
    };

    contagem.forEach(item => {
      if (estatisticas[item.status] !== undefined) {
        estatisticas[item.status] = item.total;
      }
    });

    return NextResponse.json(estatisticas, { status: 200 });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Erro ao gerar dados do dashboard.' }, { status: 500 });
  }
}
