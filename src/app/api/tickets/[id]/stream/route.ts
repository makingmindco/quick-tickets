import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { serverEvents } from '@/lib/events';
import ticketRepository from '@/lib/repositories/ticketRepository';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return new Response('Não autorizado.', { status: 401 });
    }

    const { id } = await params;
    const ticketId = parseInt(id);

    // Validate that the ticket exists and belongs to the user or that the user is admin
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) {
      return new Response('Ticket não encontrado.', { status: 404 });
    }

    if (!user.is_admin && ticket.usuario_id !== user.id) {
      return new Response('Acesso negado.', { status: 403 });
    }

    // Set up SSE stream headers
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Heartbeat interval to keep connection alive
        const heartbeatInterval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(': heartbeat\n\n'));
          } catch (err) {
            clearInterval(heartbeatInterval);
          }
        }, 15000);

        // Listen for new messages
        const onNewMessage = (message: any) => {
          try {
            controller.enqueue(encoder.encode(`event: message_new\ndata: ${JSON.stringify(message)}\n\n`));
          } catch (err) {
            cleanup();
          }
        };

        // Listen for status/deadline updates
        const onStatusUpdate = (ticketUpdate: any) => {
          try {
            controller.enqueue(encoder.encode(`event: status_update\ndata: ${JSON.stringify(ticketUpdate)}\n\n`));
          } catch (err) {
            cleanup();
          }
        };

        const eventMessageKey = `message_new_${ticketId}`;
        const eventStatusKey = `status_update_${ticketId}`;

        serverEvents.on(eventMessageKey, onNewMessage);
        serverEvents.on(eventStatusKey, onStatusUpdate);

        const cleanup = () => {
          clearInterval(heartbeatInterval);
          serverEvents.off(eventMessageKey, onNewMessage);
          serverEvents.off(eventStatusKey, onStatusUpdate);
          try {
            controller.close();
          } catch (e) {}
        };

        // If client closes connection
        req.signal.addEventListener('abort', () => {
          cleanup();
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    console.error('Erro na rota de stream SSE:', err);
    return new Response('Erro interno do servidor.', { status: 500 });
  }
}
