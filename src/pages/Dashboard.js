import React, { useState, useEffect } from "react";
import {
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  BarChart3,
  Trophy,
} from "lucide-react";
import { doc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { useTeams } from "../hooks/useTeams";
import { TeamCard } from "../component/TeamCard";
import FacilitatorScoring from "../component/FacilitatorScoring";
import EditTeamModal from "../Components/EditTeamModal";

export function Dashboard({ gameId, gameName }) {
  // Game mode state
  const [mode, setMode] = useState(
    localStorage.getItem("facilitatorMode") || "all"
  );

  // View toggle state (teams or scoring)
  const [view, setView] = useState("teams"); // 'teams' or 'scoring'

  // Score release state
  const [scoresReleased, setScoresReleased] = useState(false);
  const [releasingScores, setReleasingScores] = useState(false);

  // Edit team modal state
  const [editingTeam, setEditingTeam] = useState(null);

  const { teams, loading, error } = useTeams(gameId, mode);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  // Listen for scores released status
  useEffect(() => {
    if (!gameId) return;

    const unsubscribe = onSnapshot(
      doc(db, "games", gameId, "settings", "game"),
      (docSnap) => {
        if (docSnap.exists()) {
          setScoresReleased(docSnap.data().scoresReleased || false);
        }
      },
      (error) => {
        console.error("Error listening for settings:", error);
      }
    );

    return () => unsubscribe();
  }, [gameId]);

  // Handle releasing final scores
  const handleReleaseScores = async () => {
    if (scoresReleased) {
      alert("Scores have already been released!");
      return;
    }

    const confirmed = window.confirm(
      "🏆 Release final scores to ALL teams?\n\n" +
      "This will show the EndGame Score Breakdown to all teams that have completed Round 4.\n\n" +
      "This action cannot be undone."
    );

    if (!confirmed) return;

    setReleasingScores(true);
    try {
      await setDoc(
        doc(db, "games", gameId, "settings", "game"),
        {
          scoresReleased: true,
          releasedAt: serverTimestamp(),
          releasedBy: "facilitator",
        },
        { merge: true }
      );
      alert("✅ Final scores released! Teams can now see their score breakdown.");
    } catch (err) {
      console.error("Error releasing scores:", err);
      alert("Failed to release scores: " + err.message);
    }
    setReleasingScores(false);
  };

  const handleModeChange = (value) => {
    setMode(value);
    localStorage.setItem("facilitatorMode", value);
  };

  const filteredTeams = teams
    .filter((team) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!team.teamName?.toLowerCase().includes(query)) {
          return false;
        }
      }
      if (statusFilter !== "all") {
        if (statusFilter === "registered") {
          return team.currentRound === 0 && !team.latestRound;
        }
        if (statusFilter === "playing") {
          return team.currentRound > 0 || team.latestRound;
        }
        if (statusFilter === "pending") {
          return !team.latestReview || team.latestReview.status === "pending";
        }
        if (statusFilter === "approved") {
          return team.latestReview?.approved === true;
        }
        if (statusFilter === "blocked") {
          return team.status === "blocked";
        }
        if (statusFilter === "warning") {
          return team.warnings?.length > 0;
        }
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "round":
          return (b.latestRound?.round || 0) - (a.latestRound?.round || 0);
        case "cash":
          return (
            (b.latestRound?.progress?.cash || 0) -
            (a.latestRound?.progress?.cash || 0)
          );
        case "warnings":
          return (b.warnings?.length || 0) - (a.warnings?.length || 0);
        default:
          return (a.teamName || "").localeCompare(b.teamName || "");
      }
    });

  const stats = {
    total: teams.length,
    registered: teams.filter((t) => t.currentRound === 0 && !t.latestRound).length,
    playing: teams.filter((t) => t.currentRound > 0 || t.latestRound).length,
    pending: teams.filter(
      (t) => !t.latestReview || t.latestReview.status === "pending"
    ).length,
    approved: teams.filter((t) => t.latestReview?.approved === true).length,
    blocked: teams.filter((t) => t.status === "blocked").length,
    warnings: teams.filter((t) => t.warnings?.length > 0).length,
    completedRound4: teams.filter((t) => t.latestRound?.round >= 4).length,
  };

  if (loading) {
    return (
      <div className="loading-state">
        <RefreshCw size={32} className="spin" />
        <p>Loading teams...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <AlertTriangle size={32} />
        <p>Error loading teams: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted">
            {gameName && <><strong>{gameName}</strong> · </>}
            Game ID: <code style={{ background: 'rgba(0,0,0,0.2)', padding: '0.125rem 0.375rem', borderRadius: '4px', fontSize: '0.875rem' }}>{gameId}</code>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {/* Launch Live View Button */}
          <button
            className="launch-live-btn"
            onClick={() => {
              // Open live scores in student app, in a new window optimized for projection
              const liveMode = mode === 'all' ? 'research' : mode;
              const liveWindow = window.open(
                `https://launchgame.netlify.app/live?gameId=${gameId}&mode=${liveMode}`,
                'LiveScores',
                'width=1920,height=1080,menubar=no,toolbar=no,location=no,status=no'
              );

              // Optional: make it fullscreen-ready
              if (liveWindow) {
                liveWindow.focus();
              }
            }}
          >
            <span className="btn-icon">📺</span>
            <span className="btn-text">Launch Live View</span>
          </button>

          {/* View toggle buttons */}
          <div className="view-toggle">
            <button
              className={`toggle-btn ${view === "teams" ? "active" : ""}`}
              onClick={() => setView("teams")}
            >
              <Users size={18} />
              Teams
            </button>
            <button
              className={`toggle-btn ${view === "scoring" ? "active" : ""}`}
              onClick={() => setView("scoring")}
            >
              <BarChart3 size={18} />
              Live Scores
            </button>
          </div>
        </div>
      </div>

      {/* Release Scores Banner - Show when teams have completed round 4 */}
      {stats.completedRound4 > 0 && (
        <div
          style={{
            background: scoresReleased
              ? "linear-gradient(135deg, #059669 0%, #10b981 100%)"
              : "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
            borderRadius: "12px",
            padding: "1.25rem 1.5rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Trophy size={28} color="white" />
            <div>
              <h3 style={{ color: "white", margin: 0, fontSize: "1.1rem" }}>
                {scoresReleased ? "Final Scores Released! 🎉" : "Ready to Release Final Scores?"}
              </h3>
              <p style={{ color: "rgba(255,255,255,0.9)", margin: "0.25rem 0 0", fontSize: "0.9rem" }}>
                {scoresReleased
                  ? "All teams can now view their EndGame Score Breakdown"
                  : `${stats.completedRound4} team${stats.completedRound4 !== 1 ? "s" : ""} have completed the game`}
              </p>
            </div>
          </div>
          
          {!scoresReleased && (
            <button
              onClick={handleReleaseScores}
              disabled={releasingScores}
              style={{
                background: "white",
                color: "#7c3aed",
                border: "none",
                borderRadius: "8px",
                padding: "0.75rem 1.5rem",
                fontSize: "1rem",
                fontWeight: 600,
                cursor: releasingScores ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                opacity: releasingScores ? 0.7 : 1,
                transition: "transform 0.15s, box-shadow 0.15s",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
              onMouseOver={(e) => {
                if (!releasingScores) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
              }}
            >
              <Trophy size={20} />
              {releasingScores ? "Releasing..." : "Release Final Scores"}
            </button>
          )}
        </div>
      )}

      {/* Show stats bar only in teams view */}
      {view === "teams" && (
        <>
          <div className="stats-bar">
            <div className="stat-box">
              <Users size={20} />
              <div className="stat-info">
                <span className="stat-value">{stats.total}</span>
                <span className="stat-label">Total teams</span>
              </div>
            </div>
            <div className="stat-box" style={{ borderColor: 'rgba(99, 102, 241, 0.3)' }}>
              <Clock size={20} style={{ color: '#a5b4fc' }} />
              <div className="stat-info">
                <span className="stat-value">{stats.registered}</span>
                <span className="stat-label">Registered</span>
              </div>
            </div>
            <div className="stat-box" style={{ borderColor: 'rgba(34, 197, 94, 0.3)' }}>
              <Users size={20} style={{ color: '#4ade80' }} />
              <div className="stat-info">
                <span className="stat-value">{stats.playing}</span>
                <span className="stat-label">Playing</span>
              </div>
            </div>
            <div className="stat-box warning">
              <Clock size={20} />
              <div className="stat-info">
                <span className="stat-value">{stats.pending}</span>
                <span className="stat-label">Pending review</span>
              </div>
            </div>
            <div className="stat-box success">
              <CheckCircle size={20} />
              <div className="stat-info">
                <span className="stat-value">{stats.approved}</span>
                <span className="stat-label">Approved</span>
              </div>
            </div>
            <div className="stat-box danger">
              <AlertTriangle size={20} />
              <div className="stat-info">
                <span className="stat-value">{stats.warnings}</span>
                <span className="stat-label">With warnings</span>
              </div>
            </div>
          </div>

          <div className="filters-bar">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <span className="filter-label">Game type:</span>
              <select
                value={mode}
                onChange={(e) => handleModeChange(e.target.value)}
              >
                <option value="all">All games</option>
                <option value="startup">Startup</option>
                <option value="research">Research</option>
              </select>
            </div>

            <div className="filter-group">
              <Filter size={16} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All teams</option>
                <option value="registered">📝 Registered</option>
                <option value="playing">🎮 Playing</option>
                <option value="pending">Pending review</option>
                <option value="approved">Approved</option>
                <option value="blocked">Blocked</option>
                <option value="warning">With warnings</option>
              </select>
            </div>

            <div className="filter-group">
              <span className="filter-label">Sort by:</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="name">Name</option>
                <option value="round">Round</option>
                <option value="cash">Cash</option>
                <option value="warnings">Warnings</option>
              </select>
            </div>
          </div>

          {filteredTeams.length === 0 ? (
            <div className="empty-state">
              <Users size={48} />
              <h3>No teams found</h3>
              <p>
                {teams.length === 0
                  ? "No teams have joined the game yet."
                  : "No teams match your current filters."}
              </p>
            </div>
          ) : (
            <div className="teams-grid">
              {filteredTeams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  gameId={gameId}
                  onEdit={setEditingTeam}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Scoring view */}
      {view === "scoring" && (
        <FacilitatorScoring
          gameSession={gameId}
          gameMode={mode}
        />
      )}

      {/* Edit Team Modal */}
      {editingTeam && (
        <EditTeamModal
          team={editingTeam}
          gameId={gameId}
          onClose={() => setEditingTeam(null)}
          onSaved={() => {
            console.log('Team updated successfully');
            setEditingTeam(null);
          }}
        />
      )}
    </div>
  );
}