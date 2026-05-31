import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import ticketRepository from '@/lib/repositories/ticketRepository';
import messageRepository from '@/lib/repositories/messageRepository';
import emailService from '@/lib/emailService';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 });
    }

    const { id } = await params;
    const ticketId = parseInt(id);

    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) {
      return NextResponse.json({ erro: 'Ticket não encontrado.' }, { status: 404 });
    }

    if (ticket.usuario_id !== user.id && !user.is_admin) {
      return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 });
    }

    const messages = await messageRepository.findByTicketId(ticketId);
    return NextResponse.json(messages, { status: 200 });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Erro ao carregar mensagens.' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 });
    }

    const { id } = await params;
    const ticketId = parseInt(id);

    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) {
      return NextResponse.json({ erro: 'Ticket não encontrado.' }, { status: 404 });
    }

    if (ticket.usuario_id !== user.id && !user.is_admin) {
      return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 });
    }

    const formData = await req.formData();
    const mensagem = formData.get('mensagem') as string | null;
    const arquivo = formData.get('arquivo') as File | null;

    let tipo: 'texto' | 'imagem' | 'audio' = 'texto';
    let arquivo_url: string | null = null;

    if (arquivo && arquivo.size > 0) {
      const bytes = await arquivo.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadsDir = path.join(process.cwd(), 'public/uploads');
      // Ensure the uploads directory exists
      await fs.mkdir(uploadsDir, { recursive: true });

      const hash = crypto.randomBytes(16).toString('hex');
      const ext = path.extname(arquivo.name);
      const filename = `${hash}${ext}`;
      const filePath = path.join(uploadsDir, filename);

      await fs.writeFile(filePath, buffer);
      arquivo_url = `/uploads/${filename}`;

      const mimetype = arquivo.type.toLowerCase();
      const lowerFilename = filename.toLowerCase();

      if (mimetype.startsWith('image/')) {
        tipo = 'imagem';
      } else if (
        mimetype.startsWith('audio/') ||
        mimetype.startsWith('video/ogg') ||
        lowerFilename.endsWith('.webm') ||
        lowerFilename.endsWith('.ogg') ||
        lowerFilename.endsWith('.mp3') ||
        lowerFilename.endsWith('.wav') ||
        lowerFilename.endsWith('.m4a') ||
        lowerFilename.endsWith('.mp4')
      ) {
        tipo = 'audio';
      }
    }

    if (!mensagem && !arquivo_url) {
      return NextResponse.json({ erro: 'A mensagem ou anexo não pode ser vazio.' }, { status: 400 });
    }

    await messageRepository.create({
      ticket_id: ticketId,
      usuario_id: user.id,
      mensagem,
      tipo,
      arquivo_url
    });

    if (user.is_admin && ticket.cliente_email && ticket.cliente_nome) {
      const textoNotificacao = mensagem || '[Arquivo Anexo]';
      await emailService.enviarNotificacaoPergunta(
        ticket.cliente_email,
        ticket.cliente_nome,
        ticket.id,
        ticket.titulo || ticket.categoria || 'Chamado',
        user.nome,
        textoNotificacao
      );
    }

    return NextResponse.json({ mensagem: 'Mensagem enviada com sucesso.' }, { status: 201 });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: 'Erro ao enviar mensagem.' }, { status: 500 });
  }
}
