"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, X, Bot, User, Loader2 } from 'lucide-react';

export default function FluencyRunner({ scenario, onClose }: any) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize the chat with System Prompt and Initial Message
  useEffect(() => {
    if (scenario) {
      setMessages([
        { role: 'system', content: scenario.systemPrompt },
        { role: 'assistant', content: scenario.initialMessage }
      ]);
    }
  }, [scenario]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    
    const userMessage = { role: 'user', content: inputText.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText("");
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages([...newMessages, data]);
    } catch (err) {
      console.error(err);
      alert("Erro ao falar com a IA: " + err);
    } finally {
      setLoading(false);
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
                <span style={{ width: '8px', height: '8px', background: '#4ade80', borderRadius: '50%', display: 'inline-block' }}></span>
                IA Conectada • Modo Texto (Áudio em breve)
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
            <X size={24} />
          </button>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {messages.filter(m => m.role !== 'system').map((msg, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', gap: '1rem', alignItems: 'flex-end' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: msg.role === 'user' ? '#3b82f6' : '#a855f7', color: 'white', flexShrink: 0, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div style={{ background: msg.role === 'user' ? '#eff6ff' : 'white', border: msg.role === 'user' ? '1px solid #bfdbfe' : '1px solid #e2e8f0', padding: '1rem 1.2rem', borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px', maxWidth: '80%', fontSize: '1.05rem', color: '#1e293b', lineHeight: '1.5', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#a855f7', color: 'white', flexShrink: 0 }}>
                <Bot size={20} />
              </div>
              <div style={{ background: 'white', border: '1px solid #e2e8f0', padding: '1rem 1.2rem', borderRadius: '20px 20px 20px 4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Loader2 size={18} color="#a855f7" className="animate-spin" />
                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>A IA está pensando...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '1.5rem 2rem', background: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '1rem' }}>
          <button onClick={() => alert("Gravação de áudio será implementada em breve! Use o texto por enquanto.")} style={{ width: '56px', height: '56px', borderRadius: '16px', border: 'none', background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => {e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#3b82f6'}} onMouseLeave={e => {e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'}}>
            <Mic size={24} />
          </button>
          
          <input 
            type="text" 
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Digite algo em inglês..."
            style={{ flex: 1, padding: '0 1.5rem', borderRadius: '16px', border: '2px solid #e2e8f0', outline: 'none', fontSize: '1rem', transition: 'border-color 0.2s' }}
            onFocus={e => e.target.style.borderColor = '#a855f7'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            disabled={loading}
          />
          
          <button onClick={sendMessage} disabled={loading || !inputText.trim()} style={{ width: '56px', height: '56px', borderRadius: '16px', border: 'none', background: loading || !inputText.trim() ? '#cbd5e1' : '#a855f7', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: loading || !inputText.trim() ? 'not-allowed' : 'pointer', transition: 'background 0.2s', boxShadow: loading || !inputText.trim() ? 'none' : '0 4px 12px rgba(168, 85, 247, 0.3)' }}>
            <Send size={24} style={{ marginLeft: '3px' }} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
