"use client";

import React from 'react';

interface VideoRoomProps {
  roomName: string;
  userName: string;
  isModerator: boolean;
  onClose: () => void;
}

export default function VideoRoom({ roomName, userName, isModerator, onClose }: VideoRoomProps) {
  const meetingUrl = `https://meet.jit.si/${roomName}`;

  return (
    <div style={{ width: '100%', height: '400px', borderRadius: '12px', background: '#f8fafc', border: '2px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎥</div>
      <h3 style={{ color: 'var(--primary-blue)', marginBottom: '10px' }}>A Sala de Aula está Pronta!</h3>
      <p style={{ color: '#64748b', marginBottom: '2rem', maxWidth: '500px' }}>
        Para garantir qualidade máxima de vídeo e <b>tempo ilimitado</b> (sem a restrição de 5 minutos do modo embutido), a sua sala foi gerada em um link seguro e exclusivo.
      </p>
      
      <div style={{ display: 'flex', gap: '15px' }}>
        <a 
          href={meetingUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn-primary"
          style={{ padding: '12px 30px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1rem' }}
        >
          Acessar Sala de Vídeo
        </a>
        <button 
          onClick={onClose} 
          style={{ padding: '12px 30px', borderRadius: '8px', border: '1px solid #dc2626', background: 'transparent', color: '#dc2626', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {isModerator ? 'Encerrar Sala' : 'Voltar'}
        </button>
      </div>
      
      {isModerator && (
        <p style={{ marginTop: '2rem', fontSize: '0.85rem', color: '#94a3b8' }}>
          * Lembre-se de clicar em "Encerrar Sala" aqui quando a aula acabar para fechar o acesso do aluno.
        </p>
      )}
    </div>
  );
}
