import { NextResponse } from 'next/server';
import OpenAI, { toFile } from 'openai';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo recebido." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileObj = await toFile(buffer, file.name || 'audio.webm', { type: file.type || 'audio/webm' });

    const transcription = await openai.audio.transcriptions.create({
      file: fileObj,
      model: 'whisper-1',
      language: 'en', // Força o reconhecimento em inglês
    });

    return NextResponse.json({ text: transcription.text });
  } catch (error: any) {
    console.error("Whisper Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
