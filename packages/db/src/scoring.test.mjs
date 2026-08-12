import * as S from './scoring.ts';

const pass = [], fail = [];
const check = (name, cond, detail='') => (cond ? pass : fail).push(name + (detail?` — ${detail}`:''));

// ── Scenario A: affluent leafy suburb (Richmond-like) ──
const richmond = {
  goodSchoolShare: 0.95, schoolCount: 14,
  crimePer1000: 42,
  minsToStation: 6, transportStops: 48,
  greenSpaceShare: 0.42, metresToPark: 180,
  amenityCount: 190,
  medianPrice: 845000, medianEarnings: 41000,
  medianRent: 2680, fiveYearPriceChange: 0.124, daysOnMarket: 44,
  planningApprovals: 90, population: 21000,
  floodRisk: 'low',
};

// ── Scenario B: student HMO area (Hyde Park Leeds-like) ──
const hydePark = {
  goodSchoolShare: 0.52, schoolCount: 7,
  crimePer1000: 165,
  minsToStation: 12, transportStops: 40,
  greenSpaceShare: 0.07, metresToPark: 700,
  amenityCount: 82,
  medianPrice: 218000, medianEarnings: 32000,
  medianRent: 1090, fiveYearPriceChange: 0.194, daysOnMarket: 19,
  planningApprovals: 40, population: 15000,
  floodRisk: 'very low',
};

// ── Scenario C: sparse data ──
const sparse = {
  goodSchoolShare: null, schoolCount: null,
  crimePer1000: 70, minsToStation: null, transportStops: null,
  greenSpaceShare: null, metresToPark: null, amenityCount: null,
  medianPrice: 250000, medianEarnings: 30000,
  medianRent: null, fiveYearPriceChange: null, daysOnMarket: null,
  planningApprovals: null, population: null, floodRisk: null,
};

const dR = S.computeDimensions(richmond);
const dH = S.computeDimensions(hydePark);
const dS = S.computeDimensions(sparse);

const rR = S.computeRealvianScore(dR);
const rH = S.computeRealvianScore(dH);
const rS = S.computeRealvianScore(dS);

console.log('Richmond dims :', JSON.stringify(dR));
console.log('Richmond score:', JSON.stringify(rR));
console.log('HydePark dims :', JSON.stringify(dH));
console.log('HydePark score:', JSON.stringify(rH));
console.log('Sparse   score:', JSON.stringify(rS));

// ── Assertions grounded in what we KNOW should be true ──
check('Richmond scores high liveability', rR.score >= 78, `got ${rR.score}`);
check('Hyde Park scores lower liveability than Richmond', rH.score < rR.score, `${rH.score} vs ${rR.score}`);
check('Richmond safety beats Hyde Park', dR.safety > dH.safety, `${dR.safety} vs ${dH.safety}`);
check('Richmond affordability is poor', dR.affordability < 40, `got ${dR.affordability}`);
check('Hyde Park affordability better than Richmond', dH.affordability > dR.affordability);
check('All scores within 0-100', [dR,dH].every(d=>Object.values(d).every(v=>v===null||(v>=0&&v<=100))));
check('Sparse data withheld (confidence too low)', rS.score === null, `confidence ${rS.confidence}`);
check('Sparse reports missing dimensions', rS.missing.length > 0, rS.missing.join(','));

// Investment
const iR = S.computeInvestmentScore(richmond, rR.score);
const iH = S.computeInvestmentScore(hydePark, rH.score);
console.log('Richmond invest:', JSON.stringify(iR));
console.log('HydePark invest:', JSON.stringify(iH));
check('Hyde Park beats Richmond on INVESTMENT', iH.score > iR.score, `${iH.score} vs ${iR.score}`);
check('Yield calc correct for Hyde Park', S.grossYield(hydePark) === 6.0, `got ${S.grossYield(hydePark)}`);
check('Yield calc correct for Richmond', Math.abs(S.grossYield(richmond) - 3.8) < 0.05, `got ${S.grossYield(richmond)}`);

// Explanation
const ex = S.explainRealvianScore(dR);
const sumContrib = ex.reduce((s,c)=>s+c.contribution,0);
console.log('Explain sums to:', sumContrib.toFixed(1), 'vs score', rR.score);
check('Explanation contributions sum to the score', Math.abs(sumContrib - rR.score) < 1.5, `${sumContrib.toFixed(1)} vs ${rR.score}`);
check('Weights sum to 1.0', Math.abs(ex.reduce((s,c)=>s+c.weight,0) - 1) < 0.01);

console.log('\n=== PASS (' + pass.length + ') ===');
pass.forEach(p=>console.log('  ✓', p));
if (fail.length) { console.log('\n=== FAIL (' + fail.length + ') ==='); fail.forEach(f=>console.log('  ✗', f)); process.exit(1); }
else console.log('\nALL TESTS PASSED');
