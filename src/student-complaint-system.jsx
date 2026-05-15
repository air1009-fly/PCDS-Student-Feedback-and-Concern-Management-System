import { useState, useEffect, useRef } from "react";
import React from "react";
import { createPortal } from "react-dom";
import logoImage from "./assets/images.jpg";
import polyLogo from "./assets/poly.png";
import bgImage from "./assets/final.png";
import feedbackIcon from "./assets/feedback.png";
import dashboardIcon from "./assets/dashboard.png";
import addIcon from "./assets/add.png";
import reportsIcon from "./assets/reports.png";

// ─── GLOBAL STYLES (injected ONCE at App root) ──────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

    *, *::before, *::after {
      font-family: 'Inter', sans-serif;
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html, body, #root { height: 100%; }

    body {
      background: #f8fafc;
      overflow-x: hidden;
      color: #0f172a;
    }

    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: #f1f5f9; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }

    .fade-in  { animation: fadeIn  0.3s ease forwards; }
    .scale-in { animation: scaleIn 0.2s ease forwards; }

    @keyframes fadeIn  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
    @keyframes scaleIn { from { opacity:0; transform:scale(0.97);     } to { opacity:1; transform:scale(1);     } }

    /* ── Sidebar nav items ── */
    .nav-item {
      transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease, transform 0.15s ease;
      border-left: 3px solid transparent;
    }
    .nav-item:hover {
      background: rgba(255,255,255,0.1) !important;
      color: #ffffff !important;
      border-left: 3px solid rgba(255,255,255,0.3) !important;
      transform: translateX(3px);
    }
    .nav-item:hover span:first-child {
      transform: scale(1.15);
    }
    .nav-item.active {
      background: linear-gradient(90deg, rgba(59,130,246,0.25), rgba(59,130,246,0.08)) !important;
      border-left: 3px solid #3b82f6 !important;
      color: #fff !important;
      box-shadow: inset 0 0 0 1px rgba(59,130,246,0.15);
    }

    /* ── Card hover ── */
    .card-hover { transition: box-shadow 0.2s, transform 0.2s; }
    .card-hover:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.09); transform: translateY(-2px); }

    /* ── Primary button ── */
    .btn-primary { transition: filter 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease; }
    .btn-primary:hover:not(:disabled) {
      filter: brightness(1.1);
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(37,99,235,0.35);
    }
    .btn-primary:active:not(:disabled) { transform: translateY(0); filter: brightness(0.97); }

    /* ── Secondary button ── */
    .btn-secondary { transition: background 0.15s ease, border-color 0.15s ease; }
    .btn-secondary:hover { background: #e2e8f0 !important; border-color: #cbd5e1 !important; }

    /* ── Table row hover ── */
    .concern-row { transition: background 0.12s; cursor: default; }
    .concern-row:hover { background: #f8fafc !important; }

    /* ── Focus rings ── */
    input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: #3b82f6 !important;
      box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
    }

    /* ── Print ── */
    @media print {
      .no-print { display: none !important; }
      body { background: white; }
    }
  `}</style>
);

// ─── MOCK DATABASE ───────────────────────────────────────────
const INITIAL_USERS = [
  { id: 1, name: "Juan dela Cruz",  email: "juan@poly.edu",   password: "student123", role: "student", course: "BSIT", year: "3rd Year" },
  { id: 2, name: "Maria Santos",    email: "maria@poly.edu",  password: "student123", role: "student", course: "BSBA", year: "2nd Year" },
  { id: 3, name: "Carlo Reyes",     email: "admin@poly.edu",  password: "admin123",   role: "admin",   dept: "Office of the Registrar" },
  { id: 4, name: "Ana Gomez",       email: "staff@poly.edu",  password: "staff123",   role: "staff",   dept: "Student Affairs" },
  { id: 5, name: "Ben Torres",      email: "staff2@poly.edu", password: "staff123",   role: "staff",   dept: "Academic Affairs" },
];

const INITIAL_CONCERNS = [
  { id: 1, studentId: 1, studentName: "Juan dela Cruz", subject: "Late Grade Submission",         category: "Services",   description: "My professor hasn't submitted grades for Semester 1. It has been over a month and it's affecting my academic standing.",               status: "Pending",     priority: "High",   assignedTo: null, assignedName: "",          remarks: "",                                                                                  date: "2025-04-10" },
  { id: 2, studentId: 2, studentName: "Maria Santos",   subject: "Broken Aircon in Room 203",     category: "Facilities", description: "The air conditioning in Room 203 has been non-functional for 2 weeks. Classes are unbearable in the heat.",                       status: "In Progress", priority: "Medium", assignedTo: 4,    assignedName: "Ana Gomez", remarks: "Coordinating with the maintenance team. Parts have been ordered.",                date: "2025-04-12" },
  { id: 3, studentId: 1, studentName: "Juan dela Cruz", subject: "Scholarship Allowance Delay",   category: "Administrative Concern",  description: "My scholarship allowance for the current semester has not been released. It is already past the scheduled date.",                  status: "Resolved",    priority: "High",   assignedTo: 5,    assignedName: "Ben Torres", remarks: "Coordinated with the Finance Office. Allowance was released on April 18, 2025.", date: "2025-04-08" },
  { id: 4, studentId: 2, studentName: "Maria Santos",   subject: "Library Closing Hours During Exams", category: "Facilities", description: "The library closes at 5PM even during exam week when students need extended study hours.",                               status: "In Progress", priority: "Low",    assignedTo: 4,    assignedName: "Ana Gomez", remarks: "Discussing with the Library Director for extended hours proposal.",                date: "2025-04-15" },
];

// ─── HELPERS ────────────────────────────────────────────────
const catEmoji = { Services: "[S]", Facilities: "[F]", "Administrative Concern": "[A]" };

function ImgIcon({ src, alt = "", size = 22, white = false }) {
  return (
    <img
      src={src}
      alt={alt}
      style={{
        width: size, height: size, objectFit: "contain",
        display: "inline-block", flexShrink: 0,
        filter: white ? "brightness(0) invert(1)" : "none",
      }}
    />
  );
}

function CategoryIcon({ category, size = 18 }) {
  return <span style={{ fontSize: size }}>{catEmoji[category] || "📋"}</span>;
}

// Department ↔ Category mapping
const DEPARTMENTS = [
  { value: "Maintenance Department",    label: "Maintenance Department",    category: "Facilities"             },
  { value: "Administrative Assistants", label: "Administrative Assistants", category: "Administrative Concern" },
  { value: "Support Staff",             label: "Support Staff",             category: "Services"               },
];
const deptForCategory = (cat) => DEPARTMENTS.find(d => d.category === cat)?.value || null;

// Format any date string (ISO or YYYY-MM-DD) → "Apr 29, 2026"
const fmtDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date)) return String(d);
  return date.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
};

// Validate email — must have text @ text . tld (min 2 chars)
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((email || "").trim());

// ─── TOAST NOTIFICATION SYSTEM ──────────────────────────────
const ToastContext = React.createContext(null);

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const styles = {
    success: { bg: "#f0fdf4", border: "#bbf7d0", color: "#15803d", icon: "✅" },
    error:   { bg: "#fff1f2", border: "#fecdd3", color: "#be123c", icon: "❌" },
    warning: { bg: "#fffbeb", border: "#fde68a", color: "#b45309", icon: "⚠️" },
    info:    { bg: "#f0f9ff", border: "#bae6fd", color: "#0369a1", icon: "ℹ️" },
  };

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {/* Toast container — portal into body */}
      {typeof document !== "undefined" && createPortal(
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 99999,
          display: "flex", flexDirection: "column", gap: 10,
          maxWidth: 360, width: "100%",
          pointerEvents: "none",
        }}>
          {toasts.map(t => {
            const s = styles[t.type] || styles.info;
            return (
              <div key={t.id} className="scale-in" style={{
                display: "flex", alignItems: "flex-start", gap: 10,
                padding: "12px 14px", borderRadius: 12,
                background: s.bg, border: `1px solid ${s.border}`,
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                pointerEvents: "all",
                animation: "fadeIn 0.25s ease",
              }}>
                <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{s.icon}</span>
                <p style={{ fontSize: 13, color: s.color, fontWeight: 500, flex: 1, lineHeight: 1.5 }}>{t.message}</p>
                <button
                  onClick={() => dismiss(t.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: s.color, fontSize: 14, padding: 0, flexShrink: 0, opacity: 0.6 }}
                >✕</button>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

const useToast = () => React.useContext(ToastContext);


function Badge({ text, type = "status" }) {
  const statusStyles = {
    "Pending":     { background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a", dot: "#f59e0b" },
    "In Progress": { background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd", dot: "#0ea5e9" },
    "Resolved":    { background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", dot: "#10b981" },
  };
  const priorityStyles = {
    "High":   { background: "#fff1f2", color: "#be123c", border: "1px solid #fecdd3" },
    "Medium": { background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" },
    "Low":    { background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" },
  };

  const s = type === "status" ? statusStyles[text] : priorityStyles[text];
  if (!s) return null;

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 999, fontSize: 11,
      fontWeight: 600, background: s.background, color: s.color, border: s.border,
      whiteSpace: "nowrap", flexShrink: 0,
    }}>
      {type === "status" && (
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      )}
      {text}
    </span>
  );
}

// ─── MODAL ──────────────────────────────────────────────────
function Modal({ children, onClose, title, size = "md" }) {
  const widths = { sm: 400, md: 520, lg: 640, xl: 800 };

  const modal = (
    <div
      onClick={onClose}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 9999,
        background: "rgba(15,23,42,0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px",
      }}
    >
      <div
        className="scale-in"
        onClick={e => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: 16,
          boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
          width: "100%",
          maxWidth: widths[size],
          maxHeight: "calc(100vh - 48px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px",
          borderBottom: "1px solid #f1f5f9",
          flexShrink: 0,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: "50%", border: "none",
              cursor: "pointer", background: "transparent", color: "#64748b",
              fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >✕</button>
        </div>
        {/* Body — scrolls inside the modal */}
        <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );

  // Render into document.body so overflow on parent containers never clips the overlay
  return createPortal(modal, document.body);
}

// ─── STAT CARD ───────────────────────────────────────────────
function StatCard({ icon, label, value, color, sub }) {
  const colors = {
    blue:    { bg: "linear-gradient(135deg, #1d4ed8, #2563eb)", shadow: "rgba(37,99,235,0.35)" },
    amber:   { bg: "linear-gradient(135deg, #b45309, #d97706)", shadow: "rgba(217,119,6,0.35)"  },
    emerald: { bg: "linear-gradient(135deg, #047857, #059669)", shadow: "rgba(5,150,105,0.35)"  },
    rose:    { bg: "linear-gradient(135deg, #be123c, #e11d48)", shadow: "rgba(225,29,72,0.35)"  },
    sky:     { bg: "linear-gradient(135deg, #0369a1, #0ea5e9)", shadow: "rgba(14,165,233,0.35)" },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className="card-hover" style={{
      background: c.bg,
      borderRadius: 16,
      padding: "20px 24px",
      boxShadow: `0 4px 20px ${c.shadow}`,
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
      color: "white",
    }}>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{label}</p>
        <p style={{ fontSize: 40, fontWeight: 900, color: "white", lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>{sub}</p>}
      </div>
      <div style={{
        width: 52, height: 52, borderRadius: 14, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(255,255,255,0.18)",
        fontSize: 24,
      }}>{icon}</div>
    </div>
  );
}

// ─── TOP BAR ────────────────────────────────────────────────
function TopBar({ title, subtitle, user }) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  return (
    <div className="no-print" style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 28px", height: 64, flexShrink: 0,
      background: "white",
      borderBottom: "1px solid #f1f5f9",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    }}>
      <div>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 1 }}>{subtitle}</p>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{user.name}</p>
          <p style={{ fontSize: 11, color: "#94a3b8", textTransform: "capitalize" }}>{dateStr}</p>
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
          color: "white", fontSize: 14, fontWeight: 800,
        }}>{user.name.charAt(0).toUpperCase()}</div>
      </div>
    </div>
  );
}

// ─── SIDEBAR ────────────────────────────────────────────────
function Sidebar({ navItems, active, onNav, onLogout, user, unreadCount = 0, onNavNotif }) {
  return (
    <aside
      className="no-print"
      style={{
        display: "flex", flexDirection: "column", height: "100%",
        background: "linear-gradient(180deg, #1e3a5f 0%, #1e2d4a 100%)",
        width: 280, minWidth: 280, flexShrink: 0,
        boxShadow: "2px 0 12px rgba(0,0,0,0.15)",
      }}
    >
      {/* Logo / Brand */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "white",
          }}>
            <img src={logoImage} alt="Logo" style={{ width: 30, height: 30, objectFit: "contain" }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.3 }}>PCDS</p>
            <p style={{ fontSize: 10, color: "#94a3b8", fontWeight: 400, lineHeight: 1.4 }}>Feedback and Concern Management System</p>
          </div>
          {/* Notification bell — only shown when there are unread messages */}
          {unreadCount > 0 && onNavNotif && (
            <button
              onClick={onNavNotif}
              title={`${unreadCount} new message${unreadCount > 1 ? "s" : ""}`}
              style={{
                position: "relative", flexShrink: 0,
                width: 34, height: 34, borderRadius: "50%",
                background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(251,191,36,0.28)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(251,191,36,0.15)"}
            >
              🔔
              <span style={{
                position: "absolute", top: -4, right: -4,
                minWidth: 16, height: 16, borderRadius: 999,
                background: "#f43f5e", color: "white",
                fontSize: 9, fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 3px",
              }}>{unreadCount > 9 ? "9+" : unreadCount}</span>
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", padding: "8px 10px 6px" }}>Menu</p>
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => onNav(item.key)}
            className={`nav-item${active === item.key ? " active" : ""}`}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12,
              padding: "13px 14px", borderRadius: 10, marginBottom: 4,
              background: "transparent", border: "none", cursor: "pointer", textAlign: "left",
              color: active === item.key ? "#fff" : "#94a3b8",
            }}
          >
            <span style={{ fontSize: 17, flexShrink: 0, width: 22, textAlign: "center", transition: "transform 0.15s ease", display: "inline-block" }}>{item.icon}</span>
            <span style={{ fontSize: 14, fontWeight: active === item.key ? 700 : 500 }}>{item.label}</span>
            {/* Show unread badge on notification-enabled nav items */}
            {((item.key === "myconcerns" && unreadCount > 0) || Number(item.badge) > 0) && (
              <span style={{
                marginLeft: "auto", minWidth: 18, height: 18, borderRadius: 999,
                background: "#f43f5e", color: "white",
                fontSize: 10, fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 4px", flexShrink: 0,
              }}>{(Number(item.badge) || unreadCount) > 9 ? "9+" : (Number(item.badge) || unreadCount)}</span>
            )}
          </button>
        ))}
      </nav>

      {/* User info + logout */}
      <div style={{ padding: "12px 14px 16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, padding: "8px 10px", borderRadius: 8, background: "rgba(255,255,255,0.05)" }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
            color: "white", fontSize: 13, fontWeight: 700,
          }}>{user.name.charAt(0).toUpperCase()}</div>
          <div style={{ overflow: "hidden", flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</p>
            <p style={{ fontSize: 10, color: "#64748b", textTransform: "capitalize" }}>{user.role}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(248,113,113,0.25)", cursor: "pointer",
            color: "#fca5a5", background: "rgba(248,113,113,0.08)",
            fontSize: 13, fontWeight: 600, transition: "all 0.15s ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(248,113,113,0.18)"; e.currentTarget.style.borderColor = "rgba(248,113,113,0.4)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(248,113,113,0.08)"; e.currentTarget.style.borderColor = "rgba(248,113,113,0.25)"; }}
        >
          <span style={{ fontSize: 13 }}>↩</span> Sign Out
        </button>
      </div>
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════
// LANDING PAGE
// ═══════════════════════════════════════════════════════════
function LandingPage({ onGetStarted }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const features = [
    { icon: "✎", title: "Submit Concerns", desc: "Easily file academic, financial, or facility concerns with supporting attachments." },
    { icon: "🔔", title: "Real-time Updates", desc: "Get notified instantly when admin or staff responds to your concern." },
    { icon: "📊", title: "Track Progress", desc: "Monitor the status of every concern from Pending to Resolved." },
    { icon: "💬", title: "Receive Response", desc: "Receive a response from the administrator regarding your concerns and feedback." },
    { icon: "🔒", title: "Secure & Private", desc: "Your data is protected. Only authorized personnel can access your concerns." },
    { icon: "📁", title: "File Attachments", desc: "Attach photos or PDF documents to support your concern submissions." },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#0f172a", minHeight: "100vh", color: "white", overflowX: "hidden" }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", height: 64,
        background: scrolled ? "rgba(15,23,42,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.07)" : "none",
        transition: "all 0.3s ease",
      }}>
        {/* Logo + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={logoImage} alt="PCDS Logo" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "contain", background: "white", padding: 3 }} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#f1f5f9", lineHeight: 1.2 }}>PCDS</p>
            <p style={{ fontSize: 10, color: "#64748b", lineHeight: 1.2 }}>Digos City</p>
          </div>
        </div>

        {/* Nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {["Home", "Features", "About"].map(link => (
            <a key={link} href={`#${link.toLowerCase()}`} style={{
              fontSize: 13, fontWeight: 500, color: "#94a3b8", textDecoration: "none",
              transition: "color 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = "#f1f5f9"}
            onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}
            >{link}</a>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onGetStarted}
          style={{
            padding: "8px 20px", borderRadius: 10, border: "none", cursor: "pointer",
            background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
            color: "white", fontSize: 13, fontWeight: 700,
            boxShadow: "0 4px 14px rgba(14,165,233,0.35)",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.1)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.filter = "none"; e.currentTarget.style.transform = "none"; }}
        >
          Sign In →
        </button>
      </nav>

      {/* ── HERO SECTION ── */}
      <section id="home" style={{
        position: "relative", minHeight: "100vh",
        display: "flex", alignItems: "center",
        overflow: "hidden",
      }}>
        {/* bg.png — full bleed, slightly darkened */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover", backgroundPosition: "center top",
          filter: "brightness(0.45) saturate(1.2)",
        }} />

        {/* Rich multi-stop gradient overlay for depth */}
        <div style={{
          position: "absolute", inset: 0,
          background: `
            linear-gradient(
              120deg,
              rgba(10,15,30,0.92) 0%,
              rgba(10,20,50,0.75) 35%,
              rgba(5,30,60,0.55) 60%,
              rgba(2,20,45,0.80) 100%
            )
          `,
        }} />

        {/* Teal glow — bottom left */}
        <div style={{
          position: "absolute", bottom: -120, left: -80,
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Blue glow — top right */}
        <div style={{
          position: "absolute", top: -100, right: -60,
          width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Poly logo watermark — top right */}
        <img src={polyLogo} alt="" style={{
          position: "absolute", top: -60, right: -60,
          width: 420, height: 420, objectFit: "contain",
          opacity: 0.1, pointerEvents: "none",
        }} />

        {/* Content — two columns */}
        <div style={{
          position: "relative", zIndex: 1,
          width: "100%", maxWidth: 1100,
          margin: "0 auto", padding: "100px 40px 60px",
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60,
          alignItems: "center",
        }}>

          {/* LEFT — text */}
          <div>
            {/* Badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "6px 14px", borderRadius: 999, marginBottom: 24,
              background: "rgba(14,165,233,0.15)", border: "1px solid rgba(14,165,233,0.3)",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#0ea5e9", display: "inline-block" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#38bdf8" }}>Polytechnic College of Davao del Sur</span>
            </div>

            <h1 style={{ fontSize: 48, fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: 20 }}>
              <span style={{ color: "#f1f5f9" }}>Student Feedback</span><br />
              <span style={{ background: "linear-gradient(135deg, #38bdf8, #0ea5e9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>& Concern System</span>
            </h1>

            <p style={{ fontSize: 16, color: "#94a3b8", lineHeight: 1.7, marginBottom: 36, maxWidth: 460 }}>
              A centralized platform for students to submit, track, and resolve services, facility, and administartive concerns — directly connected to the right people.
            </p>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <button
                onClick={onGetStarted}
                style={{
                  padding: "14px 32px", borderRadius: 12, border: "none", cursor: "pointer",
                  background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
                  color: "white", fontSize: 15, fontWeight: 700,
                  boxShadow: "0 8px 24px rgba(14,165,233,0.4)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(14,165,233,0.5)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(14,165,233,0.4)"; }}
              >
                Get Started →
              </button>
              <a href="#features" style={{
                padding: "14px 32px", borderRadius: 12, cursor: "pointer",
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                color: "#e2e8f0", fontSize: 15, fontWeight: 600, textDecoration: "none",
                transition: "all 0.2s", display: "inline-block",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
              >
                Learn More
              </a>
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", gap: 32, marginTop: 48 }}>
              {[["Fast", "Response Time"], ["Secure", "& Private"], ["24/7", "Accessible"]].map(([val, label]) => (
                <div key={label}>
                  <p style={{ fontSize: 22, fontWeight: 800, color: "#38bdf8" }}>{val}</p>
                  <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — info card */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Main card */}
            <div style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 20, padding: 28,
              backdropFilter: "blur(16px)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, #0ea5e9, #0284c7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📣</div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>Submit a Concern</p>
                  <p style={{ fontSize: 12, color: "#64748b" }}>Quick and easy process</p>
                </div>
              </div>
              {[
                { step: "1", text: "Log in with your student account" },
                { step: "2", text: "Choose a category and describe your concern" },
                { step: "3", text: "Attach supporting documents if needed" },
                { step: "4", text: "Track updates and receive responses" },
              ].map(({ step, text }) => (
                <div key={step} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(14,165,233,0.2)", border: "1px solid rgba(14,165,233,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#38bdf8" }}>{step}</span>
                  </div>
                  <p style={{ fontSize: 13, color: "#cbd5e1" }}>{text}</p>
                </div>
              ))}
            </div>

            {/* Two mini cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { icon: "🎓", label: "Students", desc: "Submit & track concerns" },
                { icon: "🛡️", label: "Admin", desc: "Manage & resolve issues" },
              ].map(({ icon, label, desc }) => (
                <div key={label} style={{
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 14, padding: 16, backdropFilter: "blur(8px)",
                }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{label}</p>
                  <p style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, opacity: 0.5 }}>
          <p style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase" }}>Scroll</p>
          <div style={{ width: 1, height: 40, background: "linear-gradient(to bottom, #64748b, transparent)" }} />
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section id="features" style={{ padding: "100px 40px", background: "#0f172a" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#0ea5e9", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>What We Offer</p>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em" }}>Everything you need in one place</h2>
            <p style={{ fontSize: 15, color: "#64748b", marginTop: 12, maxWidth: 500, margin: "12px auto 0" }}>A complete system designed to make student concerns heard and resolved efficiently.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {features.map(({ icon, title, desc }) => (
              <div key={title} style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16, padding: 24,
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(14,165,233,0.06)"; e.currentTarget.style.borderColor = "rgba(14,165,233,0.2)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.transform = "none"; }}
              >
                <div style={{ fontSize: 28, marginBottom: 14 }}>{icon}</div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>{title}</p>
                <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT SECTION ── */}
      <section id="about" style={{ padding: "80px 40px", background: "rgba(14,165,233,0.04)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#0ea5e9", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>About the System</p>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em", marginBottom: 16 }}>Built for Polytechnic College of Davao del Sur</h2>
            <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.8, marginBottom: 16 }}>
              The Student Feedback and Concern Management System (SFCMS) is an official platform of Polytechnic College — MacArthur Highway, Barangay Kiagot, Digos City.
            </p>
            <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.8 }}>
              It bridges the gap between students and administration by providing a transparent, efficient, and organized way to handle all types of student concerns.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
             { icon: "𖠿", label: "Institution", value: "Polytechnic College of Davao del Sur" },
              { icon: "📍", label: "Location", value: "MacArthur Highway, Brgy. Kiagot, Digos City" },
              { icon: "🎯", label: "Purpose", value: "Student Concern & Feedback Management" },
            ].map(({ icon, label, value }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
                <div>
                  <p style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
                  <p style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 500, marginTop: 2 }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: "28px 40px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={logoImage} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "contain", background: "white", padding: 2 }} />
          <p style={{ fontSize: 12, color: "#475569" }}>© 2025 Polytechnic College of Davao del Sur. All rights reserved.</p>
        </div>
        <button onClick={onGetStarted} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid rgba(14,165,233,0.3)", background: "transparent", color: "#38bdf8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Sign In →
        </button>
      </footer>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// LOGIN PAGE
// ═══════════════════════════════════════════════════════════
function LoginPage({ onLogin, error, onBack }) {
  return (
    <div style={{
      position: "relative", overflow: "hidden",
      background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0c4a6e 100%)",
      minHeight: "100vh", width: "100%",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }}>
      {/* Background blobs */}
      <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, #38bdf8, transparent)", opacity: 0.1, top: -200, right: -200 }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, #7dd3fc, transparent)", opacity: 0.05, bottom: -100, left: -100 }} />
       
      </div>

      <div style={{ position: "relative", width: "100%", maxWidth: 440 }}>
        {/* Back to home */}
        {onBack && (
          <button onClick={onBack} style={{
            display: "flex", alignItems: "center", gap: 6, marginBottom: 20,
            background: "none", border: "none", cursor: "pointer",
            color: "#64748b", fontSize: 13, fontWeight: 500, transition: "color 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "#94a3b8"}
          onMouseLeave={e => e.currentTarget.style.color = "#64748b"}
          >
            ← Back to Home
          </button>
        )}

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          {/* Logo — transparent PNG on a subtle glassy circle */}
          <div style={{
            width: 96, height: 96, borderRadius: "50%",
            margin: "0 auto 18px",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(255, 255, 255, 0.97)",
            border: "1.5px solid rgba(255,255,255,0.15)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
            backdropFilter: "blur(8px)",
          }}>
            <img src={polyLogo} alt="PCDS Logo" style={{ width: 68, height: 68, objectFit: "contain" }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.25, letterSpacing: "-0.02em" }}>
            <span style={{ color: "#f1f5f9", display: "block" }}>Student Feedback & Concern</span>
            <span style={{ color: "#38bdf8", display: "block" }}>Management System</span>
          </h1>
          <p style={{ fontSize: 12, color: "#475569", marginTop: 6, letterSpacing: "0.01em" }}>
            Polytechnic College — MacArthur Highway, Brgy. Kiagot, Digos City
          </p>
        </div>

        <LoginForm onLogin={onLogin} error={error} />
      </div>
    </div>
  );
}

// ─── LOGIN FORM ──────────────────────────────────────────────
function LoginForm({ onLogin, error }) {
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [role,        setRole]        = useState("student");
  const [showPwd,     setShowPwd]     = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [notFound,    setNotFound]    = useState(false);
  const [emailErr,    setEmailErr]    = useState("");

  const handleSubmit = async () => {
    setNotFound(false);
    if (!email.trim()) return setEmailErr("Email address is required.");
    if (!isValidEmail(email)) return setEmailErr("Please enter a valid email address (e.g. name@domain.com).");
    setEmailErr("");
    setLoading(true);
    const result = await onLogin(email, password, role);
    setLoading(false);
    if (result === "not_found") setNotFound(true);
  };

  // ── Not registered screen ──
  if (notFound) {
    return (
      <div style={{ background: "white", borderRadius: 24, padding: 32, boxShadow: "0 25px 60px rgba(0,0,0,0.35)", textAlign: "center" }}>
        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: "50%", margin: "0 auto 20px",
          background: "#fff7ed", border: "2px solid #fed7aa",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32,
        }}>🚫</div>

        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
          Account Not Found
        </h2>
        <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, marginBottom: 24 }}>
          No account was found for <strong style={{ color: "#0f172a" }}>{email}</strong>.<br />
          You need to be registered by an administrator before you can sign in.
        </p>

        {/* Info box */}
        <div style={{
          padding: "16px 20px", borderRadius: 14, marginBottom: 24,
          background: "#f0f9ff", border: "1px solid #bae6fd", textAlign: "left",
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#0369a1", marginBottom: 10 }}>
            📋 How to get registered:
          </p>
          {[
            "Visit the school's Admin Office or Registrar",
            "Provide your full name, email address, and course",
            "The admin will create your account in the system",
            "Come back here and sign in with your credentials",
          ].map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
              <span style={{
                minWidth: 20, height: 20, borderRadius: "50%",
                background: "#0ea5e9", color: "white",
                fontSize: 10, fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1,
              }}>{i + 1}</span>
              <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{step}</p>
            </div>
          ))}
        </div>

        {/* Contact info */}
        <div style={{
          padding: "12px 16px", borderRadius: 12, marginBottom: 24,
          background: "#f8fafc", border: "1px solid #e2e8f0",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 20 }}>𖠿</span>
          <div style={{ textAlign: "left" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>Admin Office</p>
            <p style={{ fontSize: 12, color: "#64748b" }}>Polytechnic College — MacArthur Highway, Brgy. Kiagot, Digos City</p>
          </div>
        </div>

        <button
          onClick={() => { setNotFound(false); setEmail(""); setPassword(""); }}
          className="btn-primary"
          style={{
            width: "100%", padding: "12px 0", borderRadius: 10, border: "none",
            background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
            color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer",
          }}
        >
          ← Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: "white", borderRadius: 24, padding: 28, boxShadow: "0 25px 60px rgba(0,0,0,0.35)" }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Welcome back</h2>
      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>Sign in to access your dashboard</p>

      {error && !notFound && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, marginBottom: 16, background: "#fff1f2", border: "1px solid #fecdd3" }}>
          <span>⚠️</span>
          <p style={{ fontSize: 12, color: "#be123c" }}>{error}</p>
        </div>
      )}

      {/* Role selector */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Sign in as</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {["student","admin","staff"].map(r => (
            <button key={r} onClick={() => setRole(r)} style={{
              padding: "8px 4px", borderRadius: 10, fontSize: 12, fontWeight: 600,
              border: role === r ? "2px solid #0ea5e9" : "2px solid #e2e8f0",
              background: role === r ? "#eff6ff" : "white",
              color: role === r ? "#0284c7" : "#64748b",
              textTransform: "capitalize", cursor: "pointer",
            }}>{r}</button>
          ))}
        </div>
      </div>

      {/* Email */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Email Address</label>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 14, pointerEvents: "none" }}>✉️</span>
          <input type="email" value={email} onChange={e => { setEmail(e.target.value); setEmailErr(""); }}
            placeholder="your@gmail.com" onKeyDown={e => e.key === "Enter" && handleSubmit()}
            style={{ width: "100%", paddingLeft: 36, paddingRight: 16, paddingTop: 10, paddingBottom: 10, borderRadius: 10, border: `1.5px solid ${emailErr ? "#f43f5e" : "#e2e8f0"}`, fontSize: 13, color: "#0f172a", background: "#f8fafc" }} />
        </div>
        {emailErr && <p style={{ fontSize: 11, color: "#f43f5e", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>⚠ {emailErr}</p>}
      </div>

      {/* Password */}
      <div style={{ marginBottom: 22 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Password</label>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 14, pointerEvents: "none" }}>🔒</span>
          <input type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" onKeyDown={e => e.key === "Enter" && handleSubmit()}
            style={{ width: "100%", paddingLeft: 36, paddingRight: 40, paddingTop: 10, paddingBottom: 10, borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, color: "#0f172a", background: "#f8fafc" }} />
          <button onClick={() => setShowPwd(!showPwd)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 13, padding: 4 }}>
            {showPwd ? "hide" : "view"}
          </button>
        </div>
      </div>

      <button onClick={handleSubmit} disabled={loading} className="btn-primary"
        style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #0ea5e9, #0284c7)", color: "white", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
        {loading ? "Signing in…" : "Sign In →"}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STUDENT DASHBOARD
// ═══════════════════════════════════════════════════════════
function StudentDashboard({ user, concerns, onAddConcern, onLogout, messages, onLoadMessages }) {
  const [page, setPage] = useState("home");
  const [readCounts, setReadCounts] = useState(() => {
    try { return JSON.parse(localStorage.getItem("scms_read_counts") || "{}"); }
    catch { return {}; }
  });
  const myConcerns = concerns.filter(c => c.studentId === user.id);

  const handleMarkRead = (concernId, count) => {
    const updated = { ...readCounts, [concernId]: count };
    setReadCounts(updated);
    localStorage.setItem("scms_read_counts", JSON.stringify(updated));
  };

  // Unread = admin messages not yet seen
  const unreadCount = myConcerns.reduce((acc, c) => {
    const msgs = messages[c.id] || [];
    const adminCount = msgs.filter(m => m.sender_role !== "student").length;
    const lastRead = readCounts[c.id] ;
    return acc + Math.max(0, adminCount - lastRead);
  }, 0);

  const navItems = [
     { key: "home",       icon: <ImgIcon src={dashboardIcon} alt="Dashboard" size={22} white />, label: "Dashboard"                },
    { key: "submit",     icon: <ImgIcon src={addIcon} alt="Submit" size={22} white />, label: "Submit Feedback/Concern"   },
    { key: "myconcerns", icon: <ImgIcon src={feedbackIcon} alt="Feedback" size={22} white />, label: "My Feedbacks and Concerns" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#f8fafc" }}>
      <Sidebar navItems={navItems} active={page} onNav={setPage} onLogout={onLogout} user={user} unreadCount={unreadCount} onNavNotif={() => setPage("myconcerns")} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar
          title={navItems.find(n => n.key === page)?.label || "Dashboard"}
          subtitle="Student Portal"
          user={user}
        />
        <main style={{ flex: 1, overflowY: "auto" }}>
          <div className="fade-in" style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
            {page === "home"       && <StudentHome       user={user} concerns={myConcerns} onNav={setPage} />}
            {page === "submit"     && <SubmitConcern     user={user} onSubmit={async (c) => { const result = await onAddConcern(c); if (result?.success) setPage("myconcerns"); return result; }} onCancel={() => setPage("home")} />}
            {page === "myconcerns" && <MyConcerns        concerns={myConcerns} messages={messages} onLoadMessages={onLoadMessages} readCounts={readCounts} onMarkRead={handleMarkRead} />}
          </div>
        </main>
      </div>
    </div>
  );
}

function StudentHome({ user, concerns, onNav }) {
  const pending  = concerns.filter(c => c.status === "Pending").length;
  const resolved = concerns.filter(c => c.status === "Resolved").length;

  return (
    <div>
      {/* Greeting banner */}
      <div style={{
        background: "linear-gradient(135deg, #1e3a5f 0%, #1e2d4a 100%)",
        borderRadius: 20, padding: "24px 28px", marginBottom: 24,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 4px 20px rgba(30,58,95,0.25)",
      }}>
        <div>
          <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 4 }}>Welcome back!</p>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "white", letterSpacing: "-0.02em" }}>
            Good day, {user.name.split(" ")[0]}!
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{user.course} · Polytechnic College</p>
        </div>
        <div style={{ fontSize: 48, opacity: 0.6 }}></div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard icon="✎" label="Total Concerns" value={concerns.length} color="blue"    />
        <StatCard icon="ⴵ" label="Pending"         value={pending}         color="amber"   />
        <StatCard icon="✔" label="Resolved"         value={resolved}        color="emerald" />
      </div>

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16, marginBottom: 24 }}>
        {[
          { key: "submit", bg: "#eff6ff", icon: "✎", title: "Submit a Feedback/Concern", sub: "File a new feedback/concern or request" },
        ].map(a => (
          <button key={a.key} onClick={() => onNav(a.key)} className="card-hover" style={{
            background: "white", border: "1px solid #e2e8f0", borderRadius: 16,
            padding: 20, textAlign: "left", cursor: "pointer", transition: "all 0.2s ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#f0f4f8"; e.currentTarget.style.borderColor = "#0ea5e9"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, background: a.bg, fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>{a.icon}</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{a.title}</p>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{a.sub}</p>
          </button>
        ))}
      </div>

      {/* Recent concerns */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>My Recent Concerns</h3>
          <button onClick={() => onNav("myconcerns")} style={{ fontSize: 12, color: "#0ea5e9", fontWeight: 600, background: "none", border: "none", cursor: "pointer", transition: "all 0.2s ease" }} onMouseEnter={e => e.currentTarget.style.color = "#0284c7"} onMouseLeave={e => e.currentTarget.style.color = "#0ea5e9"}>View all [→]</button>
        </div>
        {concerns.length === 0 ? (
          <div style={{ padding: "48px 0", textAlign: "center" }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}></p>
            <p style={{ fontSize: 14, color: "#64748b" }}>No concerns and feedback submitted yet</p>
          </div>
        ) : concerns.slice(0, 4).map(c => (
          <div key={c.id} className="concern-row" style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 20px", borderBottom: "1px solid #f1f5f9",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>[{c.category.charAt(0)}]</span>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.subject}</p>
                <p style={{ fontSize: 11, color: "#94a3b8" }}>{fmtDate(c.date)} · {c.category}</p>
              </div>
            </div>
            <Badge text={c.status} type="status" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SUBMIT CONCERN ─────────────────────────────────────────
// Auto-priority rules: Services = High, Administrative Concern = High, Facilities = Medium
const categoryPriority = { "Services": "High", "Facilities": "Medium", "Administrative Concern": "High" };

function SubmitConcern({ user, onSubmit, onCancel }) {
  const toast = useToast();
  const [form, setForm] = useState({ subject: "", category: "Services", description: "", priority: categoryPriority["Services"], submissionType: "Concern" });
  const [uploadedFile, setUploadedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [remaining, setRemaining] = useState(null); // null = loading

  // Fetch today's real count from the backend on mount
  useEffect(() => {
    fetch(`/concerns/daily-count/${user.id}`)
      .then(r => r.json())
      .then(data => {
        setRemaining(data.remaining ?? 0);
        if ((data.remaining ?? 0) === 0) setLimitReached(true);
      })
      .catch(() => setRemaining(2)); // fallback: allow if can't reach server
  }, [user.id]);

  const set = (k, v) => {
    if (k === "category") {
      setForm(p => ({ ...p, category: v, priority: categoryPriority[v] || "Medium" }));
    } else {
      setForm(p => ({ ...p, [k]: v }));
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast("File size exceeds 5MB limit.", "warning"); return; }
    const validTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"];
    if (!validTypes.includes(file.type)) { toast("Only PDF and image files are allowed.", "warning"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedFile({ name: file.name, type: file.type, dataUrl: ev.target.result });
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!form.subject || !form.description) return toast("Please fill in all required fields.", "warning");
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await onSubmit({
        ...form,
        studentId: user.id,
        studentName: user.name,
        attachedFileName: uploadedFile?.name || null,
        attachedFileType: uploadedFile?.type || null,
        attachedFileData: uploadedFile?.dataUrl || null,
      });
      if (result?.limitReached) {
        setLimitReached(true);
        setRemaining(0);
      } else if (result?.success) {
        // Refresh count from server after successful submit
        fetch(`/concerns/daily-count/${user.id}`)
          .then(r => r.json())
          .then(data => setRemaining(data.remaining ?? 0));
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Limit reached screen ──
  if (limitReached || remaining === 0) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button onClick={onCancel} style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>Submit a Feedback/Concern</h1>
        </div>
        <div style={{ background: "white", borderRadius: 20, padding: 40, border: "1px solid #e2e8f0", textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🚫</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Daily Limit Reached</h2>
          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, marginBottom: 24 }}>
            You have already submitted <strong>2 concerns today</strong>. To prevent spam, each student is limited to <strong>2 submissions per day</strong>.
          </p>
          <div style={{ padding: "14px 20px", borderRadius: 12, background: "#f0f9ff", border: "1px solid #bae6fd", marginBottom: 24 }}>
            <p style={{ fontSize: 13, color: "#0369a1", fontWeight: 600 }}> Your limit resets at midnight tonight.</p>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>You can submit again tomorrow.</p>
          </div>
          <button onClick={onCancel} className="btn-primary" style={{ ...primaryBtn, width: "100%" }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Back header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={onCancel} style={{
          width: 32, height: 32, borderRadius: "50%", border: "1px solid #e2e8f0",
          background: "white", cursor: "pointer", fontSize: 16,
          display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s ease",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "#f0f4f8"; e.currentTarget.style.borderColor = "#0ea5e9"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
        >[←]</button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>Submit a Feedback/Concern</h1>
          <p style={{ fontSize: 13, color: "#64748b" }}>Your concern will be reviewed and addressed by our team</p>
        </div>
      </div>

      {/* Daily limit banner */}
      {remaining === null ? (
        <div style={{ padding: "12px 16px", borderRadius: 12, marginBottom: 16, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <p style={{ fontSize: 13, color: "#94a3b8" }}>Checking submission limit…</p>
        </div>
      ) : remaining === 1 ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, marginBottom: 16, background: "#fffbeb", border: "1px solid #fde68a" }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <p style={{ fontSize: 13, color: "#b45309", fontWeight: 600 }}>
            You have <strong>1 submission left</strong> today. Use it wisely.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, marginBottom: 16, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
          <span style={{ fontSize: 18 }}>✔</span>
          <p style={{ fontSize: 13, color: "#15803d", fontWeight: 600 }}>
            You have <strong>{remaining} submission{remaining !== 1 ? "s" : ""} remaining</strong> today.
          </p>
        </div>
      )}

      <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0" }}>
        {/* Type selector — Feedback or Concern */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Type *</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { value: "Concern", icon: "⚠️", desc: "An issue that needs to be resolved" },
              { value: "Feedback", icon: "💬", desc: "A suggestion or general comment" },
            ].map(({ value, icon, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => set("submissionType", value)}
                style={{
                  padding: "12px 14px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                  border: form.submissionType === value ? "2px solid #0ea5e9" : "2px solid #e2e8f0",
                  background: form.submissionType === value ? "#eff6ff" : "white",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: form.submissionType === value ? "#0284c7" : "#0f172a" }}>{value}</span>
                </div>
                <p style={{ fontSize: 11, color: "#64748b", lineHeight: 1.4 }}>{desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Category + Priority row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Category *</label>
            <select value={form.category} onChange={e => set("category", e.target.value)} style={inputStyle}>
              <option>Services</option><option>Facilities</option><option>Administrative Concern</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Priority Level <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 400 }}>(auto-set by category)</span></label>
            <div style={{
              ...inputStyle,
              display: "flex", alignItems: "center", gap: 8,
              background: form.priority === "High" ? "#fff1f2" : form.priority === "Medium" ? "#fff7ed" : "#f8fafc",
              borderColor: form.priority === "High" ? "#fecdd3" : form.priority === "Medium" ? "#fed7aa" : "#e2e8f0",
              color: form.priority === "High" ? "#be123c" : form.priority === "Medium" ? "#c2410c" : "#475569",
              fontWeight: 700, cursor: "default",
            }}>
              <span>{form.priority === "High" ? "🔴" : form.priority === "Medium" ? "🟡" : "🟢"}</span>
              {form.priority}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Subject / Title *</label>
          <input type="text" value={form.subject} onChange={e => set("subject", e.target.value)}
            placeholder="Brief title of your concern" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Description *</label>
          <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={5}
            placeholder="Describe your concern in detail. Include relevant dates, names, and circumstances…"
            style={{ ...inputStyle, resize: "none" }} />
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: 12, borderRadius: 10, marginBottom: 24,
          background: uploadedFile ? "#dbeafe" : "#f0fdf4", border: uploadedFile ? "1px solid #bae6fd" : "1px solid #bbf7d0",
        }}>
          <span>{uploadedFile ? "[✓]" : ""}</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: uploadedFile ? "#0369a1" : "#15803d" }}>
              {uploadedFile ? `File: ${uploadedFile.name}` : "Attach Supporting Documents (Optional)"}
            </p>
            <p style={{ fontSize: 11, color: uploadedFile ? "#0284c7" : "#16a34a" }}>
              {uploadedFile ? "File uploaded successfully" : "PDF, Images accepted · Max 5MB"}
            </p>
          </div>
          <label style={{ padding: "6px 12px", borderRadius: 8, background: uploadedFile ? "#bae6fd" : "#dcfce7", color: uploadedFile ? "#0369a1" : "#15803d", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", display: "inline-block" }}>
            <input type="file" onChange={handleFileUpload} accept=".pdf,.jpg,.jpeg,.png,.gif" style={{ display: "none" }} />
            {uploadedFile ? "Change" : "Browse"}
          </label>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary" style={{ ...primaryBtn, opacity: submitting ? 0.7 : 1, cursor: submitting ? "not-allowed" : "pointer" }}>
            {submitting ? "Submitting…" : "Submit Feedback/Concern"}
          </button>
          <button onClick={onCancel} disabled={submitting} className="btn-secondary" style={secondaryBtn}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── MY CONCERNS ─────────────────────────────────────────────
function MyConcerns({ concerns, messages, onLoadMessages, readCounts = {}, onMarkRead }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [openMsgId, setOpenMsgId] = useState(null);

  // Load messages for all my concerns on mount
  useEffect(() => {
    concerns.forEach(c => onLoadMessages && onLoadMessages(c.id));
  }, [concerns.length]);

  // Open panel and mark as read
  const openMessages = (concernId) => {
    const msgs = messages[concernId] || [];
    const adminCount = msgs.filter(m => m.sender_role !== "student").length;
    onMarkRead && onMarkRead(concernId, adminCount);
    setOpenMsgId(openMsgId === concernId ? null : concernId);
    onLoadMessages && onLoadMessages(concernId);
  };

  // Unread count per concern
  const getUnread = (concernId) => {
    const msgs = messages[concernId] || [];
    const adminCount = msgs.filter(m => m.sender_role !== "student").length;
    const lastRead = readCounts[concernId] ;
    return Math.max(0, adminCount - lastRead);
  };

  const filtered = concerns.filter(c =>
    (filter === "All" || c.status === filter) &&
    (c.subject.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>My Feedbacks and Concerns</h1>
        <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Track the status of all your submitted concerns</p>
      </div>

      <div style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        {/* Filter bar */}
        <div style={{ padding: 16, borderBottom: "1px solid #f1f5f9", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative", flex: "1 1 180px" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }}></span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search concerns…"
              style={{ ...inputStyle, paddingLeft: 32, margin: 0, width: "100%" }} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {["All","Pending","In Progress","Resolved"].map(s => (
              <button key={s} onClick={() => setFilter(s)} style={{
                padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                background: filter === s ? "#0ea5e9" : "#f1f5f9",
                color: filter === s ? "white" : "#64748b",
                fontWeight: 600, fontSize: 12, whiteSpace: "nowrap",
              }}>{s}</button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "64px 0", textAlign: "center" }}>
            <p style={{ fontSize: 36, marginBottom: 8 }}></p>
            <p style={{ fontSize: 14, color: "#64748b" }}>No concerns found</p>
          </div>
        ) : filtered.map(c => {
          const msgs = messages[c.id] || [];
          const unread = getUnread(c.id);
          const isOpen = openMsgId === c.id;
          return (
            <div key={c.id} className="concern-row" style={{ padding: 20, borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", minWidth: 0 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>[{c.category.charAt(0)}]</span>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{c.subject}</p>
                  <Badge text={c.priority} type="priority" />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <Badge text={c.status} type="status" />
                  {/* Message bell */}
                  <button
                    onClick={() => openMessages(c.id)}
                    title="View messages from admin"
                    style={{
                      position: "relative", width: 30, height: 30, borderRadius: "50%",
                      background: unread > 0 ? "#fffbeb" : "#f1f5f9",
                      border: unread > 0 ? "1px solid #fde68a" : "1px solid #e2e8f0",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, transition: "background 0.15s",
                    }}
                  >
                    🔔
                    {unread > 0 && (
                      <span style={{
                        position: "absolute", top: -3, right: -3,
                        minWidth: 14, height: 14, borderRadius: 999,
                        background: "#f43f5e", color: "white",
                        fontSize: 8, fontWeight: 800,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "0 2px",
                      }}>{unread > 9 ? "9+" : unread}</span>
                    )}
                  </button>
                </div>
              </div>
              <p style={{ fontSize: 12, color: "#64748b", marginBottom: 8, lineHeight: 1.6 }}>{c.description}</p>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>· {fmtDate(c.date)}</span>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>· {c.category}</span>
                {c.assignedName && <span style={{ fontSize: 11, color: "#94a3b8" }}>👤 Assigned to {c.assignedName}</span>}
              </div>
              {c.remarks && (
                <div style={{ marginTop: 10, padding: 12, borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#15803d", marginBottom: 2 }}>Staff Remarks</p>
                  <p style={{ fontSize: 12, color: "#166534" }}>{c.remarks}</p>
                </div>
              )}

              {/* ── Messages panel ── */}
              {isOpen && (
                <div style={{ marginTop: 14, borderRadius: 12, border: "1px solid #e0f2fe", background: "#f0f9ff", overflow: "hidden" }}>
                  <div style={{ padding: "10px 14px", borderBottom: "1px solid #bae6fd", background: "#e0f2fe" }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#0369a1" }}> Messages from Admin / Staff</p>
                  </div>
                  <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10, maxHeight: 260, overflowY: "auto" }}>
                    {msgs.length === 0 ? (
                      <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", padding: "16px 0" }}>No messages yet.</p>
                    ) : msgs.map(m => {
                      const isAdmin = m.sender_role !== "student";
                      return (
                        <div key={m.id} style={{
                          alignSelf: isAdmin ? "flex-start" : "flex-end",
                          maxWidth: "80%",
                        }}>
                          <div style={{
                            padding: "8px 12px", borderRadius: isAdmin ? "4px 12px 12px 12px" : "12px 4px 12px 12px",
                            background: isAdmin ? "white" : "#0ea5e9",
                            border: isAdmin ? "1px solid #e2e8f0" : "none",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                          }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: isAdmin ? "#0369a1" : "rgba(255,255,255,0.8)", marginBottom: 3 }}>
                              {m.sender_name} · {m.sender_role}
                            </p>
                            <p style={{ fontSize: 13, color: isAdmin ? "#0f172a" : "white", lineHeight: 1.5 }}>{m.message}</p>
                          </div>
                          <p style={{ fontSize: 10, color: "#94a3b8", marginTop: 2, textAlign: isAdmin ? "left" : "right", paddingLeft: isAdmin ? 4 : 0, paddingRight: isAdmin ? 0 : 4 }}>
                            {new Date(m.created_at).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}



// ═══════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════
function AdminDashboard({ user, concerns, users, onUpdateConcern, onDeleteConcern, onAddUser, onDeleteUser, onUpdateUser, onLogout, messages, onLoadMessages, onSendMessage }) {
  const toast = useToast();
  const [page, setPage] = useState("home");
  const [selected, setSelected] = useState(null);
  const lastNoticeCounts = useRef({ newConcernCount: 0, resolvedNoticeCount: 0 });
  const activeConcerns = concerns.filter(c => !Number(c.archived));
  const archivedConcerns = concerns.filter(c => Number(c.archived));
  const newConcernCount = activeConcerns.filter(c => !Number(c.adminSeen)).length;
  const resolvedNoticeCount = activeConcerns.filter(c => c.status === "Resolved" && !Number(c.adminResolvedSeen)).length;
  const adminNoticeCount = newConcernCount + resolvedNoticeCount;

  useEffect(() => {
    if (newConcernCount > lastNoticeCounts.current.newConcernCount) {
      toast(`${newConcernCount} new student concern${newConcernCount === 1 ? "" : "s"} need${newConcernCount === 1 ? "s" : ""} review.`, "info");
    }
    if (resolvedNoticeCount > lastNoticeCounts.current.resolvedNoticeCount) {
      toast(`${resolvedNoticeCount} concern${resolvedNoticeCount === 1 ? " was" : "s were"} marked resolved by staff.`, "success");
    }
    lastNoticeCounts.current = { newConcernCount, resolvedNoticeCount };
  }, [newConcernCount, resolvedNoticeCount, toast]);

  const navItems = [
     { key: "home",     icon: <ImgIcon src={dashboardIcon} alt="Overview" size={22} white />, label: "Overview"                   },
    { key: "concerns", icon: <ImgIcon src={feedbackIcon} alt="Concerns" size={22} white />, label: "All Feedbacks and Concerns", badge: adminNoticeCount },
    { key: "register", icon: <ImgIcon src={addIcon} alt="Register" size={22} white />, label: "Register Users"              },
    { key: "reports",  icon: <ImgIcon src={reportsIcon} alt="Reports" size={22} white />, label: "Reports"                    },
  ];
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#f8fafc" }}>
      <Sidebar navItems={navItems} active={page} onNav={p => { setPage(p); setSelected(null); }} onLogout={onLogout} user={user} unreadCount={adminNoticeCount} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar
          title={navItems.find(n => n.key === page)?.label || "Admin"}
          subtitle="Admin Portal — Polytechnic College"
          user={user}
        />
        <main style={{ flex: 1, overflowY: "auto" }}>
          <div className="fade-in" style={{ padding: 24, width: "100%", maxWidth: 1400, margin: "0 auto" }}>
            {page === "home"     && <AdminHome     concerns={activeConcerns} newConcernCount={newConcernCount} resolvedNoticeCount={resolvedNoticeCount} onNav={setPage} />}
            {page === "concerns" && <AdminConcerns concerns={activeConcerns} archivedConcerns={archivedConcerns} users={users} onUpdate={onUpdateConcern} onDelete={onDeleteConcern} selected={selected} onSelect={setSelected} messages={messages} onLoadMessages={onLoadMessages} onSendMessage={(cId, msg) => onSendMessage(cId, user.name, user.role, msg)} />}
            {page === "register" && <RegisterUser  users={users} onAdd={onAddUser} onDelete={onDeleteUser} onUpdate={onUpdateUser} />}
            {page === "reports"  && <Reports       concerns={activeConcerns} />}
          </div>
        </main>
      </div>
    </div>
  );
}

function AdminHome({ concerns, newConcernCount = 0, resolvedNoticeCount = 0, onNav }) {
  const pending  = concerns.filter(c => c.status === "Pending").length;
  const inProg   = concerns.filter(c => c.status === "In Progress").length;
  const resolved = concerns.filter(c => c.status === "Resolved").length;

  return (
    <div>
      {/* Banner */}
      <div style={{
        background: "linear-gradient(135deg, #1e3a5f 0%, #1e2d4a 100%)",
        borderRadius: 20, padding: "24px 28px", marginBottom: 24,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 4px 20px rgba(30,58,95,0.25)",
      }}>
        <div>
          <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 4 }}>Admin Portal</p>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "white", letterSpacing: "-0.02em" }}>Overview</h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Polytechnic College Kiagot — Feedback & Concern Management</p>
        </div>
        <div style={{ fontSize: 48, opacity: 0.6 }}></div>
      </div>

      {/* 4-column stats — 2-col on narrow screens via CSS Grid auto-fit */}
      {(newConcernCount > 0 || resolvedNoticeCount > 0) && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
          background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 14,
          padding: "14px 18px", marginBottom: 20,
        }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#1d4ed8" }}>
              Admin review needed
            </p>
            <p style={{ fontSize: 12, color: "#475569", marginTop: 3 }}>
              {newConcernCount} new submission{newConcernCount === 1 ? "" : "s"} and {resolvedNoticeCount} staff-resolved concern{resolvedNoticeCount === 1 ? "" : "s"} are highlighted in the queue.
            </p>
          </div>
          <button onClick={() => onNav("concerns")} className="btn-primary" style={{ ...primaryBtn, padding: "9px 14px", flexShrink: 0 }}>
            Review now
          </button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard icon="✎" label="Total Concerns" value={concerns.length} color="blue"    />
        <StatCard icon="ⴵ" label="Pending"         value={pending}         color="amber"   />
        <StatCard icon="⟳" label="In Progress"      value={inProg}          color="sky"     />
        <StatCard icon="✔" label="Resolved"          value={resolved}        color="emerald" />
      </div>

      {/* Recent concerns */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Recent Concerns</h3>
          <button onClick={() => onNav("concerns")} style={{ fontSize: 12, color: "#0ea5e9", fontWeight: 600, background: "none", border: "none", cursor: "pointer", transition: "all 0.2s ease" }} onMouseEnter={e => e.currentTarget.style.color = "#0284c7"} onMouseLeave={e => e.currentTarget.style.color = "#0ea5e9"}>View all [→]</button>
        </div>
        {concerns.slice(0, 5).map(c => (
          <div key={c.id} className="concern-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #f1f5f9", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{catEmoji[c.category] || "??"}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.subject}</p>
                </div>
                <p style={{ fontSize: 11, color: "#94a3b8" }}>{c.studentName} · {fmtDate(c.date)}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <Badge text={c.priority} type="priority" />
              <Badge text={c.status}   type="status"   />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ADMIN: ALL CONCERNS ─────────────────────────────────────
function AdminConcerns({ concerns, archivedConcerns = [], users, onUpdate, onDelete, selected, onSelect, messages, onLoadMessages, onSendMessage }) {
  const toast = useToast();
  const [search,    setSearch] = useState("");
  const [catFilter, setCat]    = useState("All");
  const [statFilter, setStat]  = useState("All");
  const [typeFilter, setType]  = useState("All");
  const [showNewOnly, setShowNewOnly] = useState(false);
  const [archiveView, setArchiveView] = useState("active");
  const [newMsg,    setNewMsg] = useState("");
  const [messageError, setMessageError] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  // Assign modal state
  const [assignTarget, setAssignTarget] = useState(null); // { concern, staffId }
  const [instructions, setInstructions] = useState("");
  const staffList = users.filter(u => u.role === "staff");

  const handleSelect = (c) => {
    onSelect(c);
    if (c) onLoadMessages(c.id);
    if (c && (!Number(c.adminSeen) || (c.status === "Resolved" && !Number(c.adminResolvedSeen)))) {
      onUpdate(c.id, { adminSeen: 1, adminResolvedSeen: 1 });
    }
  };

  const handleSendMsg = async () => {
    const text = newMsg.trim();
    if (!text || !selected || sendingMsg) return;

    setSendingMsg(true);
    setMessageError("");
    const result = await onSendMessage(selected.id, text);
    setSendingMsg(false);

    if (result?.success === false) {
      setMessageError(result.message || "Message could not be sent.");
      return;
    }

    setNewMsg("");
  };

  const openAssign = (concern, staffId) => {
    setAssignTarget({ concern, staffId });
    setInstructions("");
  };

  const confirmAssign = () => {
    if (!assignTarget) return;
    const { concern, staffId } = assignTarget;
    const staff = staffList.find(s => s.id === parseInt(staffId));
    onUpdate(concern.id, {
      assignedTo:         staff?.id   || null,
      assignedName:       staff?.name || "",
      status:             staff ? "In Progress" : "Pending",
      adminInstructions:  instructions.trim() || null,
    });
    setAssignTarget(null);
    setInstructions("");
  };

  const activeOnlyConcerns = concerns.filter(c => c.status !== "Resolved");
  const resolvedConcerns = concerns.filter(c => c.status === "Resolved");
  const shownConcerns =
    archiveView === "archived" ? archivedConcerns :
    archiveView === "resolved" ? resolvedConcerns :
    activeOnlyConcerns;

  const handleArchive = (concern) => {
    onUpdate(concern.id, { archived: archiveView === "archived" ? 0 : 1, adminSeen: 1 });
    if (selected?.id === concern.id) onSelect(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const result = await onDelete(deleteTarget.id);
    if (result?.success) {
      toast(`Concern #${deleteTarget.id} deleted.`, "success");
      if (selected?.id === deleteTarget.id) onSelect(null);
      setDeleteTarget(null);
    } else {
      toast(result?.message || "Failed to delete concern.", "error");
    }
  };

  const filtered = shownConcerns.filter(c =>
    (catFilter  === "All" || c.category === catFilter) &&
    (statFilter === "All" || c.status   === statFilter) &&
    (typeFilter === "All" || c.submissionType === typeFilter) &&
    (!showNewOnly || !Number(c.adminSeen)) &&
    (c.subject.toLowerCase().includes(search.toLowerCase()) || c.studentName.toLowerCase().includes(search.toLowerCase()))
  ).sort((a, b) => {
    if (showNewOnly) return Number(a.adminSeen) - Number(b.adminSeen) || b.id - a.id;
    if (archiveView === "resolved") return Number(a.adminResolvedSeen) - Number(b.adminResolvedSeen) || b.id - a.id;
    return b.id - a.id;
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>All Feedbacks and Concerns</h1>
        <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Manage, assign, and track all submitted concerns</p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <div style={{ display: "inline-flex", background: "#e2e8f0", borderRadius: 12, padding: 4 }}>
          {[
            { key: "active", label: `Active (${activeOnlyConcerns.length})` },
            { key: "resolved", label: `Resolved (${resolvedConcerns.length})` },
            { key: "archived", label: `Archived (${archivedConcerns.length})` },
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setArchiveView(item.key)}
              style={{
                padding: "8px 14px", borderRadius: 9, border: "none", cursor: "pointer",
                background: archiveView === item.key ? "white" : "transparent",
                color: archiveView === item.key ? "#0f172a" : "#64748b",
                fontSize: 12, fontWeight: 800,
                boxShadow: archiveView === item.key ? "0 1px 4px rgba(15,23,42,0.12)" : "none",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowNewOnly(v => !v)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "10px 14px", borderRadius: 12, cursor: "pointer",
            border: showNewOnly ? "1px solid #93c5fd" : "1px solid #cbd5e1",
            background: showNewOnly ? "#eff6ff" : "white",
            color: showNewOnly ? "#1d4ed8" : "#475569",
            fontSize: 12, fontWeight: 800,
          }}
        >
          <span style={{
            width: 16, height: 16, borderRadius: 5,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            background: showNewOnly ? "#2563eb" : "transparent",
            border: showNewOnly ? "1px solid #2563eb" : "1px solid #94a3b8",
            color: "white", fontSize: 11, lineHeight: 1,
          }}>{showNewOnly ? "✓" : ""}</span>
          New concerns
        </button>
      </div>

      {/* Filters */}
      <div style={{ background: "white", borderRadius: 16, padding: 16, marginBottom: 16, border: "1px solid #e2e8f0", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }}></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by subject or student…"
            style={{ ...inputStyle, paddingLeft: 32, margin: 0, width: "100%" }} />
        </div>
        <select value={catFilter} onChange={e => setCat(e.target.value)} style={{ ...inputStyle, margin: 0, flex: "0 1 160px" }}>
          <option value="All">All Categories</option>
          <option>Services</option><option>Facilities</option><option>Administrative Concern</option>
        </select>
        <select value={statFilter} onChange={e => setStat(e.target.value)} style={{ ...inputStyle, margin: 0, flex: "0 1 150px" }}>
          <option value="All">All Statuses</option>
          <option>Pending</option><option>In Progress</option><option>Resolved</option>
        </select>
        <select value={typeFilter} onChange={e => setType(e.target.value)} style={{ ...inputStyle, margin: 0, flex: "0 1 140px" }}>
          <option value="All">All Types</option>
          <option value="Concern"> Concern</option>
          <option value="Feedback"> Feedback</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: 16, overflow: "hidden", border: "1px solid #e2e8f0" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1180 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                {["#","Date","Student","Category","Type","Subject","Priority","Status","Assigned To","Actions"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap", ...(h === "Actions" ? { minWidth: 214 } : {}) }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const isNewConcern = !Number(c.adminSeen);
                const isResolvedNotice = c.status === "Resolved" && !Number(c.adminResolvedSeen);
                return (
                <tr key={c.id} className="concern-row" style={{
                  borderBottom: "1px solid #f1f5f9",
                  background: isResolvedNotice ? "#f0fdf4" : isNewConcern ? "#eff6ff" : "white",
                  boxShadow: isResolvedNotice ? "inset 4px 0 0 #22c55e" : isNewConcern ? "inset 4px 0 0 #3b82f6" : "none",
                }}>
                  <td style={{ padding: "10px 12px", fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>#{c.id}</td>
                  <td style={{ padding: "10px 12px", fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>{fmtDate(c.date)}</td>
                  <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{c.studentName}</td>
                  <td style={{ padding: "10px 12px", fontSize: 12 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      {catEmoji[c.category] || "??"} {c.category}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                      whiteSpace: "nowrap",
                      background: c.submissionType === "Feedback" ? "#f0fdf4" : "#fff1f2",
                      color:      c.submissionType === "Feedback" ? "#15803d"  : "#be123c",
                      border:     c.submissionType === "Feedback" ? "1px solid #bbf7d0" : "1px solid #fecdd3",
                    }}>
                      {c.submissionType === "Feedback" ? "" : ""} {c.submissionType || "Concern"}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: 13, color: "#374151", fontWeight: 500, maxWidth: 170 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.subject}</span>
                      {isNewConcern && (
                        <span style={{ padding: "2px 6px", borderRadius: 999, fontSize: 10, fontWeight: 800, color: "#1d4ed8", background: "#dbeafe", flexShrink: 0 }}>New</span>
                      )}
                      {isResolvedNotice && (
                        <span style={{ padding: "2px 6px", borderRadius: 999, fontSize: 10, fontWeight: 800, color: "#15803d", background: "#dcfce7", flexShrink: 0 }}>Resolved</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "10px 12px" }}><Badge text={c.priority} type="priority" /></td>
                  <td style={{ padding: "10px 12px" }}><Badge text={c.status} type="status" /></td>
                  <td style={{ padding: "10px 12px" }}>
                    <select
                      value={c.assignedTo || ""}
                      onChange={e => openAssign(c, e.target.value)}
                      style={{ fontSize: 12, border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "4px 8px", color: "#374151", background: "white", minWidth: 120 }}
                    >
                      <option value="">Unassigned</option>
                      {(() => {
                        const suggestedDept = deptForCategory(c.category);
                        const deptStaff  = suggestedDept ? staffList.filter(s => s.dept === suggestedDept) : [];
                        const otherStaff = staffList.filter(s => s.dept !== suggestedDept);
                        // If there are dept-matched staff, show them first in a group, then others
                        // If no dept-matched staff exist, show all staff
                        if (deptStaff.length === 0) {
                          return staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>);
                        }
                        return (
                          <>
                            <optgroup label={`✓ ${suggestedDept}`}>
                              {deptStaff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </optgroup>
                            {otherStaff.length > 0 && (
                              <optgroup label="Other Staff">
                                {otherStaff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </optgroup>
                            )}
                          </>
                        );
                      })()}
                    </select>
                  </td>
                  <td style={{ padding: "10px 12px", minWidth: 214 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                      <button onClick={() => handleSelect(c)} style={{ padding: "4px 10px", borderRadius: 6, background: "#eff6ff", color: "#3b82f6", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer", transition: "all 0.2s ease" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#dbeafe"}
                        onMouseLeave={e => e.currentTarget.style.background = "#eff6ff"}>
                        View
                      </button>
                      <button onClick={() => handleArchive(c)} style={{ padding: "4px 10px", borderRadius: 6, background: archiveView === "archived" ? "#f0fdf4" : "#fff7ed", color: archiveView === "archived" ? "#15803d" : "#c2410c", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer", transition: "all 0.2s ease" }}>
                        {archiveView === "archived" ? "Restore" : "Archive"}
                      </button>
                      <button onClick={() => setDeleteTarget(c)} style={{ padding: "4px 10px", borderRadius: 6, background: "#fff1f2", color: "#be123c", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer", transition: "all 0.2s ease" }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: "48px 0", textAlign: "center" }}>
              <p style={{ fontSize: 32 }}></p>
              <p style={{ fontSize: 14, color: "#64748b", marginTop: 8 }}>No concerns match your filter</p>
            </div>
          )}
        </div>
      </div>

      {deleteTarget && (
        <Modal title="Delete Concern" onClose={() => setDeleteTarget(null)} size="sm">
          <div style={{ padding: 24 }}>
            <div style={{ padding: 12, borderRadius: 10, background: "#fff1f2", border: "1px solid #fecdd3", marginBottom: 18 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: "#be123c" }}>Delete concern #{deleteTarget.id}?</p>
              <p style={{ fontSize: 12, color: "#7f1d1d", marginTop: 4, lineHeight: 1.5 }}>
                This will remove "{deleteTarget.subject}" and its message history from the system.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={confirmDelete}
                style={{ ...primaryBtn, flex: 1, background: "linear-gradient(135deg, #e11d48, #be123c)" }}
              >
                Delete
              </button>
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary" style={{ ...secondaryBtn, flex: 1 }}>
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Detail Modal */}
      {selected && (
        <Modal title={`Concern #${selected.id} — ${selected.subject}`} onClose={() => { onSelect(null); setNewMsg(""); }} size="lg">
          <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

            {/* ── LEFT: Concern details ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Meta */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><p style={metaLabel}>STUDENT</p><p style={metaValue}>{selected.studentName}</p></div>
                <div><p style={metaLabel}>DATE FILED</p><p style={metaValue}>{selected.date ? new Date(selected.date).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : "—"}</p></div>
                <div><p style={metaLabel}>CATEGORY</p><p style={metaValue}>{catEmoji[selected.category]} {selected.category}</p></div>
                <div><p style={metaLabel}>STATUS</p><div style={{ marginTop: 4 }}><Badge text={selected.status} type="status" /></div></div>
              </div>

              {/* Description */}
              <div style={{ padding: 12, borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <p style={metaLabel}>DESCRIPTION</p>
                <p style={{ fontSize: 12, color: "#374151", lineHeight: 1.6, marginTop: 4, maxHeight: 80, overflowY: "auto" }}>{selected.description}</p>
              </div>

              {/* Attached file */}
              {selected.attachedFileData && (
                <div style={{ padding: 12, borderRadius: 10, background: "#f0f9ff", border: "1px solid #bae6fd" }}>
                  <p style={{ ...metaLabel, color: "#0369a1" }}>ATTACHED FILE</p>
                  <p style={{ fontSize: 11, color: "#0284c7", marginTop: 3, marginBottom: 6 }}>{selected.attachedFileName}</p>
                  {selected.attachedFileType?.startsWith("image/") ? (
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <img src={selected.attachedFileData} alt="Attachment" style={{ maxWidth: "100%", maxHeight: 120, borderRadius: 8, border: "1px solid #e2e8f0", display: "block" }} />
                    </div>
                  ) : (
                    <a href={selected.attachedFileData} download={selected.attachedFileName} style={{ display: "inline-block", padding: "6px 12px", borderRadius: 8, background: "#3b82f6", color: "white", fontSize: 11, fontWeight: 600, textDecoration: "none" }}>
                      Download PDF
                    </a>
                  )}
                </div>
              )}

              {/* Remarks */}
              {selected.remarks && (
                <div style={{ padding: 12, borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                  <p style={{ ...metaLabel, color: "#15803d" }}>STAFF REMARKS</p>
                  <p style={{ fontSize: 12, color: "#166534", lineHeight: 1.6, marginTop: 4 }}>{selected.remarks}</p>
                </div>
              )}

              {/* Update Status */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <label style={labelStyle}>Update Status</label>
                <select
                  value={selected.status}
                  onChange={e => { onUpdate(selected.id, { status: e.target.value }); onSelect({ ...selected, status: e.target.value }); }}
                  style={{ border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "6px 12px", fontSize: 13, color: "#374151" }}
                >
                  <option>Pending</option><option>In Progress</option><option>Resolved</option>
                </select>
              </div>
              <button
                onClick={() => handleArchive(selected)}
                style={{
                  padding: "9px 12px", borderRadius: 10, border: "1px solid #fed7aa",
                  background: archiveView === "archived" ? "#f0fdf4" : "#fff7ed",
                  color: archiveView === "archived" ? "#15803d" : "#c2410c",
                  fontSize: 12, fontWeight: 800, cursor: "pointer",
                }}
              >
                {archiveView === "archived" ? "Restore concern" : "Archive concern"}
              </button>
              <button
                onClick={() => setDeleteTarget(selected)}
                style={{
                  padding: "9px 12px", borderRadius: 10, border: "1px solid #fecdd3",
                  background: "#fff1f2", color: "#be123c",
                  fontSize: 12, fontWeight: 800, cursor: "pointer",
                }}
              >
                Delete concern
              </button>
            </div>

            {/* ── RIGHT: Message thread ── */}
            <div style={{ display: "flex", flexDirection: "column", borderRadius: 12, border: "1px solid #e0f2fe", overflow: "hidden" }}>
              {/* Header */}
              <div style={{ padding: "10px 14px", background: "linear-gradient(135deg, #0ea5e9, #0284c7)", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 14 }}></span>
                <p style={{ fontSize: 13, fontWeight: 700, color: "white" }}>Message Student</p>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", marginLeft: "auto" }}>Student will be notified</span>
              </div>

              {/* Messages */}
              <div style={{ background: "#f8fafc", padding: 12, flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, minHeight: 0 }}>
                {(messages[selected.id] || []).length === 0 ? (
                  <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", padding: "16px 0" }}>No messages yet.</p>
                ) : (messages[selected.id] || []).map(m => {
                  const isAdmin = m.sender_role !== "student";
                  return (
                    <div key={m.id} style={{ alignSelf: isAdmin ? "flex-end" : "flex-start", maxWidth: "85%" }}>
                      <div style={{
                        padding: "7px 11px",
                        borderRadius: isAdmin ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
                        background: isAdmin ? "#0ea5e9" : "white",
                        border: isAdmin ? "none" : "1px solid #e2e8f0",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                      }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: isAdmin ? "rgba(255,255,255,0.75)" : "#94a3b8", marginBottom: 2 }}>
                          {m.sender_name} · {m.sender_role}
                        </p>
                        <p style={{ fontSize: 12, color: isAdmin ? "white" : "#0f172a", lineHeight: 1.5 }}>{m.message}</p>
                      </div>
                      <p style={{ fontSize: 10, color: "#94a3b8", marginTop: 2, textAlign: isAdmin ? "right" : "left", padding: "0 3px" }}>
                        {new Date(m.created_at).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Compose */}
              <div style={{ padding: 10, background: "white", borderTop: "1px solid #e2e8f0", flexShrink: 0 }}>
                {messageError && (
                  <p style={{ fontSize: 11, color: "#be123c", fontWeight: 700, marginBottom: 8 }}>{messageError}</p>
                )}
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <textarea
                  value={newMsg}
                  onChange={e => { setNewMsg(e.target.value); setMessageError(""); }}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMsg(); } }}
                  placeholder="Type a message… (Enter to send)"
                  rows={2}
                  disabled={sendingMsg}
                  style={{
                    flex: 1, padding: "7px 10px", borderRadius: 8,
                    border: "1.5px solid #e2e8f0", fontSize: 12, color: "#0f172a",
                    background: sendingMsg ? "#f1f5f9" : "#f8fafc", resize: "none", lineHeight: 1.5,
                  }}
                />
                <button
                  onClick={handleSendMsg}
                  disabled={!newMsg.trim() || sendingMsg}
                  className="btn-primary"
                  style={{
                    padding: "8px 14px", borderRadius: 8, border: "none",
                    background: newMsg.trim() && !sendingMsg ? "linear-gradient(135deg, #0ea5e9, #0284c7)" : "#e2e8f0",
                    color: newMsg.trim() && !sendingMsg ? "white" : "#94a3b8",
                    fontSize: 12, fontWeight: 700, cursor: newMsg.trim() && !sendingMsg ? "pointer" : "not-allowed",
                    flexShrink: 0,
                  }}
                >
                  Send ➤
                </button>
              </div>
              </div>
            </div>

          </div>
        </Modal>
      )}

      {/* ── Assign with Instructions Modal ── */}
      {assignTarget && (
        <Modal
          title={`Assign to ${staffList.find(s => s.id === parseInt(assignTarget.staffId))?.name || "Staff"}`}
          onClose={() => setAssignTarget(null)}
          size="sm"
        >
          <div style={{ padding: 24 }}>
            {/* Concern info */}
            <div style={{ padding: 12, borderRadius: 10, marginBottom: 16, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Concern</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{assignTarget.concern.subject}</p>
              <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{assignTarget.concern.studentName} · {fmtDate(assignTarget.concern.date)}</p>
            </div>

            {/* Instructions */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>
                Instructions for Staff
                <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 400, marginLeft: 6 }}>(optional)</span>
              </label>
              <textarea
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                rows={4}
                placeholder="e.g. Please contact the student directly and coordinate with the registrar office. Resolve by Friday."
                style={{ ...inputStyle, resize: "none" }}
                autoFocus
              />
              <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                💡 This message will appear as a highlighted notice on the staff's task card.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={confirmAssign}
                className="btn-primary"
                style={{ ...primaryBtn, flex: 1 }}
              >
                ✓ Assign{instructions.trim() ? " with Instructions" : ""}
              </button>
              <button
                onClick={() => setAssignTarget(null)}
                className="btn-secondary"
                style={{ ...secondaryBtn, flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
function RegisterUser({ users, onAdd, onDelete, onUpdate }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student", course: "", dept: "" });
  const [success, setSuccess] = useState("");
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("All");
  const [userCourseFilter, setUserCourseFilter] = useState("All");
  const [userSort, setUserSort] = useState("date_desc");
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setEdit = (k, v) => setEditForm(p => ({ ...p, [k]: v }));

  const handleAdd = async () => {
    if (!form.name || !form.email || !form.password) return toast("Please fill in all required fields.", "warning");
    if (!isValidEmail(form.email)) return toast("Please enter a valid email address (e.g. name@domain.com).", "warning");
    if (users.find(u => u.email === form.email)) return toast("Email already exists.", "error");

    try {
      const res = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name:     form.name,
          email_address: form.email,
          password:      form.password,
          role:          form.role,
          course:        form.role === "student" ? (form.course || null) : null,
          dept:          (form.role === "staff" || form.role === "admin") ? (form.dept || null) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) return toast(data.message || "Registration failed.", "error");

      onAdd(form);
      setSuccess(`${form.name} has been registered as ${form.role}.`);
      setForm({ name: "", email: "", password: "", role: "student", course: "", dept: "" });
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      toast("Could not connect to server. Make sure the backend is running.", "error");
      console.error(err);
    }
  };

  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({ name: u.name, email: u.email, role: u.role, course: u.course || "", dept: u.dept || "", password: "" });
  };

  const handleUpdate = async () => {
    if (!editForm.name || !editForm.email) return toast("Name and email are required.", "warning");
    if (!isValidEmail(editForm.email)) return toast("Please enter a valid email address (e.g. name@domain.com).", "warning");
    const payload = {
      full_name:     editForm.name,
      email_address: editForm.email,
      role:          editForm.role,
      course:        editForm.course || null,
      dept:          editForm.dept   || null,
    };
    if (editForm.password) payload.password = editForm.password;
    await onUpdate(editUser.id, payload);
    setEditUser(null);
  };

  const handleDelete = async (id) => {
    await onDelete(id);
    setConfirmDeleteId(null);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>Register Users</h1>
        <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Add student, staff, or admin accounts to the system</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* ── Registration Form ── */}
        <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>New Account</h3>
          {success && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, marginBottom: 16, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              <span>[✓]</span>
              <p style={{ fontSize: 13, color: "#15803d", fontWeight: 600 }}>{success}</p>
            </div>
          )}
          {[
            { key: "role", label: "Role *", type: "select", options: [["student","Student"],["staff","Staff"],["admin","Admin"]] },
            { key: "name", label: "Full Name *",       type: "text",     placeholder: "e.g. Raizabel Lau" },
            { key: "email", label: "Email Address *",  type: "email",    placeholder: "gmail@com" },
            { key: "password", label: "Password *",    type: "password", placeholder: "Set a secure password" },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 12 }}>
              <label style={labelStyle}>{f.label}</label>
              {f.type === "select" ? (
                <select value={form[f.key]} onChange={e => set(f.key, e.target.value)} style={inputStyle}>
                  {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              ) : (
                <input type={f.type} value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} style={inputStyle} />
              )}
            </div>
          ))}
          {form.role === "student" && (
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Course</label>
              <input type="text" value={form.course} onChange={e => set("course", e.target.value)} placeholder="e.g. BSIT, BSN" style={inputStyle} />
            </div>
          )}
          {(form.role === "staff" || form.role === "admin") && (
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Department</label>
              <select value={form.dept} onChange={e => set("dept", e.target.value)} style={inputStyle}>
                <option value="">— Select Department —</option>
                {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
          )}
          <button onClick={handleAdd} className="btn-primary" style={{ ...primaryBtn, width: "100%", marginTop: 8 }}>Register Account</button>
        </div>

        {/* ── Registered Users List ── */}
        <div style={{ background: "white", borderRadius: 16, overflow: "hidden", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column" }}>
          {/* Header + search/filter toolbar */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                Registered Users
                <span style={{ marginLeft: 8, padding: "2px 8px", borderRadius: 999, background: "#f1f5f9", color: "#64748b", fontSize: 12, fontWeight: 600 }}>
                  {(() => {
                    const s = userSearch.toLowerCase();
                    return users.filter(u => {
                      if (userRoleFilter !== "All" && u.role !== userRoleFilter) return false;
                      if (userCourseFilter !== "All") {
                        if (u.role === "staff") { if ((u.dept || "") !== userCourseFilter) return false; }
                        else { if ((u.course || "") !== userCourseFilter) return false; }
                      }
                      if (s && !u.name?.toLowerCase().includes(s) && !u.email?.toLowerCase().includes(s) &&
                          !(u.course || "").toLowerCase().includes(s) && !(u.dept || "").toLowerCase().includes(s)) return false;
                      return true;
                    }).length;
                  })()}
                </span>
              </h3>
            </div>

            {/* Search */}
            <div style={{ position: "relative", marginBottom: 8 }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 13, pointerEvents: "none" }}>🔍</span>
              <input
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Search by name, email or course…"
                style={{ ...inputStyle, paddingLeft: 32, margin: 0 }}
              />
            </div>

            {/* Filters + Sort row */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {/* Role filter */}
              <select value={userRoleFilter} onChange={e => { setUserRoleFilter(e.target.value); setUserCourseFilter("All"); }}
                style={{ ...inputStyle, margin: 0, flex: "1 1 100px", fontSize: 12 }}>
                <option value="All">All Roles</option>
                <option value="student">Student</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>

              {/* Course / Department filter — adapts based on selected role */}
              {userRoleFilter === "staff" ? (
                <select value={userCourseFilter} onChange={e => setUserCourseFilter(e.target.value)}
                  style={{ ...inputStyle, margin: 0, flex: "1 1 160px", fontSize: 12 }}>
                  <option value="All">All Departments</option>
                  {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              ) : userRoleFilter === "admin" ? null : (
                <select value={userCourseFilter} onChange={e => setUserCourseFilter(e.target.value)}
                  style={{ ...inputStyle, margin: 0, flex: "1 1 100px", fontSize: 12 }}>
                  <option value="All">All Courses</option>
                  {[...new Set(users.filter(u => u.course).map(u => u.course))].sort().map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}

              {/* Sort */}
              <select value={userSort} onChange={e => setUserSort(e.target.value)}
                style={{ ...inputStyle, margin: 0, flex: "1 1 120px", fontSize: 12 }}>
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="name_asc">Name A → Z</option>
                <option value="name_desc">Name Z → A</option>
              </select>
            </div>
          </div>

          {/* User rows */}
          <div style={{ overflowY: "auto", maxHeight: 420 }}>
            {(() => {
              const s = userSearch.toLowerCase();
              let list = users.filter(u => {
                // Role filter
                if (userRoleFilter !== "All" && u.role !== userRoleFilter) return false;
                // Course/Dept filter
                if (userCourseFilter !== "All") {
                  if (u.role === "staff") {
                    if ((u.dept || "") !== userCourseFilter) return false;
                  } else {
                    if ((u.course || "") !== userCourseFilter) return false;
                  }
                }
                // Search
                if (s && !u.name?.toLowerCase().includes(s) && !u.email?.toLowerCase().includes(s) &&
                    !(u.course || "").toLowerCase().includes(s) && !(u.dept || "").toLowerCase().includes(s)) return false;
                return true;
              });
              if (userSort === "name_asc")  list = [...list].sort((a, b) => a.name?.localeCompare(b.name));
              if (userSort === "name_desc") list = [...list].sort((a, b) => b.name?.localeCompare(a.name));
              if (userSort === "date_asc")  list = [...list].reverse();
              // date_desc is default (already ordered by id DESC from backend)

              if (list.length === 0) return (
                <div style={{ padding: "40px 0", textAlign: "center" }}>
                  <p style={{ fontSize: 28, marginBottom: 8 }}>🔍</p>
                  <p style={{ fontSize: 13, color: "#94a3b8" }}>No users match your filters</p>
                </div>
              );

              return list.map(u => {
                const roleBg    = u.role === "admin" ? "#dbeafe" : u.role === "staff" ? "#dcfce7" : "#fef3c7";
                const roleColor = u.role === "admin" ? "#1d4ed8" : u.role === "staff" ? "#15803d" : "#92400e";
                return (
                  <div key={u.id} className="concern-row" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>
                    {/* Avatar */}
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: roleBg, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 700, color: roleColor }}>
                      {u.name?.charAt(0).toUpperCase()}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{u.name}</p>
                        {u.course && <span style={{ fontSize: 10, color: "#64748b", background: "#f1f5f9", padding: "1px 6px", borderRadius: 999 }}>{u.course}</span>}
                        {u.dept && <span style={{ fontSize: 10, color: "#0369a1", background: "#e0f2fe", padding: "1px 6px", borderRadius: 999 }}>{u.dept}</span>}
                      </div>
                      <p style={{ fontSize: 11, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</p>
                    </div>
                    {/* Role badge */}
                    <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: "uppercase", background: roleBg, color: roleColor, flexShrink: 0 }}>
                      {u.role}
                    </span>
                    {/* Edit */}
                    <button onClick={() => openEdit(u)} title="Edit user"
                      style={{ padding: "4px 10px", borderRadius: 6, background: "#eff6ff", color: "#3b82f6", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer", flexShrink: 0 }}
                      onMouseEnter={e => e.currentTarget.style.background = "#dbeafe"}
                      onMouseLeave={e => e.currentTarget.style.background = "#eff6ff"}>
                      Edit
                    </button>
                    {/* Delete */}
                    <button onClick={() => setConfirmDeleteId(u.id)} title="Delete user"
                      style={{ padding: "4px 10px", borderRadius: 6, background: "#fff1f2", color: "#e11d48", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer", flexShrink: 0 }}
                      onMouseEnter={e => e.currentTarget.style.background = "#fecdd3"}
                      onMouseLeave={e => e.currentTarget.style.background = "#fff1f2"}>
                      Delete
                    </button>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* ── Edit User Modal ── */}
      {editUser && (
        <Modal title={`Edit User — ${editUser.name}`} onClose={() => setEditUser(null)} size="sm">
          <div style={{ padding: 24 }}>
            {[
              { key: "name",  label: "Full Name *",      type: "text",     placeholder: "Full name" },
              { key: "email", label: "Email Address *",  type: "email",    placeholder: "email@example.com" },
              { key: "password", label: "New Password",  type: "password", placeholder: "Leave blank to keep current" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={labelStyle}>{f.label}</label>
                <input type={f.type} value={editForm[f.key] || ""} onChange={e => setEdit(f.key, e.target.value)} placeholder={f.placeholder} style={inputStyle} />
              </div>
            ))}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Role *</label>
              <select value={editForm.role} onChange={e => setEdit("role", e.target.value)} style={inputStyle}>
                <option value="student">Student</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {editForm.role === "student" && (
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Course</label>
                <input type="text" value={editForm.course || ""} onChange={e => setEdit("course", e.target.value)} placeholder="e.g. BSIT" style={inputStyle} />
              </div>
            )}
            {(editForm.role === "staff" || editForm.role === "admin") && (
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Department</label>
                <select value={editForm.dept || ""} onChange={e => setEdit("dept", e.target.value)} style={inputStyle}>
                  <option value="">— Select Department —</option>
                  {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={handleUpdate} className="btn-primary" style={{ ...primaryBtn, flex: 1 }}>Save Changes</button>
              <button onClick={() => setEditUser(null)} className="btn-secondary" style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "white", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Confirm Delete Modal ── */}
      {confirmDeleteId && (
        <Modal title="Confirm Delete" onClose={() => setConfirmDeleteId(null)} size="sm">
          <div style={{ padding: 24 }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>Delete this user?</p>
              <p style={{ fontSize: 13, color: "#64748b" }}>This action cannot be undone. The user will be permanently removed from the system.</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #f43f5e, #e11d48)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="btn-secondary"
                style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "white", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── REPORTS ─────────────────────────────────────────────────
function Reports({ concerns }) {
  const [range,     setRange] = useState("monthly");
  const [catFilter, setCat]   = useState("All");
  const now = new Date();

  const filterByDate = (c) => {
    const d = new Date(c.date);
    if (range === "daily")   return d.toDateString() === now.toDateString();
    if (range === "weekly")  return (now - d) <= 7 * 86400000;
    if (range === "monthly") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return true;
  };

  const filtered = concerns.filter(c => filterByDate(c) && (catFilter === "All" || c.category === catFilter));
  const pending  = filtered.filter(c => c.status === "Pending").length;
  const inProg   = filtered.filter(c => c.status === "In Progress").length;
  const resolved = filtered.filter(c => c.status === "Resolved").length;

  return (
    <div>
      {/* Toolbar */}
      <div className="no-print" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>Reports</h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Generate and print concern summary reports</p>
        </div>
        <button onClick={() => window.print()} className="btn-primary" style={{ ...primaryBtn, transition: "all 0.2s ease" }} onMouseEnter={e => e.currentTarget.style.background = "linear-gradient(135deg, #0d9488, #059669)"} onMouseLeave={e => e.currentTarget.style.background = "linear-gradient(135deg, #0ea5e9, #0284c7)"}>Print Report</button>
      </div>

      {/* Filters */}
      <div className="no-print" style={{ background: "white", borderRadius: 16, padding: 16, marginBottom: 16, border: "1px solid #e2e8f0", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Time Range</p>
          <div style={{ display: "flex", gap: 6 }}>
            {["daily","weekly","monthly"].map(r => (
              <button key={r} onClick={() => setRange(r)} style={{
                padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                background: range === r ? "#0ea5e9" : "#f1f5f9",
                color: range === r ? "white" : "#64748b",
                fontWeight: 600, fontSize: 12, textTransform: "capitalize",
              }}>{r}</button>
            ))}
          </div>
        </div>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Category</p>
          <select value={catFilter} onChange={e => setCat(e.target.value)}
            style={{ border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: "#374151" }}>
            <option value="All">All Categories</option>
            <option>Services</option><option>Facilities</option><option>Administrative Concern</option>
          </select>
        </div>
      </div>

      {/* Printable report */}
      <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0" }}>
        <div style={{ textAlign: "center", marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid #f1f5f9" }}>
          <p style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>POLYTECHNIC COLLEGE — MacArthur Highway, Barangay Kiagot, Digos City</p>
          <p style={{ fontSize: 14, color: "#64748b" }}>Student Feedback and Concern Management System</p>
          <p style={{ fontSize: 13, color: "#0ea5e9", fontWeight: 600, marginTop: 4 }}>
            {range.toUpperCase()} REPORT — {catFilter === "All" ? "ALL CATEGORIES" : catFilter.toUpperCase()}
          </p>
          <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
            Generated: {now.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total", value: filtered.length, color: "#3b82f6" },
            { label: "Pending",     value: pending,         color: "#f59e0b" },
            { label: "In Progress", value: inProg,          color: "#0ea5e9" },
            { label: "Resolved",    value: resolved,        color: "#10b981" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center", padding: 16, borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <p style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</p>
              <p style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["#","Date","Student","Category","Subject","Status","Priority","Assigned To"].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "8px 12px", fontSize: 11, color: "#94a3b8" }}>#{c.id}</td>
                  <td style={{ padding: "8px 12px", fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>{fmtDate(c.date)}</td>
                  <td style={{ padding: "8px 12px", fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{c.studentName}</td>
                  <td style={{ padding: "8px 12px", fontSize: 11 }}>{c.category}</td>
                  <td style={{ padding: "8px 12px", fontSize: 12, color: "#374151" }}>{c.subject}</td>
                  <td style={{ padding: "8px 12px" }}><Badge text={c.status}   type="status"   /></td>
                  <td style={{ padding: "8px 12px" }}><Badge text={c.priority} type="priority" /></td>
                  <td style={{ padding: "8px 12px", fontSize: 11, color: "#64748b" }}>{c.assignedName || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p style={{ padding: "32px 0", textAlign: "center", fontSize: 13, color: "#94a3b8" }}>No concerns found for this period</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STAFF DASHBOARD
// ═══════════════════════════════════════════════════════════
function StaffDashboard({ user, concerns, onUpdateConcern, onLogout }) {
  const [page,     setPage]     = useState("home");
  const [selected, setSelected] = useState(null);
  const assigned = concerns.filter(c => c.assignedTo === user.id);
  const handleStaffUpdate = (id, updates) => {
    onUpdateConcern(id, {
      ...updates,
      ...(updates.status === "Resolved" ? { adminResolvedSeen: 0 } : {}),
    });
  };

  const navItems = [
    { key: "home",  icon: <ImgIcon src={dashboardIcon} alt="Dashboard" size={22} white />, label: "Dashboard"         },
    { key: "tasks", icon: <ImgIcon src={feedbackIcon} alt="Tasks" size={22} white />, label: "My Assigned Tasks"   },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#f8fafc" }}>
      <Sidebar navItems={navItems} active={page} onNav={p => { setPage(p); setSelected(null); }} onLogout={onLogout} user={user} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar
          title={navItems.find(n => n.key === page)?.label || "Staff"}
          subtitle="Staff Portal — Polytechnic College"
          user={user}
        />
        <main style={{ flex: 1, overflowY: "auto" }}>
          <div className="fade-in" style={{ padding: 24, maxWidth: 860, margin: "0 auto" }}>
            {page === "home"  && <StaffHome  user={user} assigned={assigned} onNav={setPage} />}
            {page === "tasks" && <StaffTasks assigned={assigned} selected={selected} onSelect={setSelected} onUpdate={handleStaffUpdate} />}
          </div>
        </main>
      </div>
    </div>
  );
}

function StaffHome({ user, assigned, onNav }) {
  const inProg   = assigned.filter(c => c.status === "In Progress").length;
  const resolved = assigned.filter(c => c.status === "Resolved").length;

  return (
    <div>
      {/* Banner */}
      <div style={{
        background: "linear-gradient(135deg, #1e3a5f 0%, #1e2d4a 100%)",
        borderRadius: 20, padding: "24px 28px", marginBottom: 24,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 4px 20px rgba(30,58,95,0.25)",
      }}>
        <div>
          <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 4 }}>Staff Portal</p>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "white", letterSpacing: "-0.02em" }}>
            Hello, {user.name.split(" ")[0]}!
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{user.dept || "Student Affairs"}</p>
        </div>
        <div style={{ fontSize: 48, opacity: 0.6 }}>👤</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard icon="✎" label="Total Assigned" value={assigned.length} color="blue"    />
        <StatCard icon="⟳" label="In Progress"     value={inProg}          color="sky"     />
        <StatCard icon="✔" label="Resolved"          value={resolved}        color="emerald" />
      </div>

      <div style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Assigned to Me</h3>
          <button onClick={() => onNav("tasks")} style={{ fontSize: 12, color: "#0ea5e9", fontWeight: 600, background: "none", border: "none", cursor: "pointer", transition: "all 0.2s ease" }} onMouseEnter={e => e.currentTarget.style.color = "#0284c7"} onMouseLeave={e => e.currentTarget.style.color = "#0ea5e9"}>View all [→]</button>
        </div>
        {assigned.length === 0 ? (
          <div style={{ padding: "48px 0", textAlign: "center" }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}></p>
            <p style={{ fontSize: 14, color: "#64748b" }}>No concerns assigned to you yet</p>
          </div>
        ) : assigned.slice(0, 5).map(c => (
          <div key={c.id} className="concern-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #f1f5f9", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{catEmoji[c.category] || "??"}</span>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.subject}</p>
                <p style={{ fontSize: 11, color: "#94a3b8" }}>{c.anonymous ? "Anonymous" : c.studentName} · {fmtDate(c.date)}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <Badge text={c.priority} type="priority" />
              <Badge text={c.status}   type="status"   />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StaffTasks({ assigned, selected, onSelect, onUpdate }) {
  const [remarks, setRemarks] = useState("");
  const [status,  setStatus]  = useState("");

  const openDetail = (c) => { onSelect(c); setRemarks(c.remarks); setStatus(c.status); };
  const handleSave = () => {
    if (!selected) return;
    onUpdate(selected.id, { status, remarks });
    onSelect({ ...selected, status, remarks });
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>My Assigned Tasks</h1>
        <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Update status and add resolution remarks</p>
      </div>

      {assigned.length === 0 ? (
        <div style={{ background: "white", borderRadius: 16, padding: "64px 0", textAlign: "center", border: "1px solid #e2e8f0" }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}></p>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>No tasks assigned</p>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>You'll see concerns assigned to you here</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {assigned.map(c => (
            <div key={c.id} className="card-hover" style={{ background: "white", borderRadius: 16, padding: 20, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12, gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>[{c.category.charAt(0)}]</span>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{c.subject}</h3>
                    <Badge text={c.priority} type="priority" />
                  </div>
                  <p style={{ fontSize: 12, color: "#94a3b8" }}>{c.studentName} · Filed {fmtDate(c.date)}</p>
                </div>
                <Badge text={c.status} type="status" />
              </div>

              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12, lineHeight: 1.6 }}>{c.description}</p>

              {/* Admin instructions — highlighted notice */}
              {c.adminInstructions && (
                <div style={{
                  padding: "12px 14px", borderRadius: 10, marginBottom: 12,
                  background: "linear-gradient(135deg, #fffbeb, #fef9c3)",
                  border: "1px solid #fde68a",
                  display: "flex", gap: 10, alignItems: "flex-start",
                }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>📌</span>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 800, color: "#b45309", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
                      Instructions from Admin
                    </p>
                    <p style={{ fontSize: 13, color: "#78350f", lineHeight: 1.6 }}>{c.adminInstructions}</p>
                  </div>
                </div>
              )}

              {c.remarks && (
                <div style={{ padding: 12, borderRadius: 10, marginBottom: 12, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#15803d" }}>Your Remarks</p>
                  <p style={{ fontSize: 12, color: "#166534", marginTop: 2 }}>{c.remarks}</p>
                </div>
              )}

              <button onClick={() => openDetail(c)} style={{ padding: "8px 16px", borderRadius: 10, background: "#eff6ff", color: "#3b82f6", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", transition: "all 0.2s ease" }} onMouseEnter={e => { e.currentTarget.style.background = "#dbeafe"; }} onMouseLeave={e => { e.currentTarget.style.background = "#eff6ff"; }}>
                Update Status & Remarks
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Update Modal */}
      {selected && (
        <Modal title={`Update — ${selected.subject}`} onClose={() => onSelect(null)} size="md">
          <div style={{ padding: 24 }}>
            <div style={{ padding: 12, borderRadius: 10, marginBottom: 16, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>{selected.description}</p>
            </div>
            {selected.adminInstructions && (
              <div style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 16, background: "#fffbeb", border: "1px solid #fde68a", display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>📌</span>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 800, color: "#b45309", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Admin Instructions</p>
                  <p style={{ fontSize: 12, color: "#78350f", lineHeight: 1.5 }}>{selected.adminInstructions}</p>
                </div>
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Update Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
                <option>Pending</option><option>In Progress</option><option>Resolved</option>
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Remarks / Resolution Notes</label>
              <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={4}
                placeholder="Describe the steps taken or resolution provided…"
                style={{ ...inputStyle, resize: "none" }} />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={handleSave} className="btn-primary" style={{ ...primaryBtn, background: "linear-gradient(135deg, #10b981, #059669)", transition: "all 0.2s ease" }} onMouseEnter={e => e.currentTarget.style.background = "linear-gradient(135deg, #059669, #047857)"} onMouseLeave={e => e.currentTarget.style.background = "linear-gradient(135deg, #10b981, #059669)"}>[✓] Save Update</button>
              <button onClick={() => onSelect(null)} className="btn-secondary" style={secondaryBtn}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SHARED STYLE TOKENS
// ═══════════════════════════════════════════════════════════
const labelStyle = {
  fontSize: 12, fontWeight: 600, color: "#374151",
  display: "block", marginBottom: 6,
};

const inputStyle = {
  width: "100%", padding: "10px 12px",
  borderRadius: 10, border: "1.5px solid #e2e8f0",
  fontSize: 13, color: "#0f172a", background: "#f8fafc",
  marginBottom: 0,
};

const primaryBtn = {
  padding: "10px 20px", borderRadius: 10, border: "none", cursor: "pointer",
  background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
  color: "white", fontSize: 13, fontWeight: 700,
};

const secondaryBtn = {
  padding: "10px 20px", borderRadius: 10, cursor: "pointer",
  background: "white", border: "1px solid #e2e8f0",
  fontSize: 13, fontWeight: 600, color: "#64748b",
};

const metaLabel = {
  fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em",
};

const metaValue = {
  fontSize: 14, fontWeight: 600, color: "#0f172a", marginTop: 2,
};

// ═══════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════
export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}

function AppInner() {
  const toast = useToast();
  const [currentUser, setCurrentUser] = useState(null);
  const [page,        setPage]        = useState("landing"); // "landing" | "login"
  const [users,       setUsers]       = useState([]);
  const [concerns,    setConcerns]    = useState([]);
  const [messages,    setMessages]    = useState({}); // { [concernId]: [...msgs] }
  const [loginError,  setLoginError]  = useState("");
  const visibleConcerns = concerns.filter(c => !Number(c.archived));

  // Fetch users from database
  const loadUsers = async () => {
    try {
      const res = await fetch("/users");
      if (res.ok) setUsers(await res.json());
    } catch (err) { console.error("Failed to load users:", err); }
  };

  // Fetch concerns from database
  const loadConcerns = async () => {
    try {
      const res = await fetch("/concerns");
      if (res.ok) setConcerns(await res.json());
    } catch (err) { console.error("Failed to load concerns:", err); }
  };

  const handleLogin = async (email, password, role) => {
    try {
      const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_address: email, password, role }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data);
        setLoginError("");
        setPage("login"); // ensure we're on login page after successful login
        // Load data after login
        await loadConcerns();
        if (data.role === "admin" || data.role === "staff") await loadUsers();
        return "success";
      } else {
        setLoginError(data.message || "Invalid credentials.");
        // Return a signal if user not found
        if (res.status === 401 && data.message?.includes("Invalid credentials")) {
          return "not_found";
        }
        return "error";
      }
    } catch {
      setLoginError("Cannot connect to server. Make sure the backend is running.");
      return "error";
    }
  };

  const handleLogout = () => setCurrentUser(null);

  // Save concern to DB then refresh
  const addConcern = async (c) => {
    try {
      const res = await fetch("/concerns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(c),
      });
      if (res.ok) {
        await loadConcerns();
        return { success: true };
      } else {
        const data = await res.json().catch(() => ({}));
        if (res.status === 429) {
          return { success: false, limitReached: true, message: data.message };
        }
        toast(data.message || `Failed to submit concern (${res.status}). Please try again.`, "error");
        return { success: false };
      }
    } catch (err) {
      console.error("Failed to save concern:", err);
      toast("Could not connect to server. Make sure the backend is running.", "error");
      return { success: false };
    }
  };

  // Update concern in DB then refresh
  const updateConcern = async (id, updates) => {
    // Optimistic local update
    setConcerns(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    try {
      await fetch(`/concerns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (err) { console.error("Failed to update concern:", err); }
  };

  const deleteConcern = async (id) => {
    const previousConcerns = concerns;
    setConcerns(prev => prev.filter(c => c.id !== id));
    setMessages(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    try {
      const res = await fetch(`/concerns/${id}`, { method: "DELETE" });
      if (res.ok) return { success: true };
      const data = await res.json().catch(() => ({}));
      setConcerns(previousConcerns);
      return { success: false, message: data.message || "Failed to delete concern." };
    } catch (err) {
      console.error("Failed to delete concern:", err);
      setConcerns(previousConcerns);
      return { success: false, message: "Could not connect to server. Make sure the backend is running." };
    }
  };

  // Load messages for a concern
  const loadMessages = async (concernId) => {
    try {
      const res = await fetch(`/concerns/${concernId}/messages`);
      if (res.ok) {
        const msgs = await res.json();
        setMessages(prev => ({ ...prev, [concernId]: msgs }));
      }
    } catch (err) { console.error("Failed to load messages:", err); }
  };

  // Send a message on a concern
  const sendMessage = async (concernId, senderName, senderRole, message) => {
    try {
      const res = await fetch(`/concerns/${concernId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderName, senderRole, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        await loadMessages(concernId);
        return { success: true };
      }
      toast(data.message || "Failed to send message.", "error");
      return { success: false, message: data.message || "Failed to send message." };
    } catch (err) {
      console.error("Failed to send message:", err);
      return { success: false, message: "Could not connect to server." };
    }
  };

  // Refresh user list after adding a new user
  const addUser = async (u) => {
    setUsers(prev => [...prev, { ...u, id: prev.length + 1 }]);
    await loadUsers();
  };

  // Delete a user from DB then refresh
  const deleteUser = async (id) => {
    try {
      const res = await fetch(`/users/${id}`, { method: "DELETE" });
      if (res.ok) await loadUsers();
      else {
        const data = await res.json();
        toast(data.message || "Failed to delete user.", "error");
      }
    } catch (err) { console.error("Failed to delete user:", err); }
  };

  // Update a user in DB then refresh
  const updateUser = async (id, updates) => {
    try {
      const res = await fetch(`/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (res.ok) await loadUsers();
      else toast(data.message || "Failed to update user.", "error");
    } catch (err) { console.error("Failed to update user:", err); }
  };

  return (
    <>
      <GlobalStyles />
      {!currentUser && page === "landing" && <LandingPage onGetStarted={() => setPage("login")} />}
      {!currentUser && page === "login"   && <LoginPage onLogin={handleLogin} error={loginError} onBack={() => setPage("landing")} />}
      {currentUser?.role === "student" && <StudentDashboard user={currentUser} concerns={visibleConcerns} onAddConcern={addConcern} onLogout={() => { handleLogout(); setPage("landing"); }} messages={messages} onLoadMessages={loadMessages} />}
      {currentUser?.role === "admin"   && <AdminDashboard   user={currentUser} concerns={concerns} users={users} onUpdateConcern={updateConcern} onDeleteConcern={deleteConcern} onAddUser={addUser} onDeleteUser={deleteUser} onUpdateUser={updateUser} onLogout={() => { handleLogout(); setPage("landing"); }} messages={messages} onLoadMessages={loadMessages} onSendMessage={sendMessage} />}
      {currentUser?.role === "staff"   && <StaffDashboard   user={currentUser} concerns={visibleConcerns} onUpdateConcern={updateConcern} onLogout={() => { handleLogout(); setPage("landing"); }} messages={messages} onLoadMessages={loadMessages} onSendMessage={sendMessage} />}
    </>
  );
}
