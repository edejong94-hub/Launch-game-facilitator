import React, { useState } from "react";
import { Settings, Plus, CheckCircle, Copy } from "lucide-react";
import { createGame } from "../hooks/useReviews";

export function AdminPanel({ gameId, gameName, onGameChange }) {
  const [newGameName, setNewGameName] = useState("");
  const [gameMode, setGameMode] = useState("research"); // Default to research mode
  const [creating, setCreating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [urlCopySuccess, setUrlCopySuccess] = useState(false);

  const handleCreateGame = async () => {
    if (!newGameName.trim()) return;

    setCreating(true);
    try {
      const id = await createGame(newGameName.trim(), gameMode);
      const gameName = newGameName.trim();
      alert(`Game created!\nID: ${id}\nMode: ${gameMode}`);
      setNewGameName("");
      // Pass both the ID and name to update the selected game
      onGameChange?.(id, gameName);
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

  const studentAppUrl = `https://launchgame.netlify.app/?gameId=${gameId}&mode=${gameMode}`;

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
              <select
                className="form-select"
                value={gameMode}
                onChange={(e) => setGameMode(e.target.value)}
              >
                <option value="research">🔬 Research Mode (TTO, Patents, TRL)</option>
                <option value="startup">🚀 Startup Mode (General Startups)</option>
              </select>
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
          <select
            className="form-select"
            value={gameMode}
            onChange={(e) => setGameMode(e.target.value)}
            style={{ marginTop: '8px' }}
          >
            <option value="research">🔬 Research Mode (TTO, Patents, TRL)</option>
            <option value="startup">🚀 Startup Mode (General Startups)</option>
          </select>
          <button
            className="btn btn-primary"
            onClick={handleCreateGame}
            disabled={creating || !newGameName.trim()}
            style={{ marginTop: '8px' }}
          >
            {creating ? "Creating..." : `Create ${gameMode === 'research' ? 'Research' : 'Startup'} Game`}
          </button>
        </div>
      </section>
    </div>
  );
}