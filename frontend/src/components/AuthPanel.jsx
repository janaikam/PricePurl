import { useState } from 'react';

const panelStyle = {
  maxWidth: '960px',
  margin: '0 auto 24px',
  padding: '18px',
  borderRadius: '18px',
  border: '1px solid var(--border-subtle)',
  background: 'var(--surface-panel)',
  boxShadow: 'var(--shadow-soft)',
  textAlign: 'left'
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  borderRadius: '12px',
  border: '1px solid var(--border-subtle)',
  padding: '12px',
  backgroundColor: 'var(--surface-card)',
  color: 'var(--text-primary)'
};

const buttonStyle = {
  borderRadius: '999px',
  border: 'none',
  padding: '10px 16px',
  backgroundColor: 'var(--button-primary-bg)',
  color: 'var(--button-primary-text)',
  fontWeight: 600
};

const secondaryButtonStyle = {
  ...buttonStyle,
  backgroundColor: 'var(--button-secondary-bg)',
  color: 'var(--button-secondary-text)',
  border: '1px solid var(--button-secondary-border)'
};

const AuthPanel = ({
  session,
  isAuthReady,
  isSupabaseConfigured,
  guestYarnCount,
  onSignIn,
  onSignUp,
  onSignOut,
  onImportGuestYarns,
  isImportingGuestYarns,
  onBack,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signIn');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    if (!email.trim() || !password.trim()) {
      setMessage('Enter both your email and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'signUp') {
        const result = await onSignUp({ email, password });
        const needsEmailConfirmation = !result.data.session;

        setMessage(needsEmailConfirmation
          ? 'Account created. Check your email to finish signing in.'
          : 'Account created and signed in.');
      } else {
        await onSignIn({ email, password });
        setMessage('Signed in.');
      }
    } catch (error) {
      setMessage(error.message || 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthReady) {
    return (
      <section style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '8px' }}>
          <h2 style={{ marginTop: 0, marginBottom: 0 }}>Account</h2>
          {onBack && <button type="button" onClick={onBack} style={secondaryButtonStyle}>Back To Yarn List</button>}
        </div>
        <p>Checking your saved session.</p>
      </section>
    );
  }

  if (session?.user) {
    return (
      <section style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <p style={{ marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.78rem' }}>Account</p>
            <h2 style={{ marginTop: 0, marginBottom: 0 }}>You are signed in</h2>
          </div>
          {onBack && <button type="button" onClick={onBack} style={secondaryButtonStyle}>Back To Yarn List</button>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <p style={{ marginBottom: '8px' }}>Signed in as {session.user.email || 'your account'}.</p>
            <p style={{ color: 'var(--text-secondary)' }}>Your yarn list now saves to Supabase instead of staying only in this browser.</p>
          </div>
          <button type="button" onClick={onSignOut} style={secondaryButtonStyle}>
            Sign Out
          </button>
        </div>
        {guestYarnCount > 0 && (
          <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <p>{guestYarnCount} guest yarn{guestYarnCount === 1 ? '' : 's'} still live in this browser.</p>
            <button
              type="button"
              onClick={onImportGuestYarns}
              disabled={isImportingGuestYarns}
              style={buttonStyle}
            >
              {isImportingGuestYarns ? 'Importing...' : 'Import Guest Yarns'}
            </button>
          </div>
        )}
      </section>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <section style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <p style={{ marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.78rem' }}>Guest Mode</p>
            <h2 style={{ marginTop: 0, marginBottom: 0 }}>Sign in is not available here yet</h2>
          </div>
          {onBack && <button type="button" onClick={onBack} style={secondaryButtonStyle}>Back To Yarn List</button>}
        </div>
        <p style={{ color: 'var(--text-secondary)' }}>
          Supabase auth is not configured in the frontend environment, so the app is currently running in guest-only mode.
        </p>
      </section>
    );
  }

  return (
    <section style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <p style={{ marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.78rem' }}>Account</p>
          <h2 style={{ marginTop: 0, marginBottom: 0 }}>Save your yarn list</h2>
        </div>
        {onBack && <button type="button" onClick={onBack} style={secondaryButtonStyle}>Back To Yarn List</button>}
      </div>
      <p style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>
        Use an account to save your yarn list across devices. If you skip sign-in, everything stays in this browser only.
      </p>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setMode('signIn')}
          style={mode === 'signIn' ? buttonStyle : secondaryButtonStyle}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setMode('signUp')}
          style={mode === 'signUp' ? buttonStyle : secondaryButtonStyle}
        >
          Create Account
        </button>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
        <label>
          <div style={{ marginBottom: '6px', fontWeight: 600 }}>Email</div>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            style={inputStyle}
            autoComplete="email"
          />
        </label>
        <label>
          <div style={{ marginBottom: '6px', fontWeight: 600 }}>Password</div>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            style={inputStyle}
            autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
          />
        </label>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="submit" disabled={isSubmitting} style={buttonStyle}>
            {isSubmitting ? 'Working...' : mode === 'signUp' ? 'Create Account' : 'Sign In'}
          </button>
          <span style={{ color: 'var(--text-secondary)' }}>You can return to the yarn list without signing in.</span>
        </div>
        {message && <p style={{ color: message.includes('failed') || message.includes('Enter both') ? 'var(--status-error-text)' : 'var(--status-success-text)' }}>{message}</p>}
      </form>
    </section>
  );
};

export default AuthPanel;