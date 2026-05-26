import { useState } from 'react';

const panelStyle = {
  maxWidth: '960px',
  margin: '0 auto 24px',
  padding: '18px',
  borderRadius: '18px',
  border: '1px solid #d7c2ba',
  background: 'linear-gradient(135deg, #fff7f3 0%, #fefaf4 100%)',
  textAlign: 'left',
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  borderRadius: '12px',
  border: '1px solid #d7c2ba',
  padding: '12px',
  backgroundColor: '#fff',
};

const buttonStyle = {
  borderRadius: '999px',
  border: 'none',
  padding: '10px 16px',
  backgroundColor: '#c94f3d',
  color: '#fff',
  fontWeight: 600,
};

const secondaryButtonStyle = {
  ...buttonStyle,
  backgroundColor: '#fff',
  color: '#7a3c30',
  border: '1px solid #d7c2ba',
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
        <h2 style={{ marginTop: 0 }}>Account</h2>
        <p>Checking your saved session.</p>
      </section>
    );
  }

  if (session?.user) {
    return (
      <section style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <h2 style={{ marginTop: 0, marginBottom: '8px' }}>Account</h2>
            <p style={{ marginBottom: '8px' }}>Signed in as {session.user.email || 'your account'}.</p>
            <p style={{ color: '#7d645d' }}>Your yarn list now saves to Supabase instead of staying only in this browser.</p>
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

  return (
    <section style={panelStyle}>
      <h2 style={{ marginTop: 0 }}>Optional Login</h2>
      <p style={{ marginBottom: '12px', color: '#7d645d' }}>
        Use an account to save your yarn list across devices. If you skip login, everything stays in this browser only.
      </p>
      {!isSupabaseConfigured ? (
        <p style={{ color: '#8f2d1e' }}>Supabase auth is not configured in the frontend environment yet, so the app is running in guest-only mode.</p>
      ) : (
        <>
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
              <span style={{ color: '#7d645d' }}>Guest mode remains available either way.</span>
            </div>
            {message && <p style={{ color: message.includes('failed') || message.includes('Enter both') ? '#8f2d1e' : '#17624a' }}>{message}</p>}
          </form>
        </>
      )}
    </section>
  );
};

export default AuthPanel;