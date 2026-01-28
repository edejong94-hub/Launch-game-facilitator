import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Save,
  Edit3,
  MessageSquare
} from 'lucide-react';
import { ContractChecklist } from './ContractChecklist';
import { 
  updateContractCheck, 
  addOverride,
  approveRound,
  rejectRound,
  addNote
} from '../hooks/useReviews';

export function RoundReview({ 
  gameId, 
  teamId, 
  teamName,
  roundData, 
  existingReview,
  userEmail,
  onClose 
}) {
  const [contractChecks, setContractChecks] = useState(existingReview?.contractChecks || {});
  const [overrides, setOverrides] = useState(existingReview?.overrides || {});
  const [notes, setNotes] = useState(existingReview?.notes || '');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingOverride, setEditingOverride] = useState(null);

  const roundNum = roundData?.round || 0;
  const progress = roundData?.progress || {};

  const allContractsApproved = () => {
    const checks = Object.values(contractChecks);
    if (checks.length === 0) return true;
    return checks.every(c => c.approved === true);
  };

  const handleContractChange = async (contractType, checkData) => {
    const newChecks = { ...contractChecks, [contractType]: checkData };
    setContractChecks(newChecks);
    
    try {
      await updateContractCheck(gameId, teamId, roundNum, contractType, checkData);
    } catch (err) {
      console.error('Error saving contract check:', err);
    }
  };

  const handleAddOverride = async (fieldPath, originalValue, correctedValue, reason) => {
    if (!fieldPath || correctedValue === undefined) return;
    
    const key = fieldPath.replace('.', '_');
    const newOverrides = {
      ...overrides,
      [key]: { field: fieldPath, original: originalValue, corrected: correctedValue, reason }
    };
    setOverrides(newOverrides);
    setEditingOverride(null);

    try {
      await addOverride(gameId, teamId, roundNum, fieldPath, originalValue, correctedValue, reason);
    } catch (err) {
      console.error('Error saving override:', err);
    }
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      await addNote(gameId, teamId, roundNum, notes);
    } catch (err) {
      console.error('Error saving notes:', err);
    }
    setSaving(false);
  };

  const handleApprove = async () => {
    if (!allContractsApproved()) {
      alert('Please approve all contracts before approving the round.');
      return;
    }

    setSaving(true);
    try {
      await approveRound(gameId, teamId, roundNum, userEmail);
      onClose?.();
    } catch (err) {
      console.error('Error approving round:', err);
      alert('Failed to approve round. Please try again.');
    }
    setSaving(false);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }

    setSaving(true);
    try {
      await rejectRound(gameId, teamId, roundNum, userEmail, rejectReason);
      setShowRejectModal(false);
      onClose?.();
    } catch (err) {
      console.error('Error rejecting round:', err);
      alert('Failed to reject round. Please try again.');
    }
    setSaving(false);
  };

  const overridableFields = [
    { path: 'funding.revenue', label: 'Revenue', current: roundData?.funding?.revenue },
    { path: 'funding.subsidy', label: 'Subsidy', current: roundData?.funding?.subsidy },
    { path: 'funding.subsidyFee', label: 'Subsidy Fee', current: roundData?.funding?.subsidyFee },
    { path: 'funding.investment', label: 'Investment', current: roundData?.funding?.investment },
    { path: 'funding.investorEquity', label: 'Investor Equity %', current: roundData?.funding?.investorEquity },
    { path: 'funding.loan', label: 'Loan', current: roundData?.funding?.loan },
    { path: 'funding.loanInterest', label: 'Loan Interest %', current: roundData?.funding?.loanInterest },
  ];

  return (
    <div className="round-review">
      <div className="review-header">
        <div>
          <h2>Review Round {roundNum}</h2>
          <p className="team-name-sub">{teamName}</p>
        </div>
        <div className="review-status-badge">
          {existingReview?.approved === true && (
            <span className="badge badge-green"><CheckCircle size={14} /> Approved</span>
          )}
          {existingReview?.approved === false && (
            <span className="badge badge-red"><XCircle size={14} /> Rejected</span>
          )}
          {existingReview?.approved === undefined && (
            <span className="badge badge-gray">Pending</span>
          )}
        </div>
      </div>

      <div className="progress-summary">
        <h4>Submitted Progress</h4>
        <div className="progress-grid">
          <div className="progress-item">
            <span className="label">Cash</span>
            <span className="value" data-negative={progress.cash < 0}>
              €{(progress.cash || 0).toLocaleString()}
            </span>
          </div>
          <div className="progress-item">
            <span className="label">Dev Hours</span>
            <span className="value">{progress.developmentHours || 0}</span>
          </div>
          <div className="progress-item">
            <span className="label">Interviews</span>
            <span className="value">{progress.interviewsTotal || 0}</span>
          </div>
          <div className="progress-item">
            <span className="label">Validations</span>
            <span className="value">{progress.validationsTotal || 0}</span>
          </div>
          <div className="progress-item">
            <span className="label">Bank Trust</span>
            <span className="value">{progress.bankTrust || 0}/5</span>
          </div>
          <div className="progress-item">
            <span className="label">Investor Appeal</span>
            <span className="value">{progress.investorAppeal || 0}/5</span>
          </div>
        </div>
      </div>

      <ContractChecklist
        roundData={roundData}
        existingChecks={contractChecks}
        onCheckChange={handleContractChange}
        disabled={existingReview?.approved === true}
      />

      <div className="overrides-section">
        <div className="section-header">
          <h4><Edit3 size={16} /> Value Overrides</h4>
          <p className="text-muted">Correct values that don't match physical contracts</p>
        </div>

        {Object.keys(overrides).length > 0 && (
          <div className="existing-overrides">
            {Object.entries(overrides).map(([key, override]) => (
              <div key={key} className="override-item">
                <div className="override-info">
                  <span className="override-field">{override.field}</span>
                  <span className="override-change">
                    <span className="old-value">€{override.original}</span>
                    <span className="arrow">→</span>
                    <span className="new-value">€{override.corrected}</span>
                  </span>
                </div>
                {override.reason && (
                  <span className="override-reason">{override.reason}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {editingOverride ? (
          <div className="override-form">
            <select 
              className="form-select"
              value={editingOverride.path || ''}
              onChange={(e) => setEditingOverride({ ...editingOverride, path: e.target.value })}
            >
              <option value="">Select field to override...</option>
              {overridableFields.map(f => (
                <option key={f.path} value={f.path}>
                  {f.label} (current: €{f.current || 0})
                </option>
              ))}
            </select>
            <input
              type="number"
              className="form-input"
              placeholder="Corrected value"
              value={editingOverride.corrected || ''}
              onChange={(e) => setEditingOverride({ ...editingOverride, corrected: e.target.value })}
            />
            <input
              type="text"
              className="form-input"
              placeholder="Reason for override"
              value={editingOverride.reason || ''}
              onChange={(e) => setEditingOverride({ ...editingOverride, reason: e.target.value })}
            />
            <div className="override-actions">
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => {
                  const field = overridableFields.find(f => f.path === editingOverride.path);
                  handleAddOverride(
                    editingOverride.path,
                    field?.current || 0,
                    Number(editingOverride.corrected),
                    editingOverride.reason
                  );
                }}
              >
                Save Override
              </button>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => setEditingOverride(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setEditingOverride({})}
            disabled={existingReview?.approved === true}
          >
            + Add Override
          </button>
        )}
      </div>

      <div className="notes-section">
        <div className="section-header">
          <h4><MessageSquare size={16} /> Facilitator Notes</h4>
        </div>
        <textarea
          className="form-textarea"
          placeholder="Add notes about this team's progress, feedback, or concerns..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
        />
        <button 
          className="btn btn-secondary btn-sm"
          onClick={handleSaveNotes}
          disabled={saving}
        >
          <Save size={14} /> Save Notes
        </button>
      </div>

      <div className="review-actions">
        {existingReview?.approved !== true && (
          <>
            <button 
              className="btn btn-danger"
              onClick={() => setShowRejectModal(true)}
              disabled={saving}
            >
              <XCircle size={16} /> Block Team
            </button>
            <button 
              className="btn btn-success"
              onClick={handleApprove}
              disabled={saving || !allContractsApproved()}
            >
              <CheckCircle size={16} /> Approve Round
            </button>
          </>
        )}
        {existingReview?.approved === true && (
          <p className="approved-message">
            <CheckCircle size={16} /> This round has been approved
          </p>
        )}
      </div>

      {showRejectModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3><AlertTriangle size={20} /> Block Team</h3>
            <p>This will prevent the team from continuing to the next round until issues are resolved.</p>
            <textarea
              className="form-textarea"
              placeholder="Reason for blocking (required)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowRejectModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleReject}
                disabled={saving || !rejectReason.trim()}
              >
                Block Team
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoundReview;