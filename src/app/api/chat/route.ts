import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });
    
    const { messages } = await req.json();

    if (!messages) {
      return NextResponse.json({ error: "Messages are required" }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Use gpt-4o as requested for Fluency.IA
      messages: messages,
      temperature: 0.7,
      max_tokens: 250, // Keep responses relatively short for speaking
    });

    return NextResponse.json({
      role: response.choices[0].message.role,
      content: response.choices[0].message.content,
    });
  } catch (error: any) {
    console.error("OpenAI Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
