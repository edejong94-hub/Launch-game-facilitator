// Scoring configuration for both startup and research modes

export const scoringConfig = {
  startup: {
    name: "Startup Mode",
    metrics: [
      {
        id: 'cash',
        name: 'Cash Position',
        weight: 0.25,
        calculate: (team) => {
          const cash = team.cash || 0;
          // Score based on cash position (normalized to 0-100)
          // Assume $100k is excellent, $0 is poor
          return Math.min(100, (cash / 100000) * 100);
        },
        format: (value) => `$${value.toLocaleString()}`,
        description: 'Current cash in bank'
      },
      {
        id: 'development',
        name: 'Product Development',
        weight: 0.20,
        calculate: (team) => {
          const devHours = team.developmentHours || 0;
          // Assume 500 hours is fully developed product
          return Math.min(100, (devHours / 500) * 100);
        },
        format: (value) => `${value} hours`,
        description: 'Development hours invested'
      },
      {
        id: 'customers',
        name: 'Customer Validation',
        weight: 0.20,
        calculate: (team) => {
          const customers = team.customersAcquired || 0;
          // Score based on customer acquisition
          // Assume 50 customers is excellent
          return Math.min(100, (customers / 50) * 100);
        },
        format: (value) => `${value} customers`,
        description: 'Number of customers acquired'
      },
      {
        id: 'progress',
        name: 'Overall Progress',
        weight: 0.15,
        calculate: (team) => {
          const completedActivities = team.completedActivities?.length || 0;
          // Score based on activities completed
          // Assume 30 activities is very thorough
          return Math.min(100, (completedActivities / 30) * 100);
        },
        format: (value) => `${value} activities`,
        description: 'Activities completed'
      },
      {
        id: 'equity',
        name: 'Equity Retained',
        weight: 0.10,
        calculate: (team) => {
          const equity = team.equityRetained || 100;
          // Higher equity is better (starting at 100%)
          return equity;
        },
        format: (value) => `${value}%`,
        description: 'Ownership percentage retained'
      },
      {
        id: 'legal',
        name: 'Legal Compliance',
        weight: 0.10,
        calculate: (team) => {
          const legalForms = team.legalForms || [];
          const requiredForms = ['incorporation', 'founders-agreement'];
          const completed = requiredForms.filter(f => legalForms.includes(f)).length;
          return (completed / requiredForms.length) * 100;
        },
        format: (value) => `${value}%`,
        description: 'Essential legal documents filed'
      }
    ],
    bonusPoints: [
      {
        id: 'profitability',
        name: 'Profitability Bonus',
        points: 50,
        check: (team) => (team.cash || 0) > 50000 && (team.currentRound || 1) <= 3,
        description: 'Profitable before round 4'
      },
      {
        id: 'early-customers',
        name: 'Early Traction Bonus',
        points: 30,
        check: (team) => (team.customersAcquired || 0) >= 10 && (team.currentRound || 1) <= 2,
        description: '10+ customers by round 2'
      },
      {
        id: 'lean',
        name: 'Lean Operation Bonus',
        points: 40,
        check: (team) => (team.equityRetained || 100) >= 80 && (team.cash || 0) > 30000,
        description: 'High equity with strong cash position'
      }
    ]
  },
  
  research: {
    name: "Research Mode",
    metrics: [
      {
        id: 'cash',
        name: 'Cash Position',
        weight: 0.20,
        calculate: (team) => {
          const cash = team.cash || 0;
          return Math.min(100, (cash / 150000) * 100);
        },
        format: (value) => `$${value.toLocaleString()}`,
        description: 'Current cash in bank'
      },
      {
        id: 'trl',
        name: 'Technology Readiness',
        weight: 0.25,
        calculate: (team) => {
          const trl = team.trl || 1;
          // TRL scale is 1-9, convert to percentage
          return ((trl - 1) / 8) * 100;
        },
        format: (value) => `TRL ${value}`,
        description: 'Technology Readiness Level'
      },
      {
        id: 'ip',
        name: 'IP Portfolio',
        weight: 0.15,
        calculate: (team) => {
          const patents = team.patents || 0;
          const provisionals = team.provisionalPatents || 0;
          // Score based on IP protection
          return Math.min(100, (patents * 50 + provisionals * 25));
        },
        format: (value) => `${value} patents`,
        description: 'Intellectual property protection'
      },
      {
        id: 'licence',
        name: 'Licence Terms',
        weight: 0.15,
        calculate: (team) => {
          const licence = team.universityLicence;
          if (!licence) return 0;
          
          // Score based on deal favorability
          const scores = {
            'balanced': 70,
            'revenue-heavy': 60,
            'high-percentage': 50,
            'early-payments': 55,
            'equity': 80
          };
          return scores[licence] || 0;
        },
        format: (value) => value,
        description: 'University licence agreement quality'
      },
      {
        id: 'customers',
        name: 'Market Validation',
        weight: 0.15,
        calculate: (team) => {
          const customers = team.customersAcquired || 0;
          const pilots = team.pilotPrograms || 0;
          // Research mode typically has fewer but higher-value customers
          return Math.min(100, (customers * 20 + pilots * 40));
        },
        format: (value) => `${value} customers`,
        description: 'Customer and pilot validation'
      },
      {
        id: 'team',
        name: 'Team Composition',
        weight: 0.10,
        calculate: (team) => {
          const profiles = team.founderProfiles || [];
          if (profiles.length === 0) return 0;
          
          // Check for diversity in profiles
          const uniqueProfiles = new Set(profiles).size;
          const diversityScore = (uniqueProfiles / profiles.length) * 100;
          
          // Bonus for having all three key roles
          const hasScientist = profiles.includes('scientist');
          const hasBusiness = profiles.includes('business') || profiles.includes('entrepreneur');
          const hasTech = profiles.includes('engineer') || profiles.includes('scientist');
          const completenessBonus = (hasScientist && hasBusiness && hasTech) ? 20 : 0;
          
          return Math.min(100, diversityScore + completenessBonus);
        },
        format: (value) => `${value}%`,
        description: 'Team diversity and completeness'
      }
    ],
    bonusPoints: [
      {
        id: 'grant-winner',
        name: 'Grant Funding Secured',
        points: 60,
        check: (team) => (team.grantsReceived || 0) > 0,
        description: 'Successfully secured grant funding'
      },
      {
        id: 'high-trl',
        name: 'Rapid Development',
        points: 50,
        check: (team) => (team.trl || 1) >= 7 && (team.currentRound || 1) <= 4,
        description: 'Reached TRL 7+ by round 4'
      },
      {
        id: 'ip-protected',
        name: 'Strong IP Protection',
        points: 40,
        check: (team) => (team.patents || 0) >= 1,
        description: 'Filed full patent application'
      },
      {
        id: 'incubator',
        name: 'Incubator Acceptance',
        points: 35,
        check: (team) => team.inIncubator === true,
        description: 'Accepted into incubator program'
      },
      {
        id: 'balanced-team',
        name: 'Balanced Founding Team',
        points: 30,
        check: (team) => {
          const profiles = team.founderProfiles || [];
          return new Set(profiles).size === 3;
        },
        description: 'Three founders with diverse profiles'
      }
    ]
  }
};

// Helper function to calculate total score for a team
export function calculateTeamScore(team, mode = 'startup') {
  const config = scoringConfig[mode];
  if (!config) return null;
  
  let totalScore = 0;
  const metricScores = {};
  
  // Calculate weighted metric scores
  config.metrics.forEach(metric => {
    const rawValue = metric.calculate(team);
    const weightedScore = rawValue * metric.weight;
    totalScore += weightedScore;
    
    metricScores[metric.id] = {
      name: metric.name,
      rawValue: rawValue,
      weightedScore: weightedScore,
      weight: metric.weight,
      actualValue: metric.format(
        team[metric.id] || 
        (metric.id === 'development' ? team.developmentHours : 
         metric.id === 'trl' ? team.trl :
         metric.id === 'customers' ? team.customersAcquired :
         metric.id === 'equity' ? team.equityRetained :
         metric.id === 'legal' ? Math.round((team.legalForms?.length || 0) / 2 * 100) :
         metric.id === 'ip' ? team.patents :
         metric.id === 'licence' ? team.universityLicence :
         metric.id === 'team' ? (team.founderProfiles?.length || 0) * 33 :
         team[metric.id] || 0)
      )
    };
  });
  
  // Calculate bonus points
  let bonusTotal = 0;
  const earnedBonuses = [];
  
  config.bonusPoints.forEach(bonus => {
    if (bonus.check(team)) {
      bonusTotal += bonus.points;
      earnedBonuses.push({
        name: bonus.name,
        points: bonus.points,
        description: bonus.description
      });
    }
  });
  
  return {
    totalScore: Math.round(totalScore + bonusTotal),
    baseScore: Math.round(totalScore),
    bonusPoints: bonusTotal,
    metricScores,
    earnedBonuses,
    mode: config.name
  };
}

// Helper to compare teams and generate rankings
export function rankTeams(teams, mode = 'startup') {
  const scoredTeams = teams.map(team => ({
    ...team,
    scoreData: calculateTeamScore(team, mode)
  }));
  
  // Sort by total score descending
  scoredTeams.sort((a, b) => 
    (b.scoreData?.totalScore || 0) - (a.scoreData?.totalScore || 0)
  );
  
  // Add rank
  scoredTeams.forEach((team, index) => {
    team.rank = index + 1;
  });
  
  return scoredTeams;
}

// Get performance category based on score
export function getPerformanceCategory(score) {
  if (score >= 90) return { level: 'Excellent', color: '#10b981', description: 'Outstanding performance!' };
  if (score >= 75) return { level: 'Strong', color: '#3b82f6', description: 'Very good progress' };
  if (score >= 60) return { level: 'Good', color: '#f59e0b', description: 'Solid execution' };
  if (score >= 40) return { level: 'Fair', color: '#ef4444', description: 'Room for improvement' };
  return { level: 'Developing', color: '#6b7280', description: 'Keep building momentum' };
}