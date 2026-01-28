import React, { useState } from 'react';
import { 
  Check, 
  X, 
  MessageSquare, 
  AlertTriangle,
  Building2,
  Landmark,
  FileText,
  Network,
  Lightbulb,
  Users,
  Cpu,
  Briefcase
} from 'lucide-react';

const CONTRACT_TYPES = {
  bank: { label: 'Bank', icon: Landmark, color: '#2563eb' },
  investor: { label: 'Investor', icon: Briefcase, color: '#7c3aed' },
  patent: { label: 'Patent Expert', icon: FileText, color: '#0891b2' },
  incubator: { label: 'Incubator', icon: Building2, color: '#059669' },
  subsidy: { label: 'Subsidy Adviser', icon: Lightbulb, color: '#d97706' },
  networker: { label: 'Networker', icon: Network, color: '#dc2626' },
  techExpert: { label: 'Tech Expert', icon: Cpu, color: '#4f46e5' },
  kvk: { label: 'KVK Expert', icon: Users, color: '#0d9488' }
};

export function ContractChecklist({ 
  roundData, 
  existingChecks = {}, 
  onCheckChange,
  disabled = false
}) {
  const [expandedContract, setExpandedContract] = useState(null);
  const [comments, setComments] = useState({});

  const getRequiredContracts = () => {
    const activities = roundData?.activities || {};
    const funding = roundData?.funding || {};
    const required = [];

    if (activities.kvkConsult) required.push('kvk');
    if (Number(funding.loan) > 0) required.push('bank');
    if (Number(funding.investment) > 0) required.push('investor');
    if (activities.patentDIY || activities.patentOutsourced) required.push('patent');
    if (roundData?.office === 'incubator') required.push('incubator');
    if (activities.subsidy || Number(funding.subsidy) > 0) required.push('subsidy');
    if (activities.networking) required.push('networker');
    if (activities.marketAnalysisDIY || activities.marketAnalysisOutsourced) {
      required.push('techExpert');
    }

    return required;
  };

  const requiredContracts = getRequiredContracts();

  const handleToggleCheck = (contractType, field, value) => {
    if (disabled) return;
    
    const currentCheck = existingChecks[contractType] || {};
    const updatedCheck = {
      ...currentCheck,
      [field]: value,
      comment: comments[contractType] || currentCheck.comment || ''
    };
    
    onCheckChange?.(contractType, updatedCheck);
  };

  const handleCommentChange = (contractType, comment) => {
    setComments(prev => ({ ...prev, [contractType]: comment }));
  };

  const handleCommentSave = (contractType) => {
    if (disabled) return;
    
    const currentCheck = existingChecks[contractType] || {};
    const updatedCheck = {
      ...currentCheck,
      comment: comments[contractType] || ''
    };
    
    onCheckChange?.(contractType, updatedCheck);
  };

  const getContractDetails = (type) => {
    const funding = roundData?.funding || {};
    const activities = roundData?.activities || {};

    switch (type) {
      case 'bank':
        return {
          fields: [
            { label: 'Loan amount', value: `€${Number(funding.loan || 0).toLocaleString()}` },
            { label: 'Interest rate', value: `${funding.loanInterest || 0}%` }
          ]
        };
      case 'investor':
        return {
          fields: [
            { label: 'Investment', value: `€${Number(funding.investment || 0).toLocaleString()}` },
            { label: 'Equity given', value: `${funding.investorEquity || 0}%` }
          ]
        };
      case 'subsidy':
        return {
          fields: [
            { label: 'Subsidy received', value: `€${Number(funding.subsidy || 0).toLocaleString()}` },
            { label: 'Adviser fee', value: `€${Number(funding.subsidyFee || 0).toLocaleString()}` }
          ]
        };
      case 'kvk':
        return {
          fields: [
            { label: 'Legal form chosen', value: roundData?.legalForm?.toUpperCase() || 'Unknown' }
          ]
        };
      default:
        return { fields: [] };
    }
  };

  if (requiredContracts.length === 0) {
    return (
      <div className="contract-checklist empty">
        <p className="text-muted">No contracts to verify this round.</p>
      </div>
    );
  }

  return (
    <div className="contract-checklist">
      <div className="checklist-header">
        <h4>Contract Verification</h4>
        <p className="text-muted">Compare physical contracts with digital submission</p>
      </div>

      <div className="contracts-list">
        {requiredContracts.map(type => {
          const config = CONTRACT_TYPES[type];
          const check = existingChecks[type] || {};
          const details = getContractDetails(type);
          const isExpanded = expandedContract === type;
          const Icon = config.icon;

          return (
            <div 
              key={type} 
              className={`contract-item ${check.approved ? 'approved' : ''} ${check.approved === false ? 'rejected' : ''}`}
            >
              <div 
                className="contract-header"
                onClick={() => setExpandedContract(isExpanded ? null : type)}
              >
                <div className="contract-info">
                  <div 
                    className="contract-icon" 
                    style={{ backgroundColor: `${config.color}15`, color: config.color }}
                  >
                    <Icon size={18} />
                  </div>
                  <div>
                    <span className="contract-label">{config.label}</span>
                    {check.checked && (
                      <span className={`check-status ${check.approved ? 'approved' : 'rejected'}`}>
                        {check.approved ? 'Approved' : 'Issues found'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="contract-actions">
                  <button
                    className={`action-btn approve ${check.approved === true ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleCheck(type, 'checked', true);
                      handleToggleCheck(type, 'approved', true);
                    }}
                    disabled={disabled}
                    title="Approve"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    className={`action-btn reject ${check.approved === false ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleCheck(type, 'checked', true);
                      handleToggleCheck(type, 'approved', false);
                      setExpandedContract(type);
                    }}
                    disabled={disabled}
                    title="Reject"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="contract-details">
                  <div className="detail-fields">
                    <p className="detail-heading">Submitted values:</p>
                    {details.fields.map((field, idx) => (
                      <div key={idx} className="detail-row">
                        <span className="field-label">{field.label}</span>
                        <span className="field-value">{field.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="comment-section">
                    <label className="comment-label">
                      <MessageSquare size={14} />
                      Note / reason for rejection
                    </label>
                    <textarea
                      className="comment-input"
                      placeholder="Add a note about this contract..."
                      value={comments[type] ?? check.comment ?? ''}
                      onChange={(e) => handleCommentChange(type, e.target.value)}
                      onBlur={() => handleCommentSave(type)}
                      disabled={disabled}
                    />
                  </div>

                  {check.approved === false && (
                    <div className="mismatch-warning">
                      <AlertTriangle size={14} />
                      <span>Contract mismatch detected. Use override panel to correct values.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ContractChecklist;