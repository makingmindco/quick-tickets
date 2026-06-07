import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
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

    // 1. Average Response Time (SLA to start: criado_em to atendido_em) in minutes
    const [responseTimeRows]: any = await db.execute(`
      SELECT AVG(TIMESTAMPDIFF(MINUTE, criado_em, atendido_em)) as avg_response_time 
      FROM tickets 
      WHERE atendido_em IS NOT NULL
    `);
    const avgResponseTime = Math.round(responseTimeRows[0]?.avg_response_time || 0);

    // 2. Average Resolution Time (atendido_em to finalizado_em) in minutes
    const [resolutionTimeRows]: any = await db.execute(`
      SELECT AVG(TIMESTAMPDIFF(MINUTE, atendido_em, finalizado_em)) as avg_resolution_time 
      FROM tickets 
      WHERE status = 'finalizado' AND atendido_em IS NOT NULL AND finalizado_em IS NOT NULL
    `);
    const avgResolutionTime = Math.round(resolutionTimeRows[0]?.avg_resolution_time || 0);

    // 3. Volumetric count by Category
    const [categoryRows]: any = await db.execute(`
      SELECT c.nome as categoria, COUNT(*) as total 
      FROM tickets t
      JOIN categorias c ON t.categoria_id = c.id
      GROUP BY c.nome
    `);

    // 4. Customer satisfaction stats
    const [satisfactionRows]: any = await db.execute(`
      SELECT AVG(avaliacao_nota) as avg_rating, COUNT(avaliacao_nota) as total_ratings
      FROM tickets 
      WHERE status = 'finalizado' AND avaliacao_nota IS NOT NULL
    `);
    const avgRating = parseFloat(satisfactionRows[0]?.avg_rating || 0).toFixed(1);
    const totalRatings = satisfactionRows[0]?.total_ratings || 0;

    // 5. Urgency requests distribution
    const [urgencyRows]: any = await db.execute(`
      SELECT urgencia_solicitada, COUNT(*) as total 
      FROM tickets 
      GROUP BY urgencia_solicitada
    `);
    const urgencyStats = {
      normal: 0,
      urgente: 0
    };
    urgencyRows.forEach((row: any) => {
      if (row.urgencia_solicitada === 1) {
        urgencyStats.urgente = row.total;
      } else {
        urgencyStats.normal = row.total;
      }
    });

    // 6. Status distribution
    const [statusRows]: any = await db.execute(`
      SELECT status, COUNT(*) as total 
      FROM tickets 
      GROUP BY status
    `);
    const statusStats = {
      pendente: 0,
      em_andamento: 0,
      finalizado: 0
    };
    statusRows.forEach((row: any) => {
      if (row.status === 'pendente') statusStats.pendente = row.total;
      if (row.status === 'em_andamento') statusStats.em_andamento = row.total;
      if (row.status === 'finalizado') statusStats.finalizado = row.total;
    });

    return NextResponse.json({
      avgResponseTime,
      avgResolutionTime,
      categoryStats: categoryRows,
      satisfaction: {
        avgRating: parseFloat(avgRating),
        totalRatings
      },
      urgencyStats,
      statusStats
    }, { status: 200 });

  } catch (erro) {
    console.error('Erro ao buscar métricas:', erro);
    return NextResponse.json({ erro: 'Erro ao gerar métricas do sistema.' }, { status: 500 });
  }
}
