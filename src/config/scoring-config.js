// Unified scoring configuration
// Base score: max 90 pts (8 metrics, formula: min(1, value/target) × weight)
// Achievements: bonuses/penalties on top (positive achievements capped at +10)

export const METRICS = [
  // 💰 Financial Health (max 25)
  { id: 'cash',        name: 'Cash Position',         category: 'financial',   weight: 15, target: 50000, getValue: (t) => t.cash ?? 0,              format: (v) => `€${Number(v).toLocaleString()}` },
  { id: 'revenue',     name: 'Revenue Generated',     category: 'financial',   weight: 10, target: 20000, getValue: (t) => t.revenue ?? 0,           format: (v) => `€${Number(v).toLocaleString()}` },
  // 🔬 Technology Progress (max 25)
  { id: 'trl',         name: 'TRL Level',             category: 'technology',  weight: 20, target: 7,     getValue: (t) => t.trl ?? 0,               format: (v) => `TRL ${v}` },
  { id: 'ip',          name: 'IP Protection',         category: 'technology',  weight: 5,  target: 1,     getValue: (t) => t.patents ?? 0,            format: (v) => `${v} patent${v !== 1 ? 's' : ''}` },
  // 🎯 Market Validation (max 25)
  { id: 'validations', name: 'Customer Validations',  category: 'market',      weight: 15, target: 2,     getValue: (t) => t.customersAcquired ?? 0,  format: (v) => `${v} validation${v !== 1 ? 's' : ''}` },
  { id: 'interviews',  name: 'Customer Interviews',   category: 'market',      weight: 10, target: 6,     getValue: (t) => t.interviews ?? 0,         format: (v) => `${v} interview${v !== 1 ? 's' : ''}` },
  // 👥 Team & Structure (max 15)
  { id: 'equity',      name: 'Founder Equity',        category: 'team',        weight: 10, target: 60,    getValue: (t) => t.equityRetained ?? 100,   format: (v) => `${Math.round(v)}%` },
  { id: 'legal',       name: 'Legal Structure',       category: 'team',        weight: 5,  target: 1,     getValue: (t) => (t.legalForm || t.legalForms?.length > 0) ? 1 : 0, format: (v) => v ? 'BV established' : 'Not incorporated' },
];

export const CATEGORIES = [
  { id: 'financial',  name: '💰 Financial Health',     maxScore: 25 },
  { id: 'technology', name: '🔬 Technology Progress',   maxScore: 25 },
  { id: 'market',     name: '🎯 Market Validation',     maxScore: 25 },
  { id: 'team',       name: '👥 Team & Structure',      maxScore: 15 },
];

const _hasProfile = (team, ...keywords) => {
  const profiles = (team.founderProfiles || team.teamProfiles || []).map(p => (p || '').toLowerCase());
  return profiles.some(p => keywords.some(k => p.includes(k)));
};

export const ACHIEVEMENTS = {
  positive: [
    { id: 'grant-winner',       name: 'Grant Winner',        points: 3, description: 'Secured grant funding',                               check: (t) => (t.grantsReceived || 0) > 0 },
    { id: 'incubator-star',     name: 'Incubator Star',      points: 2, description: 'Accepted into an incubator programme',               check: (t) => t.inIncubator === true },
    { id: 'dream-team',         name: 'Dream Team',          points: 2, description: 'Team covers business, science, and engineering roles', check: (t) => _hasProfile(t, 'business', 'entrepreneur', 'commercial') && _hasProfile(t, 'scientist', 'researcher', 'phd') && _hasProfile(t, 'engineer', 'tech', 'developer', 'cto') },
    { id: 'smart-negotiator',   name: 'Smart Negotiator',    points: 2, description: 'Retained ≥70% founder equity',                       check: (t) => (t.equityRetained ?? 100) >= 70 },
    { id: 'customer-champion',  name: 'Customer Champion',   points: 2, description: '2 or more customer validations (LOIs/pilots)',        check: (t) => (t.customersAcquired || 0) >= 2 },
    { id: 'ip-fortress',        name: 'IP Fortress',         points: 2, description: 'Filed at least one patent',                          check: (t) => (t.patents || 0) >= 1 },
    { id: 'speed-runner',       name: 'Speed Runner',        points: 2, description: 'Reached TRL 7 by round 3',                           check: (t) => (t.trl || 0) >= 7 && (t.currentRound || 1) <= 3 },
    { id: 'financially-prudent',name: 'Financially Prudent', points: 1, description: 'Strong cash position while retaining majority equity', check: (t) => (t.cash || 0) > 50000 && (t.equityRetained ?? 100) >= 70 },
    { id: 'secret-keeper',      name: 'Secret Keeper',       points: 1, description: 'Signed NDA with industry partner',                   check: (t) => t.completedActivities?.includes('industryExploration') || false },
  ],
  negative: [
    { id: 'bankrupt-baby',        name: 'Bankrupt Baby',          points: -3, description: 'Negative cash position',                                  check: (t) => (t.cash || 0) < 0 },
    { id: 'what-customers',       name: 'What Customers?',        points: -3, description: 'No customer validations or interviews by round 3',         check: (t) => (t.customersAcquired || 0) === 0 && (t.interviews || 0) === 0 && (t.currentRound || 1) >= 3 },
    { id: 'professor-forever',    name: 'Professor Forever',      points: -2, description: 'Still employed at university by round 3',                  check: (t) => t.employmentStatus === 'university' && (t.currentRound || 1) >= 3 },
    { id: 'equity-santa',         name: 'Equity Santa',           points: -2, description: 'Gave away more than 70% of equity',                        check: (t) => (t.equityRetained ?? 100) < 30 },
    { id: 'patent-what-patent',   name: 'Patent? What Patent?',   points: -2, description: 'No IP protection by end of game',                          check: (t) => (t.patents || 0) === 0 && (t.provisionalPatents || 0) === 0 && (t.currentRound || 1) >= 4 },
    { id: 'tto-ghosted',          name: 'TTO Ghosted',            points: -2, description: 'Never engaged with the TTO',                               check: (t) => (t.currentRound || 1) >= 2 && !t.completedActivities?.includes('ttoDiscussion') },
    { id: 'terrible-negotiator',  name: 'Terrible Negotiator',    points: -2, description: 'Agreed to unfavourable licence terms',                     check: (t) => ['revenue-heavy', 'high-percentage', 'early-payments'].includes(t.universityLicence) },
    { id: 'lab-rat',              name: 'Lab Rat',                points: -2, description: 'TRL below 4 at end of game',                               check: (t) => (t.trl || 0) < 4 && (t.currentRound || 1) >= 4 },
    { id: 'interview-allergic',   name: 'Interview Allergic',     points: -2, description: 'No customer interviews conducted by round 3',              check: (t) => (t.interviews || 0) === 0 && (t.currentRound || 1) >= 3 },
    { id: 'all-nerds-no-sales',   name: 'All Nerds No Sales',     points: -1, description: 'No business profile on the founding team',                 check: (t) => { const p = (t.founderProfiles || t.teamProfiles || []).filter(Boolean); return p.length > 0 && !_hasProfile(t, 'business', 'entrepreneur', 'commercial', 'sales'); } },
    { id: 'meeting-avoider',      name: 'Meeting Avoider',        points: -1, description: 'No investor, customer, or bank meetings held',             check: (t) => (t.currentRound || 1) >= 2 && !['investorMeeting', 'customerInterviews', 'bankMeeting'].some(a => t.completedActivities?.includes(a)) },
    { id: 'loan-shark-victim',    name: 'Loan Shark Victim',      points: -1, description: 'Took out a loan but still has low cash',                   check: (t) => t.completedActivities?.includes('loanApplication') && (t.cash || 0) < 10000 },
    { id: 'pivot-addict',         name: 'Pivot Addict',           points: -1, description: 'Changed the startup idea (pivoted)',                        check: (t) => t.hasPivoted === true },
    { id: 'one-person-show',      name: 'One Person Show',        points: -1, description: 'Team of only one founder',                                 check: (t) => (t.founderProfiles || t.teamProfiles || []).filter(Boolean).length <= 1 },
    { id: 'grant-baby',           name: 'Grant Baby',             points: -1, description: 'Relies solely on grants with no other revenue',            check: (t) => (t.grantsReceived || 0) > 0 && (t.revenue || 0) === 0 && (t.currentRound || 1) >= 3 },
  ],
};

export function calculateTeamScore(team) {
  let baseScore = 0;
  const metricScores = {};

  METRICS.forEach(metric => {
    const value = metric.getValue(team);
    const ratio = Math.min(1, value / metric.target);
    const points = ratio * metric.weight;
    baseScore += points;
    metricScores[metric.id] = {
      name: metric.name,
      category: metric.category,
      rawValue: ratio * 100, // percentage of target achieved (0–100, used for progress bar)
      weightedScore: points,
      weight: metric.weight,
      actualValue: metric.format(value),
    };
  });

  let positiveTotal = 0;
  let negativeTotal = 0;
  const earnedAchievements = [];

  ACHIEVEMENTS.positive.forEach(a => {
    if (a.check(team)) {
      positiveTotal += a.points;
      earnedAchievements.push({ ...a });
    }
  });

  ACHIEVEMENTS.negative.forEach(a => {
    if (a.check(team)) {
      negativeTotal += a.points; // already negative
      earnedAchievements.push({ ...a });
    }
  });

  const cappedPositive = Math.min(10, positiveTotal);
  const achievementTotal = cappedPositive + negativeTotal;

  return {
    totalScore: Math.max(0, Math.round(baseScore + achievementTotal)),
    baseScore: Math.round(baseScore),
    achievementTotal,
    positiveAchievements: cappedPositive,
    negativeAchievements: negativeTotal,
    metricScores,
    earnedAchievements,
  };
}

export function rankTeams(teams) {
  const scored = teams.map(team => ({
    ...team,
    scoreData: calculateTeamScore(team),
  }));

  scored.sort((a, b) => (b.scoreData?.totalScore || 0) - (a.scoreData?.totalScore || 0));
  scored.forEach((team, i) => { team.rank = i + 1; });

  return scored;
}

export function getPerformanceCategory(score) {
  if (score >= 80) return { level: '🌟 Excellent',   color: '#22c55e', description: 'Outstanding performance!' };
  if (score >= 65) return { level: '💪 Strong',       color: '#3b82f6', description: 'Very good progress' };
  if (score >= 50) return { level: '👍 Good',         color: '#f59e0b', description: 'Solid execution' };
  if (score >= 35) return { level: '📈 Developing',   color: '#f97316', description: 'Building momentum' };
  return           { level: '⚠️ Struggling',          color: '#ef4444', description: 'Needs significant improvement' };
}
