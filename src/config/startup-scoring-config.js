// Startup game scoring — mirrors startup-config.js from the student app exactly.
// Keep these two files in sync whenever scoring rules change.

const STARTUP_SCORING = {
  categories: [
    {
      id: 'traction', name: 'Customer Traction', icon: '🎯', maxPoints: 30,
      metrics: [
        { id: 'interviews',  name: 'Customer Interviews',  weight: 15, target: 5, format: (v) => `${v} interview${v !== 1 ? 's' : ''}` },
        { id: 'validations', name: 'Customer Validations', weight: 15, target: 2, format: (v) => `${v} validation${v !== 1 ? 's' : ''}` },
      ],
    },
    {
      id: 'financial', name: 'Financial Health', icon: '💰', maxPoints: 25,
      metrics: [
        { id: 'cash',    name: 'Cash Position',    weight: 15, target: 30000, format: (v) => `€${Number(v).toLocaleString()}` },
        { id: 'revenue', name: 'Revenue Generated', weight: 10, target: 10000, format: (v) => `€${Number(v).toLocaleString()}` },
      ],
    },
    {
      id: 'team', name: 'Team & Structure', icon: '👥', maxPoints: 20,
      metrics: [
        { id: 'equity',    name: 'Founder Equity',  weight: 10, target: 60, format: (v) => `${Math.round(v)}%` },
        { id: 'legalForm', name: 'Legal Structure', weight: 5,  target: 1,  format: (v) => v ? 'BV established' : 'Not incorporated' },
        { id: 'employees', name: 'Team Growth',     weight: 5,  target: 1,  format: (v) => `${v} hire${v !== 1 ? 's' : ''}` },
      ],
    },
    {
      id: 'product', name: 'Product & IP', icon: '🔧', maxPoints: 15,
      metrics: [
        { id: 'productBuilt', name: 'Product Built', weight: 8, target: 1, format: (v) => v ? 'Built' : 'Not built' },
        { id: 'ipProtected',  name: 'IP Protected',  weight: 7, target: 1, format: (v) => v ? 'Protected' : 'Not protected' },
      ],
    },
    {
      id: 'bonuses', name: 'Achievement Bonuses', icon: '🏆', maxPoints: 10,
      bonuses: [
        // Positive
        { id: 'customerWhisperer',   name: '🗣️ Customer Whisperer',      points:  3, condition: 'manyInterviews',        description: '5+ customer interviews conducted',             type: 'positive' },
        { id: 'signedValidated',     name: '✅ Signed & Validated',       points:  3, condition: 'manyValidations',        description: '2+ customer validations secured',              type: 'positive' },
        { id: 'firstRealDeal',       name: '🤝 First Real Deal',          points:  3, condition: 'hasLaunchCustomer',      description: 'Closed a launching customer deal',             type: 'positive' },
        { id: 'freeMoneyClub',       name: '💸 Free Money Club',          points:  2, condition: 'hasGrant',               description: 'Secured a grant or subsidy',                   type: 'positive' },
        { id: 'firstEuroClub',       name: '💶 First Euro Club',          points:  2, condition: 'hasRevenue',             description: 'Generated first revenue',                      type: 'positive' },
        { id: 'incubatorCrew',       name: '🏢 Incubator Crew',           points:  2, condition: 'inIncubator',            description: 'Accepted into an incubator program',           type: 'positive' },
        { id: 'dreamTeam',           name: '👥 Dream Team',               points:  2, condition: 'balancedTeam',           description: 'Built a team with diverse skills',             type: 'positive' },
        { id: 'ipOnLock',            name: '🔒 IP On Lock',               points:  2, condition: 'hasIP',                  description: 'IP protection in place',                       type: 'positive' },
        { id: 'frugalFounder',       name: '🪙 Frugal Founder',           points:  1, condition: 'neverNegative',          description: 'Never ran negative cash',                      type: 'positive' },
        { id: 'pivotPro',            name: '🔄 Pivot Pro',                points:  1, condition: 'exactlyOnePivot',        description: 'Pivoted exactly once — learnt and adapted',    type: 'positive' },
        // Negative
        { id: 'heardOfCustomers',    name: '🙈 Heard of Customers?',      points: -3, condition: 'noInterviews',           description: 'Zero customer interviews conducted',           type: 'negative' },
        { id: 'yoloStartup',         name: '🎰 YOLO Startup',             points: -3, condition: 'noValidations',          description: 'Zero customer validations',                    type: 'negative' },
        { id: 'builderNotTalker',    name: '🔨 Builder, Not Talker',      points: -2, condition: 'builtBeforeValidating',  description: 'Built before talking to 2+ customers',        type: 'negative' },
        { id: 'burnedAlive',         name: '🔥 Burned Alive',             points: -2, condition: 'wentBankrupt',           description: 'Ran out of money completely',                  type: 'negative' },
        { id: 'pivotception',        name: '♾️ Pivotception',             points: -2, condition: 'tooManyPivots',          description: '3+ pivots — no clear direction',               type: 'negative' },
        { id: 'equitySanta',         name: '🎁 Equity Santa',             points: -2, condition: 'tooMuchDilution',        description: 'Gave away more than 50% equity',               type: 'negative' },
        { id: 'islandMode',          name: '🏝️ Island Mode',              points: -2, condition: 'fewExpertMeetings',      description: 'Fewer than 2 expert meetings',                 type: 'negative' },
        { id: 'loneFounder',         name: '🎭 The Lone Founder',         points: -1, condition: 'noHires',                description: 'Never hired anyone or found a senior partner', type: 'negative' },
        { id: 'zeroSalesDNA',        name: '🤓 Zero Sales DNA',           points: -1, condition: 'allTechnicalTeam',       description: 'All-technical team, no business skills',       type: 'negative' },
        { id: 'openSourceDefault',   name: '📂 Open Source By Default',   points: -1, condition: 'noIPProtection',         description: 'No IP protection whatsoever',                  type: 'negative' },
        { id: 'grantBaby',           name: '🍼 Grant Baby',               points: -1, condition: 'onlyGrantFunding',       description: 'Only grant funding — no revenue or investment', type: 'negative' },
      ],
    },
  ],

  achievementConditions: {
    manyInterviews:       (d) => (d.interviewCount || 0) >= 5,
    manyValidations:      (d) => (d.validationCount || 0) >= 2,
    hasLaunchCustomer:    (d) => d.completedActivities?.includes('launchingCustomerDeal'),
    hasGrant:             (d) => d.completedActivities?.some(a => ['grantTakeoff', 'grantWBSO', 'grantRegional', 'subsidyApplication'].includes(a)),
    hasRevenue:           (d) => (d.totalRevenue || 0) > 0,
    inIncubator:          (d) => d.completedActivities?.includes('incubatorApplication'),
    balancedTeam:         (d) => {
      const profiles = [...(d.teamProfiles || []), ...(d.hiredProfiles || [])];
      const types = new Set(profiles.map(p => {
        if (['scientist', 'product', 'technical'].includes(p)) return 'technical';
        if (['business', 'market', 'commercial'].includes(p)) return 'commercial';
        return 'operations';
      }));
      return types.size >= 2;
    },
    hasIP:                (d) => d.completedActivities?.some(a => ['patentFiling', 'knowHowProtection', 'ipProtection'].includes(a)),
    neverNegative:        (d) => !d.wentNegative,
    exactlyOnePivot:      (d) => (d.pivotCount || 0) === 1,
    noInterviews:         (d) => (d.interviewCount || 0) === 0,
    noValidations:        (d) => (d.validationCount || 0) === 0,
    builtBeforeValidating:(d) => (d.productBuilt) && (d.validationCount || 0) < 2,
    wentBankrupt:         (d) => (d.cash || 0) < -10000,
    tooManyPivots:        (d) => (d.pivotCount || 0) >= 3,
    tooMuchDilution:      (d) => (d.investorEquity || 0) > 50,
    fewExpertMeetings:    (d) => (d.totalExpertMeetings || d.totalStickersUsed || 0) < 2,
    noHires:              (d) => (d.employees || 0) === 0,
    allTechnicalTeam:     (d) => {
      const profiles = d.teamProfiles || [];
      return profiles.length > 0 && profiles.every(p => ['scientist', 'product', 'technical'].includes(p));
    },
    noIPProtection:       (d) => !d.completedActivities?.some(a => ['patentFiling', 'knowHowProtection', 'ipProtection'].includes(a)),
    onlyGrantFunding:     (d) => {
      const hasGrant = d.completedActivities?.some(a => ['grantTakeoff', 'grantWBSO', 'grantRegional', 'subsidyApplication'].includes(a));
      return hasGrant && !(d.totalInvestment > 0) && !(d.totalRevenue > 0);
    },
  },

  rankings: {
    excellent:  { min: 80, label: '🌟 Startup Champion', color: '#22c55e', description: 'Ready for first funding round!' },
    strong:     { min: 65, label: '💪 Strong Founder',   color: '#3b82f6', description: 'Building something real' },
    good:       { min: 50, label: '👍 On Track',          color: '#f59e0b', description: 'Solid customer development work' },
    developing: { min: 35, label: '📈 Learning Founder',  color: '#f97316', description: 'More validation needed' },
    struggling: { min:  0, label: '⚠️ Back to Basics',   color: '#ef4444', description: 'Start by talking to customers' },
  },
};

export const calculateStartupScore = (teamData = {}, progress = {}) => {
  const config = STARTUP_SCORING;

  const completedActivities = teamData.completedActivities || [];
  const hasProduct = completedActivities.some(a =>
    ['productDevelopment', 'mvpBuild', 'prototype', 'productBuild'].includes(a)
  ) || (teamData.developmentHours || 0) > 0;
  const hasIP = completedActivities.some(a =>
    ['patentFiling', 'knowHowProtection', 'ipProtection'].includes(a)
  );

  const values = {
    interviews:   progress.interviewsTotal  || teamData.interviewCount  || 0,
    validations:  progress.validationsTotal || teamData.validationCount || 0,
    cash:         progress.cash             || teamData.cash            || 0,
    revenue:      teamData.funding?.revenue || teamData.totalRevenue    || 0,
    equity:       100 - (progress.investorEquity || teamData.investorEquity || 0),
    legalForm:    teamData.legalForm && teamData.legalForm !== 'none' ? 1 : 0,
    employees:    teamData.employees || 0,
    productBuilt: hasProduct ? 1 : 0,
    ipProtected:  hasIP ? 1 : 0,
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
      productBuilt: hasProduct,
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

export function rankStartupTeams(teams) {
  const scored = teams.map(team => {
    const teamData = {
      cash:                team.cash ?? 0,
      completedActivities: team.completedActivities || [],
      interviewCount:      team.interviews ?? 0,
      validationCount:     team.customersAcquired ?? 0,
      investorEquity:      100 - (team.equityRetained ?? 100),
      legalForm:           team.legalForm,
      teamProfiles:        team.teamProfiles || team.founderProfiles || [],
      hiredProfiles:       team.hiredProfiles || [],
      wentNegative:        team.wentNegative ?? false,
      totalInvestment:     team.totalInvestment ?? 0,
      totalRevenue:        team.totalRevenue ?? team.revenue ?? 0,
      employees:           team.employees ?? 0,
      totalStickersUsed:   team.totalStickersUsed ?? 0,
      totalExpertMeetings: team.totalExpertMeetings ?? 0,
      pivotCount:          team.pivotCount ?? 0,
      developmentHours:    team.developmentHours ?? 0,
      funding:             team.funding || {},
    };

    const progress = {
      cash:            team.cash ?? 0,
      investorEquity:  100 - (team.equityRetained ?? 100),
      interviewsTotal: team.interviews ?? 0,
      validationsTotal: team.customersAcquired ?? 0,
    };

    return { ...team, scoreData: calculateStartupScore(teamData, progress) };
  });

  scored.sort((a, b) => (b.scoreData?.totalScore || 0) - (a.scoreData?.totalScore || 0));
  scored.forEach((team, i) => { team.rank = i + 1; });

  return scored;
}
