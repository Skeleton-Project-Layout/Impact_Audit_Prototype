import React from 'react';

interface AbhisaranLoaderProps {
  status?: string;
  message?: string;
  size?: number;
  className?: string;
}

export const AbhisaranLoader: React.FC<AbhisaranLoaderProps> = ({
  status = 'Loading…',
  message,
  size = 56,
  className = ''
}) => {
  const displayText = message || status;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`abhisaran-loader ${className}`}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '16px'
      }}
    >
      <style>{`
        @keyframes loaderBreathe {
          0%, 100% { transform: scale(0.96); opacity: 0.85; }
          50% { transform: scale(1.04); opacity: 1; }
        }
        @keyframes loaderOrbit {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .loader-mark {
          transform-origin: 50px 50px;
          animation: loaderBreathe 2s ease-in-out infinite;
        }
        .loader-orbit {
          transform-origin: 50px 50px;
          animation: loaderOrbit 3s linear infinite;
        }
      `}</style>

      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        {/* Orbiting particle ring */}
        <g className="loader-orbit">
          <circle cx="50" cy="8" r="3.5" fill="var(--accent)" />
          <circle cx="92" cy="50" r="2.5" fill="var(--accent)" opacity="0.6" />
          <circle cx="50" cy="92" r="2" fill="var(--accent)" opacity="0.4" />
          <circle cx="8" cy="50" r="2.5" fill="var(--accent)" opacity="0.6" />
        </g>

        {/* Breathing convergence mark */}
        <g className="loader-mark">
          <circle cx="50" cy="50" r="38" stroke="var(--line)" strokeWidth="1.5" />
          <path
            d="M32 72 C 38 56, 45 40, 50 26"
            stroke="var(--accent)"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M68 72 C 62 56, 55 40, 50 26"
            stroke="var(--accent)"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M38 56 C 45 53, 55 53, 62 56"
            stroke="var(--accent)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="50" cy="26" r="6" fill="var(--accent-soft)" />
          <circle cx="50" cy="26" r="4" fill="var(--accent)" />
        </g>
      </svg>

      {displayText && (
        <span
          style={{
            fontSize: '13px',
            color: 'var(--muted)',
            fontWeight: 500,
            letterSpacing: '0.02em',
            textAlign: 'center'
          }}
        >
          {displayText}
        </span>
      )}
    </div>
  );
};
