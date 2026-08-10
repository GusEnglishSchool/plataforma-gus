"use client";

import { useState, useRef, useEffect } from 'react';

export default function TestimonialVideo({ src, name, role, youtubeId }: { src?: string, name: string, role: string, youtubeId?: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const [ytReady, setYtReady] = useState(false);

  useEffect(() => {
    if (youtubeId && !(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      
      (window as any).onYouTubeIframeAPIReady = () => {
        setYtReady(true);
      };
    } else if (youtubeId && (window as any).YT) {
      setYtReady(true);
    }
  }, [youtubeId]);

  useEffect(() => {
    if (ytReady && youtubeId && !playerRef.current) {
      playerRef.current = new (window as any).YT.Player(`youtube-player-${youtubeId}`, {
        videoId: youtubeId,
        playerVars: {
          controls: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3
        },
        events: {
          onStateChange: (event: any) => {
            if (event.data === (window as any).YT.PlayerState.PLAYING) setIsPlaying(true);
            else if (event.data === (window as any).YT.PlayerState.PAUSED || event.data === (window as any).YT.PlayerState.ENDED) setIsPlaying(false);
          }
        }
      });
    }
  }, [ytReady, youtubeId]);

  const handlePlay = () => {
    if (youtubeId && playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    } else if (videoRef.current) {
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
      {youtubeId ? (
        <div style={{ 
          width: '100%', 
          height: '100%', 
          pointerEvents: 'none', 
          filter: isPlaying ? 'none' : 'blur(3px) brightness(0.6)',
          transition: 'filter 0.3s ease',
          transform: 'scale(1.5)' // scale up to hide black bars on shorts
        }}>
          <div id={`youtube-player-${youtubeId}`} style={{ width: '100%', height: '100%' }} />
        </div>
      ) : (
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
      )}
      
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
