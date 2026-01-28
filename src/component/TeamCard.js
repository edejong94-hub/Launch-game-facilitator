import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Banknote,
  MessageSquare,
  Trophy,
  Star,
  XCircle,
  ChevronRight,
  Edit,
  FileCheck
} from 'lucide-react';

export function TeamCard({ team, gameId, onEdit }) {
  const {
    id,
    teamName,
    status,
    latestRound,
    latestReview,
    warnings = [],
    currentRound = 0,
    founderCount,
    cash,
    trl,
    employmentStatus
  } = team;

  const progress = latestRound?.progress || {};
  const roundNum = latestRound?.round || currentRound || 0;

  // Check if team is registered but hasn't started playing
  const isRegistered = currentRound === 0 && !latestRound;

  // Check if team needs review (has submitted but not yet reviewed)
  const isPendingReview = !isRegistered && (!latestReview || latestReview.status === 'pending');

  const getStatusBadge = () => {
    switch (status) {
      case 'winner':
        return <span className="status-badge gold"><Trophy size={12} /> Winner</span>;
      case 'coach_favorite':
        return <span className="status-badge purple"><Star size={12} /> Coach Pick</span>;
      case 'blocked':
        return <span className="status-badge red"><XCircle size={12} /> Blocked</span>;
      default:
        return null;
    }
  };

  // Format cash with K/M abbreviation for large numbers
  const formatCash = (amount) => {
    if (amount >= 1000000) return `€${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 10000) return `€${(amount / 1000).toFixed(0)}K`;
    return `€${amount.toLocaleString()}`;
  };

  const cashAmount = progress.cash ?? cash ?? 0;

  return (
    <div className={`team-card-v2 ${status === 'blocked' ? 'blocked' : ''} ${isRegistered ? 'registered' : ''} ${isPendingReview ? 'pending-review' : ''}`}>
      {/* Header */}
      <div className="card-header">
        <div className="team-info">
          <div className="team-name-row">
            {isPendingReview && <span className="pending-dot" title="Pending review" />}
            <h3 className="team-name">{teamName || 'Unnamed Team'}</h3>
            {getStatusBadge()}
          </div>
          <div className="round-pill">
            {isRegistered ? '📝 Registered' : `Round ${roundNum}`}
          </div>
        </div>
      </div>

      {/* Key Metrics - 2x2 Grid */}
      <div className="metrics-grid">
        <div className="metric">
          <Banknote size={16} className="metric-icon" />
          <div className="metric-content">
            <span className={`metric-value ${cashAmount < 0 ? 'negative' : cashAmount > 10000 ? 'positive' : ''}`}>
              {formatCash(cashAmount)}
            </span>
            <span className="metric-label">Cash</span>
          </div>
        </div>

        {isRegistered ? (
          <>
            <div className="metric">
              <Clock size={16} className="metric-icon" />
              <div className="metric-content">
                <span className="metric-value">TRL {trl || 3}</span>
                <span className="metric-label">Tech Level</span>
              </div>
            </div>
            <div className="metric">
              <MessageSquare size={16} className="metric-icon" />
              <div className="metric-content">
                <span className="metric-value">{founderCount || 0}</span>
                <span className="metric-label">Founders</span>
              </div>
            </div>
            <div className="metric">
              <FileCheck size={16} className="metric-icon" />
              <div className="metric-content">
                <span className="metric-value capitalize">{employmentStatus || 'University'}</span>
                <span className="metric-label">Status</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="metric">
              <Clock size={16} className="metric-icon" />
              <div className="metric-content">
                <span className="metric-value">{progress.developmentHours || 0}h</span>
                <span className="metric-label">Dev Hours</span>
              </div>
            </div>
            <div className="metric">
              <MessageSquare size={16} className="metric-icon" />
              <div className="metric-content">
                <span className="metric-value">{progress.interviewsTotal || progress.interviews || 0}</span>
                <span className="metric-label">Interviews</span>
              </div>
            </div>
            <div className="metric">
              <FileCheck size={16} className="metric-icon" />
              <div className="metric-content">
                <span className="metric-value">{progress.validationsTotal || progress.validations || 0}</span>
                <span className="metric-label">Validations</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Compact Warnings as Tags */}
      {warnings.length > 0 && (
        <div className="warning-tags">
          {warnings.slice(0, 3).map((warning, idx) => (
            <span key={idx} className={`warning-tag ${warning.type}`}>
              {warning.type === 'danger' ? <AlertTriangle size={10} /> : <AlertTriangle size={10} />}
              {warning.message.length > 25 ? warning.message.slice(0, 25) + '...' : warning.message}
            </span>
          ))}
          {warnings.length > 3 && (
            <span className="warning-tag more">+{warnings.length - 3} more</span>
          )}
        </div>
      )}

      {/* Footer with Status and Actions */}
      <div className="card-footer">
        <div className="status-indicator">
          {isRegistered ? (
            <span className="status waiting">
              <Clock size={14} />
              Waiting for Round 1
            </span>
          ) : isPendingReview ? (
            <span className="status pending">
              <Clock size={14} />
              <span className="pending-text">Pending review</span>
            </span>
          ) : latestReview?.approved ? (
            <span className="status approved">
              <CheckCircle size={14} />
              Approved
            </span>
          ) : (
            <span className="status rejected">
              <XCircle size={14} />
              Rejected
            </span>
          )}
        </div>

        <div className="card-actions">
          {onEdit && (
            <button
              className="btn-action edit"
              onClick={(e) => {
                e.preventDefault();
                onEdit(team);
              }}
              title="Edit team"
            >
              <Edit size={14} />
            </button>
          )}
          {!isRegistered && (
            <Link to={`/team/${id}`} className={`btn-action review ${isPendingReview ? 'primary' : ''}`}>
              Review
              <ChevronRight size={16} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default TeamCard;
