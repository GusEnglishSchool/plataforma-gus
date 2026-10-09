import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });
    const { messages } = await req.json();

    const transcript = messages
      .filter((m: any) => m.role !== 'system')
      .map((m: any) => `${m.role === 'user' ? 'ALUNO' : 'PERSONAGEM'}: ${m.content}`)
      .join('\n');

    const evaluationPrompt = `Você é o professor avaliador do 'Gus English School'. Avalie a seguinte transcrição de uma simulação de conversa em inglês entre um aluno e um personagem de um cenário prático.
    
    TRANSCRIÇÃO DA CONVERSA:
    ${transcript}
    
    Forneça um feedback detalhado e estruturado EM PORTUGUÊS diretamente para o aluno, abordando os seguintes pontos:
    
    ### 🎯 Desempenho Geral
    (Um parágrafo amigável dizendo como ele se saiu na missão do cenário)
    
    ### ✨ Pontos Fortes
    (O que ele fez bem, estruturas que acertou)
    
    ### 🛠️ O Que Precisamos Ajustar (Correções)
    (Aponte erros específicos de gramática, vocabulário ou frases que soaram estranhas, e mostre COMO seria o correto/mais natural)
    
    ### 💡 Dica de Ouro
    (Uma dica prática para ele arrasar na próxima vez)
    
    Formate a resposta usando Markdown para ficar bem visual.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: 'system', content: evaluationPrompt }],
      temperature: 0.7,
    });

    return NextResponse.json({ feedback: response.choices[0].message.content });
  } catch (error: any) {
    console.error("Feedback Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
