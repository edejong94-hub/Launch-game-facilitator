import React, { useState, useEffect } from 'react';
import { doc, updateDoc, writeBatch, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { CheckCircle, Square, AlertTriangle, FileText, RefreshCw } from 'lucide-react';
import './ContractOverview.css';

// Contract requirements mapped to activities
const CONTRACT_REQUIREMENTS = {
  ttoDiscussion: { id: 'ttoMeeting', name: 'TTO Meeting', icon: '🏛️' },
  licenceNegotiation: { id: 'licenceAgreement', name: 'Licence Agreement', icon: '🏛️' },
  patentSearch: { id: 'ftoReport', name: 'FTO Report', icon: '⚖️' },
  patentFiling: { id: 'patentStrategy', name: 'Patent Strategy', icon: '⚖️' },
  customerInterviews: { id: 'interviewLog', name: 'Interview Log', icon: '🎯' },
  customerValidation: { id: 'loi', name: 'Letter of Intent', icon: '🎯' },
  investorMeeting: { id: 'pitchDeck', name: 'Pitch Feedback', icon: '💰' },
  investorNegotiation: { id: 'termSheet', name: 'Term Sheet', icon: '💰' },
  bankMeeting: { id: 'loanApplication', name: 'Loan Application', icon: '🏦' },
  loanApplication: { id: 'loanAgreement', name: 'Loan Agreement', icon: '🏦' },
  grantTakeoff: { id: 'grantApp', name: 'Grant Application', icon: '📋' },
  grantWBSO: { id: 'grantAppWBSO', name: 'WBSO Grant', icon: '📋' },
  grantRegional: { id: 'grantAppRegional', name: 'Regional Grant', icon: '📋' },
  industryExploration: { id: 'ndaAgreement', name: 'NDA Agreement', icon: '🏭' },
  pilotProject: { id: 'pilotAgreement', name: 'Pilot Agreement', icon: '🏭' },
  incubatorApplication: { id: 'incubatorApp', name: 'Incubator App', icon: '🏢' },
};

// Get required contracts for a team based on their activities
export function getRequiredContracts(team, verifiedContracts = {}) {
  const activities = [];

  // Get activities from latest round
  if (team.latestRound) {
    // Check completedActivities array
    if (team.latestRound.completedActivities) {
      activities.push(...team.latestRound.completedActivities);
    }
    // Check activities object
    if (team.latestRound.activities) {
      Object.keys(team.latestRound.activities).forEach(key => {
        if (team.latestRound.activities[key] && !activities.includes(key)) {
          activities.push(key);
        }
      });
    }
    // Check selectedActivities
    if (team.latestRound.selectedActivities) {
      team.latestRound.selectedActivities.forEach(act => {
        const actId = typeof act === 'string' ? act : act.id;
        if (actId && !activities.includes(actId)) {
          activities.push(actId);
        }
      });
    }
  }

  const required = [];
  const addedIds = new Set();

  activities.forEach(activity => {
    if (CONTRACT_REQUIREMENTS[activity]) {
      const contract = CONTRACT_REQUIREMENTS[activity];
      // Avoid duplicates
      if (!addedIds.has(contract.id)) {
        addedIds.add(contract.id);
        required.push({
          ...contract,
          activity,
          verified: verifiedContracts[contract.id] || false
        });
      }
    }
  });

  return required;
}

export function ContractOverview({ gameId, teams }) {
  const [verifiedContracts, setVerifiedContracts] = useState({});
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);

  // Load all teams' verified contracts via real-time listeners
  useEffect(() => {
    if (!gameId || !teams.length) {
      setLoading(false);
      return;
    }

    const unsubscribes = teams.map(team => {
      return onSnapshot(
        doc(db, 'games', gameId, 'teams', team.id),
        (snapshot) => {
          if (snapshot.exists()) {
            setVerifiedContracts(prev => ({
              ...prev,
              [team.id]: snapshot.data().verifiedContracts || {}
            }));
          }
        },
        (error) => {
          console.error(`Error listening to team ${team.id}:`, error);
        }
      );
    });

    setLoading(false);
    return () => unsubscribes.forEach(unsub => unsub());
  }, [gameId, teams]);

  // Toggle a contract verification
  const toggleContract = async (teamId, contractId) => {
    const currentValue = verifiedContracts[teamId]?.[contractId] || false;

    try {
      await updateDoc(doc(db, 'games', gameId, 'teams', teamId), {
        [`verifiedContracts.${contractId}`]: !currentValue
      });
    } catch (error) {
      console.error('Error toggling contract:', error);
      alert('Failed to update contract status');
    }
  };

  // Bulk approve all teams with verified contracts
  const approveAllVerified = async () => {
    const batch = writeBatch(db);
    let count = 0;

    teams.forEach(team => {
      const required = getRequiredContracts(team, verifiedContracts[team.id] || {});
      const allVerified = required.length === 0 || required.every(c => c.verified);
      const isPending = !team.latestReview?.approved && team.latestRound;

      if (allVerified && isPending && team.latestRound) {
        const reviewRef = doc(db, 'games', gameId, 'teams', team.id, 'reviews', String(team.latestRound.round));
        batch.set(reviewRef, {
          status: 'approved',
          approved: true,
          reviewedAt: serverTimestamp(),
          note: 'Bulk approved - contracts verified',
          roundNumber: team.latestRound.round,
        }, { merge: true });

        const teamRef = doc(db, 'games', gameId, 'teams', team.id);
        batch.update(teamRef, {
          status: 'playing',
          lastApprovedRound: team.latestRound.round,
        });

        count++;
      }
    });

    if (count > 0) {
      setApproving(true);
      try {
        await batch.commit();
        alert(`✅ Approved ${count} team${count > 1 ? 's' : ''}!`);
      } catch (error) {
        console.error('Error bulk approving:', error);
        alert('Failed to approve teams: ' + error.message);
      }
      setApproving(false);
    } else {
      alert('No teams ready for approval.\n\nMake sure:\n• All contracts are verified ✅\n• Team has a pending submission');
    }
  };

  // Calculate stats
  const stats = {
    totalContracts: 0,
    verifiedCount: 0,
    teamsReady: 0,
    teamsPending: 0
  };

  const teamsWithContracts = teams.map(team => {
    const contracts = getRequiredContracts(team, verifiedContracts[team.id] || {});
    const verifiedNum = contracts.filter(c => c.verified).length;
    const allVerified = contracts.length === 0 || contracts.every(c => c.verified);
    const isPending = !team.latestReview?.approved && team.latestRound;

    stats.totalContracts += contracts.length;
    stats.verifiedCount += verifiedNum;
    if (allVerified) stats.teamsReady++;
    if (isPending) stats.teamsPending++;

    return {
      ...team,
      contracts,
      allVerified,
      noneVerified: contracts.length > 0 && contracts.every(c => !c.verified),
      isPending
    };
  });

  if (loading) {
    return (
      <div className="contract-overview">
        <div className="co-loading">
          <RefreshCw size={24} className="spin" />
          <span>Loading contracts...</span>
        </div>
      </div>
    );
  }

  const pendingContracts = stats.totalContracts - stats.verifiedCount;

  return (
    <div className="contract-overview">
      <div className="co-header">
        <div className="co-title">
          <FileText size={24} />
          <div>
            <h2>Contract Verification</h2>
            <p className="co-subtitle">Quick-check physical documents for all teams</p>
          </div>
        </div>

        <div className="co-stats">
          <span className="stat">
            <strong>{stats.verifiedCount}</strong>/{stats.totalContracts} verified
          </span>
          <span className="stat">
            <strong>{stats.teamsReady}</strong>/{teams.length} teams ready
          </span>
        </div>

        <button
          className="approve-all-btn"
          onClick={approveAllVerified}
          disabled={approving}
        >
          {approving ? (
            <>
              <RefreshCw size={18} className="spin" />
              Approving...
            </>
          ) : (
            <>
              <CheckCircle size={18} />
              Approve All Verified
            </>
          )}
        </button>
      </div>

      {pendingContracts > 0 && (
        <div className="pending-banner">
          <AlertTriangle size={18} />
          <span><strong>{pendingContracts}</strong> contract{pendingContracts !== 1 ? 's' : ''} pending verification</span>
        </div>
      )}

      {stats.totalContracts === 0 && (
        <div className="no-contracts-banner">
          <CheckCircle size={18} />
          <span>No contracts required this round</span>
        </div>
      )}

      <div className="teams-contract-grid">
        {teamsWithContracts.map(team => (
          <div
            key={team.id}
            className={`team-contracts ${team.allVerified ? 'all-verified' : team.noneVerified ? 'none-verified' : 'partial'}`}
          >
            <div className="team-header">
              <span className="team-name">{team.teamName}</span>
              {team.latestRound && (
                <span className="round-badge">R{team.latestRound.round}</span>
              )}
            </div>

            {team.contracts.length === 0 ? (
              <div className="no-contracts">
                <CheckCircle size={14} />
                No contracts needed
              </div>
            ) : (
              <div className="contracts-list">
                {team.contracts.map(contract => (
                  <button
                    key={contract.id}
                    className={`contract-btn ${contract.verified ? 'verified' : ''}`}
                    onClick={() => toggleContract(team.id, contract.id)}
                  >
                    <span className="contract-icon">{contract.icon}</span>
                    <span className="contract-name">{contract.name}</span>
                    {contract.verified ? (
                      <CheckCircle size={16} className="check verified" />
                    ) : (
                      <Square size={16} className="check" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {team.isPending && team.allVerified && (
              <div className="ready-badge">
                <CheckCircle size={12} />
                Ready to approve
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ContractOverview;
