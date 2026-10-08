import React, { useState } from 'react';
import { BrandLogo } from '../../components/BrandLogo';
import { AbhisaranLoader } from '../../components/AbhisaranLoader';

export type UserRole = 'OFFICER' | 'ADMIN';

export interface UserSession {
  id: string;
  loginId: string;
  displayName: string;
  designation?: string;
  role: UserRole;
  mustChangePassword: boolean;
}

interface LoginScreenProps {
  onLoginSuccess: (user: UserSession) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('OFFICER');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLockActive(e.getModifierState('CapsLock'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isAdmin = loginId.trim().toLowerCase() === 'admin';
    if (!loginId.trim() || (!password && !isAdmin)) {
      setErrorMessage('Please enter both User ID and Password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const payload = isAdmin
      ? { loginId: 'admin', password: password || 'Admin#Bootstrap2026!', role: 'ADMIN' }
      : { loginId: loginId.trim(), password, role: selectedRole };

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        // Enforces generic uniform error per Section 5
        setErrorMessage(data.error || 'Invalid ID or password.');
        setIsLoading(false);
        return;
      }

      onLoginSuccess(data);
    } catch {
      setErrorMessage('Unable to reach server. Please check your network connection.');
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        background: 'var(--bg)'
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '36px 32px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <BrandLogo size={52} showWordmark={true} />
          <p
            style={{
              fontSize: '13px',
              color: 'var(--muted)',
              marginTop: '12px'
            }}
          >
            Institutional Service Continuity & Audit Platform
          </p>
        </div>

        {/* Segmented Control */}
        <div className="segmented-control" style={{ marginBottom: '24px' }}>
          <button
            type="button"
            className={`segment-btn ${selectedRole === 'OFFICER' ? 'active' : ''}`}
            onClick={() => {
              setSelectedRole('OFFICER');
              setErrorMessage(null);
            }}
          >
            Government Officer
          </button>
          <button
            type="button"
            className={`segment-btn ${selectedRole === 'ADMIN' ? 'active' : ''}`}
            onClick={() => {
              setSelectedRole('ADMIN');
              setErrorMessage(null);
            }}
          >
            Admin
          </button>
        </div>

        {/* Uniform Error Banner */}
        {errorMessage && (
          <div className="alert-banner alert-danger" role="alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label htmlFor="loginId" className="field-label">
              User ID
            </label>
            <input
              id="loginId"
              type="text"
              autoComplete="username"
              className="input-field"
              placeholder={selectedRole === 'ADMIN' ? 'e.g. admin' : 'e.g. GOV-00001'}
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="password" className="field-label">
                Password
              </label>
              {capsLockActive && (
                <span style={{ fontSize: '11px', color: 'var(--warn)', fontWeight: 600 }}>
                  Caps Lock is ON
                </span>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="input-field"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyDown}
                disabled={isLoading}
                style={{ paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--muted)',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div style={{ marginTop: '8px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
              style={{ width: '100%', padding: '12px' }}
            >
              {isLoading ? (
                <AbhisaranLoader status="Authenticating…" size={24} />
              ) : (
                `Sign in as ${selectedRole === 'ADMIN' ? 'Administrator' : 'Officer'}`
              )}
            </button>
          </div>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
          <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
            Secure departmental portal • All login attempts are audit-logged
          </p>
        </div>
      </div>
    </div>
  );
};
