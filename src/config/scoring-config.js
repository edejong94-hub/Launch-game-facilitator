// Unified scoring — mirrors research-config.js from the student app exactly.
// Keep these two files in sync whenever scoring rules change.

const END_GAME_SCORING = {
  categories: [
    {
      id: 'financial', name: 'Financial Health', icon: '💰', maxPoints: 25,
      metrics: [
        { id: 'cash',    name: 'Cash Position',    weight: 15, target: 50000, format: (v) => `€${Number(v).toLocaleString()}` },
        { id: 'revenue', name: 'Revenue Generated', weight: 10, target: 20000, format: (v) => `€${Number(v).toLocaleString()}` },
      ],
    },
    {
      id: 'technology', name: 'Technology Progress', icon: '🔬', maxPoints: 25,
      metrics: [
        { id: 'trl',     name: 'TRL Level',      weight: 20, target: 7, format: (v) => `TRL ${v}` },
        { id: 'patents', name: 'IP Protection',  weight: 5,  target: 1, format: (v) => `${v} patent${v !== 1 ? 's' : ''}` },
      ],
    },
    {
      id: 'market', name: 'Market Validation', icon: '🎯', maxPoints: 25,
      metrics: [
        { id: 'validations', name: 'Customer Validations', weight: 15, target: 2, format: (v) => `${v} validation${v !== 1 ? 's' : ''}` },
        { id: 'interviews',  name: 'Customer Interviews',  weight: 10, target: 6, format: (v) => `${v} interview${v !== 1 ? 's' : ''}` },
      ],
    },
    {
      id: 'team', name: 'Team & Structure', icon: '👥', maxPoints: 15,
      metrics: [
        { id: 'equity',    name: 'Founder Equity',  weight: 10, target: 60, format: (v) => `${Math.round(v)}%` },
        { id: 'legalForm', name: 'Legal Structure', weight: 5,  target: 1,  format: (v) => v ? 'BV established' : 'Not incorporated' },
      ],
    },
    {
      id: 'bonuses', name: 'Achievement Bonuses', icon: '🏆', maxPoints: 10,
      bonuses: [
        // Positive
        { id: 'grantWinner',      name: '🏆 Grant Winner',        points:  3, condition: 'hasGrant',            description: 'Secured non-dilutive funding',             type: 'positive' },
        { id: 'incubator',        name: '🏢 Incubator Star',       points:  2, condition: 'inIncubator',          description: 'Accepted into an incubator program',        type: 'positive' },
        { id: 'balancedTeam',     name: '👥 Dream Team',           points:  2, condition: 'balancedTeam',         description: 'Built a team with diverse skills',           type: 'positive' },
        { id: 'goodLicence',      name: '📜 Smart Negotiator',     points:  2, condition: 'goodLicence',          description: 'Negotiated a fair licence deal',             type: 'positive' },
        { id: 'noBankruptcy',     name: '💰 Financially Prudent',  points:  1, condition: 'neverNegative',        description: 'Never went into the red',                    type: 'positive' },
        { id: 'customerChampion', name: '🎯 Customer Champion',    points:  2, condition: 'manyInterviews',       description: '6+ customer interviews conducted',           type: 'positive' },
        { id: 'ipProtected',      name: '🛡️ IP Fortress',          points:  2, condition: 'hasPatent',            description: 'Filed a patent application',                 type: 'positive' },
        { id: 'secretKeeper',     name: '🤫 Secret Keeper',        points:  1, condition: 'hasKnowHow',           description: 'Protected IP with know-how',                 type: 'positive' },
        { id: 'speedRunner',      name: '🚀 Speed Runner',         points:  2, condition: 'leftUniversityEarly',  description: 'Committed full-time by round 2',             type: 'positive' },
        // Negative
        { id: 'bankruptBaby',     name: '💸 Bankrupt Baby',        points: -3, condition: 'wentBankrupt',         description: 'Ran out of money completely',                type: 'negative' },
        { id: 'professorForever', name: '👴 Professor Forever',    points: -2, condition: 'neverLeftUniversity',  description: 'Still at university in round 4',             type: 'negative' },
        { id: 'whatCustomers',    name: '🙈 What Customers?',      points: -3, condition: 'noCustomerValidation', description: 'Zero customer validations',                  type: 'negative' },
        { id: 'equityGiveaway',   name: '🎁 Equity Santa',         points: -2, condition: 'tooMuchDilution',      description: 'Gave away more than 50% equity',             type: 'negative' },
        { id: 'patentWho',        name: '📋 Patent? What Patent?', points: -2, condition: 'noIPProtection',       description: 'No IP protection at all after 4 rounds',     type: 'negative' },
        { id: 'ttoIgnorer',       name: '🏛️ TTO Ghosted',          points: -2, condition: 'noTTOMeeting',         description: 'Never even talked to the TTO',               type: 'negative' },
        { id: 'terribleDeal',     name: '🤡 Terrible Negotiator',  points: -2, condition: 'badLicence',           description: 'Accepted a revenue-based royalty',           type: 'negative' },
        { id: 'allNerds',         name: '🤓 All Nerds No Sales',   points: -1, condition: 'allTechnicalTeam',     description: 'Team has zero business skills',              type: 'negative' },
        { id: 'speedBurn',        name: '🔥 Speed Burn',           points: -2, condition: 'burnedTooFast',        description: 'Spent more than €80k in one round',          type: 'negative' },
        { id: 'loanShark',        name: '🦈 Loan Shark Victim',    points: -1, condition: 'highInterestLoan',     description: 'Accepted a loan with 10%+ interest',         type: 'negative' },
        { id: 'pivotKing',        name: '🔄 Pivot Addict',         points: -1, condition: 'tooManyPivots',        description: 'Pivoted 3+ times',                           type: 'negative' },
        { id: 'oneManShow',       name: '🎭 One Person Show',      points: -1, condition: 'noHires',              description: 'Never hired anyone',                         type: 'negative' },
        { id: 'grantDependent',   name: '🍼 Grant Baby',           points: -1, condition: 'onlyGrantFunding',     description: 'Only funding is grants, no revenue or investment', type: 'negative' },
        { id: 'trlStuck',         name: '🐌 Lab Rat',              points: -2, condition: 'lowTRL',               description: 'Still at TRL 4 or below',                    type: 'negative' },
        { id: 'interviewAllergic',name: '🤧 Interview Allergic',   points: -2, condition: 'fewInterviews',        description: 'Less than 3 customer interviews',            type: 'negative' },
        { id: 'meetingAvoider',   name: '📞 Meeting Avoider',      points: -1, condition: 'fewExpertMeetings',    description: 'Used fewer than 6 expert meeting slots',     type: 'negative' },
      ],
    },
  ],

  achievementConditions: {
    hasGrant:            (d) => d.completedActivities?.some(a => ['grantTakeoff', 'grantWBSO', 'grantRegional'].includes(a)),
    inIncubator:         (d) => d.completedActivities?.includes('incubatorApplication'),
    balancedTeam:        (d) => {
      const profiles = [...(d.teamProfiles || []), ...(d.hiredProfiles || [])];
      const types = new Set(profiles.map(p => {
        if (['scientist', 'product'].includes(p)) return 'technical';
        if (['business', 'market'].includes(p)) return 'commercial';
        return 'operations';
      }));
      return types.size >= 2;
    },
    goodLicence:          (d) => d.licenceAgreement === 'balanced',
    neverNegative:        (d) => !d.wentNegative,
    manyInterviews:       (d) => (d.interviewCount || 0) >= 6,
    hasPatent:            (d) => d.completedActivities?.some(a => ['patentFiling'].includes(a)),
    hasKnowHow:           (d) => {
      const hasKnowHowOnly = d.completedActivities?.includes('knowHowProtection');
      const hasPatent = d.completedActivities?.some(a => ['patentFiling'].includes(a));
      return hasKnowHowOnly && !hasPatent;
    },
    leftUniversityEarly:  (d) => d.leftUniversityRound && d.leftUniversityRound <= 2,
    wentBankrupt:         (d) => (d.cash || 0) < -10000,
    neverLeftUniversity:  (d) => d.employmentStatus === 'university',
    noCustomerValidation: (d) => (d.validationCount || 0) === 0,
    tooMuchDilution:      (d) => (d.investorEquity || 0) > 50,
    noIPProtection:       (d) => !d.completedActivities?.some(a => ['patentFiling', 'knowHowProtection'].includes(a)),
    noTTOMeeting:         (d) => !d.completedActivities?.includes('ttoDiscussion'),
    badLicence:           (d) => d.licenceAgreement === 'revenueHeavy',
    allTechnicalTeam:     (d) => {
      const profiles = d.teamProfiles || [];
      return profiles.length > 0 && profiles.every(p => ['scientist', 'product'].includes(p));
    },
    burnedTooFast:        (d) => (d.maxSpendInRound || 0) > 80000,
    highInterestLoan:     (d) => (d.loanInterest || 0) >= 10,
    tooManyPivots:        (d) => (d.pivotCount || 0) >= 3,
    noHires:              (d) => (d.employees || 0) === 0,
    onlyGrantFunding:     (d) => {
      const hasGrant = d.completedActivities?.some(a => ['grantTakeoff', 'grantWBSO', 'grantRegional'].includes(a));
      return hasGrant && !(d.totalInvestment > 0) && !(d.totalRevenue > 0);
    },
    lowTRL:               (d) => (d.trl || 3) <= 4,
    fewInterviews:        (d) => (d.interviewCount || 0) < 3,
    fewExpertMeetings:    (d) => (d.totalStickersUsed || 0) < 6,
  },

  rankings: {
    excellent:  { min: 80, label: '🌟 Excellent',  color: '#22c55e', description: 'Ready for Series A!' },
    strong:     { min: 65, label: '💪 Strong',      color: '#3b82f6', description: 'On track for success' },
    good:       { min: 50, label: '👍 Good',        color: '#f59e0b', description: 'Solid foundation' },
    developing: { min: 35, label: '📈 Developing',  color: '#f97316', description: 'More work needed' },
    struggling: { min:  0, label: '⚠️ Struggling',  color: '#ef4444', description: 'Major challenges ahead' },
  },
};

// Mirrors calculateResearchScore from the student app (research-config.js).
// Keep both files in sync.
export const calculateResearchScore = (teamData = {}, progress = {}) => {
  const config = END_GAME_SCORING;

  const values = {
    cash:       progress.cash || teamData.cash || 0,
    revenue:    teamData.funding?.revenue || teamData.totalRevenue || 0,
    trl:        progress.currentTRL || teamData.trl || 3,
    patents:    (teamData.completedActivities || []).filter(a => ['patentFiling', 'knowHowProtection'].includes(a)).length,
    validations: progress.validationsTotal || teamData.validationCount || 0,
    interviews:  progress.interviewsTotal  || teamData.interviewCount  || 0,
    equity:     100 - (progress.investorEquity || teamData.investorEquity || 0) - (teamData.licenceAgreement === 'equity' ? 10 : 0),
    legalForm:  teamData.legalForm && teamData.legalForm !== 'none' ? 1 : 0,
  };

  const metricCategories = config.categories.filter(c => c.metrics);
  const categoryScores = metricCategories.map(category => {
    const metricScores = category.metrics.map(metric => {
      const value = values[metric.id] || 0;
      const ratio = Math.min(1, value / metric.target);
      const score = ratio * metric.weight;
      return { ...metric, value, score, percentage: Math.min(100, ratio * 100) };
    });
    const categoryTotal = metricScores.reduce((sum, m) => sum + m.score, 0);
    return { ...category, metrics: metricScores, score: categoryTotal };
  });

  const baseScore = categoryScores.reduce((sum, c) => sum + c.score, 0);

  const bonusCategory = config.categories.find(c => c.bonuses);
  const achievementConditions = config.achievementConditions;
  const achievements = [];

  if (bonusCategory) {
    const conditionData = {
      ...teamData,
      cash: values.cash,
      validationCount: values.validations,
      interviewCount: values.interviews,
    };
    bonusCategory.bonuses.forEach(bonus => {
      const conditionFn = achievementConditions[bonus.condition];
      if (conditionFn && conditionFn(conditionData)) {
        achievements.push(bonus);
      }
    });
  }

  achievements.sort((a, b) => {
    if (a.points >= 0 && b.points < 0) return -1;
    if (a.points < 0 && b.points >= 0) return 1;
    return Math.abs(b.points) - Math.abs(a.points);
  });

  const bonusPoints = achievements.reduce((sum, a) => sum + a.points, 0);
  const totalScore = Math.round(baseScore + bonusPoints);

  const { rankings } = config;
  let ranking;
  if      (totalScore >= rankings.excellent.min)  ranking = rankings.excellent;
  else if (totalScore >= rankings.strong.min)     ranking = rankings.strong;
  else if (totalScore >= rankings.good.min)       ranking = rankings.good;
  else if (totalScore >= rankings.developing.min) ranking = rankings.developing;
  else                                            ranking = rankings.struggling;

  return { totalScore, baseScore, bonusPoints, categoryScores, achievements, values, ranking };
};

// Builds the arguments calculateResearchScore expects from the flat team
// objects stored in component state, then ranks.
export function rankTeams(teams) {
  const scored = teams.map(team => {
    const teamData = {
      cash:              team.cash ?? 0,
      trl:               team.trl ?? 0,
      completedActivities: team.completedActivities || [],
      interviewCount:    team.interviews ?? 0,
      validationCount:   team.customersAcquired ?? 0,
      investorEquity:    100 - (team.equityRetained ?? 100),
      licenceAgreement:  team.licenceAgreement || team.universityLicence,
      legalForm:         team.legalForm,
      teamProfiles:      team.teamProfiles || team.founderProfiles || [],
      hiredProfiles:     team.hiredProfiles || [],
      employmentStatus:  team.employmentStatus || 'university',
      leftUniversityRound: team.leftUniversityRound ?? null,
      wentNegative:      team.wentNegative ?? false,
      totalInvestment:   team.totalInvestment ?? 0,
      totalRevenue:      team.totalRevenue ?? team.revenue ?? 0,
      employees:         team.employees ?? 0,
      totalStickersUsed: team.totalStickersUsed ?? 0,
      pivotCount:        team.pivotCount ?? 0,
      maxSpendInRound:   team.maxSpendInRound ?? 0,
      loanInterest:      team.loanInterest ?? 0,
      funding:           team.funding || {},
    };

    const progress = {
      cash:            team.cash ?? 0,
      currentTRL:      team.trl ?? 0,
      investorEquity:  100 - (team.equityRetained ?? 100),
      interviewsTotal: team.interviews ?? 0,
      validationsTotal: team.customersAcquired ?? 0,
    };

    return { ...team, scoreData: calculateResearchScore(teamData, progress) };
  });

  scored.sort((a, b) => (b.scoreData?.totalScore || 0) - (a.scoreData?.totalScore || 0));
  scored.forEach((team, i) => { team.rank = i + 1; });

  return scored;
}

export function getPerformanceCategory(score) {
  const { rankings } = END_GAME_SCORING;
  if      (score >= rankings.excellent.min)  return { level: rankings.excellent.label,  color: rankings.excellent.color,  description: rankings.excellent.description };
  else if (score >= rankings.strong.min)     return { level: rankings.strong.label,     color: rankings.strong.color,     description: rankings.strong.description };
  else if (score >= rankings.good.min)       return { level: rankings.good.label,       color: rankings.good.color,       description: rankings.good.description };
  else if (score >= rankings.developing.min) return { level: rankings.developing.label, color: rankings.developing.color, description: rankings.developing.description };
  else                                       return { level: rankings.struggling.label, color: rankings.struggling.color, description: rankings.struggling.description };
}
