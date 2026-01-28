import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, collection, onSnapshot, updateDoc, setDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  ArrowLeft, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  FileText,
  Beaker,
  Target,
  Building,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from 'lucide-react';
import './TeamPage.css';

import ContractVerification from '../component/ContractVerification';
import '../component/ContractVerification.css';

export function TeamPage({ gameId }) {
  const { teamId: oderId } = useParams();
  const navigate = useNavigate();
  
  const [team, setTeam] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRound, setExpandedRound] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Load team data
  useEffect(() => {
    if (!gameId || !oderId) {
      console.log('Missing gameId or oderId:', { gameId, oderId });
      setLoading(false);
      return;
    }

    console.log('Loading team with gameId:', gameId, 'oderId:', oderId);
    let unsubRounds = null;

    const teamsRef = collection(db, 'games', gameId, 'teams');
    
    const unsubTeams = onSnapshot(teamsRef, (snapshot) => {
      console.log('Teams snapshot received, count:', snapshot.docs.length);
      
      // Try to find by oderId field first
      let teamDoc = snapshot.docs.find(d => d.data().oderId === oderId);
      
      // If not found by oderId, try to find by document ID
      if (!teamDoc) {
        teamDoc = snapshot.docs.find(d => d.id === oderId);
        console.log('Tried finding by doc ID:', teamDoc ? 'found' : 'not found');
      }
      
      if (teamDoc) {
        const teamData = { id: teamDoc.id, ...teamDoc.data() };
        console.log('Team found:', teamData.teamName, 'docId:', teamDoc.id);
        setTeam(teamData);
        setError(null);
        
        // Load rounds for this team using the document ID
        const roundsRef = collection(db, 'games', gameId, 'teams', teamDoc.id, 'rounds');
        const roundsQuery = query(roundsRef, orderBy('round', 'desc'));
        
        // Clean up previous rounds subscription if exists
        if (unsubRounds) {
          unsubRounds();
        }
        
        unsubRounds = onSnapshot(roundsQuery, (roundsSnap) => {
          console.log('Rounds snapshot received, count:', roundsSnap.docs.length);
          const roundsData = roundsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          setRounds(roundsData);
          
          // Auto-expand latest round
          if (roundsData.length > 0) {
            setExpandedRound(prev => prev || roundsData[0].id);
          }
          setLoading(false);
        }, (err) => {
          console.error('Error loading rounds:', err);
          setError('Failed to load rounds: ' + err.message);
          setLoading(false);
        });
      } else {
        console.log('Team not found. Available teams:', snapshot.docs.map(d => ({
          id: d.id,
          oderId: d.data().oderId,
          teamName: d.data().teamName
        })));
        setError(`Team not found. Looking for: ${oderId}`);
        setLoading(false);
      }
    }, (err) => {
      console.error('Error loading teams:', err);
      setError('Failed to load teams: ' + err.message);
      setLoading(false);
    });

    return () => {
      unsubTeams();
      if (unsubRounds) unsubRounds();
    };
  }, [gameId, oderId]);

  // Approve/Reject round
  const handleReview = async (roundId, approved) => {
    if (!team) return;
    setSaving(true);
    
    try {
      // Update the round with review status
      const roundRef = doc(db, 'games', gameId, 'teams', team.id, 'rounds', roundId);
      await updateDoc(roundRef, {
        review: {
          approved,
          note: reviewNote,
          reviewedAt: new Date().toISOString(),
        }
      });

      // ALSO create/update the reviews subcollection for the student app to check
      const reviewRef = doc(db, 'games', gameId, 'teams', team.id, 'reviews', roundId);
      await setDoc(reviewRef, {
        approved,
        note: reviewNote,
        reviewedAt: new Date().toISOString(),
      });

      setReviewNote('');
    } catch (err) {
      console.error('Error reviewing round:', err);
      setError('Failed to save review: ' + err.message);
    }
    
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="team-page loading">
        <div className="spinner" />
        <p>Loading team...</p>
        {error && <p className="error-message" style={{ color: '#ef4444', marginTop: '1rem' }}>{error}</p>}
      </div>
    );
  }

  if (!team) {
    return (
      <div className="team-page not-found">
        <AlertTriangle size={48} />
        <h2>Team Not Found</h2>
        <p>Could not find team with ID: {oderId}</p>
        {error && <p className="error-detail" style={{ color: '#ef4444', fontSize: '0.875rem' }}>{error}</p>}
        <p className="debug-info" style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '1rem' }}>Game ID: {gameId}</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const latestRound = rounds[0];
  const isResearchMode = team.gameMode === 'research';

  return (
    <div className="team-page">
      {/* Header */}
      <div className="team-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          Back
        </button>
        <div className="team-title">
          <h1>{team.teamName}</h1>
          <span className="team-id">ID: {oderId}</span>
        </div>
        <div className={`mode-badge ${team.gameMode}`}>
          {team.gameMode === 'research' ? '🔬 Research' : '🚀 Startup'}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <DollarSign size={24} />
          <div className="metric-info">
            <span className="metric-value">
              €{(latestRound?.progress?.cash || latestRound?.cash || team.cash || 0).toLocaleString()}
            </span>
            <span className="metric-label">Cash</span>
          </div>
        </div>
        
        {isResearchMode ? (
          <div className="metric-card">
            <Beaker size={24} />
            <div className="metric-info">
              <span className="metric-value">
                TRL {latestRound?.progress?.currentTRL || latestRound?.trl || team.trl || 3}
              </span>
              <span className="metric-label">Technology Level</span>
            </div>
          </div>
        ) : (
          <div className="metric-card">
            <TrendingUp size={24} />
            <div className="metric-info">
              <span className="metric-value">
                {latestRound?.progress?.developmentHours || 0}h
              </span>
              <span className="metric-label">Dev Hours</span>
            </div>
          </div>
        )}
        
        <div className="metric-card">
          <Target size={24} />
          <div className="metric-info">
            <span className="metric-value">
              {latestRound?.progress?.validationsTotal || latestRound?.validationCount || 0}
            </span>
            <span className="metric-label">Validations</span>
          </div>
        </div>
        
        <div className="metric-card">
          <Users size={24} />
          <div className="metric-info">
            <span className="metric-value">
              {100 - (latestRound?.progress?.investorEquity || latestRound?.funding?.investorEquity || 0)}%
            </span>
            <span className="metric-label">Equity</span>
          </div>
        </div>
      </div>

      {/* Research Mode Specific Info */}
      {isResearchMode && (
        <div className="research-info">
          <h3>Research Mode Details</h3>
          <div className="research-grid">
            <div className="research-item">
              <span className="label">Team Profiles</span>
              <span className="value">
                {team.teamProfiles?.filter(p => p).map(p => {
                  const icons = { scientist: '🔬', product: '🎨', business: '💼', operations: '📊', market: '🎯' };
                  return icons[p] || p;
                }).join(' ') || 'Not set'}
              </span>
            </div>
            <div className="research-item">
              <span className="label">Licence Agreement</span>
              <span className={`value ${team.licenceAgreement === 'balanced' ? 'good' : team.licenceAgreement ? 'warning' : ''}`}>
                {team.licenceAgreement || 'Not selected'}
              </span>
            </div>
            <div className="research-item">
              <span className="label">Legal Form</span>
              <span className="value">{latestRound?.legalForm || 'None'}</span>
            </div>
            <div className="research-item">
              <span className="label">Office</span>
              <span className="value">{latestRound?.office || team.office || 'Not set'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Startup Idea */}
      {team.startupIdea && (
        <div className="startup-idea-section">
          <h3>Startup Idea</h3>
          <div className="idea-grid">
            <div className="idea-item">
              <span className="label">Technology</span>
              <span className="value">{team.startupIdea.technique || '-'}</span>
            </div>
            <div className="idea-item">
              <span className="label">Product</span>
              <span className="value">{team.startupIdea.productIdea || '-'}</span>
            </div>
            <div className="idea-item">
              <span className="label">Problem</span>
              <span className="value">{team.startupIdea.problem || '-'}</span>
            </div>
            <div className="idea-item">
              <span className="label">Target Market</span>
              <span className="value">{team.startupIdea.segment || '-'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Contract Verification */}
      <ContractVerification
        gameId={gameId}
        teamId={team.id}
        teamData={team}
        roundData={latestRound}
      />

      {/* Rounds */}
      <div className="rounds-section">
        <h3>Round History</h3>
        
        {rounds.length === 0 ? (
          <div className="no-rounds">
            <Clock size={32} />
            <p>No rounds submitted yet</p>
          </div>
        ) : (
          <div className="rounds-list">
            {rounds.map((round) => (
              <div 
                key={round.id} 
                className={`round-card ${expandedRound === round.id ? 'expanded' : ''}`}
              >
                <div 
                  className="round-header"
                  onClick={() => setExpandedRound(expandedRound === round.id ? null : round.id)}
                >
                  <div className="round-title">
                    <span className="round-number">Round {round.round}</span>
                    {round.review?.approved === true && (
                      <span className="status approved"><CheckCircle size={16} /> Approved</span>
                    )}
                    {round.review?.approved === false && (
                      <span className="status rejected"><XCircle size={16} /> Rejected</span>
                    )}
                    {!round.review && (
                      <span className="status pending"><Clock size={16} /> Pending</span>
                    )}
                  </div>
                  <div className="round-summary">
                    <span>€{(round.progress?.cash || round.cash || 0).toLocaleString()}</span>
                    {isResearchMode && <span>TRL {round.progress?.currentTRL || round.trl || 3}</span>}
                    <span>{round.completedActivities?.length || 0} activities</span>
                  </div>
                  {expandedRound === round.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>

                {expandedRound === round.id && (
                  <div className="round-details">
                    {/* Activities */}
                    <div className="detail-section">
                      <h4>Activities Completed</h4>
                      {round.completedActivities?.length > 0 ? (
                        <ul className="activities-list">
                          {round.completedActivities.map((activity, i) => (
                            <li key={i}>{activity}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="no-data">No activities this round</p>
                      )}
                    </div>

                    {/* Progress Details */}
                    <div className="detail-section">
                      <h4>Progress</h4>
                      <div className="progress-grid">
                        <div className="progress-item">
                          <span className="label">Cash</span>
                          <span className="value">€{(round.progress?.cash || round.cash || 0).toLocaleString()}</span>
                        </div>
                        <div className="progress-item">
                          <span className="label">Interviews</span>
                          <span className="value">{round.progress?.interviewsTotal || round.interviewCount || 0}</span>
                        </div>
                        <div className="progress-item">
                          <span className="label">Validations</span>
                          <span className="value">{round.progress?.validationsTotal || round.validationCount || 0}</span>
                        </div>
                        <div className="progress-item">
                          <span className="label">Investor Appeal</span>
                          <span className="value">{round.progress?.investorAppeal || 2}/5</span>
                        </div>
                        <div className="progress-item">
                          <span className="label">Bank Trust</span>
                          <span className="value">{round.progress?.bankTrust || 2}/5</span>
                        </div>
                        {isResearchMode && (
                          <div className="progress-item">
                            <span className="label">TRL</span>
                            <span className="value">{round.progress?.currentTRL || round.trl || 3}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Funding */}
                    {round.funding && (Object.values(round.funding).some(v => Number(v) > 0)) && (
                      <div className="detail-section">
                        <h4>Funding</h4>
                        <div className="progress-grid">
                          {Number(round.funding.investment) > 0 && (
                            <div className="progress-item">
                              <span className="label">Investment</span>
                              <span className="value">€{Number(round.funding.investment).toLocaleString()}</span>
                            </div>
                          )}
                          {Number(round.funding.subsidy) > 0 && (
                            <div className="progress-item">
                              <span className="label">Grant/Subsidy</span>
                              <span className="value">€{Number(round.funding.subsidy).toLocaleString()}</span>
                            </div>
                          )}
                          {Number(round.funding.loan) > 0 && (
                            <div className="progress-item">
                              <span className="label">Loan</span>
                              <span className="value">€{Number(round.funding.loan).toLocaleString()}</span>
                            </div>
                          )}
                          {Number(round.funding.investorEquity) > 0 && (
                            <div className="progress-item warning">
                              <span className="label">Equity Given</span>
                              <span className="value">{round.funding.investorEquity}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Review Section */}
                    {!round.review ? (
                      <div className="review-section">
                        <h4>Review Round</h4>
                        <textarea
                          value={reviewNote}
                          onChange={(e) => setReviewNote(e.target.value)}
                          placeholder="Add notes for the team (optional)..."
                        />
                        <div className="review-actions">
                          <button 
                            className="approve-btn"
                            onClick={() => handleReview(round.id, true)}
                            disabled={saving}
                          >
                            <CheckCircle size={18} />
                            {saving ? 'Saving...' : 'Approve'}
                          </button>
                          <button 
                            className="reject-btn"
                            onClick={() => handleReview(round.id, false)}
                            disabled={saving}
                          >
                            <XCircle size={18} />
                            {saving ? 'Saving...' : 'Reject'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="review-result">
                        <h4>Review</h4>
                        <div className={`review-status ${round.review.approved ? 'approved' : 'rejected'}`}>
                          {round.review.approved ? (
                            <><CheckCircle size={18} /> Approved</>
                          ) : (
                            <><XCircle size={18} /> Rejected</>
                          )}
                        </div>
                        {round.review.note && (
                          <div className="review-note">
                            <MessageSquare size={16} />
                            {round.review.note}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TeamPage;