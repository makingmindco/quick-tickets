import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import userRepository from '@/lib/repositories/userRepository';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 });
    }

    const userDb = await userRepository.findById(user.id);
    if (!userDb) {
      return NextResponse.json({ erro: 'Usuário não encontrado.' }, { status: 404 });
    }

    const formData = await req.formData();
    const arquivo = formData.get('avatar') as File | null;

    if (!arquivo || arquivo.size === 0) {
      return NextResponse.json({ erro: 'Arquivo de avatar inválido.' }, { status: 400 });
    }

    // Process file uploading
    const bytes = await arquivo.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), 'public/uploads');
    // Ensure the uploads directory exists
    await fs.mkdir(uploadsDir, { recursive: true });

    const hash = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(arquivo.name) || '.png';
    const filename = `avatar-${hash}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    await fs.writeFile(filePath, buffer);
    const foto_url = `/uploads/${filename}`;

    // Update database using userRepository
    const sucesso = await userRepository.updateUser(user.id, {
      nome: userDb.nome,
      email: userDb.email,
      cargo: userDb.cargo || 'Estudante',
      is_admin: userDb.is_admin === 1,
      foto_url
    });

    if (!sucesso) {
      return NextResponse.json({ erro: 'Erro ao salvar o avatar no banco de dados.' }, { status: 500 });
    }

    const updatedUser = {
      id: user.id,
      nome: userDb.nome,
      email: userDb.email,
      cargo: userDb.cargo || 'Estudante',
      is_admin: userDb.is_admin === 1,
      foto_url,
      tema_escuro: userDb.tema_escuro === 1
    };

    return NextResponse.json({
      mensagem: 'Foto de perfil atualizada com sucesso!',
      foto_url,
      usuario: updatedUser
    }, { status: 200 });

  } catch (erro) {
    console.error('[Avatar API] Erro ao fazer upload do avatar:', erro);
    return NextResponse.json({ erro: 'Erro interno ao processar upload do avatar.' }, { status: 500 });
  }
}
