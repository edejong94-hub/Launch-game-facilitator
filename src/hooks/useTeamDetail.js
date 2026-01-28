import { useState, useEffect } from 'react';
import { 
  doc, 
  collection, 
  onSnapshot, 
  query, 
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';

export function useTeamDetail(gameId, teamId) {
  const [team, setTeam] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!gameId || !teamId) {
      setLoading(false);
      return;
    }

    const teamRef = doc(db, 'games', gameId, 'teams', teamId);
    const roundsRef = collection(db, 'games', gameId, 'teams', teamId, 'rounds');
    const reviewsRef = collection(db, 'games', gameId, 'teams', teamId, 'reviews');

    const unsubTeam = onSnapshot(teamRef, (snap) => {
      if (snap.exists()) {
        setTeam({ id: snap.id, ...snap.data() });
      } else {
        setTeam(null);
      }
    }, (err) => {
      setError(err);
    });

    const roundsQuery = query(roundsRef, orderBy('round', 'asc'));
    const unsubRounds = onSnapshot(roundsQuery, (snap) => {
      const roundsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRounds(roundsData);
      setLoading(false);
    }, (err) => {
      setError(err);
      setLoading(false);
    });

    const unsubReviews = onSnapshot(reviewsRef, (snap) => {
      const reviewsMap = {};
      snap.docs.forEach(d => {
        reviewsMap[d.id] = { id: d.id, ...d.data() };
      });
      setReviews(reviewsMap);
    }, (err) => {
      console.error('Error fetching reviews:', err);
    });

    return () => {
      unsubTeam();
      unsubRounds();
      unsubReviews();
    };
  }, [gameId, teamId]);

  return { team, rounds, reviews, loading, error };
}

export default useTeamDetail;