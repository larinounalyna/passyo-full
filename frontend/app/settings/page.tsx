"use client";

import "./page.css";
import Sidebar from "@/components/sidebar/sidebar";
import PageTitle from "@/components/page_title/page_title";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import {
  Sun,
  Moon,
  Globe,
  Lock,
  Shield,
  Bell,
  Mail,
  Trash2,
  Camera,
  User,
  Check,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState("English");

  // Notification States
  const [emailNotify, setEmailNotify] = useState(true);
  const [browserNotify, setBrowserNotify] = useState(true);
  const [marketingNotify, setMarketingNotify] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleSave = () => {
    toast.success("Settings updated successfully!");
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Password changed successfully!");
  };

  return (
    <div className="settings-page-shell app-shell">
      <Sidebar />

      <main className="settings-content app-content">
        <div className="page-header-block">
          <PageTitle title="System Settings" />
          <p className="page-subtitle">
            Configure your personal workspace and security preferences
          </p>
        </div>

        <div className="settings-layout-grid">
          {/* LEFT COLUMN: Profile & Security */}
          <div className="settings-col">
            {/* Profile Details */}
            <section className="settings-card">
              <div className="card-header">
                <div className="header-icon">
                  <User size={20} />
                </div>
                <div>
                  <h3>Profile Details</h3>
                  <p>Update your public identity and avatar</p>
                </div>
              </div>

              <div className="avatar-manager">
                <div className="avatar-preview">
                  <div className="avatar-placeholder">LL</div>
                  <button className="avatar-upload-btn">
                    <Camera size={14} />
                  </button>
                </div>
                <div className="avatar-meta">
                  <h4>Lyna Larinouna</h4>
                  <p>lyna@example.com</p>
                  <span className="badge-premium">AI Engineer</span>
                </div>
              </div>

              <div className="settings-form">
                <div className="form-row">
                  <label className="field-group">
                    <span>Display Name</span>
                    <input
                      defaultValue="Lyna Larinouna"
                      placeholder="Enter your full name"
                    />
                  </label>
                  <label className="field-group">
                    <span>Gender</span>
                    <select defaultValue="Female">
                      <option>Female</option>
                      <option>Male</option>
                      <option>Other</option>
                      <option>Prefer not to say</option>
                    </select>
                  </label>
                </div>
                <label className="field-group">
                  <span>Professional Bio</span>
                  <textarea
                    rows={3}
                    defaultValue="AI Engineer specializing in intelligent construction systems and 5D estimation pipelines."
                  />
                </label>
                <button className="btn-save" onClick={handleSave}>
                  Save Profile
                </button>
              </div>
            </section>

            {/* Security Section */}
            <section className="settings-card">
              <div className="card-header">
                <div className="header-icon secondary">
                  <Lock size={20} />
                </div>
                <div>
                  <h3>Account Security</h3>
                  <p>Protect your account with modern security standards</p>
                </div>
              </div>

              <form className="settings-form" onSubmit={handleChangePassword}>
                <label className="field-group">
                  <span>Current Password</span>
                  <input type="password" placeholder="••••••••" />
                </label>
                <div className="form-row">
                  <label className="field-group">
                    <span>New Password</span>
                    <input type="password" placeholder="Min 8 characters" />
                  </label>
                  <label className="field-group">
                    <span>Confirm New Password</span>
                    <input type="password" placeholder="Repeat new password" />
                  </label>
                </div>

                <div className="security-check-list">
                  <div className="check-item enabled">
                    <Shield size={16} />
                    <span>
                      Two-Factor Authentication (2FA) is currently{" "}
                      <strong>enabled</strong>
                    </span>
                    <button type="button" className="text-btn">
                      Manage
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn-save">
                  Update Password
                </button>
              </form>
            </section>
          </div>

          {/* RIGHT COLUMN: Appearance, Language, Notifications */}
          <div className="settings-col">
            {/* Appearance */}
            <section className="settings-card">
              <div className="card-header">
                <div className="header-icon">
                  <Sun size={20} />
                </div>
                <div>
                  <h3>Appearance</h3>
                  <p>Choose your preferred interface aesthetic</p>
                </div>
              </div>
              <div className="theme-grid">
                <button
                  className={`theme-tile ${theme === "light" ? "selected" : ""}`}
                  onClick={() => setTheme("light")}
                >
                  <div className="tile-icon light">
                    <Sun size={20} />
                  </div>
                  <div className="tile-content">
                    <strong>Day Mode</strong>
                    <p>High contrast for bright environments</p>
                  </div>
                  {theme === "light" && (
                    <Check size={16} className="check-mark" />
                  )}
                </button>
                <button
                  className={`theme-tile ${theme === "dark" ? "selected" : ""}`}
                  onClick={() => setTheme("dark")}
                >
                  <div className="tile-icon dark">
                    <Moon size={20} />
                  </div>
                  <div className="tile-content">
                    <strong>Night Mode</strong>
                    <p>Gentle on eyes in low light</p>
                  </div>
                  {theme === "dark" && (
                    <Check size={16} className="check-mark" />
                  )}
                </button>
              </div>
            </section>

            {/* Language & Region */}
            <section className="settings-card">
              <div className="card-header">
                <div className="header-icon">
                  <Globe size={20} />
                </div>
                <div>
                  <h3>Language & Localization</h3>
                  <p>Select your primary workspace language</p>
                </div>
              </div>
              <div className="lang-field">
                <Globe size={18} className="lang-prefix" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="English">English (United States)</option>
                  <option value="French">Français (France)</option>
                  <option value="Arabic">العربية (Algeria)</option>
                </select>
              </div>
            </section>

            {/* Notifications */}
            <section className="settings-card">
              <div className="card-header">
                <div className="header-icon">
                  <Bell size={20} />
                </div>
                <div>
                  <h3>Notification Center</h3>
                  <p>Control when and how you stay updated</p>
                </div>
              </div>
              <div className="notify-list">
                <div className="notify-item">
                  <div className="notify-text">
                    <Mail size={18} />
                    <div>
                      <strong>Email Updates</strong>
                      <p>Receive reports and task assignments via email</p>
                    </div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={emailNotify}
                      onChange={() => setEmailNotify(!emailNotify)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="notify-item">
                  <div className="notify-text">
                    <Bell size={18} />
                    <div>
                      <strong>Push Notifications</strong>
                      <p>Browser alerts for high-priority updates</p>
                    </div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={browserNotify}
                      onChange={() => setBrowserNotify(!browserNotify)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </section>

            {/* Danger Zone */}
            <section className="settings-card danger">
              <div className="card-header">
                <div className="header-icon danger">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3>Danger Zone</h3>
                  <p>Irreversible account management actions</p>
                </div>
              </div>
              <div className="danger-actions">
                <button className="btn-danger">
                  <Trash2 size={16} />
                  <span>Delete Account</span>
                </button>
                <p className="danger-hint">
                  Once you delete your account, there is no going back. Please
                  be certain.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SettingsPage;
