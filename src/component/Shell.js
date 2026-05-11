import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Gamepad2,
  BarChart3,
} from "lucide-react";

export function Shell({ children, user, onLogout, onBackToGames, gameMode }) {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/teams", icon: Users, label: "All Teams" },
    { path: "/analytics", icon: BarChart3, label: "Analytics" },
    { path: "/admin", icon: Settings, label: "Admin" },
  ];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <Gamepad2 size={24} />
          </div>
          <div className="brand">
            <h1>Launch Game</h1>
            <p>Facilitator</p>
            {gameMode && (
              <span style={{
                display: 'inline-block',
                marginTop: '4px',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: gameMode === 'startup' ? '#7c3aed' : '#0369a1',
                color: '#fff',
              }}>
                {gameMode === 'startup' ? '🚀 Startup' : '🔬 Research'}
              </span>
            )}
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${
                location.pathname === item.path ? "active" : ""
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          {onBackToGames && (
            <button onClick={onBackToGames} className="back-to-games-btn">
              ← All Games
            </button>
          )}
          {user && (
            <div className="user-info">
              <div className="user-avatar">
                {user.email?.[0]?.toUpperCase() || "F"}
              </div>
              <div className="user-details">
                <p className="user-name">{user.email}</p>
                <button onClick={onLogout} className="logout-btn">
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}
