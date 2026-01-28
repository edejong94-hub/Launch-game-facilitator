import React, { useState, useEffect } from 'react';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { CheckCircle, XCircle, FileText, AlertTriangle } from 'lucide-react';
import './ContractVerification.css';

// Expert contract requirements
const EXPERT_CONTRACTS = {
  tto: {
    name: "TTO Officer",
    icon: "🏛️",
    contracts: [
      { id: "ttoMeeting", name: "TTO Meeting Notes", activities: ["ttoDiscussion"] },
      { id: "licenceAgreement", name: "Licence Agreement", activities: ["licenceNegotiation"] },
    ],
  },
  patent: {
    name: "Patent Attorney",
    icon: "⚖️",
    contracts: [
      { id: "patentStrategy", name: "Patent Strategy Form", activities: ["patentFiling", "patentDIY"] },
      { id: "ftoReport", name: "FTO Report", activities: ["patentSearch"] },
    ],
  },
  investor: {
    name: "VC / Investor",
    icon: "💰",
    contracts: [
      { id: "pitchDeck", name: "Pitch Deck Feedback", activities: ["investorMeeting"] },
      { id: "termSheet", name: "Term Sheet", activities: ["investorNegotiation"] },
    ],
  },
  grant: {
    name: "Grant Advisor",
    icon: "📋",
    contracts: [
      { id: "grantApplication", name: "Grant Application", activities: ["grantTakeoff", "grantWBSO", "grantRegional"] },
    ],
  },
  incubator: {
    name: "Incubator",
    icon: "🏢",
    contracts: [
      { id: "incubatorApp", name: "Incubator Application", activities: ["incubatorApplication"] },
    ],
  },
  bank: {
    name: "Bank / Loan Officer",
    icon: "🏦",
    contracts: [
      { id: "loanApplication", name: "Loan Application", activities: ["bankMeeting"] },
      { id: "loanAgreement", name: "Loan Agreement", activities: ["loanApplication"] },
    ],
  },
  industry: {
    name: "Industry Partner",
    icon: "🏭",
    contracts: [
      { id: "ndaAgreement", name: "NDA Agreement", activities: ["industryExploration"] },
      { id: "pilotAgreement", name: "Pilot Agreement", activities: ["pilotProject"] },
    ],
  },
  customer: {
    name: "Customer Expert",
    icon: "🎯",
    contracts: [
      { id: "interviewLog", name: "Interview Log", activities: ["customerInterviews"] },
      { id: "loi", name: "Letter of Intent", activities: ["customerValidation"] },
    ],
  },
};

export function ContractVerification({ gameId, teamId, teamData, roundData }) {
  const [verifiedContracts, setVerifiedContracts] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Get completed activities from round data
  const completedActivities = roundData?.completedActivities || [];
  const currentActivities = roundData?.activities || {};

  // Combine completed and current activities
  const allActivities = [
    ...completedActivities,
    ...Object.keys(currentActivities).filter(k => currentActivities[k]),
  ];

  // Load verified contracts from Firebase
  useEffect(() => {
    if (!gameId || !teamId) return;

    const contractsRef = doc(db, 'games', gameId, 'teams', teamId);
    
    const unsubscribe = onSnapshot(contractsRef, (snapshot) => {
      if (snapshot.exists()) {
        setVerifiedContracts(snapshot.data().verifiedContracts || {});
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [gameId, teamId]);

  // Check if an activity requires a contract that hasn't been verified
  const getContractStatus = (contractId, activities) => {
    const activityDone = activities.some(act => allActivities.includes(act));
    const isVerified = verifiedContracts[contractId];
    
    return {
      required: activityDone,
      verified: isVerified,
      missing: activityDone && !isVerified,
    };
  };

  // Toggle contract verification
  const toggleContract = async (contractId) => {
    if (!gameId || !teamId) return;
    
    setSaving(true);
    try {
      const newVerified = {
        ...verifiedContracts,
        [contractId]: !verifiedContracts[contractId],
      };
      
      await updateDoc(doc(db, 'games', gameId, 'teams', teamId), {
        verifiedContracts: newVerified,
      });
      
      setVerifiedContracts(newVerified);
    } catch (err) {
      console.error('Error updating contract verification:', err);
    }
    setSaving(false);
  };

  // Count missing contracts
  const missingContracts = Object.values(EXPERT_CONTRACTS).flatMap(expert =>
    expert.contracts.filter(contract => {
      const status = getContractStatus(contract.id, contract.activities);
      return status.missing;
    })
  );

  if (loading) {
    return <div className="contract-verification loading">Loading contracts...</div>;
  }

  return (
    <div className="contract-verification">
      <div className="cv-header">
        <FileText size={20} />
        <h3>Contract Verification</h3>
        {missingContracts.length > 0 && (
          <span className="missing-badge">
            <AlertTriangle size={14} />
            {missingContracts.length} missing
          </span>
        )}
      </div>
      
      <p className="cv-description">
        Compare physical contracts with digital submission
      </p>

      <div className="experts-list">
        {Object.entries(EXPERT_CONTRACTS).map(([expertId, expert]) => {
          const expertContracts = expert.contracts.map(contract => ({
            ...contract,
            status: getContractStatus(contract.id, contract.activities),
          }));

          // Only show experts with relevant contracts
          const hasRelevantContracts = expertContracts.some(c => c.status.required);
          if (!hasRelevantContracts) return null;

          return (
            <div key={expertId} className="expert-section">
              <div className="expert-header">
                <span className="expert-icon">{expert.icon}</span>
                <span className="expert-name">{expert.name}</span>
              </div>
              
              <div className="contracts-list">
                {expertContracts.filter(c => c.status.required).map(contract => (
                  <div
                    key={contract.id}
                    className={`contract-item ${contract.status.verified ? 'verified' : 'missing'}`}
                    onClick={() => toggleContract(contract.id)}
                  >
                    <div className="contract-checkbox">
                      {contract.status.verified ? (
                        <CheckCircle size={18} className="check-icon verified" />
                      ) : (
                        <XCircle size={18} className="check-icon missing" />
                      )}
                    </div>
                    <span className="contract-name">{contract.name}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {Object.keys(EXPERT_CONTRACTS).every(expertId => {
        const expert = EXPERT_CONTRACTS[expertId];
        return !expert.contracts.some(c => getContractStatus(c.id, c.activities).required);
      }) && (
        <div className="no-contracts">
          <p>No expert interactions yet this round.</p>
          <p className="hint">Contracts will appear as the team completes activities.</p>
        </div>
      )}

      {saving && <div className="saving-indicator">Saving...</div>}
    </div>
  );
}

export default ContractVerification;