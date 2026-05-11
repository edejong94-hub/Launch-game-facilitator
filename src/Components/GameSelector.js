import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { createGame } from '../hooks/useReviews';
import './GameSelector.css';

const GameSelector = ({ onSelectGame, currentGameId }) => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [newGameMode, setNewGameMode] = useState(null);
  const [creating, setCreating] = useState(false);

  // Load all games from Firebase
  useEffect(() => {
    const loadGames = async () => {
      try {
        setLoading(true);
        const gamesQuery = query(collection(db, 'games'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(gamesQuery);

        const gamesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        }));

        setGames(gamesList);
        setError(null);
      } catch (err) {
        console.error('Error loading games:', err);
        setError('Failed to load games. Check your connection.');
      } finally {
        setLoading(false);
      }
    };

    loadGames();
  }, []);

  // Create a new game
  const handleCreateGame = async (e) => {
    e.preventDefault();
    if (!newGameName.trim() || !newGameMode) return;

    try {
      setCreating(true);
      const id = await createGame(newGameName.trim(), newGameMode);

      // Add to local list
      setGames(prev => [{
        id,
        name: newGameName.trim(),
        gameMode: newGameMode,
        createdAt: new Date(),
        currentRound: 1,
        status: 'active',
      }, ...prev]);

      // Select the new game with its locked mode
      onSelectGame(id, newGameName.trim(), newGameMode);

      // Reset form
      setNewGameName('');
      setNewGameMode(null);
      setShowCreateForm(false);
    } catch (err) {
      console.error('Error creating game:', err);
      setError('Failed to create game. Try again.');
    } finally {
      setCreating(false);
    }
  };

  // Format date nicely
  const formatDate = (date) => {
    if (!date) return 'Unknown';
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#22c55e';
      case 'completed': return '#6366f1';
      case 'archived': return '#64748b';
      default: return '#f59e0b';
    }
  };

  if (loading) {
    return (
      <div className="game-selector">
        <div className="game-selector-loading">
          <div className="loading-spinner"></div>
          <p>Loading games...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="game-selector">
      <div className="game-selector-header">
        <div className="header-content">
          <h1>🎮 Launch Game</h1>
          <p className="header-subtitle">Facilitator Dashboard</p>
        </div>
        <button
          className="create-game-btn"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? '✕ Cancel' : '+ New Game'}
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Create Game Form */}
      {showCreateForm && (
        <form className="create-game-form" onSubmit={handleCreateGame}>
          <h3>Create New Game Session</h3>

          <div className="form-row">
            <input
              type="text"
              value={newGameName}
              onChange={(e) => setNewGameName(e.target.value)}
              placeholder="Game name (e.g., Workshop Dec 17)"
              autoFocus
              disabled={creating}
            />
          </div>

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
                  disabled={creating}
                  style={{
                    flex: 1,
                    padding: '14px 12px',
                    borderRadius: '10px',
                    border: selected
                      ? `2px solid ${opt.value === 'startup' ? '#7c3aed' : '#0369a1'}`
                      : '2px solid rgba(245,158,11,0.15)',
                    background: selected
                      ? opt.value === 'startup' ? 'rgba(124,58,237,0.2)' : 'rgba(3,105,161,0.2)'
                      : 'rgba(0,0,0,0.25)',
                    color: selected
                      ? opt.value === 'startup' ? '#c4b5fd' : '#7dd3fc'
                      : '#9ca3af',
                    cursor: creating ? 'not-allowed' : 'pointer',
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

          <div style={{ marginTop: '12px' }}>
            <button
              type="submit"
              disabled={!newGameName.trim() || !newGameMode || creating}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: newGameName.trim() && newGameMode
                  ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                  : 'rgba(255,255,255,0.08)',
                color: newGameName.trim() && newGameMode ? '#1a0800' : '#6b7280',
                fontWeight: 700,
                fontSize: '15px',
                cursor: newGameName.trim() && newGameMode ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s ease',
              }}
            >
              {creating ? 'Creating...' : newGameMode
                ? `Create ${newGameMode === 'research' ? 'Research' : 'Startup'} Game`
                : 'Select a game type above'}
            </button>
          </div>
        </form>
      )}

      {/* Games List */}
      <div className="games-section">
        <h2>Select a Game</h2>

        {games.length === 0 ? (
          <div className="no-games">
            <span className="no-games-icon">📋</span>
            <p>No games found</p>
            <p className="hint">Create your first game to get started!</p>
          </div>
        ) : (
          <div className="games-grid">
            {games.map(game => {
              const modeLabel = game.gameMode === 'startup' ? '🚀 Startup' : game.gameMode === 'research' ? '🔬 Research' : null;
              return (
                <div
                  key={game.id}
                  className={`game-card ${currentGameId === game.id ? 'selected' : ''}`}
                  onClick={() => onSelectGame(game.id, game.name, game.gameMode || null)}
                >
                  <div className="game-card-header">
                    <h3>{game.name || 'Unnamed Game'}</h3>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {modeLabel && (
                        <span
                          className="game-mode-badge"
                          style={{
                            backgroundColor: game.gameMode === 'startup' ? '#7c3aed' : '#0369a1',
                            color: '#fff',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          {modeLabel}
                        </span>
                      )}
                      <span
                        className="game-status"
                        style={{ backgroundColor: getStatusColor(game.status) }}
                      >
                        {game.status || 'active'}
                      </span>
                    </div>
                  </div>

                  <div className="game-card-details">
                    <div className="detail-row">
                      <span className="detail-label">Game ID:</span>
                      <code className="detail-value">{game.id.slice(0, 12)}...</code>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Created:</span>
                      <span className="detail-value">{formatDate(game.createdAt)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Current Round:</span>
                      <span className="detail-value">{game.currentRound || 1}</span>
                    </div>
                  </div>

                  {currentGameId === game.id && (
                    <div className="selected-badge">✓ Currently Selected</div>
                  )}

                  <button className="open-game-btn">
                    Open Dashboard →
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Access */}
      {games.length > 0 && (
        <div className="quick-access">
          <h3>Quick Access by Game ID</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            const input = e.target.elements.gameId.value.trim();
            if (input) {
              onSelectGame(input, null);
            }
          }}>
            <input
              type="text"
              name="gameId"
              placeholder="Paste game ID here..."
            />
            <button type="submit">Go</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default GameSelector;
