import React, { useState } from 'react';
import { doc, updateDoc, serverTimestamp, setDoc, collection } from 'firebase/firestore';
import { db } from '../config/firebase';
import './EditTeamModal.css';

const EditTeamModal = ({ team, gameId, onClose, onSaved }) => {
  // Get latest round data
  const latestRound = team.latestRound || {};
  const progress = latestRound.progress || team.progress || {};

  // Editable fields
  const [formData, setFormData] = useState({
    cash: progress.cash ?? team.cash ?? 5000,
    trl: progress.trl ?? progress.currentTRL ?? team.trl ?? 3,
    interviewCount: progress.interviews ?? progress.interviewsTotal ?? team.interviewCount ?? 0,
    validationCount: progress.validations ?? progress.validationsTotal ?? team.validationCount ?? 0,
    investorEquity: progress.investorEquity ?? team.investorEquity ?? 0,
    employees: team.employees ?? 0,
    currentRound: latestRound.round ?? team.currentRound ?? 1,
    employmentStatus: team.employmentStatus ?? 'university',
    licenceAgreement: team.licenceAgreement ?? '',
    legalForm: latestRound.legalForm ?? team.legalForm ?? '',
    office: team.office ?? 'university',
  });

  const [editReason, setEditReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!editReason.trim()) {
      setError('Please provide a reason for the edit');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const teamId = team.oderId || team.id;
      const teamRef = doc(db, 'games', gameId, 'teams', teamId);

      // Prepare update data
      const updateData = {
        // Direct fields
        cash: Number(formData.cash),
        trl: Number(formData.trl),
        interviewCount: Number(formData.interviewCount),
        validationCount: Number(formData.validationCount),
        investorEquity: Number(formData.investorEquity),
        employees: Number(formData.employees),
        currentRound: Number(formData.currentRound),
        employmentStatus: formData.employmentStatus,
        licenceAgreement: formData.licenceAgreement || null,
        legalForm: formData.legalForm || null,
        office: formData.office,

        // Also update progress object for consistency
        'progress.cash': Number(formData.cash),
        'progress.trl': Number(formData.trl),
        'progress.currentTRL': Number(formData.trl),
        'progress.interviews': Number(formData.interviewCount),
        'progress.interviewsTotal': Number(formData.interviewCount),
        'progress.validations': Number(formData.validationCount),
        'progress.validationsTotal': Number(formData.validationCount),
        'progress.investorEquity': Number(formData.investorEquity),

        // Metadata
        lastEditedAt: serverTimestamp(),
        lastEditedBy: 'facilitator',
        lastEditReason: editReason,
      };

      await updateDoc(teamRef, updateData);

      // Also update the current round document
      const roundRef = doc(db, 'games', gameId, 'teams', teamId, 'rounds', String(formData.currentRound));
      try {
        await updateDoc(roundRef, {
          'progress.cash': Number(formData.cash),
          'progress.trl': Number(formData.trl),
          'progress.currentTRL': Number(formData.trl),
          'progress.interviews': Number(formData.interviewCount),
          'progress.interviewsTotal': Number(formData.interviewCount),
          'progress.validations': Number(formData.validationCount),
          'progress.validationsTotal': Number(formData.validationCount),
          'progress.investorEquity': Number(formData.investorEquity),
          employees: Number(formData.employees),
          employmentStatus: formData.employmentStatus,
          licenceAgreement: formData.licenceAgreement || null,
          legalForm: formData.legalForm || null,
          office: formData.office,
          facilitatorEdited: true,
          facilitatorEditReason: editReason,
          facilitatorEditAt: serverTimestamp(),
        });
      } catch (roundError) {
        console.log('Could not update round doc, may not exist:', roundError);
      }

      // Add to edit history
      const historyRef = doc(collection(db, 'games', gameId, 'teams', teamId, 'editHistory'));
      await setDoc(historyRef, {
        editedAt: serverTimestamp(),
        editedBy: 'facilitator',
        reason: editReason,
        changes: {
          before: {
            cash: progress.cash ?? team.cash ?? 0,
            trl: progress.trl ?? progress.currentTRL ?? team.trl ?? 3,
            interviewCount: progress.interviews ?? progress.interviewsTotal ?? team.interviewCount ?? 0,
            validationCount: progress.validations ?? progress.validationsTotal ?? team.validationCount ?? 0,
            investorEquity: progress.investorEquity ?? team.investorEquity ?? 0,
            employees: team.employees ?? 0,
            employmentStatus: team.employmentStatus ?? 'university',
            licenceAgreement: team.licenceAgreement ?? null,
            legalForm: latestRound.legalForm ?? team.legalForm ?? null,
            office: team.office ?? 'university',
          },
          after: formData,
        }
      });

      onSaved?.();
      onClose();
    } catch (err) {
      console.error('Failed to update team:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="edit-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Team: {team.teamName}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Financial */}
          <div className="edit-section">
            <h3>💰 Financial</h3>
            <div className="edit-grid">
              <div className="edit-field">
                <label>Cash (€)</label>
                <input
                  type="number"
                  value={formData.cash}
                  onChange={e => handleChange('cash', e.target.value)}
                />
              </div>
              <div className="edit-field">
                <label>Investor Equity (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.investorEquity}
                  onChange={e => handleChange('investorEquity', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="edit-section">
            <h3>📈 Progress</h3>
            <div className="edit-grid">
              <div className="edit-field">
                <label>TRL Level</label>
                <input
                  type="number"
                  min="3"
                  max="9"
                  value={formData.trl}
                  onChange={e => handleChange('trl', e.target.value)}
                />
              </div>
              <div className="edit-field">
                <label>Current Round</label>
                <input
                  type="number"
                  min="1"
                  max="4"
                  value={formData.currentRound}
                  onChange={e => handleChange('currentRound', e.target.value)}
                />
              </div>
              <div className="edit-field">
                <label>Customer Interviews</label>
                <input
                  type="number"
                  min="0"
                  value={formData.interviewCount}
                  onChange={e => handleChange('interviewCount', e.target.value)}
                />
              </div>
              <div className="edit-field">
                <label>Validations (LOIs)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.validationCount}
                  onChange={e => handleChange('validationCount', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Team */}
          <div className="edit-section">
            <h3>👥 Team & Status</h3>
            <div className="edit-grid">
              <div className="edit-field">
                <label>Employees</label>
                <input
                  type="number"
                  min="0"
                  value={formData.employees}
                  onChange={e => handleChange('employees', e.target.value)}
                />
              </div>
              <div className="edit-field">
                <label>Employment Status</label>
                <select
                  value={formData.employmentStatus}
                  onChange={e => handleChange('employmentStatus', e.target.value)}
                >
                  <option value="university">🏛️ University</option>
                  <option value="parttime">⚖️ Part-time</option>
                  <option value="fulltime">🚀 Full-time</option>
                </select>
              </div>
            </div>
          </div>

          {/* Legal & Contracts */}
          <div className="edit-section">
            <h3>📋 Legal & Contracts</h3>
            <div className="edit-grid">
              <div className="edit-field">
                <label>Legal Form</label>
                <select
                  value={formData.legalForm}
                  onChange={e => handleChange('legalForm', e.target.value)}
                >
                  <option value="">None</option>
                  <option value="bv">BV</option>
                  <option value="holding">Holding + BV</option>
                  <option value="none">No Legal Entity</option>
                </select>
              </div>
              <div className="edit-field">
                <label>Licence Agreement</label>
                <select
                  value={formData.licenceAgreement}
                  onChange={e => handleChange('licenceAgreement', e.target.value)}
                >
                  <option value="">None</option>
                  <option value="balanced">Balanced Deal</option>
                  <option value="revenueHeavy">Revenue-Based Royalty</option>
                  <option value="highPercentage">High Royalty Deal</option>
                  <option value="earlyPayments">Early Fixed Payments</option>
                  <option value="equity">University Takes Equity</option>
                </select>
              </div>
              <div className="edit-field">
                <label>Office</label>
                <select
                  value={formData.office}
                  onChange={e => handleChange('office', e.target.value)}
                >
                  <option value="university">University Office</option>
                  <option value="incubator">Incubator Space</option>
                  <option value="sciencepark">Science Park</option>
                  <option value="commercial">Commercial Office</option>
                </select>
              </div>
            </div>
          </div>

          {/* Edit Reason */}
          <div className="edit-section">
            <h3>📝 Reason for Edit</h3>
            <textarea
              className="edit-reason"
              placeholder="Why are you making this change? (e.g., 'Student entered wrong investment amount - should be €20,000 not €200,000')"
              value={editReason}
              onChange={e => setEditReason(e.target.value)}
              rows={3}
            />
          </div>

          {error && (
            <div className="edit-error">
              ⚠️ {error}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-save"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTeamModal;
