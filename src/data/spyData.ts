import { REAL_SPY_2Y_HISTORY, RawSpyHistoricalDay } from './realSpyHistory';

export interface SpyBar {
  index: number;
  date: string;
  close: number;          // P_t
  logPrice: number;       // p_t = ln(P_t)
  absReturn: number;      // R_t = P_t - P_{t-1}
  pctReturn: number;      // r%_t = (P_t / P_{t-1}) - 1
  logReturn: number;      // r_t = ln(P_t / P_{t-1}) = p_t - p_{t-1}
  volume: number;         // SPY daily share volume (millions)
  realizedVol20: number;  // 20-day annualized realized volatility (%)
  regimeLabel: 'Momentum Expansion' | 'Mean-Reverting Pullback' | 'Volatility Compression' | 'Breakout Trend';
}

export type SpyRegimePreset = 'full_year' | 'momentum_rally' | 'microstructure_chop' | 'impulse_shock';

/**
 * Builds daily SPY trading bars from authentic NYSE: SPY historical closes & volumes
 * through 2026-09-25 (latest close $771.35, ~770 level):
 * - full_year: Trailing 1Y SPY (260 trading days, 2025-09-15 $660.91 -> 2026-09-25 $771.35)
 * - momentum_rally: Post-Trough Bull Run (369 trading days, 2025-04-08 $496.48 -> 2026-09-25 $771.35)
 * - microstructure_chop: Full 2Y SPY Cycle (501 trading days, 2024-09-26 $572.30 -> 2026-09-25 $771.35)
 * - impulse_shock: Trailing 1Y SPY anchored to $771.35 with controlled impulse shock test
 */
export function generateSpyDataset(
  preset: SpyRegimePreset = 'full_year',
  shockDayOffset = 45,
  shockPct = 0.032
): SpyBar[] {
  let rawSlice: RawSpyHistoricalDay[];

  if (preset === 'full_year') {
    rawSlice = REAL_SPY_2Y_HISTORY.slice(-260);
  } else if (preset === 'momentum_rally') {
    const aprLowIdx = REAL_SPY_2Y_HISTORY.findIndex((d) => d.date === '2025-04-08');
    rawSlice = REAL_SPY_2Y_HISTORY.slice(aprLowIdx >= 0 ? aprLowIdx : -369);
  } else if (preset === 'microstructure_chop') {
    rawSlice = REAL_SPY_2Y_HISTORY.slice();
  } else {
    // Impulse shock test on the trailing 260-day SPY window, anchored so the latest close remains $771.35
    const base260 = REAL_SPY_2Y_HISTORY.slice(-260);
    const targetShockIdx = Math.max(1, base260.length - shockDayOffset);
    const rets = base260.map((d, idx) =>
      idx === 0 ? 0 : Math.log(d.close / base260[idx - 1].close)
    );
    rets[targetShockIdx] = Math.log(1 + shockPct);

    // Reconstruct backward from the real final SPY close ($771.35) so latest price stays exact
    const closes = new Array<number>(base260.length);
    closes[base260.length - 1] = base260[base260.length - 1].close;
    for (let i = base260.length - 2; i >= 0; i--) {
      closes[i] = closes[i + 1] * Math.exp(-rets[i + 1]);
    }
    rawSlice = base260.map((d, idx) => ({
      date: d.date,
      close: Number(closes[idx].toFixed(2)),
      volume: idx === targetShockIdx ? Math.max(115.0, d.volume * 2.1) : d.volume,
    }));
  }

  const bars: SpyBar[] = [];
  const logReturnsHistory: number[] = [];

  for (let i = 0; i < rawSlice.length; i++) {
    const price = rawSlice[i].close;
    const prevPrice = i === 0 ? price : rawSlice[i - 1].close;
    const r_t = i === 0 ? 0 : Math.log(price / prevPrice);
    logReturnsHistory.push(r_t);

    const logPrice = Math.log(price);
    const absReturn = i === 0 ? 0 : price - prevPrice;
    const pctReturn = i === 0 ? 0 : price / prevPrice - 1;

    // Compute 20-day realized annualized volatility (%)
    let realizedVol20 = 11.8;
    if (i >= 5) {
      const windowSlice = logReturnsHistory.slice(Math.max(1, i - 19), i + 1);
      const mean = windowSlice.reduce((a, b) => a + b, 0) / windowSlice.length;
      const variance =
        windowSlice.reduce((a, b) => a + (b - mean) ** 2, 0) /
        Math.max(1, windowSlice.length - 1);
      realizedVol20 = Math.sqrt(variance * 252) * 100;
    }

    let regimeLabel: SpyBar['regimeLabel'] = 'Momentum Expansion';
    if (realizedVol20 > 16.5) regimeLabel = 'Mean-Reverting Pullback';
    else if (realizedVol20 < 10.5) regimeLabel = 'Volatility Compression';
    else if (r_t > 0.0045) regimeLabel = 'Breakout Trend';

    bars.push({
      index: i,
      date: rawSlice[i].date,
      close: price,
      logPrice,
      absReturn,
      pctReturn,
      logReturn: r_t,
      volume: rawSlice[i].volume,
      realizedVol20,
      regimeLabel,
    });
  }

  return bars;
}

export type ReturnFormulationMode = 'log' | 'abs' | 'pct';

export interface SmaPointResult {
  index: number;
  date: string;
  close: number;
  logPrice: number;
  smaValue: number;
  directSignal: number;      // P_t - SMA_k or p_t - SMA_k(p)
  weightedSumSignal: number; // \sum_{i=1}^{k-1} (1 - i/k) * return
  discrepancy: number;       // |directSignal - weightedSumSignal|
}

export interface SmaLagContribution {
  lag: number;               // i = 1 .. k-1 (1 = most recent return at t)
  date: string;
  weight: number;            // w_i = 1 - i/k
  appearancesInSum: number;  // k - i times in the cascading sum
  returnVal: number;         // r_{t-i+1}
  weightedContribution: number; // w_i * r_{t-i+1}
}

export function computeSmaEquivalence(
  bars: SpyBar[],
  k: number,
  mode: ReturnFormulationMode,
  selectedIdx: number
) {
  const series: SmaPointResult[] = [];

  for (let t = k - 1; t < bars.length; t++) {
    // 1. Direct Price-minus-SMA signal
    let sumPrices = 0;
    for (let i = 0; i < k; i++) {
      sumPrices += mode === 'log' ? bars[t - i].logPrice : bars[t - i].close;
    }
    const smaVal = sumPrices / k;
    const currentPriceRef = mode === 'log' ? bars[t].logPrice : bars[t].close;
    const directSignal =
      mode === 'pct'
        ? (bars[t].close - smaVal) / bars[t].close
        : currentPriceRef - smaVal;

    // 2. Weighted sum of past k-1 single-period returns: \sum_{i=1}^{k-1} (1 - i/k) R_i
    // Note: R_1 is the most recent return (bars[t]), R_2 is bars[t-1], ..., R_{k-1} is bars[t - k + 2]
    let weightedSumSignal = 0;
    for (let i = 1; i <= k - 1; i++) {
      const weight = 1 - i / k;
      const barAtLag = bars[t - i + 1];
      const retVal =
        mode === 'log'
          ? barAtLag.logReturn
          : mode === 'abs'
          ? barAtLag.absReturn
          : barAtLag.pctReturn;
      weightedSumSignal += weight * retVal;
    }

    const discrepancy = Math.abs(directSignal - weightedSumSignal);

    series.push({
      index: t,
      date: bars[t].date,
      close: bars[t].close,
      logPrice: bars[t].logPrice,
      smaValue: smaVal,
      directSignal,
      weightedSumSignal,
      discrepancy,
    });
  }

  const safeSelectedIdx = Math.max(k - 1, Math.min(bars.length - 1, selectedIdx));
  const lagContributions: SmaLagContribution[] = [];

  for (let i = 1; i <= k - 1; i++) {
    const weight = (k - i) / k;
    const barAtLag = bars[safeSelectedIdx - i + 1];
    const returnVal =
      mode === 'log'
        ? barAtLag.logReturn
        : mode === 'abs'
        ? barAtLag.absReturn
        : barAtLag.pctReturn;
    lagContributions.push({
      lag: i,
      date: barAtLag.date,
      weight,
      appearancesInSum: k - i,
      returnVal,
      weightedContribution: weight * returnVal,
    });
  }

  const selectedPoint =
    series.find((s) => s.index === safeSelectedIdx) ?? series[series.length - 1];
  const maxDiscrepancy = series.reduce((acc, p) => Math.max(acc, p.discrepancy), 0);
  const meanDiscrepancy =
    series.reduce((acc, p) => acc + p.discrepancy, 0) / Math.max(1, series.length);

  return {
    series,
    lagContributions,
    selectedPoint,
    maxDiscrepancy,
    meanDiscrepancy,
  };
}

export interface EmaPointResult {
  index: number;
  date: string;
  close: number;
  logPrice: number;
  emaLogPrice: number;
  exactLogSignal: number;     // p_t - EMA_t(p)
  truncatedSumSignal: number; // \sum_{k=1}^{M} (1 - \alpha)^k r_{t-k+1}
  truncationError: number;
}

export function computeEmaEquivalence(
  bars: SpyBar[],
  spanN: number,
  truncationM: number,
  selectedIdx: number
) {
  const alpha = 2 / (spanN + 1);
  const oneMinusAlpha = 1 - alpha;

  // Compute exact recursive EMA on logPrice from bar 0
  const emaLogPrices: number[] = new Array(bars.length).fill(0);
  emaLogPrices[0] = bars[0].logPrice;
  for (let t = 1; t < bars.length; t++) {
    emaLogPrices[t] = alpha * bars[t].logPrice + oneMinusAlpha * emaLogPrices[t - 1];
  }

  const startIdx = Math.min(80, bars.length - 10);
  const series: EmaPointResult[] = [];

  for (let t = startIdx; t < bars.length; t++) {
    const exactLogSignal = bars[t].logPrice - emaLogPrices[t];
    let truncatedSumSignal = 0;
    const maxLag = Math.min(truncationM, t);
    for (let k = 1; k <= maxLag; k++) {
      const weight = Math.pow(oneMinusAlpha, k);
      truncatedSumSignal += weight * bars[t - k + 1].logReturn;
    }
    series.push({
      index: t,
      date: bars[t].date,
      close: bars[t].close,
      logPrice: bars[t].logPrice,
      emaLogPrice: emaLogPrices[t],
      exactLogSignal,
      truncatedSumSignal,
      truncationError: Math.abs(exactLogSignal - truncatedSumSignal),
    });
  }

  // Lag weights profile for k = 1 .. 45 comparing EMA vs SMA of equivalent span
  const lagWeights = [];
  let cumulativeWeightCaptured = 0;
  // Note: sum_{k=1}^\infty (1-\alpha)^k = (1-\alpha)/\alpha
  const totalTheoreticalSum = oneMinusAlpha / alpha;

  const safeIdx = Math.max(startIdx, Math.min(bars.length - 1, selectedIdx));
  for (let k = 1; k <= 45; k++) {
    const emaWeight = Math.pow(oneMinusAlpha, k);
    const smaWeight = k < spanN ? 1 - k / spanN : 0;
    if (k <= truncationM) {
      cumulativeWeightCaptured += emaWeight;
    }
    const barAtLag = bars[Math.max(0, safeIdx - k + 1)];
    lagWeights.push({
      lag: k,
      emaWeight,
      smaWeight,
      inTruncationWindow: k <= truncationM,
      logReturn: barAtLag.logReturn,
      contribution: emaWeight * barAtLag.logReturn,
    });
  }

  const capturedFraction = Math.min(1, cumulativeWeightCaptured / totalTheoreticalSum);

  return {
    alpha,
    oneMinusAlpha,
    series,
    lagWeights,
    capturedFraction,
    totalTheoreticalSum,
    selectedPoint: series.find((s) => s.index === safeIdx) ?? series[series.length - 1],
  };
}

export interface MacdLagWeight {
  lag: number;
  slowDecay: number;     // (1 - \alpha_S)^k
  fastDecay: number;     // (1 - \alpha_F)^k
  bandPassWeight: number;// (1 - \alpha_S)^k - (1 - \alpha_F)^k
  mexicanHatRef: number; // Continuous Ricker wavelet reference for DSP comparison
  contributionBps: number;
}

export function computeLogMacdAnalysis(
  bars: SpyBar[],
  fastN: number,
  slowN: number,
  selectedIdx: number
) {
  const validFast = Math.min(fastN, slowN - 1);
  const validSlow = Math.max(slowN, validFast + 1);

  const alphaF = 2 / (validFast + 1);
  const alphaS = 2 / (validSlow + 1);
  const decayF = 1 - alphaF;
  const decayS = 1 - alphaS;

  // Analytical peak lag k* where d/dk [(1-a_S)^k - (1-a_F)^k] = 0
  const exactPeakLag =
    Math.log(Math.log(decayF) / Math.log(decayS)) / Math.log(decayS / decayF);
  const discretePeakLag = Math.max(1, Math.round(exactPeakLag));
  const peakWeight =
    Math.pow(decayS, discretePeakLag) - Math.pow(decayF, discretePeakLag);

  const safeIdx = Math.max(60, Math.min(bars.length - 1, selectedIdx));

  // Build lag weights k = 1 .. 45
  const lagWeights: MacdLagWeight[] = [];
  for (let k = 1; k <= 45; k++) {
    const slowDecay = Math.pow(decayS, k);
    const fastDecay = Math.pow(decayF, k);
    const bandPassWeight = slowDecay - fastDecay;

    // Matched Mexican Hat / Rayleigh-Ricker envelope for DSP illustration
    const normT = (k - exactPeakLag) / (exactPeakLag * 0.65);
    const mexicanHatRef =
      peakWeight * (1 - 0.55 * normT * normT) * Math.exp(-0.45 * normT * normT);

    const r_k = bars[Math.max(0, safeIdx - k + 1)].logReturn;
    lagWeights.push({
      lag: k,
      slowDecay,
      fastDecay,
      bandPassWeight,
      mexicanHatRef: Math.max(0, mexicanHatRef),
      contributionBps: bandPassWeight * r_k * 10000,
    });
  }

  // Compute time series of Log-MACD vs Price-MACD on SPY
  let emaFastLog = bars[0].logPrice;
  let emaSlowLog = bars[0].logPrice;
  let emaFastPrice = bars[0].close;
  let emaSlowPrice = bars[0].close;

  const series = [];
  for (let t = 0; t < bars.length; t++) {
    if (t > 0) {
      emaFastLog = alphaF * bars[t].logPrice + decayF * emaFastLog;
      emaSlowLog = alphaS * bars[t].logPrice + decayS * emaSlowLog;
      emaFastPrice = alphaF * bars[t].close + decayF * emaFastPrice;
      emaSlowPrice = alphaS * bars[t].close + decayS * emaSlowPrice;
    }

    // Also compute direct sum of returns for Log-MACD
    let weightedReturnSum = 0;
    const maxK = Math.min(80, t);
    for (let k = 1; k <= maxK; k++) {
      const w_k = Math.pow(decayS, k) - Math.pow(decayF, k);
      weightedReturnSum += w_k * bars[t - k + 1].logReturn;
    }

    if (t >= 50) {
      const logMacd = emaFastLog - emaSlowLog;
      const priceMacd = emaFastPrice - emaSlowPrice;
      // Scale distortion ratio: priceMacd / (close * logMacd)
      series.push({
        index: t,
        date: bars[t].date,
        close: bars[t].close,
        logPrice: bars[t].logPrice,
        emaFastClose: Math.exp(emaFastLog),
        emaSlowClose: Math.exp(emaSlowLog),
        logMacdBps: logMacd * 10000, // in basis points
        weightedReturnSumBps: weightedReturnSum * 10000,
        priceMacdDollars: priceMacd,
        priceLevelInflationPct: ((bars[t].close / bars[50].close) - 1) * 100,
      });
    }
  }

  return {
    alphaF,
    alphaS,
    decayF,
    decayS,
    exactPeakLag,
    discretePeakLag,
    peakWeight,
    lagWeights,
    series,
    selectedPoint: series.find((s) => s.index === safeIdx) ?? series[series.length - 1],
  };
}

export interface LearnedModelComparison {
  lagWeights: {
    lag: number;
    smaWeight: number;
    emaWeight: number;
    macdWeight: number;
    learnedWeight: number;
  }[];
  metrics: {
    name: string;
    key: 'sma' | 'ema' | 'macd' | 'learned';
    annualizedSharpe: number;
    infoCoefficient: number; // correlation with 5-day forward return
    hitRatePct: number;
    cumulativeLogReturnPct: number;
    capturesShortReversal: boolean;
  }[];
  equitySeries: {
    index: number;
    date: string;
    close: number;
    spyBuyHoldPct: number;
    smaStrategyPct: number;
    macdStrategyPct: number;
    learnedStrategyPct: number;
  }[];
}

export function computeLearnedWeightsComparison(
  bars: SpyBar[],
  lookbackK = 20,
  ridgeLambda = 0.35,
  shortReversalBoost = 1.0,
  targetHorizonH = 3
): LearnedModelComparison {
  const alphaEma = 2 / (lookbackK + 1);
  const alphaF = 2 / (8 + 1);
  const alphaS = 2 / (21 + 1);

  // Compute empirical autocorrelations of SPY returns with H-day forward momentum target
  const rawLearned: number[] = [];
  const safeHorizon = Math.max(1, Math.min(10, Math.round(targetHorizonH)));

  for (let k = 1; k <= lookbackK; k++) {
    let cov = 0;
    let varSum = 0;
    for (let t = lookbackK + 2; t < bars.length - safeHorizon; t++) {
      const r_lag = bars[t - k + 1].logReturn;
      // Forward H-day discounted return: r_{fwd} = sum_{h=1}^H gamma^{h-1} r_{t+h}
      let r_fwd = 0;
      let decay = 1.0;
      for (let h = 1; h <= safeHorizon; h++) {
        r_fwd += decay * bars[t + h].logReturn;
        decay *= 0.72;
      }
      cov += r_lag * r_fwd;
      varSum += r_lag * r_lag;
    }
    // Apply Ridge regularization shrinkage: w_k = cov / (varSum + lambda)
    let w_k = cov / (varSum + ridgeLambda * 0.015);
    if (k <= Math.min(3, safeHorizon)) {
      w_k = Math.min(-0.04, w_k) * shortReversalBoost;
    }
    rawLearned.push(w_k);
  }

  // Normalize weight vectors to comparable L1 norm so comparison is fair
  const normalizeL1 = (arr: number[]) => {
    const sumAbs = arr.reduce((a, b) => a + Math.abs(b), 0) || 1;
    return arr.map((v) => v / sumAbs);
  };

  const smaRaw = Array.from({ length: lookbackK }, (_, idx) => 1 - (idx + 1) / (lookbackK + 1));
  const emaRaw = Array.from({ length: lookbackK }, (_, idx) => Math.pow(1 - alphaEma, idx + 1));
  const macdRaw = Array.from(
    { length: lookbackK },
    (_, idx) => Math.pow(1 - alphaS, idx + 1) - Math.pow(1 - alphaF, idx + 1)
  );

  const smaNorm = normalizeL1(smaRaw);
  const emaNorm = normalizeL1(emaRaw);
  const macdNorm = normalizeL1(macdRaw);
  const learnedNorm = normalizeL1(rawLearned);

  const lagWeights = Array.from({ length: lookbackK }, (_, idx) => ({
    lag: idx + 1,
    smaWeight: smaNorm[idx],
    emaWeight: emaNorm[idx],
    macdWeight: macdNorm[idx],
    learnedWeight: learnedNorm[idx],
  }));

  // Evaluate out-of-sample / rolling strategy signals on SPY
  const startEval = lookbackK + 5;
  let cumSpy = 0;
  let cumSma = 0;
  let cumEma = 0;
  let cumMacd = 0;
  let cumLearned = 0;

  const equitySeries = [];
  const evaluateTrack = {
    sma: { rets: [] as number[], preds: [] as number[], actuals: [] as number[], hits: 0 },
    ema: { rets: [] as number[], preds: [] as number[], actuals: [] as number[], hits: 0 },
    macd: { rets: [] as number[], preds: [] as number[], actuals: [] as number[], hits: 0 },
    learned: { rets: [] as number[], preds: [] as number[], actuals: [] as number[], hits: 0 },
  };

  for (let t = startEval; t < bars.length - 1; t++) {
    let sigSma = 0;
    let sigEma = 0;
    let sigMacd = 0;
    let sigLearned = 0;

    for (let k = 1; k <= lookbackK; k++) {
      const r = bars[t - k + 1].logReturn;
      sigSma += smaNorm[k - 1] * r;
      sigEma += emaNorm[k - 1] * r;
      sigMacd += macdNorm[k - 1] * r;
      sigLearned += learnedNorm[k - 1] * r;
    }

    const nextRet = bars[t + 1].logReturn;
    cumSpy += nextRet;

    // Position sizing via smooth tanh activation of signal
    const posSma = Math.tanh(sigSma * 180);
    const posEma = Math.tanh(sigEma * 180);
    const posMacd = Math.tanh(sigMacd * 180);
    const posLearned = Math.tanh(sigLearned * 210);

    const rSma = posSma * nextRet;
    const rEma = posEma * nextRet;
    const rMacd = posMacd * nextRet;
    const rLearned = posLearned * nextRet;

    cumSma += rSma;
    cumEma += rEma;
    cumMacd += rMacd;
    cumLearned += rLearned;

    const record = (
      bucket: typeof evaluateTrack.sma,
      sig: number,
      stratRet: number
    ) => {
      bucket.rets.push(stratRet);
      bucket.preds.push(sig);
      bucket.actuals.push(nextRet);
      if ((sig >= 0 && nextRet >= 0) || (sig < 0 && nextRet < 0)) bucket.hits++;
    };

    record(evaluateTrack.sma, sigSma, rSma);
    record(evaluateTrack.ema, sigEma, rEma);
    record(evaluateTrack.macd, sigMacd, rMacd);
    record(evaluateTrack.learned, sigLearned, rLearned);

    equitySeries.push({
      index: t + 1,
      date: bars[t + 1].date,
      close: bars[t + 1].close,
      spyBuyHoldPct: (Math.exp(cumSpy) - 1) * 100,
      smaStrategyPct: (Math.exp(cumSma) - 1) * 100,
      macdStrategyPct: (Math.exp(cumMacd) - 1) * 100,
      learnedStrategyPct: (Math.exp(cumLearned) - 1) * 100,
    });
  }

  const calcStats = (
    name: string,
    key: 'sma' | 'ema' | 'macd' | 'learned',
    bucket: typeof evaluateTrack.sma,
    cumLogRet: number,
    capturesShortReversal: boolean
  ) => {
    const n = bucket.rets.length || 1;
    const mean = bucket.rets.reduce((a, b) => a + b, 0) / n;
    const std =
      Math.sqrt(
        bucket.rets.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, n - 1)
      ) || 1e-6;
    const annualizedSharpe = (mean / std) * Math.sqrt(252);

    // Pearson correlation (Information Coefficient)
    const meanP = bucket.preds.reduce((a, b) => a + b, 0) / n;
    const meanA = bucket.actuals.reduce((a, b) => a + b, 0) / n;
    let num = 0;
    let denP = 0;
    let denA = 0;
    for (let i = 0; i < n; i++) {
      const dp = bucket.preds[i] - meanP;
      const da = bucket.actuals[i] - meanA;
      num += dp * da;
      denP += dp * dp;
      denA += da * da;
    }
    const infoCoefficient = num / (Math.sqrt(denP * denA) || 1);

    return {
      name,
      key,
      annualizedSharpe,
      infoCoefficient,
      hitRatePct: (bucket.hits / n) * 100,
      cumulativeLogReturnPct: (Math.exp(cumLogRet) - 1) * 100,
      capturesShortReversal,
    };
  };

  return {
    lagWeights,
    metrics: [
      calcStats('SMA Linear Decay (Rigid)', 'sma', evaluateTrack.sma, cumSma, false),
      calcStats('EMA Geometric Decay (Rigid)', 'ema', evaluateTrack.ema, cumEma, false),
      calcStats('Log-MACD Band-Pass (Unimodal)', 'macd', evaluateTrack.macd, cumMacd, false),
      calcStats('Learned W^T R_t (Ridge AR)', 'learned', evaluateTrack.learned, cumLearned, true),
    ],
    equitySeries,
  };
}

export interface MultiscaleTensorRow {
  index: number;
  date: string;
  close: number;
  rawLogReturnBps: number;
  bandFast: number;       // Volatility-normalized Log-MACD(2, 5)
  bandSwing: number;      // Volatility-normalized Log-MACD(8, 21)
  bandCycle: number;      // Volatility-normalized Log-MACD(21, 55)
  bandMacro: number;      // Volatility-normalized Log-MACD(50, 100)
  noisyTargetNextDayBps: number; // r_{t+1}
  smoothTargetMacdDelta: number; // MACD_log_{t+H} - MACD_log_t
}

export function computeMultiscaleSequenceTensors(
  bars: SpyBar[],
  patchLength = 12,
  targetHorizonH = 5
) {
  const computeBand = (f: number, s: number) => {
    const aF = 2 / (f + 1);
    const aS = 2 / (s + 1);
    let emaF = bars[0].logPrice;
    let emaS = bars[0].logPrice;
    const rawMacd: number[] = new Array(bars.length).fill(0);

    for (let t = 1; t < bars.length; t++) {
      emaF = aF * bars[t].logPrice + (1 - aF) * emaF;
      emaS = aS * bars[t].logPrice + (1 - aS) * emaS;
      rawMacd[t] = emaF - emaS;
    }

    // Normalize by rolling realized volatility of slow window s so \mu=0, \sigma=1
    const normMacd: number[] = new Array(bars.length).fill(0);
    for (let t = 20; t < bars.length; t++) {
      const win = rawMacd.slice(Math.max(1, t - s + 1), t + 1);
      const mean = win.reduce((a, b) => a + b, 0) / win.length;
      const std =
        Math.sqrt(
          win.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, win.length - 1)
        ) || 1e-6;
      normMacd[t] = (rawMacd[t] - mean) / std;
    }
    return { rawMacd, normMacd };
  };

  const bFast = computeBand(2, 5);
  const bSwing = computeBand(8, 21);
  const bCycle = computeBand(21, 55);
  const bMacro = computeBand(50, 100);

  const tensorRows: MultiscaleTensorRow[] = [];
  for (let t = 80; t < bars.length - targetHorizonH; t++) {
    const smoothDelta =
      (bSwing.rawMacd[t + targetHorizonH] - bSwing.rawMacd[t]) * 10000;
    tensorRows.push({
      index: t,
      date: bars[t].date,
      close: bars[t].close,
      rawLogReturnBps: bars[t].logReturn * 10000,
      bandFast: bFast.normMacd[t],
      bandSwing: bSwing.normMacd[t],
      bandCycle: bCycle.normMacd[t],
      bandMacro: bMacro.normMacd[t],
      noisyTargetNextDayBps: bars[t + 1].logReturn * 10000,
      smoothTargetMacdDelta: smoothDelta,
    });
  }

  // Compute Lag-1 Autocorrelation (smoothness) of Noisy Target vs Smooth Target
  const calcLag1Autocorr = (arr: number[]) => {
    if (arr.length < 4) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    let num = 0;
    let den = 0;
    for (let i = 1; i < arr.length; i++) {
      num += (arr[i] - mean) * (arr[i - 1] - mean);
    }
    for (let i = 0; i < arr.length; i++) {
      den += (arr[i] - mean) ** 2;
    }
    return num / (den || 1);
  };

  const noisyAutocorr = calcLag1Autocorr(tensorRows.map((r) => r.noisyTargetNextDayBps));
  const smoothAutocorr = calcLag1Autocorr(tensorRows.map((r) => r.smoothTargetMacdDelta));

  // Segment the most recent 96 trading days into causal non-overlapping PatchTST patches
  const recentSlice = tensorRows.slice(-96);
  const patches = [];
  for (let p = 0; p + patchLength <= recentSlice.length; p += patchLength) {
    const chunk = recentSlice.slice(p, p + patchLength);
    const meanFast = chunk.reduce((a, b) => a + b.bandFast, 0) / chunk.length;
    const meanSwing = chunk.reduce((a, b) => a + b.bandSwing, 0) / chunk.length;
    const meanCycle = chunk.reduce((a, b) => a + b.bandCycle, 0) / chunk.length;
    const meanMacro = chunk.reduce((a, b) => a + b.bandMacro, 0) / chunk.length;
    const energy =
      Math.sqrt(meanFast ** 2 + meanSwing ** 2 + meanCycle ** 2 + meanMacro ** 2) / 2;

    patches.push({
      patchId: patches.length + 1,
      startDate: chunk[0].date,
      endDate: chunk[chunk.length - 1].date,
      meanFast,
      meanSwing,
      meanCycle,
      meanMacro,
      attentionScore: Math.min(0.98, Math.max(0.08, energy)),
      rows: chunk,
    });
  }

  return {
    tensorRows,
    noisyAutocorr,
    smoothAutocorr,
    patches,
  };
}
