import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { rankTeams, getPerformanceCategory } from '../config/scoring-config';
import './FacilitatorScoring.css';

const FacilitatorScoring = ({ gameSession, gameMode }) => {
  const [teams, setTeams] = useState([]);
  const [rankedTeams, setRankedTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [viewMode, setViewMode] = useState('rankings');
  const [loading, setLoading] = useState(true);

  // Real-time listener for teams - FIXED: correct path games/{gameId}/teams
  useEffect(() => {
    if (!gameSession) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Correct path: games/{gameId}/teams
    const teamsRef = collection(db, 'games', gameSession, 'teams');

    const unsubscribe = onSnapshot(teamsRef, async (snapshot) => {
      const teamsPromises = snapshot.docs.map(async (teamDoc) => {
        const teamData = teamDoc.data();
        
        // Get latest round data for this team
        const roundsRef = collection(db, 'games', gameSession, 'teams', teamDoc.id, 'rounds');
        
        return new Promise((resolve) => {
          const unsubRounds = onSnapshot(roundsRef, (roundsSnapshot) => {
            let latestRound = null;
            let latestRoundNum = 0;

            roundsSnapshot.docs.forEach((roundDoc) => {
              const roundData = roundDoc.data();
              const roundNum = roundData.round || parseInt(roundDoc.id) || 0;
              if (roundNum >= latestRoundNum) {
                latestRoundNum = roundNum;
                latestRound = roundData;
              }
            });

            // Build team object with data from both team doc and latest round
            const team = {
              id: teamDoc.id,
              oderId: teamData.oderId,
              teamName: teamData.teamName || 'Unknown Team',
              currentRound: teamData.currentRound || latestRoundNum || 1,
              gameMode: teamData.gameMode || gameMode,
              startupIdea: teamData.startupIdea,
              teamProfiles: teamData.teamProfiles,
              licenceAgreement: teamData.licenceAgreement,
              founderProfiles: teamData.teamProfiles, // Alias for scoring-config
              universityLicence: teamData.licenceAgreement, // Alias for scoring-config
            };

            if (latestRound) {
              // Map round data to expected field names for scoring-config
              team.cash = latestRound.progress?.cash ?? latestRound.cash ?? 5000;
              team.trl = latestRound.progress?.currentTRL ?? latestRound.trl ?? 3;
              team.developmentHours = latestRound.progress?.developmentHours ?? 0;
              team.customersAcquired = latestRound.progress?.validationsTotal ?? latestRound.validationCount ?? 0;
              team.interviews = latestRound.progress?.interviewsTotal ?? latestRound.interviewCount ?? 0;
              team.equityRetained = 100 - (latestRound.progress?.investorEquity ?? latestRound.funding?.investorEquity ?? 0);
              team.completedActivities = latestRound.completedActivities || [];
              team.investorAppeal = latestRound.progress?.investorAppeal ?? 2;
              team.bankTrust = latestRound.progress?.bankTrust ?? 2;
              team.legalForm = latestRound.legalForm;
              team.legalForms = latestRound.legalForm ? [latestRound.legalForm] : [];
              team.employees = latestRound.employees ?? 0;
              team.patents = latestRound.completedActivities?.includes('patentApplication') ? 1 : 0;
              team.provisionalPatents = latestRound.completedActivities?.includes('patentSearch') ? 1 : 0;
              team.inIncubator = latestRound.completedActivities?.includes('incubatorApplication') || false;
              team.grantsReceived = latestRound.funding?.subsidy > 0 ? 1 : 0;
              team.pilotPrograms = latestRound.progress?.validationsTotal ?? 0;
              team.revenue = latestRound.funding?.revenue ?? latestRound.progress?.revenue ?? 0;
              team.employmentStatus = teamData.employmentStatus || latestRound.employmentStatus || 'university';
              // Additional fields for achievement conditions
              team.hiredProfiles = teamData.hiredProfiles || [];
              team.wentNegative = teamData.wentNegative || latestRound.progress?.wentNegative || false;
              team.leftUniversityRound = teamData.leftUniversityRound ?? null;
              team.totalInvestment = teamData.totalInvestment ?? latestRound.progress?.totalInvestment ?? 0;
              team.totalRevenue = teamData.totalRevenue ?? latestRound.progress?.totalRevenue ?? team.revenue ?? 0;
              team.totalStickersUsed = teamData.totalStickersUsed ?? latestRound.progress?.totalStickersUsed ?? 0;
              team.pivotCount = teamData.pivotCount ?? 0;
              team.maxSpendInRound = latestRound.progress?.maxSpendInRound ?? latestRound.maxSpendInRound ?? 0;
              team.loanInterest = latestRound.funding?.loanInterest ?? 0;
            }

            unsubRounds(); // Unsubscribe after getting data
            resolve(team);
          }, (error) => {
            console.error('Error fetching rounds:', error);
            resolve({
              id: teamDoc.id,
              teamName: teamData.teamName || 'Unknown Team',
              currentRound: 1,
              cash: 5000,
              trl: 3,
            });
          });
        });
      });

      try {
        const teamsData = await Promise.all(teamsPromises);
        
        // Filter by game mode if specified
        const filteredTeams = gameMode && gameMode !== 'all' 
          ? teamsData.filter(t => t.gameMode === gameMode || !t.gameMode)
          : teamsData;

        setTeams(filteredTeams);
        
        // Use the scoring config to rank teams
        const ranked = rankTeams(filteredTeams);
        setRankedTeams(ranked);
      } catch (err) {
        console.error('Error processing teams:', err);
      }
      
      setLoading(false);
    }, (error) => {
      console.error('Firebase error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [gameSession, gameMode]);

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const formatCurrency = (amount) => {
    return `€${(amount || 0).toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="facilitator-scoring dark-theme">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading team rankings...</p>
        </div>
      </div>
    );
  }

  const renderRankingsView = () => (
    <div className="rankings-view">
      <div className="rankings-header">
        <h2>Live Team Rankings</h2>
        <div className="header-controls">
          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
          <span className="team-count">{rankedTeams.length} teams</span>
        </div>
      </div>

      {rankedTeams.length === 0 ? (
        <div className="empty-state">
          <p>No teams have submitted rounds yet.</p>
          <p className="hint">Teams will appear here once they submit their first round.</p>
        </div>
      ) : (
        <div className="rankings-grid">
          {rankedTeams.map((team) => {
            const scoreData = team.scoreData;
            const performance = getPerformanceCategory(scoreData?.totalScore || 0);
            return (
              <div
                key={team.id}
                className={`team-card rank-${team.rank}`}
                onClick={() => {
                  setSelectedTeam(team);
                  setViewMode('details');
                }}
              >
                <div className="team-card-header">
                  <div className="rank-display">
                    <span className="rank-icon">{getRankIcon(team.rank)}</span>
                  </div>
                  <div className="team-info">
                    <h3>{team.teamName}</h3>
                    <span className="team-round">Round {team.currentRound || 1}</span>
                  </div>
                  <div
                    className="score-badge"
                    style={{ background: performance.color }}
                  >
                    {scoreData?.totalScore || 0}
                  </div>
                </div>

                <div className="team-card-body">
                  <div className="quick-stats">
                    <div className="stat-item">
                      <span className="stat-label">Cash</span>
                      <span className="stat-value">{formatCurrency(team.cash)}</span>
                    </div>

                    <div className="stat-item">
                      <span className="stat-label">TRL</span>
                      <span className="stat-value">{team.trl || 0}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Validations</span>
                      <span className="stat-value">{team.customersAcquired || 0}</span>
                    </div>

                    <div className="stat-item">
                      <span className="stat-label">Equity</span>
                      <span className="stat-value">{team.equityRetained || 100}%</span>
                    </div>
                  </div>

                  <div className="performance-indicator">
                    <span
                      className="performance-label"
                      style={{ color: performance.color }}
                    >
                      {performance.level}
                    </span>
                  </div>
                </div>

                {scoreData?.achievements?.length > 0 && (
                  <div className="bonuses-preview">
                    <span className="bonus-icon">🏆</span>
                    <span className="bonus-text">
                      {scoreData.achievements.length} achievement{scoreData.achievements.length > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderDetailsView = () => {
    if (!selectedTeam) {
      return (
        <div className="no-selection">
          <p>Select a team from the rankings to view details</p>
          <button onClick={() => setViewMode('rankings')}>Back to Rankings</button>
        </div>
      );
    }

    const scoreData = selectedTeam.scoreData;
    const performance = getPerformanceCategory(scoreData?.totalScore || 0);
    const isResearch = selectedTeam.gameMode === 'research' || gameMode === 'research';

    return (
      <div className="details-view">
        <div className="details-header">
          <button
            className="back-button"
            onClick={() => {
              setSelectedTeam(null);
              setViewMode('rankings');
            }}
          >
            ← Back
          </button>
          <h2>{selectedTeam.teamName}</h2>
          <div className="team-rank-badge">Rank {getRankIcon(selectedTeam.rank)}</div>
        </div>

        <div className="score-overview">
          <div className="main-score-display">
            <div className="score-number" style={{ color: performance.color }}>
              {scoreData?.totalScore || 0}
            </div>
            <div className="score-breakdown">
              <span>Base: {scoreData?.baseScore || 0}</span>
              {scoreData?.bonusPoints !== 0 && scoreData?.bonusPoints !== undefined && (
                <span className={scoreData.bonusPoints > 0 ? 'bonus' : 'penalty'}>
                  {scoreData.bonusPoints > 0 ? '+' : ''}{scoreData.bonusPoints} achievements
                </span>
              )}
            </div>
          </div>

          <div className="performance-display" style={{ background: performance.color }}>
            <div className="performance-level">{performance.level}</div>
            <div className="performance-desc">{performance.description}</div>
          </div>
        </div>

        <div className="metrics-detailed">
          <h3>Metric Breakdown</h3>
          {scoreData?.categoryScores?.map(category => (
            <div key={category.id}>
              <div className="category-header">
                <span>{category.icon} {category.name}</span>
                <span className="category-score">{category.score.toFixed(1)} / {category.maxPoints}</span>
              </div>
              {category.metrics?.map(metric => (
                <div key={metric.id} className="metric-row">
                  <div className="metric-info-detailed">
                    <span className="metric-name-detailed">{metric.name}</span>
                    <span className="metric-value-detailed">{metric.format ? metric.format(metric.value) : metric.value}</span>
                  </div>
                  <div className="metric-score-bar">
                    <div className="score-bar-bg">
                      <div
                        className="score-bar-fill"
                        style={{ width: `${Math.min(100, metric.percentage)}%` }}
                      ></div>
                    </div>
                    <span className="score-text">
                      {Math.round(metric.percentage)}%
                    </span>
                  </div>
                  <div className="metric-contribution">
                    +{metric.score.toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {scoreData?.achievements?.length > 0 && (
          <div className="bonuses-detailed">
            <h3>Achievements</h3>
            <div className="bonuses-list">
              {scoreData.achievements.map((a, index) => (
                <div key={index} className={`bonus-item${a.points < 0 ? ' penalty' : ''}`}>
                  <span className="bonus-check">{a.points >= 0 ? '✓' : '✗'}</span>
                  <div className="bonus-info">
                    <span className="bonus-name">{a.name}</span>
                    <span className="bonus-desc">{a.description}</span>
                  </div>
                  <span className="bonus-points">{a.points > 0 ? '+' : ''}{a.points}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isResearch && (
          <div className="research-details">
            <h3>Research Mode Details</h3>
            <div className="research-grid">
              <div className="research-item">
                <span className="research-label">Licence Agreement</span>
                <span className="research-value">
                  {selectedTeam.licenceAgreement || 'Not selected'}
                </span>
              </div>
              <div className="research-item">
                <span className="research-label">Team Profiles</span>
                <span className="research-value">
                  {selectedTeam.teamProfiles?.filter(p => p).join(', ') || 'Not set'}
                </span>
              </div>
              <div className="research-item">
                <span className="research-label">Incubator Status</span>
                <span className="research-value">
                  {selectedTeam.inIncubator ? 'Accepted ✓' : 'Not in incubator'}
                </span>
              </div>
              <div className="research-item">
                <span className="research-label">Grants Received</span>
                <span className="research-value">
                  {selectedTeam.grantsReceived || 0}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="startup-idea">
          <h3>Startup Idea</h3>
          <div className="idea-grid">
            <div className="idea-item">
              <span className="idea-label">Technology</span>
              <span className="idea-value">
                {selectedTeam.startupIdea?.technique || '-'}
              </span>
            </div>
            <div className="idea-item">
              <span className="idea-label">Product</span>
              <span className="idea-value">
                {selectedTeam.startupIdea?.productIdea || '-'}
              </span>
            </div>
            <div className="idea-item">
              <span className="idea-label">Problem</span>
              <span className="idea-value">
                {selectedTeam.startupIdea?.problem || '-'}
              </span>
            </div>
            <div className="idea-item">
              <span className="idea-label">Target Market</span>
              <span className="idea-value">
                {selectedTeam.startupIdea?.segment || '-'}
              </span>
            </div>
          </div>
        </div>

        <div className="activity-summary">
          <h3>Progress Overview</h3>
          <div className="progress-stats">
            <div className="progress-item">
              <span className="progress-number">
                {selectedTeam.completedActivities?.length || 0}
              </span>
              <span className="progress-label">Activities Completed</span>
            </div>
            <div className="progress-item">
              <span className="progress-number">
                {selectedTeam.currentRound || 1}
              </span>
              <span className="progress-label">Current Round</span>
            </div>
            <div className="progress-item">
              <span className="progress-number">
                {selectedTeam.interviews || 0}
              </span>
              <span className="progress-label">Interviews Done</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="facilitator-scoring dark-theme">
      <div className="view-tabs">
        <button
          className={viewMode === 'rankings' ? 'active' : ''}
          onClick={() => setViewMode('rankings')}
        >
          Rankings
        </button>
        <button
          className={viewMode === 'details' ? 'active' : ''}
          onClick={() => setViewMode('details')}
          disabled={!selectedTeam}
        >
          Team Details
        </button>
      </div>

      <div className="view-content">
        {viewMode === 'rankings' ? renderRankingsView() : renderDetailsView()}
      </div>
    </div>
  );
};

export default FacilitatorScoring;