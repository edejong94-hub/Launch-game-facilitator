import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./config/firebase";

// Use named imports because your components use
// export function Shell() etc
import { Shell } from "./component/Shell";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { TeamPage } from "./pages/TeamPage";
import { AdminPanel } from "./pages/AdminPanel";
import GameSelector from "./Components/GameSelector";
import LiveDashboard from "./Components/LiveDashboard";
import { Analytics } from "./pages/Analytics";

import "./styles.css";

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Game selection state with localStorage persistence
  const [selectedGameId, setSelectedGameId] = useState(() => {
    return localStorage.getItem("facilitator_selected_game") || null;
  });

  const [selectedGameName, setSelectedGameName] = useState(() => {
    return localStorage.getItem("facilitator_selected_game_name") || null;
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // One-time cleanup: Remove old launchGameId from localStorage
  useEffect(() => {
    localStorage.removeItem("launchGameId");
  }, []);


  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleGameChange = (newGameId, newGameName) => {
    // Update the selected game when creating/changing games from AdminPanel
    setSelectedGameId(newGameId);
    setSelectedGameName(newGameName || 'Unknown Game');

    // Persist to localStorage
    localStorage.setItem('facilitator_selected_game', newGameId);
    if (newGameName) {
      localStorage.setItem('facilitator_selected_game_name', newGameName);
    }
  };

  // Handler for game selection from GameSelector
  const handleSelectGame = (gameId, gameName) => {
    setSelectedGameId(gameId);
    setSelectedGameName(gameName || 'Unknown Game');

    // Remember selection in localStorage
    localStorage.setItem('facilitator_selected_game', gameId);
    if (gameName) {
      localStorage.setItem('facilitator_selected_game_name', gameName);
    }
  };

  // Handler to return to game selector
  const handleBackToGameSelector = () => {
    setSelectedGameId(null);
    setSelectedGameName(null);
    localStorage.removeItem('facilitator_selected_game');
    localStorage.removeItem('facilitator_selected_game_name');
  };

  if (authLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={(u) => setUser(u)} />;
  }

  // Show GameSelector if no game is selected
  if (!selectedGameId) {
    return (
      <GameSelector
        onSelectGame={handleSelectGame}
        currentGameId={selectedGameId}
      />
    );
  }

  // Show main app with selected game
  return (
    <BrowserRouter>
      <Routes>
        {/* Live scores page - fullscreen view without Shell */}
        <Route path="/live" element={<LiveDashboard />} />

        {/* Analytics page - independent game selector */}
        <Route path="/analytics" element={<Analytics />} />

        {/* Main app routes with Shell */}
        <Route
          path="/*"
          element={
            <>
              {/* Back to games button - moved to sidebar footer via Shell component */}

              <Shell user={user} onLogout={handleLogout} onBackToGames={handleBackToGameSelector}>
                <Routes>
                  <Route
                    path="/"
                    element={
                      <Dashboard
                        gameId={selectedGameId}
                        gameName={selectedGameName}
                      />
                    }
                  />
                  <Route
                    path="/teams"
                    element={
                      <Dashboard
                        gameId={selectedGameId}
                        gameName={selectedGameName}
                      />
                    }
                  />
                  <Route
                    path="/team/:teamId"
                    element={<TeamPage gameId={selectedGameId} userEmail={user.email} />}
                  />
                  <Route
                    path="/admin"
                    element={
                      <AdminPanel
                        gameId={selectedGameId}
                        gameName={selectedGameName}
                        onGameChange={handleGameChange}
                      />
                    }
                  />
                  <Route
                    path="/analytics"
                    element={<Analytics />}
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Shell>
            </>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
