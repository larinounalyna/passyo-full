"use client";

import "./sidebar.css";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ProfileInfo from "../profile_info/profile_info";
import { useState, useSyncExternalStore } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  LogOut,
  Trash2,
  ChevronUp,
  Sparkles,
  X,
  MessageSquareText,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Dialog from "@radix-ui/react-dialog";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: "Projets",
    href: "/projects",
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
];

const TOOLS_ITEMS = [
  {
    label: "Équipes",
    href: "/teams",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    label: "Sécurité",
    href: "/security",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    label: "Calculateur",
    href: "/calculator",
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <line x1="8" y1="6" x2="16" y2="6" />
        <line x1="8" y1="10" x2="9" y2="10" />
        <line x1="12" y1="10" x2="13" y2="10" />
        <line x1="16" y1="10" x2="17" y2="10" />
        <line x1="8" y1="14" x2="9" y2="14" />
        <line x1="12" y1="14" x2="13" y2="14" />
        <line x1="16" y1="14" x2="17" y2="14" />
        <line x1="8" y1="18" x2="9" y2="18" />
        <line x1="12" y1="18" x2="13" y2="18" />
        <line x1="16" y1="18" x2="17" y2="18" />
      </svg>
    ),
  },
  {
    label: "Calendrier",
    href: "/calendar",
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    label: "Assistant IA",
    href: "/chatbot",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
];

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";
const SIDEBAR_COLLAPSED_EVENT = "sidebar-collapsed-change";

function getSidebarCollapsedSnapshot() {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

function getSidebarCollapsedServerSnapshot() {
  return false;
}

function subscribeToSidebarCollapsed(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(SIDEBAR_COLLAPSED_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(SIDEBAR_COLLAPSED_EVENT, onStoreChange);
  };
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const isCollapsed = useSyncExternalStore(
    subscribeToSidebarCollapsed,
    getSidebarCollapsedSnapshot,
    getSidebarCollapsedServerSnapshot,
  );
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const isChatbotPage = pathname === "/chatbot";

  const toggleCollapsed = () => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(!isCollapsed));
      window.dispatchEvent(new Event(SIDEBAR_COLLAPSED_EVENT));
    } catch {}
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("access_token");
    } catch {}
    router.push("/authentication/login");
  };

  const isActive = (href: string) => pathname?.startsWith(href);

  return (
    <>
      <div className={`sidebar-root ${isCollapsed ? "collapsed" : ""}`}>
        {/* ── Brand ── */}
        <div className="sidebar-brand-container">
          <div className="sidebar-brand">
            <img
              src="/4c50cb7b9af245039eff0bb367bd811c.png"
              alt="Website Logo"
              className="sidebar-logo"
            />
          </div>
          <button
            className="sidebar-collapse-btn"
            onClick={toggleCollapsed}
            aria-label="Toggle Sidebar"
          >
            {isCollapsed ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronLeft size={18} />
            )}
          </button>
        </div>

        {/* ── Navigation ── */}
        {!isCollapsed && (
          <span className="sidebar-section-label">Navigation</span>
        )}
        <ul className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <li key={item.href} className="sidebar-nav-item">
              <Link
                href={item.href}
                className={isActive(item.href) ? "active" : ""}
                title={isCollapsed ? item.label : undefined}
              >
                {item.icon}
                {!isCollapsed && item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* ── Tools ── */}
        {!isCollapsed && <span className="sidebar-section-label">Outils</span>}
        <ul className="sidebar-nav">
          {TOOLS_ITEMS.map((item) => (
            <li key={item.href} className="sidebar-nav-item">
              <Link
                href={item.href}
                className={isActive(item.href) ? "active" : ""}
                title={isCollapsed ? item.label : undefined}
              >
                {item.icon}
                {!isCollapsed && item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* ── Profile Footer ── */}
        <div className="sidebar-footer">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="sidebar-profile-trigger"
                aria-label="Profile menu"
              >
                {isCollapsed ? (
                  <div className="sidebar-profile-avatar-placeholder">LL</div>
                ) : (
                  <div className="sidebar-profile-row">
                    <ProfileInfo
                      name="Lyna Larinouna"
                      title="AI Engineer"
                      photoUrl=""
                    />
                    <ChevronUp size={13} className="profile-chevron" />
                  </div>
                )}
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="sidebar-dropdown"
                side="top"
                align="start"
                sideOffset={8}
                avoidCollisions
              >
                {/* User info header */}
                <div className="sidebar-dropdown-header">
                  <div className="sidebar-dropdown-avatar">LL</div>
                  <div className="sidebar-dropdown-user-info">
                    <p className="sidebar-dropdown-name">Lyna Larinouna</p>
                    <p className="sidebar-dropdown-role">AI Engineer</p>
                  </div>
                </div>

                <DropdownMenu.Separator className="sidebar-dropdown-sep" />

                <DropdownMenu.Item asChild>
                  <Link href="/settings" className="sidebar-dropdown-item">
                    <Settings size={15} />
                    Settings
                  </Link>
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="sidebar-dropdown-sep" />

                <DropdownMenu.Item
                  className="sidebar-dropdown-item"
                  onSelect={handleLogout}
                >
                  <LogOut size={15} />
                  Logout
                </DropdownMenu.Item>

                <DropdownMenu.Item
                  className="sidebar-dropdown-item danger"
                  onSelect={(e) => {
                    e.preventDefault();
                    setDeleteOpen(true);
                  }}
                >
                  <Trash2 size={15} />
                  Delete Account
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>

      {/* ── Delete Account Confirmation Dialog ── */}
      <Dialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="sidebar-dialog-overlay" />
          <Dialog.Content className="sidebar-dialog-content">
            <div className="sidebar-dialog-icon-wrap">
              <Trash2 size={22} />
            </div>
            <Dialog.Title className="sidebar-dialog-title">
              Delete Account
            </Dialog.Title>
            <Dialog.Description className="sidebar-dialog-desc">
              This will permanently delete your account and all associated data.
              This action cannot be undone.
            </Dialog.Description>
            <div className="sidebar-dialog-actions">
              <Dialog.Close asChild>
                <button className="btn btn-ghost">Cancel</button>
              </Dialog.Close>
              <button
                className="btn-danger-solid"
                onClick={() => {
                  setDeleteOpen(false);
                  handleLogout();
                }}
              >
                <Trash2 size={14} />
                Delete Account
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ── Floating AI Assistant Button ── */}
      {!isChatbotPage && (
        <div className="ai-fab-root">
          {fabOpen && (
            <div className="ai-fab-popup">
              <div className="ai-fab-popup-header">
                <div className="ai-fab-popup-title">
                  <Sparkles size={15} />
                  AI Assistant
                </div>
                <button
                  className="ai-fab-popup-close"
                  onClick={() => setFabOpen(false)}
                  aria-label="Close"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="ai-fab-popup-desc">
                Ask anything about your projects, resources, or get smart
                insights.
              </p>
              <Link
                href="/chatbot"
                className="ai-fab-popup-btn"
                onClick={() => setFabOpen(false)}
              >
                <MessageSquareText size={15} />
                Open AI Assistant
              </Link>
            </div>
          )}
          <button
            className={`ai-fab-btn ${fabOpen ? "active" : ""}`}
            onClick={() => setFabOpen(!fabOpen)}
            aria-label="AI Assistant"
          >
            {fabOpen ? <X size={20} /> : <Sparkles size={20} />}
          </button>
        </div>
      )}
    </>
  );
}
