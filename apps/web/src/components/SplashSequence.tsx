import React, { useEffect, useState } from 'react';

interface SplashSequenceProps {
  onComplete: () => void;
}

export const SplashSequence: React.FC<SplashSequenceProps> = ({ onComplete }) => {
  const [canSkip, setCanSkip] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      const timer = setTimeout(() => {
        onComplete();
      }, 400);
      return () => clearTimeout(timer);
    }

    // Pre-warm the backend API /health endpoint
    fetch('/health', { method: 'GET' }).catch(() => {
      // Ignore initial network errors during container boot
    });

    // Enable skip after 600ms
    const skipTimer = setTimeout(() => {
      setCanSkip(true);
    }, 600);

    // Full sequence timer (~2.8s)
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2400);

    const endTimer = setTimeout(() => {
      sessionStorage.setItem('abhisaran_splash_shown', 'true');
      onComplete();
    }, 2800);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (canSkip && (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ')) {
        setIsFadingOut(true);
        setTimeout(onComplete, 200);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(skipTimer);
      clearTimeout(fadeTimer);
      clearTimeout(endTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canSkip, onComplete]);

  const handleInteraction = () => {
    if (canSkip) {
      setIsFadingOut(true);
      setTimeout(onComplete, 200);
    }
  };

  const letters = 'ABHISARAN'.split('');

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={handleInteraction}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'radial-gradient(circle at center, #16211e 0%, #0e1513 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: canSkip ? 'pointer' : 'default',
        opacity: isFadingOut ? 0 : 1,
        transition: 'opacity 0.4s ease-out',
        userSelect: 'none'
      }}
    >
      <style>{`
        @keyframes strokeDraw {
          0% { stroke-dashoffset: 120; opacity: 0; }
          40% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes particleConverge {
          0% { transform: translate(var(--dx), var(--dy)) scale(0.6); opacity: 0; }
          30% { opacity: 0.9; }
          100% { transform: translate(0, 0) scale(1.1); opacity: 0; }
        }
        @keyframes apexFlash {
          0%, 65% { transform: scale(1); opacity: 0.6; }
          75% { transform: scale(1.6); opacity: 1; filter: drop-shadow(0 0 10px #3fb8a2); }
          100% { transform: scale(1); opacity: 0.9; }
        }
        @keyframes ringPulse {
          0%, 70% { transform: scale(0.95); opacity: 0.3; }
          80% { transform: scale(1.04); opacity: 0.8; }
          100% { transform: scale(1); opacity: 0.5; }
        }
        @keyframes letterRise {
          0% { opacity: 0; transform: translateY(14px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes subtitleFade {
          0% { opacity: 0; }
          100% { opacity: 0.85; }
        }

        .stroke-anim-left {
          stroke-dasharray: 120;
          animation: strokeDraw 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        .stroke-anim-right {
          stroke-dasharray: 120;
          animation: strokeDraw 1s cubic-bezier(0.2, 0.8, 0.2, 1) 0.15s forwards;
        }
        .stroke-anim-bar {
          stroke-dasharray: 60;
          animation: strokeDraw 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) 0.3s forwards;
        }
        .apex-flash {
          transform-origin: 50px 22px;
          animation: apexFlash 2.4s ease-out forwards;
        }
        .ring-pulse {
          transform-origin: 50px 50px;
          animation: ringPulse 2.4s ease-out forwards;
        }
      `}</style>

      {/* SVG Canvas for Convergence Animation */}
      <svg
        width="150"
        height="150"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        {/* Pulsing Outer Ring */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="#3fb8a2"
          strokeWidth="1.5"
          className="ring-pulse"
        />

        {/* 16 Converging Particles */}
        <g>
          {[
            { dx: '-40px', dy: '60px', delay: '0.5s' },
            { dx: '40px', dy: '60px', delay: '0.6s' },
            { dx: '-50px', dy: '30px', delay: '0.7s' },
            { dx: '50px', dy: '30px', delay: '0.75s' },
            { dx: '-30px', dy: '-20px', delay: '0.8s' },
            { dx: '30px', dy: '-20px', delay: '0.85s' },
            { dx: '-20px', dy: '50px', delay: '0.9s' },
            { dx: '20px', dy: '50px', delay: '0.95s' },
            { dx: '-35px', dy: '10px', delay: '1.0s' },
            { dx: '35px', dy: '10px', delay: '1.05s' },
            { dx: '-15px', dy: '70px', delay: '1.1s' },
            { dx: '15px', dy: '70px', delay: '1.15s' },
            { dx: '-45px', dy: '45px', delay: '1.2s' },
            { dx: '45px', dy: '45px', delay: '1.25s' },
            { dx: '-10px', dy: '-15px', delay: '1.3s' },
            { dx: '10px', dy: '-15px', delay: '1.35s' }
          ].map((pt, idx) => (
            <circle
              key={idx}
              cx="50"
              cy="22"
              r="2"
              fill="#dff0ec"
              style={{
                '--dx': pt.dx,
                '--dy': pt.dy,
                animation: `particleConverge 0.9s cubic-bezier(0.1, 0.7, 0.1, 1) ${pt.delay} forwards`,
                opacity: 0
              } as React.CSSProperties}
            />
          ))}
        </g>

        {/* The Three Converging Strokes */}
        <path
          d="M26 80 C 35 60, 44 40, 50 22"
          stroke="#3fb8a2"
          strokeWidth="6"
          strokeLinecap="round"
          className="stroke-anim-left"
        />
        <path
          d="M74 80 C 65 60, 56 40, 50 22"
          stroke="#3fb8a2"
          strokeWidth="6"
          strokeLinecap="round"
          className="stroke-anim-right"
        />
        <path
          d="M34 60 C 44 56, 56 56, 66 60"
          stroke="#3fb8a2"
          strokeWidth="5"
          strokeLinecap="round"
          className="stroke-anim-bar"
        />

        {/* Apex Node */}
        <circle cx="50" cy="22" r="8" fill="#dff0ec" className="apex-flash" />
        <circle cx="50" cy="22" r="5" fill="#3fb8a2" />
      </svg>

      {/* Staggered Wordmark */}
      <div style={{ marginTop: '28px', display: 'flex', gap: '3px' }}>
        {letters.map((char, index) => (
          <span
            key={index}
            style={{
              fontSize: '24px',
              fontWeight: 700,
              letterSpacing: '0.18em',
              color: '#e5eeeb',
              display: 'inline-block',
              animation: `letterRise 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) ${1.4 + index * 0.04}s forwards`,
              opacity: 0
            }}
          >
            {char}
          </span>
        ))}
      </div>

      {/* Sanskrit Subtitle */}
      <div
        style={{
          marginTop: '6px',
          fontSize: '14px',
          letterSpacing: '0.1em',
          color: '#94a7a1',
          animation: 'subtitleFade 0.6s ease-out 1.9s forwards',
          opacity: 0
        }}
      >
        अभिसरण
      </div>

      {canSkip && (
        <div
          style={{
            position: 'absolute',
            bottom: '28px',
            fontSize: '12px',
            color: '#566863',
            letterSpacing: '0.04em',
            opacity: 0.8
          }}
        >
          Tap anywhere or press Enter to skip
        </div>
      )}
    </div>
  );
};
