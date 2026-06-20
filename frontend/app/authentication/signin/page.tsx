"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import "../auth.css";

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    setPasswordError("");
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
            Join thousands of construction professionals
          </h2>
          <p className="auth-panel-sub">
            Start managing your projects smarter. Get real-time insights and
            AI-powered tools for your team.
          </p>
          <div className="auth-panel-features">
            {[
              "Free 14-day trial",
              "No credit card required",
              "Setup in under 5 minutes",
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
            <h1 className="auth-form-title">Create your account</h1>
            <p className="auth-form-sub">
              Get started with Passyo for free
            </p>
          </div>

          <form onSubmit={handleSignup} className="auth-form">
            {/* Name row */}
            <div className="auth-two-col">
              <div className="auth-field">
                <label className="auth-label" htmlFor="su-fname">
                  First name
                </label>
                <div className="auth-input-wrap">
                  <User className="auth-input-icon" size={16} />
                  <input
                    id="su-fname"
                    type="text"
                    className="auth-input"
                    value={form.firstName}
                    onChange={(e) => set("firstName", e.target.value)}
                    placeholder="Lyna"
                    required
                    autoComplete="given-name"
                  />
                </div>
              </div>
              <div className="auth-field">
                <label className="auth-label" htmlFor="su-lname">
                  Last name
                </label>
                <input
                  id="su-lname"
                  type="text"
                  className="auth-input no-icon"
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                  placeholder="Larinouna"
                  required
                  autoComplete="family-name"
                />
              </div>
            </div>

            {/* Email */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="su-email">
                Email address
              </label>
              <div className="auth-input-wrap">
                <Mail className="auth-input-icon" size={16} />
                <input
                  id="su-email"
                  type="email"
                  className="auth-input"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Passwords */}
            <div className="auth-two-col">
              <div className="auth-field">
                <label className="auth-label" htmlFor="su-password">
                  Password
                </label>
                <div className="auth-input-wrap">
                  <Lock className="auth-input-icon" size={16} />
                  <input
                    id="su-password"
                    type={showPass ? "text" : "password"}
                    className={`auth-input ${passwordError ? "error" : ""}`}
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="Min. 8 chars"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowPass(!showPass)}
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="auth-field">
                <label className="auth-label" htmlFor="su-confirm">
                  Confirm password
                </label>
                <div className="auth-input-wrap">
                  <Lock className="auth-input-icon" size={16} />
                  <input
                    id="su-confirm"
                    type={showConfirm ? "text" : "password"}
                    className={`auth-input ${passwordError ? "error" : ""}`}
                    value={form.confirmPassword}
                    onChange={(e) => set("confirmPassword", e.target.value)}
                    placeholder="Repeat password"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowConfirm(!showConfirm)}
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>
            {passwordError && (
              <p className="auth-error-msg">{passwordError}</p>
            )}

            {/* Terms */}
            <label className="auth-check-label">
              <input
                type="checkbox"
                className="auth-checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
              />
              I agree to the{" "}
              <a href="#" className="auth-link-sm" style={{ marginLeft: 4 }}>
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="auth-link-sm">
                Privacy Policy
              </a>
            </label>

            <button type="submit" className="auth-submit-btn">
              Create Account
            </button>
          </form>

          <p className="auth-footer-text">
            Already have an account?
            <Link href="/authentication/login" className="auth-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
