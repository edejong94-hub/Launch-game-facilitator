import React from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock,
  ChevronDown,
  ChevronRight,
  Banknote,
  Users,
  FileText
} from 'lucide-react';

export function TimelineView({ rounds, reviews, onSelectRound }) {
  const [expandedRound, setExpandedRound] = React.useState(null);

  const getActivityList = (activities) => {
    if (!activities) return [];
    return Object.entries(activities)
      .filter(([key, value]) => value === true)
      .map(([key]) => formatActivityName(key));
  };

  const formatActivityName = (key) => {
    const names = {
      customerInterviews: 'Customer Interviews',
      customerValidation: 'Customer Validation',
      kvkConsult: 'KVK Consult',
      networking: 'Networking',
      patentDIY: 'Patent (DIY)',
      patentOutsourced: 'Patent (Outsourced)',
      marketAnalysisDIY: 'Market Analysis (DIY)',
      marketAnalysisOutsourced: 'Market Analysis (Outsourced)',
      hireSenior: 'Hired Senior',
      subsidy: 'Subsidy Adviser',
      investorMeeting: 'Investor Meeting',
      pivot: 'Pivot'
    };
    return names[key] || key;
  };

  const getRoundStatus = (round, review) => {
    if (!review) return 'pending';
    if (review.approved) return 'approved';
    if (review.status === 'rejected') return 'rejected';
    return 'pending';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={20} className="status-icon approved" />;
      case 'rejected':
        return <XCircle size={20} className="status-icon rejected" />;
      default:
        return <Clock size={20} className="status-icon pending" />;
    }
  };

  if (!rounds || rounds.length === 0) {
    return (
      <div className="timeline-empty">
        <Clock size={32} className="text-muted" />
        <p>No rounds submitted yet</p>
      </div>
    );
  }

  return (
    <div className="timeline">
      {[1, 2, 3, 4].map((roundNum) => {
        const round = rounds.find(r => r.round === roundNum);
        const review = reviews[String(roundNum)];
        const status = round ? getRoundStatus(round, review) : 'future';
        const isExpanded = expandedRound === roundNum;
        const progress = round?.progress || {};

        return (
          <div 
            key={roundNum} 
            className={`timeline-item ${status} ${isExpanded ? 'expanded' : ''}`}
          >
            <div className="timeline-connector">
              <div className="connector-line top" />
              <div className="connector-dot">
                {round ? getStatusIcon(status) : <div className="dot-empty" />}
              </div>
              <div className="connector-line bottom" />
            </div>

            <div className="timeline-content">
              <div 
                className="timeline-header"
                onClick={() => round && setExpandedRound(isExpanded ? null : roundNum)}
              >
                <div className="round-title">
                  <h4>Round {roundNum}</h4>
                  {round?.submittedAt && (
                    <span className="submit-time">
                      {new Date(round.submittedAt?.toDate?.() || round.submittedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {round && (
                  <div className="round-summary">
                    <span className="summary-stat">
                      <Banknote size={14} />
                      €{(progress.cash || 0).toLocaleString()}
                    </span>
                    <span className="summary-stat">
                      <Clock size={14} />
                      {progress.developmentHours || 0}h
                    </span>
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>
                )}

                {!round && (
                  <span className="not-submitted">Not submitted</span>
                )}
              </div>

              {round && isExpanded && (
                <div className="timeline-details">
                  <div className="metrics-grid">
                    <div className="metric">
                      <span className="metric-label">Cash</span>
                      <span className="metric-value" data-negative={progress.cash < 0}>
                        €{(progress.cash || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Dev hours</span>
                      <span className="metric-value">{progress.developmentHours || 0}h</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Interviews</span>
                      <span className="metric-value">{progress.interviewsTotal || 0}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Validations</span>
                      <span className="metric-value">{progress.validationsTotal || 0}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Time spent</span>
                      <span className="metric-value">{progress.totalTimeSpent || 0}h</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Money spent</span>
                      <span className="metric-value">€{(progress.totalMoneySpent || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="activities-section">
                    <h5><FileText size={14} /> Activities</h5>
                    <div className="activity-tags">
                      {getActivityList(round.activities).map((activity, idx) => (
                        <span key={idx} className="activity-tag">{activity}</span>
                      ))}
                      {getActivityList(round.activities).length === 0 && (
                        <span className="text-muted">No activities selected</span>
                      )}
                    </div>
                  </div>

                  {round.funding && (
                    <div className="funding-section">
                      <h5><Banknote size={14} /> Funding this round</h5>
                      <div className="funding-items">
                        {Number(round.funding.revenue) > 0 && (
                          <span className="funding-item">
                            Revenue: €{Number(round.funding.revenue).toLocaleString()}
                          </span>
                        )}
                        {Number(round.funding.subsidy) > 0 && (
                          <span className="funding-item">
                            Subsidy: €{Number(round.funding.subsidy).toLocaleString()}
                          </span>
                        )}
                        {Number(round.funding.investment) > 0 && (
                          <span className="funding-item">
                            Investment: €{Number(round.funding.investment).toLocaleString()} 
                            ({round.funding.investorEquity}% equity)
                          </span>
                        )}
                        {Number(round.funding.loan) > 0 && (
                          <span className="funding-item">
                            Loan: €{Number(round.funding.loan).toLocaleString()} 
                            ({round.funding.loanInterest}% interest)
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="team-section">
                    <h5><Users size={14} /> Team</h5>
                    <div className="team-items">
                      <span>Founders: {round.founders}</span>
                      <span>Employees: {round.employees || 0}</span>
                      <span>Senior: {round.hasSenior ? 'Yes' : 'No'}</span>
                      <span>Office: {round.office || 'None'}</span>
                      <span>Legal: {round.legalForm?.toUpperCase() || '—'}</span>
                    </div>
                  </div>

                  {review?.notes && (
                    <div className="review-notes">
                      <h5>Facilitator notes</h5>
                      <p>{review.notes}</p>
                    </div>
                  )}

                  <button 
                    className="btn btn-secondary"
                    onClick={() => onSelectRound?.(roundNum)}
                  >
                    Review this round
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default TimelineView;