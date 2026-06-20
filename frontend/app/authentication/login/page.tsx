"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import "../auth.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined")
      localStorage.setItem("access_token", "mock_token");
    router.push("/dashboard");
  };

  return (
    <div className="auth-page">
      {/* ── Left Brand Panel ── */}
      <div className="auth-left">
        <div className="auth-decor" aria-hidden="true" />
        <div className="auth-brand-mark">
          <div className="auth-brand-icon">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="auth-brand-name">Passyo</span>
        </div>

        <div className="auth-panel-body">
          <h2 className="auth-panel-headline">
            Smart Project Management for Construction Teams
          </h2>
          <p className="auth-panel-sub">
            Track projects, manage teams, and optimize resources — all in one
            intelligent platform.
          </p>
          <div className="auth-panel-features">
            {[
              "Real-time project tracking",
              "AI-powered insights",
              "Team collaboration tools",
            ].map((f) => (
              <div key={f} className="auth-panel-feature">
                <span className="auth-feature-dot" />
                {f}
              </div>
            ))}
          </div>
        </div>

        <p className="auth-panel-footer">© 2025 Passyo. All rights reserved.</p>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="auth-right">
        <div className="auth-form-card">
          {/* Mobile brand */}
          <div className="auth-mobile-brand">
            <div className="auth-brand-icon">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="auth-mobile-brand-name">Passyo</span>
          </div>

          <div className="auth-form-heading">
            <h1 className="auth-form-title">Welcome back</h1>
            <p className="auth-form-sub">Sign in to your Passyo workspace</p>
          </div>

          <form onSubmit={handleLogin} className="auth-form">
            <div className="auth-field">
              <label className="auth-label" htmlFor="login-email">
                Email address
              </label>
              <div className="auth-input-wrap">
                <Mail className="auth-input-icon" size={16} />
                <input
                  id="login-email"
                  type="email"
                  className="auth-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-label-row">
                <label className="auth-label" htmlFor="login-password">
                  Password
                </label>
                <Link
                  href="/authentication/forgot-password"
                  className="auth-link-sm"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="auth-input-wrap">
                <Lock className="auth-input-icon" size={16} />
                <input
                  id="login-password"
                  type={showPass ? "text" : "password"}
                  className="auth-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPass(!showPass)}
                  tabIndex={-1}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="auth-remember-row">
              <label className="auth-check-label">
                <input
                  type="checkbox"
                  className="auth-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
            </div>

            <button type="submit" className="auth-submit-btn">
              Sign In
            </button>
          </form>

          <p className="auth-footer-text">
            Don&apos;t have an account?
            <Link href="/authentication/signin" className="auth-link">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
