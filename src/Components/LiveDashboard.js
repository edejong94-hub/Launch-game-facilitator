import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import './LiveDashboard.css';

// Get gameId from URL
const getGameId = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('gameId') || 'demo-game';
};

// Get game mode from URL
const getGameMode = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('mode') || 'research';
};

const LiveDashboard = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const gameId = getGameId();
  const isResearchMode = getGameMode() === 'research';

  // Subscribe to teams with their latest round data
  useEffect(() => {
    const teamsRef = collection(db, 'games', gameId, 'teams');

    const unsubscribe = onSnapshot(teamsRef, async (snapshot) => {
      // Get all teams with their latest round data
      const teamsPromises = snapshot.docs.map(async (teamDoc) => {
        const teamData = teamDoc.data();

        // Get latest round from rounds subcollection
        const roundsRef = collection(db, 'games', gameId, 'teams', teamDoc.id, 'rounds');

        return new Promise((resolve) => {
          const unsubRounds = onSnapshot(roundsRef, (roundsSnapshot) => {
            let latestRound = null;
            let latestRoundNum = 0;

            // Find the latest round
            roundsSnapshot.docs.forEach((roundDoc) => {
              const roundData = roundDoc.data();
              const roundNum = roundData.round || parseInt(roundDoc.id) || 0;
              if (roundNum >= latestRoundNum) {
                latestRoundNum = roundNum;
                latestRound = roundData;
              }
            });

            // Build complete team object
            const team = {
              id: teamDoc.id,
              ...teamData,
              latestRound: latestRound || {},
              currentRound: teamData.currentRound || latestRoundNum || 1,
            };

            unsubRounds();
            resolve(team);
          }, (error) => {
            console.error('Error fetching rounds for team', teamDoc.id, error);
            resolve({
              id: teamDoc.id,
              ...teamData,
              latestRound: {},
            });
          });
        });
      });

      try {
        const teamsData = await Promise.all(teamsPromises);
        const validTeams = teamsData.filter(team => team.teamName);
        setTeams(validTeams);
        setLastUpdate(new Date());
        setLoading(false);
      } catch (error) {
        console.error('Error processing teams:', error);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [gameId]);

  // Calculate score - using same data source as display
  const calculateScore = (team) => {
    // Get data from latestRound.progress (same as display)
    const latestRound = team.latestRound || {};
    const roundProgress = latestRound.progress || {};

    const cash = roundProgress.cash ?? team.cash ?? 5000;
    const trl = roundProgress.trl ?? team.trl ?? 3;
    const validations = roundProgress.validations ?? team.validationCount ?? 0;
    const interviews = roundProgress.interviews ?? team.interviewCount ?? 0;
    const founderEquity = roundProgress.founderEquity ?? 100;
    const round = latestRound.round ?? team.currentRound ?? 1;

    let score = 0;

    // Financial (max 25)
    if (cash >= 50000) score += 25;
    else if (cash >= 25000) score += 18;
    else if (cash >= 10000) score += 12;
    else if (cash >= 0) score += 5;
    else score += 0;

    // TRL (max 25)
    score += Math.min(25, (trl - 3) * 4);

    // Validation (max 25)
    score += Math.min(15, validations * 8);
    score += Math.min(10, interviews * 2);

    // Equity (max 10)
    if (founderEquity > 70) score += 10;
    else if (founderEquity > 50) score += 6;
    else score += 2;

    // Round bonus (max 15)
    score += Math.min(15, (round - 1) * 3);

    return Math.round(score);
  };

  // Sort and rank teams
  const rankedTeams = [...teams]
    .map(team => ({ ...team, score: calculateScore(team) }))
    .sort((a, b) => b.score - a.score);

  // Get display values
  const getTeamData = (team) => {
    const progress = team.progress || {};
    const latestRound = team.latestRound || {};
    const roundProgress = latestRound.progress || {};

    return {
      cash: roundProgress.cash ?? progress.cash ?? team.cash ?? 5000,
      trl: roundProgress.trl ?? progress.currentTRL ?? team.trl ?? 3,
      validations: roundProgress.validations ?? progress.validationsTotal ?? team.validationCount ?? 0,
      interviews: roundProgress.interviews ?? progress.interviewsTotal ?? team.interviewCount ?? 0,
      round: latestRound.round ?? team.currentRound ?? team.round ?? 1,
      employmentStatus: team.employmentStatus ?? 'university',
    };
  };

  const getEmploymentIcon = (status) => {
    switch (status) {
      case 'university': return '🏛️';
      case 'parttime': return '⚖️';
      case 'fulltime': return '🚀';
      default: return '👤';
    }
  };

  if (loading) {
    return (
      <div className="live-dashboard-v2 loading">
        <div className="loader">
          <div className="loader-ring"></div>
          <span>Connecting...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="live-dashboard-v2">
      {/* Ambient Background */}
      <div className="ambient-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      {/* Header */}
      <header className="live-header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">🚀</span>
            <div className="logo-text">
              <h1>Launch Game</h1>
              <span className="edition">{isResearchMode ? 'Research Edition' : 'Startup Edition'}</span>
            </div>
          </div>
        </div>

        <div className="header-center">
          <div className="live-badge">
            <span className="live-dot"></span>
            <span className="live-text">LIVE</span>
          </div>
        </div>

        <div className="header-right">
          <div className="stats-mini">
            <div className="stat-mini">
              <span className="stat-mini-value">{teams.length}</span>
              <span className="stat-mini-label">Teams</span>
            </div>
            <div className="stat-mini">
              <span className="stat-mini-value">R{Math.max(...rankedTeams.map(t => getTeamData(t).round), 1)}</span>
              <span className="stat-mini-label">Round</span>
            </div>
          </div>
          <div className="update-time">
            {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </header>

      {/* Main Scoreboard */}
      <main className="scoreboard-container">
        {rankedTeams.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h2>Waiting for teams...</h2>
            <p>Teams will appear here when they submit their first round</p>
            <div className="game-id-display">
              Game ID: <code>{gameId}</code>
            </div>
          </div>
        ) : (
          <div className="teams-scoreboard">
            {rankedTeams.map((team, index) => {
              const data = getTeamData(team);
              const isTop3 = index < 3;

              return (
                <div
                  key={team.id}
                  className={`team-row ${index === 0 ? 'gold' : ''} ${index === 1 ? 'silver' : ''} ${index === 2 ? 'bronze' : ''}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Rank */}
                  <div className="team-rank">
                    {index === 0 && <span className="rank-medal">🥇</span>}
                    {index === 1 && <span className="rank-medal">🥈</span>}
                    {index === 2 && <span className="rank-medal">🥉</span>}
                    {index > 2 && <span className="rank-number">{index + 1}</span>}
                  </div>

                  {/* Team Info */}
                  <div className="team-info">
                    <div className="team-name">{team.teamName}</div>
                    <div className="team-meta">
                      <span className="employment-badge">
                        {getEmploymentIcon(data.employmentStatus)}
                      </span>
                      <span className="round-badge">Round {data.round}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="team-stats">
                    <div className={`stat ${data.cash < 0 ? 'negative' : data.cash > 30000 ? 'positive' : ''}`}>
                      <span className="stat-icon">💰</span>
                      <span className="stat-value">€{(data.cash / 1000).toFixed(0)}k</span>
                    </div>

                    {isResearchMode && (
                      <div className={`stat ${data.trl >= 6 ? 'positive' : ''}`}>
                        <span className="stat-icon">🔬</span>
                        <span className="stat-value">TRL {data.trl}</span>
                      </div>
                    )}

                    <div className={`stat ${data.validations >= 1 ? 'positive' : ''}`}>
                      <span className="stat-icon">✓</span>
                      <span className="stat-value">{data.validations}</span>
                    </div>

                    <div className="stat">
                      <span className="stat-icon">🎯</span>
                      <span className="stat-value">{data.interviews}</span>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="team-score">
                    <span className="score-value">{team.score}</span>
                    <span className="score-label">pts</span>
                  </div>

                  {/* Rank Bar (visual indicator) */}
                  {isTop3 && (
                    <div
                      className="rank-bar"
                      style={{ width: `${(team.score / Math.max(...rankedTeams.map(t => t.score), 1)) * 100}%` }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="live-footer">
        <div className="footer-left">
          <span className="game-id">Game: {gameId}</span>
        </div>
        <div className="footer-center">
          <span className="branding">Founded • Entrepreneurship Education</span>
        </div>
        <div className="footer-right">
          <span className="team-count">{teams.length} team{teams.length !== 1 ? 's' : ''} competing</span>
        </div>
      </footer>
    </div>
  );
};

export default LiveDashboard;
