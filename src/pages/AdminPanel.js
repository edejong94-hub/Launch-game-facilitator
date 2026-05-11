import React, { useState } from "react";
import { Settings, Plus, CheckCircle, Copy } from "lucide-react";
import { createGame } from "../hooks/useReviews";

export function AdminPanel({ gameId, gameName, gameMode, onGameChange }) {
  const [newGameName, setNewGameName] = useState("");
  const [newGameMode, setNewGameMode] = useState(null); // null = not yet chosen
  const [creating, setCreating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [urlCopySuccess, setUrlCopySuccess] = useState(false);

  const handleCreateGame = async () => {
    if (!newGameName.trim() || !newGameMode) return;

    setCreating(true);
    try {
      const id = await createGame(newGameName.trim(), newGameMode);
      const name = newGameName.trim();
      setNewGameName("");
      setNewGameMode(null);
      onGameChange?.(id, name, newGameMode);
    } catch (err) {
      console.error("Error creating game:", err);
      alert("Failed to create game");
    }
    setCreating(false);
  };

  const handleCopyGameId = () => {
    if (!gameId) return;
    navigator.clipboard.writeText(gameId);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(studentAppUrl);
    setUrlCopySuccess(true);
    setTimeout(() => setUrlCopySuccess(false), 2000);
  };

  // URL uses the game's stored mode (from prop), not a local switch
  const studentAppUrl = `https://launchgame.netlify.app/?gameId=${gameId}&mode=${gameMode || 'research'}`;

  return (
    <div className="admin-panel">
      <div className="page-header">
        <div>
          <h1>
            <Settings size={24} /> Admin Panel
          </h1>
          <p className="text-muted">Game management and utilities</p>
        </div>
      </div>

      <section className="admin-section">
        <h2>Current Game</h2>
        <div className="info-card">
          <div className="info-row">
            <span className="info-label">Game ID</span>
            <div className="info-value-group">
              <code className="game-id">
                {gameId || "No game selected"}
              </code>
              {gameId && (
                <button
                  className="btn btn-icon btn-sm"
                  onClick={handleCopyGameId}
                  title="Copy Game ID"
                >
                  {copySuccess ? (
                    <CheckCircle size={16} />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              )}
            </div>
          </div>
          <div className="info-row">
            <span className="info-label">Game Mode</span>
            <div className="info-value-group">
              <span style={{
                padding: '4px 12px',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '13px',
                backgroundColor: gameMode === 'startup' ? 'rgba(124,58,237,0.15)' : 'rgba(3,105,161,0.15)',
                color: gameMode === 'startup' ? '#a78bfa' : '#38bdf8',
                border: `1px solid ${gameMode === 'startup' ? 'rgba(124,58,237,0.3)' : 'rgba(3,105,161,0.3)'}`,
              }}>
                {gameMode === 'startup' ? '🚀 Startup Mode' : '🔬 Research Mode'}
              </span>
              <span style={{ fontSize: '11px', color: '#6b7280', marginLeft: '6px' }}>locked at creation</span>
            </div>
          </div>
          <div className="info-row">
            <span className="info-label">Student App URL</span>
            <div className="info-value-group">
              <code className="url">{studentAppUrl}</code>
              <button
                className="btn btn-icon btn-sm"
                onClick={handleCopyUrl}
                title="Copy URL"
              >
                {urlCopySuccess ? (
                  <CheckCircle size={16} />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-section">
        <h2>
          <Plus size={20} /> Create New Game
        </h2>
        <p className="text-muted">
          Start a fresh game session for a new class or event.
        </p>

        <div className="create-game-form">
          <input
            type="text"
            className="form-input"
            placeholder="Game name (e.g., Spring 2025 - Class A)"
            value={newGameName}
            onChange={(e) => setNewGameName(e.target.value)}
          />

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            {[
              { value: 'research', icon: '🔬', label: 'Research Game', sub: 'TRL · TTO · Patents' },
              { value: 'startup',  icon: '🚀', label: 'Startup Game',  sub: 'Customer Dev · Pivots' },
            ].map(opt => {
              const selected = newGameMode === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setNewGameMode(opt.value)}
                  style={{
                    flex: 1,
                    padding: '14px 12px',
                    borderRadius: '10px',
                    border: selected
                      ? `2px solid ${opt.value === 'startup' ? '#7c3aed' : '#0369a1'}`
                      : '2px solid rgba(255,255,255,0.08)',
                    background: selected
                      ? opt.value === 'startup' ? 'rgba(124,58,237,0.18)' : 'rgba(3,105,161,0.18)'
                      : 'rgba(255,255,255,0.04)',
                    color: selected
                      ? opt.value === 'startup' ? '#c4b5fd' : '#7dd3fc'
                      : '#9ca3af',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>{opt.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{opt.label}</div>
                  <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>{opt.sub}</div>
                </button>
              );
            })}
          </div>

          <button
            className="btn btn-primary"
            onClick={handleCreateGame}
            disabled={creating || !newGameName.trim() || !newGameMode}
            style={{ marginTop: '12px', width: '100%' }}
          >
            {creating ? "Creating..." : newGameMode
              ? `Create ${newGameMode === 'research' ? 'Research' : 'Startup'} Game`
              : "Select a game type above"}
          </button>
        </div>
      </section>
    </div>
  );
}