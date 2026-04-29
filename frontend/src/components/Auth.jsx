import { useState } from "react";

function LoginView({ email, setEmail, password, setPassword, onSubmit, toggleMode, loading, error }) {
  return (
    <div className="auth-card-ref">
      <div className="auth-header-ref">
        <h1 className="auth-title-ref">Welcome back</h1>
        <p className="auth-subtitle-ref">Sign in to your Spendly account</p>
      </div>

      {error && <div className="auth-flash-error-ref">{error}</div>}

      <form onSubmit={onSubmit} className="auth-form-ref">
        <div className="form-group-ref">
          <label>Email address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="nitish@example.com" />
        </div>
        <div className="form-group-ref">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Your password" />
        </div>
        <button type="submit" disabled={loading} className="auth-submit-btn-ref">
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="auth-switch-ref">
        Don't have an account? <button onClick={toggleMode}>Create one free</button>
      </p>
    </div>
  );
}

function RegisterView({ email, setEmail, password, setPassword, onSubmit, toggleMode, loading, error }) {
  return (
    <div className="auth-card-ref">
      <div className="auth-header-ref">
        <h1 className="auth-title-ref">Create Account</h1>
        <p className="auth-subtitle-ref">Start tracking your expenses with Spendly</p>
      </div>

      {error && <div className="auth-flash-error-ref">{error}</div>}

      <form onSubmit={onSubmit} className="auth-form-ref">
        <div className="form-group-ref">
          <label>Email address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="nitish@example.com" />
        </div>
        <div className="form-group-ref">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Choose a strong password" />
        </div>
        <button type="submit" disabled={loading} className="auth-submit-btn-ref">
          {loading ? "Creating account..." : "Get started"}
        </button>
      </form>

      <p className="auth-switch-ref">
        Already have an account? <button onClick={toggleMode}>Sign in instead</button>
      </p>
    </div>
  );
}

export function AuthScreen({ supabase }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error } = isLogin
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ 
            email, 
            password, 
            options: { data: { full_name: email.split("@")[0] } } 
          });

      if (error) throw error;
      
      if (!isLogin && !data?.session) {
        setError("Signed up successfully! Please check your email or sign in.");
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-ref">
      <div className="auth-container-ref">
        <div className="auth-brand-ref">
          <div className="brand-icon-ref">◈</div>
          <span className="brand-name-ref">Spendly</span>
        </div>
        {isLogin ? (
          <LoginView
            email={email} setEmail={setEmail} password={password} setPassword={setPassword}
            onSubmit={handleSubmit} toggleMode={() => setIsLogin(false)}
            loading={loading} error={error}
          />
        ) : (
          <RegisterView
            email={email} setEmail={setEmail} password={password} setPassword={setPassword}
            onSubmit={handleSubmit} toggleMode={() => setIsLogin(true)}
            loading={loading} error={error}
          />
        )}
      </div>
    </div>
  );
}
