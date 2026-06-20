"use client";
import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import "../auth.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
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
            Account recovery made simple
          </h2>
          <p className="auth-panel-sub">
            We'll send you a secure link to reset your password. It only takes
            a moment.
          </p>
          <div className="auth-panel-features">
            {[
              "Secure one-time reset link",
              "Expires in 15 minutes",
              "No account lockout",
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

          <Link href="/authentication/login" className="auth-back-link">
            <ArrowLeft size={16} />
            Back to Sign In
          </Link>

          {submitted ? (
            <div className="auth-success-state">
              <div className="auth-success-icon">
                <CheckCircle size={30} />
              </div>
              <h2>Check your email</h2>
              <p>
                We sent password reset instructions to{" "}
                <strong>{email}</strong>. The link expires in 15 minutes.
              </p>
              <Link
                href="/authentication/login"
                className="auth-submit-btn"
                style={{ marginTop: 16 }}
              >
                Back to Sign In
              </Link>
              <button
                className="auth-footer-text"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  font: "inherit",
                  marginTop: 8,
                }}
                onClick={() => setSubmitted(false)}
              >
                Didn&apos;t receive it?{" "}
                <span style={{ color: "var(--accent)", fontWeight: 700 }}>
                  Try again
                </span>
              </button>
            </div>
          ) : (
            <>
              <div className="auth-form-heading">
                <h1 className="auth-form-title">Forgot password?</h1>
                <p className="auth-form-sub">
                  Enter your email and we&apos;ll send you reset instructions.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="auth-field">
                  <label className="auth-label" htmlFor="fp-email">
                    Email address
                  </label>
                  <div className="auth-input-wrap">
                    <Mail className="auth-input-icon" size={16} />
                    <input
                      id="fp-email"
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

                <button type="submit" className="auth-submit-btn">
                  <Mail size={16} />
                  Send Reset Link
                </button>
              </form>

              <p className="auth-footer-text">
                Remember your password?
                <Link href="/authentication/login" className="auth-link">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
