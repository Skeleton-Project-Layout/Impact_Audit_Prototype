import React from 'react';

interface BrandLogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 40,
  showWordmark = true,
  className = ''
}) => {
  return (
    <div className={`brand-logo-container ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Abhisaran Logo Mark"
        role="img"
      >
        {/* Concentric outer glowing aura ring */}
        <circle
          cx="50"
          cy="50"
          r="46"
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeOpacity="0.4"
          strokeDasharray="4 2"
        />

        {/* Outer convergence boundary ring */}
        <circle
          cx="50"
          cy="50"
          r="42"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeOpacity="0.8"
        />

        {/* Left Stream / Leg */}
        <path
          d="M26 80 C 35 60, 44 40, 50 20"
          stroke="var(--accent)"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Right Stream / Leg */}
        <path
          d="M74 80 C 65 60, 56 40, 50 20"
          stroke="var(--accent)"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Crossbar Stream Converging Inward */}
        <path
          d="M34 60 C 44 56, 56 56, 66 60"
          stroke="var(--accent)"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Apex Node with radiant halo */}
        <circle cx="50" cy="20" r="7" fill="var(--accent-soft)" />
        <circle cx="50" cy="20" r="4.5" fill="var(--accent)" />
      </svg>

      {showWordmark && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span
            style={{
              fontSize: `${Math.max(16, size * 0.44)}px`,
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: 'var(--accent)',
              fontFamily: 'var(--font)'
            }}
          >
            ABHISARAN
          </span>
          <span
            style={{
              fontSize: `${Math.max(10, size * 0.26)}px`,
              fontWeight: 500,
              letterSpacing: '0.08em',
              color: 'var(--muted)',
              fontFamily: 'var(--font)'
            }}
          >
            अभिसरण
          </span>
        </div>
      )}
    </div>
  );
};
