// src/hooks/useTeams.js
import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "../config/firebase";

export function useTeams(gameId, mode = "all") {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!gameId) {
      setTeams([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const teamsRef = collection(db, "games", gameId, "teams");

    // When mode is startup or research we filter on gameMode
    // When mode is all we show everything
    let teamsQuery;
    if (mode && mode !== "all") {
      teamsQuery = query(
        teamsRef,
        where("gameMode", "==", mode),
        orderBy("teamName")
      );
    } else {
      teamsQuery = query(teamsRef, orderBy("teamName"));
    }

    const unsubscribe = onSnapshot(
      teamsQuery,
      async (snapshot) => {
        try {
          const teamsData = await Promise.all(
            snapshot.docs.map(async (teamDoc) => {
              const teamData = teamDoc.data();

              const roundsRef = collection(
                db,
                "games",
                gameId,
                "teams",
                teamDoc.id,
                "rounds"
              );
              const roundsSnapshot = await getDocs(
                query(roundsRef, orderBy("round", "desc"))
              );

              let latestRound = null;
              const allRounds = [];

              roundsSnapshot.forEach((roundDoc) => {
                const roundData = { id: roundDoc.id, ...roundDoc.data() };
                allRounds.push(roundData);
                if (!latestRound) latestRound = roundData;
              });

              let latestReview = null;
              if (latestRound) {
                const reviewRef = doc(
                  db,
                  "games",
                  gameId,
                  "teams",
                  teamDoc.id,
                  "reviews",
                  String(latestRound.round)
                );
                const reviewSnap = await getDoc(reviewRef);
                if (reviewSnap.exists()) {
                  latestReview = reviewSnap.data();
                }
              }

              return {
                id: teamDoc.id,
                ...teamData,
                latestRound,
                latestReview,
                allRounds,
                warnings: computeWarnings(latestRound?.progress),
              };
            })
          );

          setTeams(teamsData);
          setLoading(false);
        } catch (err) {
          console.error("Error fetching teams:", err);
          setError(err);
          setLoading(false);
        }
      },
      (err) => {
        console.error("Snapshot error:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [gameId, mode]);

  return { teams, loading, error };
}

function computeWarnings(progress) {
  if (!progress) return [];

  const warnings = [];

  if (progress.cash < 0) {
    warnings.push({
      type: "danger",
      message: "Negative cash flow",
      field: "cash",
    });
  }

  if (progress.cash >= 0 && progress.cash < 1000) {
    warnings.push({
      type: "warning",
      message: "Low cash reserves",
      field: "cash",
    });
  }

  if (progress.interviewsTotal === 0) {
    warnings.push({
      type: "warning",
      message: "No customer interviews yet",
      field: "interviews",
    });
  }

  if (progress.validationsTotal === 0) {
    warnings.push({
      type: "warning",
      message: "No customer validation yet",
      field: "validation",
    });
  }

  return warnings;
}

export default useTeams;
