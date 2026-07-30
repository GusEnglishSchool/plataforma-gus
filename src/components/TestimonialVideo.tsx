"use client";

import { useState, useRef } from 'react';

export default function TestimonialVideo({ src, name, role }: { src: string, name: string, role: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <div 
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', cursor: 'pointer', background: '#000' }} 
      onClick={handlePlay}
    >
      <video 
        ref={videoRef}
        src={src} 
        loop
        playsInline
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover', 
          filter: isPlaying ? 'none' : 'blur(3px) brightness(0.6)',
          transition: 'filter 0.3s ease'
        }} 
      />
      
      {!isPlaying && (
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          width: '70px',
          height: '70px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(5px)',
          border: '2px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
        }}>
          <svg width="35" height="35" viewBox="0 0 24 24" fill="white" style={{ marginLeft: '5px' }}>
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      )}

      <div style={{ 
        position: 'absolute', 
        bottom: '25px', 
        left: '20px', 
        textShadow: '0px 2px 4px rgba(0,0,0,0.9)',
        zIndex: 10
      }}>
        <h4 style={{ color: 'white', margin: 0, fontSize: '1.4rem' }}>{name}</h4>
        <p style={{ color: 'var(--accent-gold)', margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>{role}</p>
      </div>
    </div>
  );
}
