import { 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  collection
} from 'firebase/firestore';
import { db } from '../config/firebase';

export async function saveReview(gameId, teamId, roundNumber, reviewData) {
  const reviewRef = doc(db, 'games', gameId, 'teams', teamId, 'reviews', String(roundNumber));
  
  await setDoc(reviewRef, {
    ...reviewData,
    roundNumber,
    reviewedAt: serverTimestamp(),
  }, { merge: true });
}

export async function updateContractCheck(gameId, teamId, roundNumber, contractType, checkData) {
  const reviewRef = doc(db, 'games', gameId, 'teams', teamId, 'reviews', String(roundNumber));
  
  await setDoc(reviewRef, {
    [`contractChecks.${contractType}`]: checkData,
    reviewedAt: serverTimestamp(),
  }, { merge: true });
}

export async function addOverride(gameId, teamId, roundNumber, fieldPath, originalValue, correctedValue, reason) {
  const reviewRef = doc(db, 'games', gameId, 'teams', teamId, 'reviews', String(roundNumber));
  
  await setDoc(reviewRef, {
    [`overrides.${fieldPath.replace('.', '_')}`]: {
      field: fieldPath,
      original: originalValue,
      corrected: correctedValue,
      reason,
      createdAt: serverTimestamp()
    },
    reviewedAt: serverTimestamp(),
  }, { merge: true });
}

export async function approveRound(gameId, teamId, roundNumber, reviewerEmail) {
  const reviewRef = doc(db, 'games', gameId, 'teams', teamId, 'reviews', String(roundNumber));
  
  await setDoc(reviewRef, {
    status: 'approved',
    approved: true,
    reviewedBy: reviewerEmail,
    reviewedAt: serverTimestamp(),
  }, { merge: true });

  const teamRef = doc(db, 'games', gameId, 'teams', teamId);
  await updateDoc(teamRef, {
    status: 'playing',
    lastApprovedRound: roundNumber
  });
}

export async function rejectRound(gameId, teamId, roundNumber, reviewerEmail, reason) {
  const reviewRef = doc(db, 'games', gameId, 'teams', teamId, 'reviews', String(roundNumber));
  
  await setDoc(reviewRef, {
    status: 'rejected',
    approved: false,
    rejectionReason: reason,
    reviewedBy: reviewerEmail,
    reviewedAt: serverTimestamp(),
  }, { merge: true });

  const teamRef = doc(db, 'games', gameId, 'teams', teamId);
  await updateDoc(teamRef, {
    status: 'blocked'
  });
}

export async function addNote(gameId, teamId, roundNumber, note) {
  const reviewRef = doc(db, 'games', gameId, 'teams', teamId, 'reviews', String(roundNumber));
  
  await setDoc(reviewRef, {
    notes: note,
    reviewedAt: serverTimestamp(),
  }, { merge: true });
}

export async function setTeamStatus(gameId, teamId, status) {
  const teamRef = doc(db, 'games', gameId, 'teams', teamId);
  await updateDoc(teamRef, { status });
}

export async function resetTeam(gameId, teamId) {
  const teamRef = doc(db, 'games', gameId, 'teams', teamId);
  await updateDoc(teamRef, {
    currentRound: 0,
    status: 'playing',
    resetAt: serverTimestamp()
  });
}

export async function deleteRound(gameId, teamId, roundNumber) {
  const roundRef = doc(db, 'games', gameId, 'teams', teamId, 'rounds', String(roundNumber));
  const reviewRef = doc(db, 'games', gameId, 'teams', teamId, 'reviews', String(roundNumber));
  
  await deleteDoc(roundRef);
  await deleteDoc(reviewRef);
}

export async function createGame(gameName) {
  const gameRef = doc(collection(db, 'games'));
  
  await setDoc(gameRef, {
    name: gameName,
    createdAt: serverTimestamp(),
    status: 'active',
    currentRound: 1
  });
  
  return gameRef.id;
}

export default {
  saveReview,
  updateContractCheck,
  addOverride,
  approveRound,
  rejectRound,
  addNote,
  setTeamStatus,
  resetTeam,
  deleteRound,
  createGame
};