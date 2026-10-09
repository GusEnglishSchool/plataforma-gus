"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, Bot, User, Loader2, Play, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function FluencyRunner({ scenario, onClose, studentDocId }: any) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingText, setLoadingText] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  
  // Audio state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [audioUrls, setAudioUrls] = useState<{[index: number]: string}>({});

  // Initialize
  useEffect(() => {
    if (scenario) {
      setMessages([
        { role: 'system', content: scenario.systemPrompt },
        { role: 'assistant', content: scenario.initialMessage }
      ]);
      playTTS(scenario.initialMessage, 1);
    }
  }, [scenario]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingText]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      const mimeType = mediaRecorder.mimeType;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        let ext = 'webm';
        if (mimeType.includes('mp4')) ext = 'm4a';
        else if (mimeType.includes('ogg')) ext = 'ogg';
        else if (mimeType.includes('wav')) ext = 'wav';
        await processVoiceInput(audioBlob, ext);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      alert("Por favor, permita o acesso ao microfone para usar o Fluency.IA.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const processVoiceInput = async (audioBlob: Blob, ext: string = 'webm') => {
    setLoadingText("Ouvindo o que você disse...");
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, `audio.${ext}`);
      
      const whisperRes = await fetch('/api/whisper', {
        method: 'POST',
        body: formData
      });
      
      const whisperData = await whisperRes.json();
      if (whisperData.error) throw new Error(whisperData.error);
      
      const userText = whisperData.text;
      if (!userText || userText.trim().length === 0) {
        setLoadingText("");
        return;
      }

      const userMessage = { role: 'user', content: userText };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      
      setLoadingText("IA está pensando na resposta...");
      
      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });
      
      const chatData = await chatRes.json();
      if (chatData.error) throw new Error(chatData.error);

      setMessages([...newMessages, chatData]);
      
      await playTTS(chatData.content, newMessages.length);
      
      // TAXÍMETRO: Cada interação (ouvir + pensar + falar) custa 5 centavos fictícios (R$ 0.05) para controle de limites.
      if (studentDocId) {
        try {
          await updateDoc(doc(db, "users", studentDocId), {
            totalFluencyCost: increment(0.05)
          });
        } catch (e) {
          console.error("Erro ao computar custo:", e);
        }
      }
    } catch (err: any) {
      console.error(err);
      alert("Erro na comunicação: " + err.message);
    } finally {
      setLoadingText("");
    }
  };

  const playTTS = async (text: string, messageIndex: number) => {
    try {
      setLoadingText("Gerando áudio da IA...");
      const ttsRes = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'onyx' })
      });
      
      if (!ttsRes.ok) throw new Error("Erro no TTS");
      
      const blob = await ttsRes.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrls(prev => ({ ...prev, [messageIndex]: url }));
      
      const audio = new Audio(url);
      audio.play();
    } catch (err: any) {
      console.error("Erro de Audio TTS:", err);
    } finally {
      setLoadingText("");
    }
  };

  const finishAndGetFeedback = async () => {
    setLoadingText("Professor IA está analisando sua conversa...");
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setFeedback(data.feedback);
    } catch (err: any) {
      alert("Erro ao gerar feedback: " + err.message);
    } finally {
      setLoadingText("");
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(8px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} style={{ background: '#f8fafc', width: '100%', maxWidth: '800px', height: '90vh', borderRadius: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)', padding: '1.5rem 2rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '14px' }}>
              <Bot size={32} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{scenario.title}</h2>
              <span style={{ fontSize: '0.85rem', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', background: '#4ade80', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #4ade80' }}></span>
                Modo Rádio Conectado (Áudio-Only)
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
            <X size={24} />
          </button>
        </div>

        {/* Chat Area or Feedback Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
          
          <AnimatePresence>
            {feedback && (
              <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, minHeight: '100%', background: 'white', zIndex: 20, padding: '2rem', overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '2rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem' }}>
                  <div style={{ background: '#10b981', padding: '12px', borderRadius: '50%', color: 'white' }}>
                    <CheckCircle size={32} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.8rem' }}>Feedback do Professor IA</h2>
                    <p style={{ margin: 0, color: '#64748b' }}>Avaliação completa da sua performance nesta missão.</p>
                  </div>
                </div>
                
                <div className="markdown-body" style={{ color: '#334155', lineHeight: '1.7', fontSize: '1.05rem' }}>
                  <ReactMarkdown>{feedback}</ReactMarkdown>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!feedback && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <span style={{ background: '#e2e8f0', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', color: '#475569', fontWeight: 'bold' }}>
                  Modo Imersivo Ativado - Apenas Áudio
                </span>
              </div>
              
              {messages.filter(m => m.role !== 'system').map((msg, i) => {
                const actualIndex = messages.findIndex(x => x === msg);
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', gap: '1rem', alignItems: 'flex-end' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: msg.role === 'user' ? '#3b82f6' : '#a855f7', color: 'white', flexShrink: 0, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                      {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                    </div>
                    <div style={{ background: msg.role === 'user' ? '#eff6ff' : 'white', border: msg.role === 'user' ? '1px solid #bfdbfe' : '1px solid #e2e8f0', padding: '1rem 1.2rem', borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px', maxWidth: '80%', fontSize: '1.05rem', color: '#1e293b', lineHeight: '1.5', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                      {msg.content}
                      
                      {msg.role === 'assistant' && audioUrls[actualIndex] && (
                        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                          <button onClick={() => new Audio(audioUrls[actualIndex]).play()} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#f3e8ff', color: '#9333ea', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>
                            <Play size={14} /> Ouvir novamente
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {loadingText && (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#a855f7', color: 'white', flexShrink: 0 }}>
                    <Bot size={20} />
                  </div>
                  <div style={{ background: 'white', border: '1px solid #e2e8f0', padding: '1rem 1.2rem', borderRadius: '20px 20px 20px 4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Loader2 size={18} color="#a855f7" className="animate-spin" />
                    <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 'bold' }}>{loadingText}</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input/Action Area */}
        <div style={{ padding: '2rem', background: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1.5rem', justifyContent: 'center', alignItems: 'center' }}>
          
          {!feedback ? (
            <>
              <button 
                onMouseDown={startRecording} 
                onMouseUp={stopRecording}
                onMouseLeave={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                disabled={!!loadingText}
                style={{ 
                  width: isRecording ? '140px' : '120px', 
                  height: isRecording ? '140px' : '120px', 
                  borderRadius: '50%', 
                  border: 'none', 
                  background: isRecording ? '#ef4444' : (loadingText ? '#cbd5e1' : '#a855f7'), 
                  color: 'white', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: loadingText ? 'not-allowed' : 'pointer', 
                  transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)', 
                  boxShadow: isRecording ? '0 0 30px rgba(239, 68, 68, 0.6)' : (loadingText ? 'none' : '0 10px 25px rgba(168, 85, 247, 0.4)') 
                }}
              >
                <Mic size={isRecording ? 48 : 36} style={{ transition: 'all 0.2s' }} />
                <span style={{ marginTop: '8px', fontSize: '0.8rem', fontWeight: 'bold', opacity: 0.9 }}>
                  {isRecording ? "GRAVANDO..." : (loadingText ? "AGUARDE" : "SEGURE E FALE")}
                </span>
              </button>

              {messages.length > 3 && (
                <button onClick={finishAndGetFeedback} style={{ padding: '12px 24px', background: '#f8fafc', border: '2px solid #e2e8f0', color: '#64748b', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => {e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.color = '#10b981'}} onMouseLeave={e => {e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'}}>
                  ✓ Encerrar Conversa e Ver Feedback
                </button>
              )}
            </>
          ) : (
            <button onClick={onClose} style={{ width: '100%', padding: '16px', background: '#10b981', color: 'white', borderRadius: '16px', border: 'none', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}>
              Voltar ao Laboratório
            </button>
          )}
          
        </div>
      </motion.div>
    </div>
  );
}
