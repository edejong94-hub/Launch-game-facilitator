import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell,
  ComposedChart, Area
} from 'recharts';
import {
  BarChart3, TrendingUp, Users, DollarSign, Clock, AlertTriangle,
  Search, Plus, X, Download, Share2, RefreshCw, ChevronDown
} from 'lucide-react';
import './Analytics.css';

// Color palette for teams/games
const COLORS = [
  '#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4',
  '#ec4899', '#14b8a6', '#f97316', '#84cc16', '#a855f7', '#0ea5e9'
];

const FUNDING_COLORS = {
  investment: '#ef4444',
  loan: '#f59e0b',
  revenue: '#22c55e',
  subsidy: '#3b82f6'
};

// Maps activity IDs (stored in completedActivities) to their expert adviser category
const ACTIVITY_EXPERT_MAP = {
  ttoDiscussion:        'TTO Officer',
  licenceNegotiation:   'TTO Officer',
  patentFiling:         'Patent Attorney',
  knowHowProtection:    'Patent Attorney',
  patentAnalysis:       'Patent Attorney',
  grantTakeoff:         'Grant Advisor',
  grantWBSO:            'Grant Advisor',
  grantRegional:        'Grant Advisor',
  subsidyApplication:   'Grant Advisor',
  incubatorApplication: 'Incubator',
  investorMeeting:      'VC / Investor',
  customerInterview:    'Customer Expert',
  customerInterviews:   'Customer Expert',
  customerValidation:   'Customer Expert',
  industryPartner:      'Industry Partner',
  bankMeeting:          'Bank / Loan Officer',
  bankLoan:             'Bank / Loan Officer',
};

const EXPERT_COLORS = {
  'TTO Officer':       '#8b5cf6',
  'Patent Attorney':   '#6366f1',
  'Grant Advisor':     '#3b82f6',
  'Incubator':         '#06b6d4',
  'VC / Investor':     '#ef4444',
  'Customer Expert':   '#22c55e',
  'Industry Partner':  '#f97316',
  'Bank / Loan Officer': '#f59e0b',
};

export function Analytics() {
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [allGames, setAllGames] = useState([]);
  const [selectedGameIds, setSelectedGameIds] = useState([]);
  const [gamesData, setGamesData] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingGames, setLoadingGames] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGameSelector, setShowGameSelector] = useState(false);

  // Parse URL params on mount
  useEffect(() => {
    const gameParam = searchParams.get('game');
    const gamesParam = searchParams.get('games');

    if (gameParam) {
      setSelectedGameIds([gameParam]);
    } else if (gamesParam) {
      setSelectedGameIds(gamesParam.split(',').filter(Boolean));
    }
  }, [searchParams]);

  // Fetch all games list
  useEffect(() => {
    async function fetchGames() {
      try {
        const gamesRef = collection(db, 'games');
        const snapshot = await getDocs(gamesRef);
        const games = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAllGames(games.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB - dateA;
        }));
      } catch (error) {
        console.error('Error fetching games:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchGames();
  }, []);

  // Fetch detailed data for selected games
  useEffect(() => {
    async function fetchGameData() {
      if (selectedGameIds.length === 0) {
        setGamesData({});
        return;
      }

      setLoadingGames(true);
      const newData = { ...gamesData };

      for (const gameId of selectedGameIds) {
        // Skip if already fetched
        if (newData[gameId]) continue;

        try {
          // Fetch teams
          const teamsRef = collection(db, 'games', gameId, 'teams');
          const teamsSnapshot = await getDocs(teamsRef);

          const teams = [];
          for (const teamDoc of teamsSnapshot.docs) {
            const teamData = { id: teamDoc.id, ...teamDoc.data() };

            // Fetch rounds for each team
            const roundsRef = collection(db, 'games', gameId, 'teams', teamDoc.id, 'rounds');
            const roundsQuery = query(roundsRef, orderBy('round', 'asc'));
            const roundsSnapshot = await getDocs(roundsQuery);

            teamData.rounds = roundsSnapshot.docs.map(roundDoc => ({
              id: roundDoc.id,
              ...roundDoc.data()
            }));

            teams.push(teamData);
          }

          // Get game metadata
          const gameInfo = allGames.find(g => g.id === gameId) || { id: gameId, name: gameId };

          newData[gameId] = {
            ...gameInfo,
            teams
          };
        } catch (error) {
          console.error(`Error fetching data for game ${gameId}:`, error);
        }
      }

      setGamesData(newData);
      setLoadingGames(false);
    }

    if (selectedGameIds.length > 0 && allGames.length > 0) {
      fetchGameData();
    }
  }, [selectedGameIds, allGames]);

  // Update URL when selection changes
  const updateUrlParams = useCallback((gameIds) => {
    if (gameIds.length === 0) {
      setSearchParams({});
    } else if (gameIds.length === 1) {
      setSearchParams({ game: gameIds[0] });
    } else {
      setSearchParams({ games: gameIds.join(',') });
    }
  }, [setSearchParams]);

  // Handle game selection
  const toggleGame = (gameId) => {
    const newSelection = selectedGameIds.includes(gameId)
      ? selectedGameIds.filter(id => id !== gameId)
      : [...selectedGameIds, gameId];

    setSelectedGameIds(newSelection);
    updateUrlParams(newSelection);
  };

  const removeGame = (gameId) => {
    const newSelection = selectedGameIds.filter(id => id !== gameId);
    setSelectedGameIds(newSelection);
    updateUrlParams(newSelection);
  };

  const clearAllGames = () => {
    setSelectedGameIds([]);
    updateUrlParams([]);
  };

  // Filtered games for search
  const filteredGames = useMemo(() => {
    if (!searchQuery) return allGames;
    const query = searchQuery.toLowerCase();
    return allGames.filter(game =>
      game.name?.toLowerCase().includes(query) ||
      game.id?.toLowerCase().includes(query)
    );
  }, [allGames, searchQuery]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const data = {
      financialJourney: [],
      fundingStrategy: [],
      teamGrowth: [],
      roundProgression: [],
      stats: {
        avgEndingCash: 0,
        teamsGoneBroke: 0,
        totalTeams: 0,
        commonFundingStrategy: '',
        avgTeamSize: 0,
        totalRoundsCompleted: 0
      }
    };

    const allTeams = [];
    const selectedGamesData = selectedGameIds.map(id => gamesData[id]).filter(Boolean);

    if (selectedGamesData.length === 0) return data;

    // Collect all teams
    selectedGamesData.forEach(game => {
      game.teams?.forEach(team => {
        allTeams.push({ ...team, gameName: game.name, gameId: game.id });
      });
    });

    if (allTeams.length === 0) return data;

    // Financial Journey Data (line chart)
    const maxRounds = Math.max(...allTeams.map(t => t.rounds?.length || 0), 4);
    for (let round = 0; round <= maxRounds; round++) {
      const roundData = { round: `Round ${round}` };

      allTeams.forEach((team, idx) => {
        const teamLabel = selectedGamesData.length > 1
          ? `${team.teamName} (${team.gameName?.slice(0, 15)}...)`
          : team.teamName;

        if (round === 0) {
          // All teams start with €5,000
          roundData[teamLabel] = 5000;
        } else {
          const roundInfo = team.rounds?.find(r => r.round === round || r.id === String(round));
          if (roundInfo) {
            roundData[teamLabel] = roundInfo.cash ?? roundInfo.lowestCash ?? roundInfo.progress?.cash ?? null;
          }
        }
      });

      data.financialJourney.push(roundData);
    }

    // Funding Strategy Data (stacked bar)
    allTeams.forEach((team, idx) => {
      const lastRound = team.rounds?.[team.rounds.length - 1];

      // investment and revenue are stored as cumulative totals on the round doc
      const investment = parseFloat(lastRound?.totalInvestment || 0);
      const revenue    = parseFloat(lastRound?.totalRevenue    || 0);
      // subsidy and loan are per-round only — sum across all rounds
      const subsidy = team.rounds?.reduce((sum, r) => sum + parseFloat(r.funding?.subsidy || 0), 0) || 0;
      const loan    = team.rounds?.reduce((sum, r) => sum + parseFloat(r.funding?.loan    || 0), 0) || 0;

      data.fundingStrategy.push({
        name: team.teamName || `Team ${idx + 1}`,
        gameName: team.gameName,
        investment,
        loan,
        revenue,
        subsidy,
        total: investment + loan + revenue + subsidy
      });
    });

    // Team Growth Data (grouped bar)
    allTeams.forEach((team, idx) => {
      const lastRound = team.rounds?.[team.rounds.length - 1];
      const founders = lastRound?.founders ?? team.founderCount ?? 0;
      const employees = lastRound?.employees ?? team.employees ?? 0;

      data.teamGrowth.push({
        name: team.teamName || `Team ${idx + 1}`,
        gameName: team.gameName,
        founders,
        employees,
        total: founders + employees
      });
    });

    // Round Progression Data
    allTeams.forEach((team, idx) => {
      const progression = {
        name: team.teamName || `Team ${idx + 1}`,
        gameName: team.gameName
      };

      for (let r = 1; r <= maxRounds; r++) {
        const roundInfo = team.rounds?.find(rd => rd.round === r || rd.id === String(r));
        progression[`Round ${r}`] = roundInfo ? 1 : 0;
      }

      progression.currentRound = team.currentRound || team.rounds?.length || 0;
      data.roundProgression.push(progression);
    });

    // Calculate Stats
    let totalCash = 0;
    let teamsWithCash = 0;
    let goneBroke = 0;
    let totalTeamSize = 0;
    let totalRounds = 0;
    const fundingCounts = { investment: 0, loan: 0, revenue: 0, subsidy: 0 };

    allTeams.forEach(team => {
      const lastRound = team.rounds?.[team.rounds.length - 1];
      const cash = lastRound?.cash ?? lastRound?.progress?.cash ?? team.cash ?? 0;

      if (typeof cash === 'number') {
        totalCash += cash;
        teamsWithCash++;
      }

      if (team.hasGoneBroke || lastRound?.hasGoneBroke || cash < 0) {
        goneBroke++;
      }

      const founders = lastRound?.founders ?? team.founderCount ?? 0;
      const employees = lastRound?.employees ?? team.employees ?? 0;
      totalTeamSize += founders + employees;

      totalRounds += team.rounds?.length || 0;

      // Count funding types used (same cumulative logic as the funding strategy chart)
      const teamLastRound = team.rounds?.[team.rounds.length - 1];
      if (parseFloat(teamLastRound?.totalInvestment || 0) > 0) fundingCounts.investment++;
      if (parseFloat(teamLastRound?.totalRevenue    || 0) > 0) fundingCounts.revenue++;
      const teamSubsidy = team.rounds?.reduce((s, r) => s + parseFloat(r.funding?.subsidy || 0), 0) || 0;
      const teamLoan    = team.rounds?.reduce((s, r) => s + parseFloat(r.funding?.loan    || 0), 0) || 0;
      if (teamSubsidy > 0) fundingCounts.subsidy++;
      if (teamLoan    > 0) fundingCounts.loan++;
    });

    const mostCommonFunding = Object.entries(fundingCounts)
      .sort((a, b) => b[1] - a[1])[0];

    data.stats = {
      avgEndingCash: teamsWithCash > 0 ? Math.round(totalCash / teamsWithCash) : 0,
      teamsGoneBroke: goneBroke,
      totalTeams: allTeams.length,
      commonFundingStrategy: mostCommonFunding ? `${mostCommonFunding[0]} (${mostCommonFunding[1]} teams)` : 'None',
      avgTeamSize: allTeams.length > 0 ? (totalTeamSize / allTeams.length).toFixed(1) : 0,
      totalRoundsCompleted: totalRounds,
      gamesCount: selectedGamesData.length
    };

    // Expert Usage — count how many teams used each expert category
    const expertCounts = {};
    allTeams.forEach(team => {
      const lastRoundActivities = team.rounds?.[team.rounds.length - 1]?.completedActivities
        || team.completedActivities
        || [];
      const usedExperts = new Set();
      lastRoundActivities.forEach(actId => {
        const expert = ACTIVITY_EXPERT_MAP[actId];
        if (expert) usedExperts.add(expert);
      });
      usedExperts.forEach(expert => {
        expertCounts[expert] = (expertCounts[expert] || 0) + 1;
      });
    });
    data.expertUsage = Object.entries(expertCounts)
      .map(([expert, count]) => ({ expert, count }))
      .sort((a, b) => b.count - a.count);

    // Deal Quality — equity, loan interest, licence per team
    data.dealQuality = allTeams.map((team, idx) => {
      const lastRound = team.rounds?.[team.rounds.length - 1];
      const investorEquity = parseFloat(lastRound?.investorEquity ?? team.investorEquity ?? 0);
      const loanInterest   = parseFloat(lastRound?.loanInterest   ?? team.loanInterest   ?? 0);
      const hadLoan = (team.rounds?.reduce((s, r) => s + parseFloat(r.funding?.loan || 0), 0) || 0) > 0;
      const licenceAgreement = lastRound?.licenceAgreement ?? team.licenceAgreement ?? null;

      return {
        name: team.teamName || `Team ${idx + 1}`,
        gameName: team.gameName,
        investorEquity,
        loanInterest: hadLoan ? loanInterest : null,
        licenceAgreement,
      };
    });

    return data;
  }, [selectedGameIds, gamesData]);

  // Get team names for legend
  const teamNames = useMemo(() => {
    const names = [];
    const selectedGamesData = selectedGameIds.map(id => gamesData[id]).filter(Boolean);

    selectedGamesData.forEach(game => {
      game.teams?.forEach(team => {
        const label = selectedGamesData.length > 1
          ? `${team.teamName} (${game.name?.slice(0, 15)}...)`
          : team.teamName;
        names.push(label);
      });
    });

    return names;
  }, [selectedGameIds, gamesData]);

  // Share URL
  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  // Export data
  const handleExport = () => {
    const dataStr = JSON.stringify(chartData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map((entry, idx) => (
          <p key={idx} style={{ color: entry.color }}>
            {entry.name}: €{Number(entry.value || 0).toLocaleString()}
          </p>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="analytics-loading">
          <RefreshCw size={32} className="spin" />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      {/* Header */}
      <div className="analytics-header">
        <div className="header-left">
          <BarChart3 size={28} className="header-icon" />
          <div>
            <h1>Analytics Dashboard</h1>
            <p className="text-muted">Compare team performance across game sessions</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-icon-action" onClick={handleShare} title="Share">
            <Share2 size={18} />
          </button>
          <button className="btn-icon-action" onClick={handleExport} title="Export Data">
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Game Selector */}
      <div className="game-selector-section">
        <div className="selected-games">
          {selectedGameIds.length === 0 ? (
            <span className="no-selection">No games selected</span>
          ) : (
            selectedGameIds.map(gameId => {
              const game = allGames.find(g => g.id === gameId);
              return (
                <div key={gameId} className="selected-game-chip">
                  <span>{game?.name || gameId.slice(0, 12)}...</span>
                  <button onClick={() => removeGame(gameId)}>
                    <X size={14} />
                  </button>
                </div>
              );
            })
          )}
          {selectedGameIds.length > 0 && (
            <button className="clear-all-btn" onClick={clearAllGames}>
              Clear all
            </button>
          )}
        </div>

        <div className="game-selector-dropdown">
          <button
            className="add-game-btn"
            onClick={() => setShowGameSelector(!showGameSelector)}
          >
            <Plus size={16} />
            Add Game
            <ChevronDown size={16} className={showGameSelector ? 'rotated' : ''} />
          </button>

          {showGameSelector && (
            <div className="game-dropdown">
              <div className="dropdown-search">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search games..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="dropdown-list">
                {filteredGames.length === 0 ? (
                  <div className="dropdown-empty">No games found</div>
                ) : (
                  filteredGames.map(game => (
                    <div
                      key={game.id}
                      className={`dropdown-item ${selectedGameIds.includes(game.id) ? 'selected' : ''}`}
                      onClick={() => toggleGame(game.id)}
                    >
                      <div className="game-info">
                        <span className="game-name">{game.name || 'Unnamed Game'}</span>
                        <span className="game-meta">
                          {game.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown date'}
                        </span>
                      </div>
                      {selectedGameIds.includes(game.id) && (
                        <span className="check-mark">✓</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading indicator for game data */}
      {loadingGames && (
        <div className="loading-overlay">
          <RefreshCw size={24} className="spin" />
          <span>Loading game data...</span>
        </div>
      )}

      {/* Empty State */}
      {selectedGameIds.length === 0 && !loadingGames && (
        <div className="analytics-empty">
          <BarChart3 size={64} className="empty-icon" />
          <h2>Select Games to Analyze</h2>
          <p>Choose one or more game sessions to view comparative analytics</p>
          <button
            className="btn-primary"
            onClick={() => setShowGameSelector(true)}
          >
            <Plus size={18} />
            Select Games
          </button>
        </div>
      )}

      {/* Charts Section */}
      {selectedGameIds.length > 0 && !loadingGames && chartData.stats.totalTeams > 0 && (
        <>
          <div className="charts-grid">
            {/* Financial Journey Chart */}
            <div className="chart-card full-width">
              <div className="chart-header">
                <TrendingUp size={20} />
                <h3>Team Financial Journey</h3>
              </div>
              <div className="chart-body">
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={chartData.financialJourney}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="round"
                      stroke="#64748b"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <YAxis
                      stroke="#64748b"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      tickFormatter={(val) => `€${(val/1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {teamNames.map((name, idx) => (
                      <Line
                        key={name}
                        type="monotone"
                        dataKey={name}
                        stroke={COLORS[idx % COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Funding Strategy Chart */}
            <div className="chart-card">
              <div className="chart-header">
                <DollarSign size={20} />
                <h3>Funding Strategy</h3>
              </div>
              <div className="chart-body">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.fundingStrategy} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      type="number"
                      stroke="#64748b"
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      tickFormatter={(val) => `€${(val/1000).toFixed(0)}k`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#64748b"
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      width={100}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="investment" stackId="a" fill={FUNDING_COLORS.investment} name="Investment" />
                    <Bar dataKey="loan" stackId="a" fill={FUNDING_COLORS.loan} name="Loans" />
                    <Bar dataKey="revenue" stackId="a" fill={FUNDING_COLORS.revenue} name="Revenue" />
                    <Bar dataKey="subsidy" stackId="a" fill={FUNDING_COLORS.subsidy} name="Subsidy" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Team Growth Chart */}
            <div className="chart-card">
              <div className="chart-header">
                <Users size={20} />
                <h3>Team Composition</h3>
              </div>
              <div className="chart-body">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.teamGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="name"
                      stroke="#64748b"
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      stroke="#64748b"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="founders" fill="#6366f1" name="Founders" />
                    <Bar dataKey="employees" fill="#22c55e" name="Employees" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Most Popular Expert */}
            {chartData.expertUsage?.length > 0 && (
              <div className="chart-card">
                <div className="chart-header">
                  <Users size={20} />
                  <h3>Most Popular Expert</h3>
                </div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.expertUsage} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        label={{ value: 'teams', position: 'insideRight', offset: -4, fill: '#64748b', fontSize: 11 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="expert"
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        width={130}
                      />
                      <Tooltip
                        formatter={(val) => [`${val} team${val !== 1 ? 's' : ''}`, 'Used by']}
                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                        labelStyle={{ color: '#e2e8f0' }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {chartData.expertUsage.map((entry) => (
                          <Cell key={entry.expert} fill={EXPERT_COLORS[entry.expert] || '#6366f1'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Deal Quality Overview */}
            <div className="chart-card">
              <div className="chart-header">
                <DollarSign size={20} />
                <h3>Deal Quality</h3>
              </div>
              <div className="chart-body">
                <div className="deal-table">
                  <div className="deal-header">
                    <span className="deal-team-col">Team</span>
                    <span className="deal-col">Investor equity</span>
                    <span className="deal-col">Loan interest</span>
                    <span className="deal-col">Licence deal</span>
                  </div>
                  {chartData.dealQuality?.map((team, idx) => {
                    const equityClass = team.investorEquity === 0 ? 'deal-na'
                      : team.investorEquity > 50 ? 'deal-bad'
                      : team.investorEquity > 30 ? 'deal-ok'
                      : 'deal-good';
                    const interestClass = team.loanInterest === null ? 'deal-na'
                      : team.loanInterest >= 10 ? 'deal-bad'
                      : team.loanInterest >= 5  ? 'deal-ok'
                      : 'deal-good';
                    const licenceClass = !team.licenceAgreement ? 'deal-na'
                      : team.licenceAgreement === 'balanced' ? 'deal-good'
                      : team.licenceAgreement === 'revenueHeavy' ? 'deal-bad'
                      : 'deal-ok';
                    const licenceLabel = {
                      balanced:       'Balanced ✓',
                      revenueHeavy:   'Revenue-heavy ✗',
                      highPercentage: 'High %',
                      earlyPayments:  'Early payments',
                      equity:         'Equity deal',
                    }[team.licenceAgreement] || '—';

                    return (
                      <div key={idx} className="deal-row">
                        <span className="deal-team-col">{team.name}</span>
                        <span className={`deal-cell ${equityClass}`}>
                          {team.investorEquity > 0 ? `${Math.round(team.investorEquity)}%` : '—'}
                        </span>
                        <span className={`deal-cell ${interestClass}`}>
                          {team.loanInterest !== null ? `${team.loanInterest}%` : '—'}
                        </span>
                        <span className={`deal-cell ${licenceClass}`}>
                          {licenceLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Round Progression */}
            <div className="chart-card full-width">
              <div className="chart-header">
                <Clock size={20} />
                <h3>Round Progression</h3>
              </div>
              <div className="chart-body progression-chart">
                <div className="progression-grid">
                  <div className="progression-header">
                    <span className="team-col">Team</span>
                    {[1, 2, 3, 4].map(r => (
                      <span key={r} className="round-col">R{r}</span>
                    ))}
                    <span className="status-col">Status</span>
                  </div>
                  {chartData.roundProgression.map((team, idx) => (
                    <div key={idx} className="progression-row">
                      <span className="team-col">{team.name}</span>
                      {[1, 2, 3, 4].map(r => (
                        <span
                          key={r}
                          className={`round-cell ${team[`Round ${r}`] ? 'completed' : ''} ${team.currentRound === r ? 'current' : ''}`}
                        >
                          {team[`Round ${r}`] ? '✓' : ''}
                        </span>
                      ))}
                      <span className="status-col">
                        {team.currentRound >= 4 ? (
                          <span className="status-badge completed">Completed</span>
                        ) : (
                          <span className="status-badge in-progress">Round {team.currentRound}</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="stats-summary">
            <h3>Summary Statistics</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <DollarSign size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-value">€{chartData.stats.avgEndingCash.toLocaleString()}</span>
                  <span className="stat-label">Avg. Ending Cash</span>
                </div>
              </div>

              <div className="stat-card warning">
                <div className="stat-icon">
                  <AlertTriangle size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{chartData.stats.teamsGoneBroke}</span>
                  <span className="stat-label">Teams Gone Broke</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <Users size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{chartData.stats.totalTeams}</span>
                  <span className="stat-label">Total Teams</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <TrendingUp size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{chartData.stats.commonFundingStrategy}</span>
                  <span className="stat-label">Most Common Funding</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <Users size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{chartData.stats.avgTeamSize}</span>
                  <span className="stat-label">Avg. Team Size</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <BarChart3 size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{chartData.stats.totalRoundsCompleted}</span>
                  <span className="stat-label">Total Rounds Played</span>
                </div>
              </div>
            </div>

            {chartData.stats.gamesCount > 1 && (
              <div className="comparison-note">
                Comparing {chartData.stats.gamesCount} game sessions with {chartData.stats.totalTeams} total teams
              </div>
            )}
          </div>
        </>
      )}

      {/* No data state */}
      {selectedGameIds.length > 0 && !loadingGames && chartData.stats.totalTeams === 0 && (
        <div className="analytics-empty">
          <AlertTriangle size={48} className="empty-icon warning" />
          <h2>No Team Data Found</h2>
          <p>The selected games don't have any team data yet</p>
        </div>
      )}
    </div>
  );
}

export default Analytics;
