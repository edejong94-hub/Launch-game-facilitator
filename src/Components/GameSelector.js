import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import './GameSelector.css';

const GameSelector = ({ onSelectGame, currentGameId }) => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGameName, setNewGameName] = useState('');
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
    if (!newGameName.trim()) return;

    try {
      setCreating(true);
      const docRef = await addDoc(collection(db, 'games'), {
        name: newGameName.trim(),
        createdAt: serverTimestamp(),
        currentRound: 1,
        status: 'active',
      });

      // Add to local list
      setGames(prev => [{
        id: docRef.id,
        name: newGameName.trim(),
        createdAt: new Date(),
        currentRound: 1,
        status: 'active',
      }, ...prev]);

      // Select the new game
      onSelectGame(docRef.id, newGameName.trim());

      // Reset form
      setNewGameName('');
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
            <button type="submit" disabled={!newGameName.trim() || creating}>
              {creating ? 'Creating...' : 'Create Game'}
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
            {games.map(game => (
              <div
                key={game.id}
                className={`game-card ${currentGameId === game.id ? 'selected' : ''}`}
                onClick={() => onSelectGame(game.id, game.name)}
              >
                <div className="game-card-header">
                  <h3>{game.name || 'Unnamed Game'}</h3>
                  <span
                    className="game-status"
                    style={{ backgroundColor: getStatusColor(game.status) }}
                  >
                    {game.status || 'active'}
                  </span>
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
            ))}
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
