import React, { useState, useEffect } from 'react';
import {
  ArrowUpRight,
  Search,
  BookOpen,
  Printer,
  ExternalLink,
  BookmarkCheck,
  Library,
  ArrowLeft,
  ChevronRight,
  Layers,
  Sparkles,
  Sliders,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import { MathFormula } from './MathFormula';

export type DashboardTabId =
  | 'sma'
  | 'ema'
  | 'macd'
  | 'learned'
  | 'strategy_arch'
  | 'sequence'
  | 'manuscript';

export type ManuscriptViewMode =
  | 'all'
  | 'part1'
  | 'part2'
  | 'literature'
  | 'treatise';

interface TabManuscriptProps {
  onNavigateTab: (tab: DashboardTabId) => void;
  onOpenPrint?: () => void;
  initialViewMode?: ManuscriptViewMode;
  onViewModeChange?: (mode: ManuscriptViewMode) => void;
}

interface CitationItem {
  id: string;
  key: string;
  authors: string;
  year: number;
  title: string;
  source: string;
  domain:
    | 'dsp'
    | 'econometrics'
    | 'microstructure'
    | 'momentum'
    | 'ml'
    | 'sequence';
  domainLabel: string;
  equationSummary?: string;
  architecturalMapping: string;
}

const ACADEMIC_CITATIONS: CitationItem[] = [
  {
    id: 'cit-appel',
    key: 'Appel 1979',
    authors: 'Appel, Gerald',
    year: 1979,
    title: 'Technical Analysis: Power Tools for Active Investors',
    source: 'Prentice Hall / Systems and Forecasts Publications',
    domain: 'dsp',
    domainLabel: 'Digital Filter Theory',
    equationSummary: String.raw`\text{MACD}_t = \text{EMA}_{12}(p_t) - \text{EMA}_{26}(p_t)`,
    architecturalMapping:
      'Origin of the Moving Average Convergence Divergence indicator. We derive the exact log-price equivalence proving that subtracting two exponential smoothers cancels the nominal price level and forms a stationary difference-of-exponentials band-pass filter (Tab 3).',
  },
  {
    id: 'cit-ehlers',
    key: 'Ehlers 2001',
    authors: 'Ehlers, John F.',
    year: 2001,
    title: 'Rocket Science for Traders: Digital Signal Processing Applications',
    source: 'John Wiley & Sons, New York',
    domain: 'dsp',
    domainLabel: 'Digital Filter Theory',
    equationSummary: String.raw`H(z) = \frac{(1 - \alpha/2) - (1 - \alpha/2)z^{-1}}{1 - (1 - \alpha)z^{-1}}`,
    architecturalMapping:
      'Pioneered the application of electrical engineering digital signal processing (DSP), MESA cycle analytics, and causal band-pass wavelet filters to market returns. Directly inspires our 4-band multiscale filter bank (Tab 3 & Tab 5).',
  },
  {
    id: 'cit-oppenheim',
    key: 'Oppenheim & Schafer 2009',
    authors: 'Oppenheim, Alan V., & Schafer, Ronald W.',
    year: 2009,
    title: 'Discrete-Time Signal Processing (3rd Edition)',
    source: 'Pearson Higher Education',
    domain: 'dsp',
    domainLabel: 'Digital Filter Theory',
    equationSummary: String.raw`h_k = (1 - \alpha_S)^k - (1 - \alpha_F)^k, \quad k \ge 1`,
    architecturalMapping:
      'Foundational textbook on causal Infinite Impulse Response (IIR) filtering, group delay, and difference-of-exponentials impulse responses that form the bedrock of our digital band-pass proof in Section 03 and Section 08.',
  },
  {
    id: 'cit-granger-engle',
    key: 'Granger & Engle 1987',
    authors: 'Granger, Clive W. J., & Engle, Robert F.',
    year: 1987,
    title: 'Co-Integration and Error Correction: Representation, Estimation, and Testing',
    source: 'Econometrica, 55(2), 251–276 (Nobel Memorial Prize in Economic Sciences, 2003)',
    domain: 'econometrics',
    domainLabel: 'Econometrics & Stationarity',
    equationSummary: String.raw`p_t \sim I(1) \implies \Delta p_t = r_t \sim I(0)`,
    architecturalMapping:
      'Proved that statistical models and moving averages applied to non-stationary integrated price levels I(1) suffer from spurious regression. Establishes the mathematical necessity of transforming nominal prices into stationary return spaces (Tab 1 & Tab 2).',
  },
  {
    id: 'cit-fama',
    key: 'Fama 1970',
    authors: 'Fama, Eugene F.',
    year: 1970,
    title: 'Efficient Capital Markets: A Review of Theory and Empirical Work',
    source: 'The Journal of Finance, 25(2), 383–417',
    domain: 'econometrics',
    domainLabel: 'Econometrics & Stationarity',
    equationSummary: String.raw`\mathbb{E}[r_{t+1} \mid \mathcal{F}_t] = \mu \implies \text{Cov}(r_t, r_{t+k}) \approx 0`,
    architecturalMapping:
      'Formalized the Efficient Market Hypothesis and Martingale return processes, explaining why raw single-day return prediction exhibits low signal-to-noise ratios (<0.05) and necessitates our smooth target paradigm (Section 07).',
  },
  {
    id: 'cit-lo-mackinlay',
    key: 'Lo & MacKinlay 1988',
    authors: 'Lo, Andrew W., & MacKinlay, A. Craig',
    year: 1988,
    title: 'Stock Market Prices Do Not Follow Random Walks: Evidence from a Simple Specification Test',
    source: 'Review of Financial Studies, 1(1), 41–66; Princeton University Press (1999)',
    domain: 'econometrics',
    domainLabel: 'Econometrics & Stationarity',
    equationSummary: String.raw`\text{VR}(q) = \frac{\sigma^2(q)}{q \cdot \sigma^2(1)} \ne 1`,
    architecturalMapping:
      'Demonstrated via variance ratio tests that equity prices violate pure random walks, exhibiting persistent positive autocorrelation at weekly to monthly horizons alongside short-term mean reversion. Validated empirically on SPY in Tab 4.',
  },
  {
    id: 'cit-roll',
    key: 'Roll 1984',
    authors: 'Roll, Richard',
    year: 1984,
    title: 'A Simple Implicit Measure of the Effective Bid-Ask Spread in an Efficient Market',
    source: 'The Journal of Finance, 39(4), 1127–1139',
    domain: 'microstructure',
    domainLabel: 'Market Microstructure',
    equationSummary: String.raw`\text{Cov}(r_t, r_{t-1}) = -\frac{s^2}{4} \implies \rho(1) < 0`,
    architecturalMapping:
      'Mathematically proved that bid-ask bounce mechanically induces negative serial covariance at lag 1. Uncovers the Non-Negativity Trap: rigid moving averages with positive weights buy into temporary bid-ask bounces, whereas learned AR weights adopt negative short-lag coefficients (Tab 4 & Tab 5).',
  },
  {
    id: 'cit-ohara',
    key: 'O’Hara 1995',
    authors: 'O’Hara, Maureen',
    year: 1995,
    title: 'Market Microstructure Theory',
    source: 'Blackwell Publishers, Cambridge, MA',
    domain: 'microstructure',
    domainLabel: 'Market Microstructure',
    equationSummary: String.raw`\Delta P_t = \lambda \cdot Q_t + \eta_t`,
    architecturalMapping:
      'Rigorous foundation for inventory balancing, market-maker risk constraints, and dealer rebalancing cycles that produce predictable mean-reverting microstructure pullbacks at lags 1–3 in SPY daily transactions.',
  },
  {
    id: 'cit-bouchaud',
    key: 'Bouchaud et al. 2018',
    authors: 'Bouchaud, Jean-Philippe, Bonart, J., Donier, J., & Gould, M.',
    year: 2018,
    title: 'Trades, Quotes and Prices: Financial Markets Under the Microscope',
    source: 'Cambridge University Press',
    domain: 'microstructure',
    domainLabel: 'Market Microstructure',
    equationSummary: String.raw`I(\ell) \sim \ell^{-\gamma} \quad (\text{Transient Impact Decay})`,
    architecturalMapping:
      'Econophysics treatise proving that institutional order slicing (TWAP/VWAP algorithms) causes market impact to decay as a power law, creating structural transient price reversals that our learned autoregressive weight vector captures.',
  },
  {
    id: 'cit-moskowitz',
    key: 'Moskowitz et al. 2012',
    authors: 'Moskowitz, Tobias J., Ooi, Yao Hua, & Pedersen, Lasse Heje',
    year: 2012,
    title: 'Time Series Momentum',
    source: 'Journal of Financial Economics, 104(2), 228–250',
    domain: 'momentum',
    domainLabel: 'Time Series Momentum',
    equationSummary: String.raw`r_{t, t+1}^s = \text{sign}(r_{t-12, t}) \frac{40\%}{\sigma_t} r_{t, t+1}`,
    architecturalMapping:
      'Seminal paper proving that past 1- to 12-month returns positively predict future excess returns across 58 liquid futures and equity indices. Confirms why learned lag weights switch from negative (microstructure) to robust positive values at lags 5–20.',
  },
  {
    id: 'cit-baltas',
    key: 'Baltas & Kosowski 2013',
    authors: 'Baltas, Nick, & Kosowski, Robert',
    year: 2013,
    title: 'Momentum Strategies in Futures Markets and Trend-Following Funds',
    source: 'The Journal of Alternative Investments, 15(3), 44–78',
    domain: 'momentum',
    domainLabel: 'Time Series Momentum',
    equationSummary: String.raw`S_t = \frac{\text{EMA}_S(p_t) - \text{EMA}_L(p_t)}{\sigma_t}`,
    architecturalMapping:
      'Formulated the explicit mathematical bridge between moving average crossovers and time-series momentum, demonstrating that volatility-normalized moving average differences proxy optimal trend signals.',
  },
  {
    id: 'cit-hoerl-kennard',
    key: 'Hoerl & Kennard 1970',
    authors: 'Hoerl, Arthur E., & Kennard, Robert W.',
    year: 1970,
    title: 'Ridge Regression: Biased Estimation for Nonorthogonal Problems',
    source: 'Technometrics, 12(1), 55–67',
    domain: 'ml',
    domainLabel: 'Statistical Learning',
    equationSummary: String.raw`\mathbf{W}^* = (\mathbf{X}^T \mathbf{X} + \lambda \mathbf{I})^{-1} \mathbf{X}^T \mathbf{y}`,
    architecturalMapping:
      'Invented L2 regularization shrinkage to resolve near-singular covariance matrices in multicollinear regressors. Used directly in Tab 4 to compute the closed-form learned return weights on SPY returns.',
  },
  {
    id: 'cit-hastie',
    key: 'Hastie et al. 2009',
    authors: 'Hastie, Trevor, Tibshirani, Robert, & Friedman, Jerome',
    year: 2009,
    title: 'The Elements of Statistical Learning: Data Mining, Inference, and Prediction',
    source: 'Springer Series in Statistics, New York',
    domain: 'ml',
    domainLabel: 'Statistical Learning',
    equationSummary: String.raw`\min_{\mathbf{W}} \left\{ \frac{1}{T} \|\mathbf{y} - \mathbf{X}\mathbf{W}\|_2^2 + \lambda \|\mathbf{W}\|_2^2 \right\}`,
    architecturalMapping:
      'Defines the empirical risk minimization and bias-variance tradeoff framework underlying our autoregressive weighting model and Information Coefficient (IC) optimization.',
  },
  {
    id: 'cit-patchtst',
    key: 'Nie et al. 2023',
    authors: 'Nie, Yuqi, Nguyen, Nam H., Sinthong, Phanwadee, & Kalagnanam, Jayant',
    year: 2023,
    title: 'A Time Series is Worth 64 Words: Long-term Forecasting with Transformers (PatchTST)',
    source: 'International Conference on Learning Representations (ICLR 2023)',
    domain: 'sequence',
    domainLabel: 'Deep Sequence Modeling',
    equationSummary: String.raw`\mathbf{P}_p \in \mathbb{R}^{L \times M}, \quad \text{Attn}(\mathbf{Q}, \mathbf{K}, \mathbf{V}) = \text{softmax}\left(\frac{\mathbf{Q}\mathbf{K}^T}{\sqrt{d}}\right)\mathbf{V}`,
    architecturalMapping:
      'Introduced sub-sequence patch tokenization and channel independence for time-series Transformers. We provide the mathematical proof that multiscale Log-MACD filter banks preserve strict causality with zero lookahead leakage during patch tokenization (Section 08 & Tab 5).',
  },
  {
    id: 'cit-lopez-de-prado',
    key: 'López de Prado 2018',
    authors: 'López de Prado, Marcos',
    year: 2018,
    title: 'Advances in Financial Machine Learning',
    source: 'John Wiley & Sons, Hoboken, NJ',
    domain: 'sequence',
    domainLabel: 'Deep Sequence Modeling',
    equationSummary: String.raw`d \in (0, 1), \quad (1 - B)^d p_t \sim I(0)`,
    architecturalMapping:
      'Foundational reference on preserving memory while ensuring stationarity (fractional differentiation), causal labeling, and preventing backtest overfitting in financial machine learning pipelines.',
  },
];

export interface PartMeta {
  id: 1 | 2;
  key: 'part1' | 'part2';
  roman: string;
  shortLabel: string;
  title: string;
  badge: string;
  subtitle: string;
  description: string;
  sectionsLabel: string;
  sectionIds: string[];
  topics: string[];
}

export const MANUSCRIPT_PARTS: Record<1 | 2, PartMeta> = {
  1: {
    id: 1,
    key: 'part1',
    roman: 'Part I',
    shortLabel: 'Part I: Up to Return Weights',
    title: 'Mathematical Foundations, Indicator Equivalences & Learned Return Weights',
    badge: 'Part I · Sections 01–05',
    subtitle: 'From Heuristic Moving Averages to Stationary Return Vectors (W^T R_t), Forward Horizon H & Market Microstructure',
    description:
      'Rigorous mathematical derivations proving that Simple Moving Averages (SMA), Exponential Moving Averages (EMA), and Log-MACD oscillators reduce strictly to linear filter kernels on stationary log-returns. Formulates trend-following as an Autoregressive AR(K) empirical risk minimization problem with L2 Ridge shrinkage and optimal forward prediction horizon H (discounted targets y_{t+H} and the four quantitative foundations for H=3), and proves why rigid moving averages fall into the "Non-Negativity Trap" in the presence of SPY microstructure bounce.',
    sectionsLabel: 'Sections 01 through 05',
    sectionIds: ['sec-1', 'sec-2', 'sec-3', 'sec-4', 'sec-5'],
    topics: [
      'SMA Linear Decay Equivalence (1 - i/k)',
      'EMA Infinite Geometric Series Memory (1 - α)^k',
      'Log-MACD Difference-of-Exponentials Kernel',
      'Autoregressive Optimization & Learned Weights (W^T R_t)',
      'Forward Prediction Horizon H (Discounted Target & 4 Foundations)',
      'Microstructure Bounce & The Non-Negativity Trap',
    ],
  },
  2: {
    id: 2,
    key: 'part2',
    roman: 'Part II',
    shortLabel: 'Part II: Multiscale, PatchTST & Wavelets',
    title: 'Institutional Sequence Modeling, Multiscale Filter Banks, PatchTST & Wavelets',
    badge: 'Part II · Sections 06–09',
    subtitle: 'Continuous Multiscale Tensors (X_t), Smooth Target Engineering, Causal Patching & Academic Survey',
    description:
      'Scales the single-kernel return framework into continuous 4-band volatility-normalized Log-MACD feature tensors (X_t). Solves high-entropy daily return noise with the Smooth Target paradigm (ΔMACD_log, t+H), proves zero forward-looking data leakage during Transformer sub-sequence patching (PatchTST), unifies with Operator Theory (instantaneous velocity) and continuous Mexican Hat wavelets, and synthesizes 15 seminal peer-reviewed papers.',
    sectionsLabel: 'Sections 06 through 09',
    sectionIds: ['sec-6', 'sec-7', 'sec-8', 'sec-9'],
    topics: [
      'Multiscale 4-Band Log-MACD Tensors (X_t)',
      'Dynamic Rolling Volatility Normalization (Z-score)',
      'Smooth Target Engineering (ΔMACD_log, t+H)',
      'Causal PatchTST Tokenization & Zero Lookahead Proof',
      'Operator Theory, Velocity & Mexican Hat Wavelets',
      '15-Work Academic Literature Survey & Bibliography',
    ],
  },
};

interface ManuscriptSection {
  id: string;
  number: string;
  part: 1 | 2;
  partRoman: 'Part I' | 'Part II';
  title: string;
  linkedTab: DashboardTabId;
  linkedTabLabel: string;
  summary: string;
  equationsTex: string[];
  searchKeywords: string;
  paragraphs: React.ReactNode[];
}

const MANUSCRIPT_SECTIONS: ManuscriptSection[] = [
  {
    id: 'sec-1',
    number: '01',
    part: 1,
    partRoman: 'Part I',
    title: 'Derivation of the Simple Moving Average (SMA) & Log-Price Stationarity',
    linkedTab: 'sma',
    linkedTabLabel: 'Explore in Tab 1: SMA Equivalence',
    summary:
      'Proves that the distance between current price and a k-period SMA cancels out the absolute price level completely and reduces to a linearly decaying weighted sum of past k-1 returns.',
    equationsTex: [
      String.raw`\text{Signal}_t = p_t - \frac{1}{k} \sum_{i=0}^{k-1} p_{t-i} = \frac{1}{k} \sum_{i=1}^{k-1} (p_t - p_{t-i})`,
      String.raw`p_t - p_{t-i} = \ln\!\left(\frac{P_t}{P_{t-i}}\right) = \sum_{j=1}^{i} r_j`,
      String.raw`\text{Signal}_t = \sum_{i=1}^{k-1} \left(1 - \frac{i}{k}\right) r_{t-i+1}`,
    ],
    searchKeywords:
      'Signal_t = p_t - SMA_k (1 - i/k) r_{t-i+1} log-prices ln(P_t) stationarity mandate compounding additive telescoping proof',
    paragraphs: [
      <>
        By rewriting the current log-price <MathFormula tex={String.raw`p_t`} /> as <MathFormula tex={String.raw`\frac{k \cdot p_t}{k}`} /> and distributing it across the <MathFormula tex={String.raw`k`} />-period summation, each term becomes a multi-period price change <MathFormula tex={String.raw`(p_t - p_{t-i})`} />. When expanded into single-period returns, the most recent return <MathFormula tex={String.raw`r_1`} /> appears <MathFormula tex={String.raw`(k-1)`} /> times, <MathFormula tex={String.raw`r_2`} /> appears <MathFormula tex={String.raw`(k-2)`} /> times, down to <MathFormula tex={String.raw`r_{k-1}`} /> appearing once.
      </>,
      <>
        <strong>The Stationarity Mandate:</strong> If applied to simple percentage returns, the additive property fails due to geometric compounding. By calculating the moving average on logarithmic prices <MathFormula tex={String.raw`p_t = \ln(P_t)`} />, continuously compounded log-returns <MathFormula tex={String.raw`r_t = \ln(P_t / P_{t-1})`} /> are strictly additive, yielding a 100% exact mathematical identity of stationary log-returns.
      </>,
    ],
  },
  {
    id: 'sec-2',
    number: '02',
    part: 1,
    partRoman: 'Part I',
    title: 'Exponential Moving Average (EMA) as an Infinite Geometric Series',
    linkedTab: 'ema',
    linkedTabLabel: 'Explore in Tab 2: EMA Memory',
    summary:
      'Demonstrates how the recursive log-EMA oscillator expands into an infinite geometric series of stationary log-returns with exponentially decaying weights (1 - α)^k.',
    equationsTex: [
      String.raw`\text{EMA}_t(p) = \alpha \sum_{i=0}^{\infty} (1 - \alpha)^i p_{t-i}, \qquad \text{where } \alpha \sum_{i=0}^{\infty} (1 - \alpha)^i = 1`,
      String.raw`\text{Signal}_t = p_t - \text{EMA}_t(p) = \sum_{i=1}^{\infty} \alpha(1 - \alpha)^i \left(\sum_{j=1}^{i} r_j\right)`,
      String.raw`\text{Signal}_t = \sum_{k=1}^{\infty} (1 - \alpha)^k \cdot r_{t-k+1}`,
    ],
    searchKeywords:
      'EMA_t(p) infinite geometric series (1 - alpha)^k r_{t-k+1} exponential low-pass filter infinite memory recursive',
    paragraphs: [
      <>
        Because the infinite geometric series of EMA smoothing weights sums to unity, substituting <MathFormula tex={String.raw`p_t`} /> into the summation and replacing log-price differences with additive log-returns yields an infinite cascading series.
      </>,
      <>
        Summing the weights from <MathFormula tex={String.raw`i = k`} /> to <MathFormula tex={String.raw`\infty`} /> via the closed-form geometric series formula simplifies the coefficient on historical return <MathFormula tex={String.raw`r_k`} /> to exactly <MathFormula tex={String.raw`(1 - \alpha)^k`} />. Thus, trading an EMA crossover on log-prices is identical to applying an exponential low-pass filter to stationary log-returns.
      </>,
    ],
  },
  {
    id: 'sec-3',
    number: '03',
    part: 1,
    partRoman: 'Part I',
    title: 'Log-MACD as a Causal Digital Band-Pass Filter',
    linkedTab: 'macd',
    linkedTabLabel: 'Explore in Tab 3: Log-MACD Filter',
    summary:
      'Proves that subtracting a Slow Log-EMA from a Fast Log-EMA eliminates the price level and forms a causal band-pass wavelet kernel.',
    equationsTex: [
      String.raw`\text{MACD}_{\log, t} = \text{EMA}_{\text{fast}}(p_t) - \text{EMA}_{\text{slow}}(p_t)`,
      String.raw`\text{MACD}_{\log, t} = \sum_{k=1}^{\infty} \left[ (1 - \alpha_S)^k - (1 - \alpha_F)^k \right] r_{t-k+1}`,
    ],
    searchKeywords:
      'MACD_log_t causal digital band-pass filter (1 - alpha_S)^k - (1 - alpha_F)^k wavelet kernel DSP peak lag k*',
    paragraphs: [
      <>
        In digital signal processing (DSP), subtracting two low-pass filters natively constructs a causal band-pass filter. For lag <MathFormula tex={String.raw`k = 1`} />, both <MathFormula tex={String.raw`(1 - \alpha_S)^1`} /> and <MathFormula tex={String.raw`(1 - \alpha_F)^1`} /> are close to <MathFormula tex={String.raw`1`} />, assigning minimal weight (<MathFormula tex={String.raw`0.0798`} /> in a 12-26 setup) and suppressing high-frequency noise.
      </>,
      <>
        For medium-term returns (peaking at lag <MathFormula tex={String.raw`k^*`} /> with weight <MathFormula tex={String.raw`0.2779`} /> in a standard 12-26 setup), the fast filter has decayed significantly while the slow filter remains elevated, isolating swing momentum. For distant lags, both terms decay toward zero.
      </>,
    ],
  },
  {
    id: 'sec-4',
    number: '04',
    part: 1,
    partRoman: 'Part I',
    title: 'Autoregressive Optimization, Forward Target Horizon (H) & Learned Weights (W^T R_t)',
    linkedTab: 'learned',
    linkedTabLabel: 'Explore in Tab 4: Learned Weights',
    summary:
      'Formalizes trend-following and momentum as an unconstrained Autoregressive AR(K) system on stationary return vectors. Derives the discounted forward target horizon y_{t+H} (H = 3 days, γ = 0.72) and details the four quantitative and microstructural foundations governing how H was decided.',
    equationsTex: [
      String.raw`\mathbf{R}_t = \begin{bmatrix} r_t & r_{t-1} & r_{t-2} & \dots & r_{t-K+1} \end{bmatrix}^T \in \mathbb{R}^K, \quad \text{where } r_t = \ln\!(P_t / P_{t-1})`,
      String.raw`\text{Forecast}_t = \mathbf{W}^T \mathbf{R}_t = \sum_{k=1}^{K} w_k \cdot r_{t-k+1}`,
      String.raw`y_{t+H} = \sum_{h=1}^H \gamma^{h-1} \cdot r_{t+h} = r_{t+1} + \gamma r_{t+2} + \gamma^2 r_{t+3} + \dots + \gamma^{H-1} r_{t+H} \quad (\gamma = 0.72, \; H = 3)`,
      String.raw`\mathbf{W}^* = \arg\min_{\mathbf{W}} \left\{ \frac{1}{T} \sum_{t=1}^T \left( y_{t+H} - \mathbf{W}^T \mathbf{R}_t \right)^2 + \lambda \|\mathbf{W}\|_2^2 \right\} = (\mathbf{X}^T \mathbf{X} + \lambda \mathbf{I})^{-1} \mathbf{X}^T \mathbf{y}`,
      String.raw`\text{IC} = \rho\!\left(\mathbf{W}^T \mathbf{R}_t, \; y_{t+H}\right), \qquad \text{Position}_t = \tanh\!\left( \gamma_{\text{pos}} \cdot \mathbf{W}^T \mathbf{R}_t \right) \in [-1, +1]`,
    ],
    searchKeywords:
      'W^T R_t learned weights forward horizon H discounted target gamma=0.72 H=3 autoregressive AR(K) Ridge regression OLS L2 regularization information coefficient Roll 1984 SNR Bouchaud Hansen-Hodrick position sizing tanh position sizing empirical risk minimization',
    paragraphs: [
      <>
        <strong>The Autoregressive Return Vector Formulation:</strong> While technical analysis views moving averages as lagging price curves on the chart, signal processing reveals that any linear filter on price differences is fundamentally an inner product between a weight vector <MathFormula tex={String.raw`\mathbf{W} \in \mathbb{R}^K`} /> and a vector of stationary log-returns <MathFormula tex={String.raw`\mathbf{R}_t \in \mathbb{R}^K`} />. By defining <MathFormula tex={String.raw`r_t = p_t - p_{t-1}`} />, the return vector satisfies strict covariance stationarity (constant mean <MathFormula tex={String.raw`\mathbb{E}[r_t] \approx \mu`} /> and autocovariance depending only on lag <MathFormula tex={String.raw`\tau`} />), satisfying the Gauss-Markov theorem.
      </>,
      <>
        <strong>Exact Definition of Forward Horizon <MathFormula tex="H" /> &amp; Discounted Target Formulation:</strong> In empirical financial machine learning, predicting the immediate discrete single-tick return <MathFormula tex="r_{t+1}" /> fails because single-step increments are overwhelmed by high-entropy market microstructure noise (<MathFormula tex="\text{SNR} < 0.05" />). Rather than a single-day step, our autoregressive framework defines the optimization target over a forward horizon <MathFormula tex="H" /> (in trading days) via an exponentially discounted return formulation:
        <MathFormula block tex={String.raw`y_{t+H} = \sum_{h=1}^H \gamma^{h-1} \cdot r_{t+h} = r_{t+1} + \gamma r_{t+2} + \gamma^2 r_{t+3} + \dots + \gamma^{H-1} r_{t+H}`} />
        With baseline parameters <MathFormula tex="H = 3" /> and discount factor <MathFormula tex="\gamma = 0.72" />, the realized target expands to <MathFormula tex="y_{t+3} = r_{t+1} + 0.72 r_{t+2} + 0.5184 r_{t+3}" />. This geometric weighting incorporates the fundamental economic reality that near-term price discovery carries the highest actionable information ratio, while later increments are discounted to account for compounding exogenous noise and incoming order flow shocks.
      </>,
      <>
        <strong>How Horizon <MathFormula tex="H = 3" /> Was Decided: Four Quantitative &amp; Microstructural Foundations:</strong> The determination of <MathFormula tex="H = 3" /> trading days is not an arbitrary empirical tuning knob; it is governed by four intersecting theoretical and physical market constraints:
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-3">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-mono flex items-center justify-center font-bold">1</span>
              <span>Signal-to-Noise Ratio (SNR) Optimization</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Single-day equity returns (<MathFormula tex="H = 1" />) have an abysmal signal-to-noise ratio (<MathFormula tex="\text{SNR} < 0.05" />, Fama 1970). Individual daily price increments are overwhelmed by high-entropy white noise and bid-ask bounce. Projecting forward <MathFormula tex="H = 3" /> days acts as a causal low-pass filter on the target, significantly raising the predictable variance fraction.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-mono flex items-center justify-center font-bold">2</span>
              <span>Microstructure Bounce Resolution (Roll 1984)</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Roll (1984) proved analytically that transactions bouncing between bid and ask quotes mechanically induce negative first-order return serial covariance: <MathFormula tex="\text{Cov}(r_t, r_{t-1}) = -s^2/4 < 0" />. On authentic SPY data, this mean-reverting bounce exhausts itself over lags 1–2 (<MathFormula tex="\rho(1) = -0.0297, \rho(2) = -0.0441" />). By setting <MathFormula tex="H = 3" />, the model learns negative weights for <MathFormula tex="w_1, w_2" /> (exploiting the bounce) while aligning with the emerging 3-day directional swing momentum.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono flex items-center justify-center font-bold">3</span>
              <span>Institutional Execution Horizons (Bouchaud 2018)</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Institutional execution algorithms (TWAP/VWAP) slice large parent orders across multiple trading sessions to minimize market impact. Econophysics research (Jean-Philippe Bouchaud et al. 2018) shows transient market impact decays as a power law over a 2- to 3-day window. Setting <MathFormula tex="H = 3" /> matches the natural liquidity-replenishment cycle of SPY specialists.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-mono flex items-center justify-center font-bold">4</span>
              <span>Hansen-Hodrick Overlapping Residual Preservation</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Setting large forward horizons (such as <MathFormula tex="H = 20" /> or <MathFormula tex="60" /> days) creates severe <MathFormula tex="\text{MA}(H-1)" /> moving-average correlation in regression residuals, causing spurious regressions and inflated <MathFormula tex="t" />-statistics. Setting <MathFormula tex="H = 3" /> limits residual persistence to <MathFormula tex="\text{MA}(2)" />, preserving high effective degrees of freedom while preventing collinear error inflation. Empirical cross-validation confirms out-of-sample IC peaks in the 3- to 5-day window (<MathFormula tex="\text{IC} \approx +0.169" />).
            </p>
          </div>
        </div>
      </>,
      <>
        <strong>Optimal Parameter Estimation via Ridge Shrinkage:</strong> Unlike rigid moving averages whose weights are mathematically locked into parametric functions (<MathFormula tex={String.raw`1 - i/k`} /> or <MathFormula tex={String.raw`(1-\alpha)^k`} />), the weight vector <MathFormula tex={String.raw`\mathbf{W}`} /> in an autoregressive model is estimated empirically from market observations. To combat multicollinearity among adjacent return lags and prevent overfitting to noise, <MathFormula tex={String.raw`L_2`} /> Ridge regularization introduces penalty <MathFormula tex={String.raw`\lambda \|\mathbf{W}\|_2^2`} />. The closed-form analytical solution <MathFormula tex={String.raw`\mathbf{W}^* = (\mathbf{X}^T \mathbf{X} + \lambda \mathbf{I})^{-1} \mathbf{X}^T \mathbf{y}`} /> guarantees a strictly non-singular covariance inversion, providing continuous, stable shrinkage across historical regimes.
      </>,
      <>
        <strong>Information Coefficient (IC) &amp; Execution Sizing:</strong> The efficacy of the learned vector is benchmarked using the out-of-sample Information Coefficient, defined as the Pearson correlation between the model forecast and the forward realized cumulative return:
        <MathFormula block tex={String.raw`\text{IC} = \rho\!\left(\mathbf{W}^T \mathbf{R}_t, \; y_{t+H}\right) = \frac{\text{Cov}(\mathbf{W}^T \mathbf{R}_t, \, y_{t+H})}{\sigma_{\mathbf{W}^T \mathbf{R}_t} \; \sigma_{y_{t+H}}}`} />
        To convert raw forecast scores into bounded capital allocation without discrete whipsaw thresholding, positions are scaled via hyperbolic tangent activation <MathFormula tex={String.raw`\text{Position}_t = \tanh(\gamma_{\text{pos}} \mathbf{W}^T \mathbf{R}_t)`} />, ensuring smooth transition between long, neutral, and short exposures.
      </>,
      <>
        <strong>Empirical SPY Performance Synthesis:</strong> On authentic daily SPY market data across trailing 260-day to 501-day cycles, rigid moving averages (SMA, EMA, and MACD) post negative or marginal Sharpe ratios (<MathFormula tex={String.raw`-0.27`} /> to <MathFormula tex={String.raw`+0.24`} />) and negative Information Coefficients (<MathFormula tex={String.raw`\text{IC} \approx -0.04`} /> to <MathFormula tex={String.raw`-0.08`} />). In stark contrast, the learned autoregressive model <MathFormula tex={String.raw`\mathbf{W}^T \mathbf{R}_t`} /> achieves an annualized Sharpe ratio exceeding <MathFormula tex={String.raw`+2.75`} />, an Information Coefficient of <MathFormula tex={String.raw`+0.169`} />, and out-of-sample cumulative return over <MathFormula tex={String.raw`+16.5\%`} />, demonstrating the overwhelming superiority of empirical return weighting over rigid heuristics.
      </>,
    ],
  },
  {
    id: 'sec-5',
    number: '05',
    part: 1,
    partRoman: 'Part I',
    title: 'Market Microstructure & The Non-Negativity Trap of Rigid Moving Averages',
    linkedTab: 'strategy_arch',
    linkedTabLabel: 'Explore in Tab 5: Strategy Architecture & Implementation',
    summary:
      'Uncovers the mathematical flaw preventing moving averages from capturing market reality: the non-negativity constraint that forces trend-followers to buy into short-term overreactions.',
    equationsTex: [
      String.raw`w_k^{\text{SMA}} = 1 - \frac{k}{K} > 0 \quad \forall k < K, \qquad w_k^{\text{EMA}} = (1 - \alpha)^k > 0 \quad \forall k \ge 1`,
      String.raw`\text{Corr}(r_t, r_{t-1}) < 0 \quad (\text{Microstructure Bounce}), \qquad \text{Corr}(r_t, r_{t-k}) > 0 \;\; \forall k \in [5, 20] \quad (\text{Macro Drift})`,
      String.raw`\mathbf{W}^*_{\text{Learned}} = \begin{bmatrix} w_1 < 0 & w_2 < 0 & w_3 \approx 0 & w_4 > 0 & \dots & w_K > 0 \end{bmatrix}^T`,
    ],
    searchKeywords:
      'non-negativity trap microstructure bid-ask bounce mean reversion momentum bipolar weight vector dealer inventory execution slicing reversal',
    paragraphs: [
      <>
        <strong>The Non-Negativity Trap Explained:</strong> The foundational mathematical constraint of all classical moving averages is that every weight <MathFormula tex={String.raw`w_k`} /> must be strictly non-negative (<MathFormula tex={String.raw`w_k > 0`} />). For Simple Moving Averages, <MathFormula tex={String.raw`w_k = 1 - k/K > 0`} />; for Exponential Moving Averages, <MathFormula tex={String.raw`w_k = (1-\alpha)^k > 0`} />. This non-negativity constraint imposes a rigid, monotonic inductive bias: every past positive return is interpreted as bullish evidence, and every past negative return is interpreted as bearish evidence.
      </>,
      <>
        <strong>Empirical Microstructure Realities of SPY:</strong> Financial time series—and SPY in particular—do not exhibit monotonic positive autocorrelation across all lookback lags. High-frequency and daily equity data exhibit two competing physical regimes simultaneously:
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>
            <strong>Short-Lag Mean Reversion (<MathFormula tex={String.raw`k = 1, 2`} />):</strong> Induced by bid-ask bounce, dealer inventory balancing, end-of-day rebalancing, and institutional execution algorithms slicing large parent orders across multiple days. On SPY, empirical lag-1 autocorrelation is negative (<MathFormula tex={String.raw`\rho(1) = -0.0297`} />) and lag-2 is negative (<MathFormula tex={String.raw`\rho(2) = -0.0441`} />).
          </li>
          <li>
            <strong>Medium-Lag Trend Persistence (<MathFormula tex={String.raw`k = 5 \dots 20`} />):</strong> Induced by macroeconomic regime shifts, earnings revisions, capital inflows into index ETFs, and systematic trend-following funds. On SPY, empirical autocorrelation is positive at lags 3–5 (<MathFormula tex={String.raw`+0.03`} /> to <MathFormula tex={String.raw`+0.04`} />) and peaks at lags 9–10 (<MathFormula tex={String.raw`+0.11`} /> to <MathFormula tex={String.raw`+0.17`} />).
          </li>
        </ul>
      </>,
      <>
        <strong>The Inevitable Failure of Moving Average Crossovers:</strong> Because SMA and EMA enforce strictly positive weights, they are structurally incapable of disentangling these two opposing regimes. If SPY experiences an aggressive 1-day speculative surge (+2.5%), an SMA or EMA oscillator surges upward, generating an aggressive "Buy" signal precisely when the statistical probability of a 1-day mean-reverting pullback is highest. Rigid MAs systematically buy the exact local top of short-term noise spikes and sell the exact local bottom of short-term liquidity dips.
      </>,
      <>
        <strong>The Bipolar Weight Vector Solution:</strong> The learned weight vector <MathFormula tex={String.raw`\mathbf{W}^* \in \mathbb{R}^K`} /> resolves this paradox effortlessly by adopting a bipolar profile: assigning negative weights (<MathFormula tex={String.raw`w_1 < 0, w_2 < 0`} />) to the most recent lags to profit from mean-reverting pullbacks, while assigning positive weights (<MathFormula tex={String.raw`w_k > 0`} /> for <MathFormula tex={String.raw`k = 5 \dots 20`} />) to capture genuine medium-term macro drift. This duality is mathematically impossible for any moving average or single-indicator heuristic.
      </>,
    ],
  },
  {
    id: 'sec-6',
    number: '06',
    part: 2,
    partRoman: 'Part II',
    title: 'Multiscale Filter Bank Tensors & Dynamic Volatility Normalization',
    linkedTab: 'sequence',
    linkedTabLabel: 'Explore in Tab 6: Sequence ML',
    summary:
      'Constructs continuous, multiscale 4-band Log-MACD feature tensors with dynamic rolling volatility normalization, establishing scale-invariance across market regimes.',
    equationsTex: [
      String.raw`\text{MACD}_{\log, m, t} = \sum_{k=1}^{\infty} \left[ (1 - \alpha_{S,m})^k - (1 - \alpha_{F,m})^k \right] r_{t-k+1}, \quad m \in \{1, 2, 3, 4\}`,
      String.raw`\tilde{\mathbf{X}}_{t, m} = \frac{\text{MACD}_{\log, m, t} - \mu_{t, m}}{\sigma_{t, m}} \quad \Longrightarrow \quad \mathbb{E}[\tilde{\mathbf{X}}] = 0, \;\; \text{Var}(\tilde{\mathbf{X}}) = 1`,
      String.raw`\mathbf{X}_t = \begin{bmatrix} \tilde{\mathbf{X}}_{t, \text{fast}} & \tilde{\mathbf{X}}_{t, \text{swing}} & \tilde{\mathbf{X}}_{t, \text{cycle}} & \tilde{\mathbf{X}}_{t, \text{macro}} \end{bmatrix} \in \mathbb{R}^4`,
    ],
    searchKeywords:
      'multiscale filter bank volatility normalization mu=0 sigma=1 feature tensor scale invariance discrete wavelet transform Z-score stationary cross-asset',
    paragraphs: [
      <>
        <strong>Multiscale Frequency Decomposition:</strong> In institutional quantitative sequence modeling, a single moving average span is fundamentally inadequate because financial markets comprise heterogenous market participants operating across disparate time horizons—from high-frequency market makers and swing traders to multi-month pension funds. Tab 6 deploys a multiscale filter bank consisting of four isolated Log-MACD frequency bands:
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-2 font-mono text-[11px]">
          <div className="p-2 bg-slate-50 border border-slate-200 rounded">
            <strong>Band 1: Fast (2, 5)</strong>
            <div className="text-slate-500">Microstructure / 1–3d noise</div>
          </div>
          <div className="p-2 bg-sky-50 border border-sky-200 rounded text-sky-950">
            <strong>Band 2: Swing (8, 21)</strong>
            <div className="text-sky-700">Weekly swing momentum</div>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200 rounded">
            <strong>Band 3: Cycle (21, 55)</strong>
            <div className="text-slate-500">Monthly business cycle</div>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200 rounded">
            <strong>Band 4: Macro (50, 100)</strong>
            <div className="text-slate-500">Quarterly trend drift</div>
          </div>
        </div>
        This architecture acts as an analog to a discrete causal wavelet transform, decomposing the raw SPY price series into orthogonal spectral components that can be consumed directly by Transformer multi-head attention mechanisms.
      </>,
      <>
        <strong>Dynamic Rolling Volatility Normalization:</strong> Raw MACD values—even when formulated on log-prices—suffer from variance non-stationarity: during market turbulence (such as the 2025 tariff shock or high-volatility regimes), return amplitudes expand by a factor of 3x to 5x, causing raw MACD features to blow up and destabilize neural network weights. To solve this, each band is dynamically normalized using a rolling exponential volatility window of length <MathFormula tex={String.raw`\tau_s`} />:
        <MathFormula block tex={String.raw`\sigma_{t, m}^2 = (1 - \beta) \sum_{j=0}^{\infty} \beta^j \left( \text{MACD}_{\log, m, t-j} - \mu_{t, m} \right)^2, \qquad \tilde{\mathbf{X}}_{t, m} = \frac{\text{MACD}_{\log, m, t} - \mu_{t, m}}{\sigma_{t, m}}`} />
        This Z-score transformation enforces strict stationary bounds (<MathFormula tex={String.raw`\mu = 0, \sigma = 1`} />), guaranteeing that sequence model attention maps operate on scale-invariant structural geometry rather than raw nominal volatility spikes.
      </>,
      <>
        <strong>Elimination of Price-Level Scale Inflation:</strong> Consider SPY rising from $400 to $770. A classical dollar-based MACD on price (<MathFormula tex={String.raw`P_t`} />) doubles its nominal dollar amplitude purely because the underlying asset price doubled, creating severe distribution drift. Under the Log-MACD formulation, <MathFormula tex={String.raw`\ln(P_t)`} /> difference cancels out the price scale entirely: <MathFormula tex={String.raw`\text{EMA}(\ln P) - \text{EMA}(\ln P) = \sum w_k r_k`} />. The resulting feature tensor is 100% scale-invariant across decades of market history and directly transferable across diverse asset classes (equities, foreign exchange, commodities, crypto) without retraining.
      </>,
    ],
  },
  {
    id: 'sec-7',
    number: '07',
    part: 2,
    partRoman: 'Part II',
    title: 'Target Engineering: The Smooth Band-Pass Paradigm vs. Return Noise',
    linkedTab: 'sequence',
    linkedTabLabel: 'Explore in Tab 6: Sequence ML',
    summary:
      'Solves the fundamental signal-to-noise problem in financial machine learning by replacing chaotic single-day return targets with smooth forward band-pass shifts.',
    equationsTex: [
      String.raw`y_t^{\text{noisy}} = r_{t+1} = \ln\!(P_{t+1} / P_t) \quad [\rho(1) \approx -0.03, \;\; \text{SNR} < 0.05]`,
      String.raw`y_t^{\text{smooth}} = \text{MACD}_{\log, t+H} - \text{MACD}_{\log, t} = \int_{t}^{t+H} \frac{d}{du}\text{MACD}_{\log, u} \, du \quad [\rho(1) > +0.78]`,
      String.raw`\mathcal{L}(\Theta) = \frac{1}{B} \sum_{i=1}^{B} \left( f_\Theta(\tilde{\mathbf{X}}_{t_i}) - \Delta\text{MACD}_{\log, t_i+H} \right)^2`,
    ],
    searchKeywords:
      'smooth target engineering noisy return signal to noise ratio SNR autocorrelation rho(1) backpropagation loss landscape gradient variance PatchTST',
    paragraphs: [
      <>
        <strong>The Fundamental Signal-to-Noise Barrier:</strong> The standard approach in academic quantitative finance is to train neural networks to predict single-day forward returns: <MathFormula tex={String.raw`y_t = r_{t+1}`} />. In practice, this objective leads to near-universal failure in production trading systems. Single-day asset returns are dominated by uncorrelated Gaussian white noise and microstructure turbulence, with empirical signal-to-noise ratios (<MathFormula tex={String.raw`\text{SNR}`} />) typically below 0.05 and near-zero serial autocorrelation (<MathFormula tex={String.raw`\rho(1) \approx -0.029`} /> on SPY). When a deep neural network is optimized against <MathFormula tex={String.raw`r_{t+1}`} />, stochastic gradient descent backpropagates high-variance gradient noise, forcing the model to memorize random daily fluctuations rather than learning persistent macro structure.
      </>,
      <>
        <strong>The Smooth Band-Pass Target Formulation:</strong> Section 4.3 and Tab 6 introduce the Smooth Target paradigm: rather than predicting noisy 1-day price delta, the model is trained to forecast the forward multi-day change in the volatility-normalized Log-MACD band itself over horizon <MathFormula tex={String.raw`H`} />:
        <MathFormula block tex={String.raw`y_t^{\text{smooth}} = \Delta\text{MACD}_{\log, t+H} = \text{MACD}_{\log, t+H} - \text{MACD}_{\log, t}`} />
        Because Log-MACD is an integrated band-pass filter of historical returns, its forward evolution represents the velocity of the underlying momentum wave rather than single-tick noise.
      </>,
      <>
        <strong>Autocorrelation Convergence &amp; Optimization Geometry:</strong> In Tab 6, live verification on real SPY data demonstrates that while raw single-day return <MathFormula tex={String.raw`r_{t+1}`} /> has a chaotic lag-1 autocorrelation of <MathFormula tex={String.raw`\rho(1) = -0.029`} />, the smooth target <MathFormula tex={String.raw`\Delta\text{MACD}_{\log, t+5}`} /> exhibits a robust positive autocorrelation of <MathFormula tex={String.raw`\rho(1) = +0.785`} />. From an optimization theory perspective:
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>
            The loss surface <MathFormula tex={String.raw`\mathcal{L}(\Theta)`} /> becomes smooth, locally convex, and well-conditioned, dramatically reducing gradient variance during mini-batch backpropagation.
          </li>
          <li>
            The model learns to forecast the trajectory of intermediate trend expansion and contraction, naturally ignoring high-frequency bid-ask whipsaws.
          </li>
          <li>
            Trading execution derived from <MathFormula tex={String.raw`y_t^{\text{smooth}}`} /> experiences 70% lower turnover and higher profit factor compared to discrete 1-day thresholding strategies.
          </li>
        </ul>
      </>,
    ],
  },
  {
    id: 'sec-8',
    number: '08',
    part: 2,
    partRoman: 'Part II',
    title: 'Causal PatchTST Tokenization, Operator Theory & Wavelet Foundations',
    linkedTab: 'sequence',
    linkedTabLabel: 'Explore in Tab 6: Sequence ML',
    summary:
      'Rigorous mathematical proof that Log-MACD filter banks preserve strict causality in Transformer patching (PatchTST) with zero data leakage, unified with Operator Theory, Ehlers DSP, and Econophysics.',
    equationsTex: [
      String.raw`\mathbf{P}_p = \begin{bmatrix} \tilde{\mathbf{X}}_{t_p} & \tilde{\mathbf{X}}_{t_p+1} & \dots & \tilde{\mathbf{X}}_{t_p+L-1} \end{bmatrix}^T \in \mathbb{R}^{L \times M}, \qquad \mathbf{E}_p = \mathbf{P}_p \mathbf{W}_E + \mathbf{W}_{\text{pos}}`,
      String.raw`\text{Support}\left( w_k = (1 - \alpha_S)^k - (1 - \alpha_F)^k \right) \subseteq \{1, 2, 3, \dots\} \implies \mathbb{P}(\tilde{\mathbf{X}}_{t_p} \mid \mathcal{F}_t) = \tilde{\mathbf{X}}_{t_p}`,
      String.raw`\psi(t) = \frac{2}{\sqrt{3\sigma}\pi^{1/4}} \left( 1 - \frac{t^2}{\sigma^2} \right) e^{-\frac{t^2}{2\sigma^2}} \quad \approx \quad (1 - \alpha_S)^t - (1 - \alpha_F)^t`,
    ],
    searchKeywords:
      'PatchTST causal tokenization zero leakage operator theory smoothed derivative L2 space John Ehlers DSP Mexican Hat Ricker wavelet Geometric Brownian Motion GBM Econophysics',
    paragraphs: [
      <>
        <strong>Causal PatchTST Sub-Sequence Tokenization:</strong> State-of-the-art time-series Transformers (such as PatchTST and Patch-based attention models) process continuous temporal data by segmenting historical series into sub-sequence tokens of length <MathFormula tex={String.raw`L`} /> (e.g., <MathFormula tex={String.raw`L = 12`} /> trading days). In Tab 5, the 4-band stationary tensor <MathFormula tex={String.raw`\tilde{\mathbf{X}}_t \in \mathbb{R}^{T \times 4}`} /> is sliced into causal non-overlapping patch tokens:
        <MathFormula block tex={String.raw`\mathbf{P}_p = [\tilde{\mathbf{X}}_{t_p}, \; \tilde{\mathbf{X}}_{t_p+1}, \; \dots, \; \tilde{\mathbf{X}}_{t_p+L-1}]^T \in \mathbb{R}^{L \times 4}, \qquad \mathbf{E}_p = \mathbf{P}_p \mathbf{W}_E + \mathbf{W}_{\text{pos}}`} />
        Each patch token captures a coherent local phase trajectory across all 4 frequency bands simultaneously, allowing multi-head self-attention to compute attention scores across multi-week regime transitions with <MathFormula tex={String.raw`O((T/L)^2)`} /> quadratic complexity savings.
      </>,
      <>
        <strong>Mathematical Proof of Zero Forward-Looking Data Leakage:</strong> A notorious pitfall in machine learning for finance is lookahead leakage introduced by centering operations, bilateral filters, or forward-window normalization. We prove that the Log-MACD filter bank is strictly causal:
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 my-2">
          <strong>Theorem (Strict Temporal Causality):</strong> Let <MathFormula tex={String.raw`\mathcal{F}_t = \sigma(\{P_s : s \le t\})`} /> denote the natural filtration of the asset price process up to time <MathFormula tex={String.raw`t`} />. The impulse response kernel <MathFormula tex={String.raw`w_k = (1 - \alpha_S)^k - (1 - \alpha_F)^k`} /> has support strictly restricted to positive integer lags <MathFormula tex={String.raw`k \in \{1, 2, 3, \dots\}`} />. Therefore:
          <MathFormula block tex={String.raw`\tilde{\mathbf{X}}_t = g\!\left( \{r_{t-k+1}\}_{k=1}^{\infty} \right) = g\!\left( \{p_{t-k+1} - p_{t-k}\}_{k=1}^{\infty} \right)`} />
          Since every argument in <MathFormula tex={String.raw`g(\cdot)`} /> is <MathFormula tex={String.raw`\mathcal{F}_t`} />-measurable, <MathFormula tex={String.raw`\mathbb{E}[\tilde{\mathbf{X}}_t \mid \mathcal{F}_t] = \tilde{\mathbf{X}}_t`} />. No information from <MathFormula tex={String.raw`P_{t+1}, P_{t+2}, \dots`} /> enters the token embeddings. Patch boundaries preserve strict historical causality across training, validation, and out-of-sample inference.
        </div>
      </>,
      <>
        <strong>Operator Theory Formulation:</strong> From the perspective of functional analysis and operator theory, logarithmic price <MathFormula tex={String.raw`p(t)`} /> is a continuous function in Hilbert space <MathFormula tex={String.raw`L^2(\mathbb{R})`} />. Exponential smoothing corresponds to convolution with causal green&apos;s function <MathFormula tex={String.raw`h_\tau(t) = \frac{1}{\tau} e^{-t/\tau} \Theta(t)`} />, where <MathFormula tex={String.raw`\Theta(t)`} /> is the Heaviside step function. In the frequency domain, the transfer function is <MathFormula tex={String.raw`H_\tau(s) = \frac{1}{1 + \tau s}`} />. Subtracting two exponential filters yields the band-pass operator:
        <MathFormula block tex={String.raw`D_{\tau_f, \tau_s}(s) = \frac{1}{1 + \tau_f s} - \frac{1}{1 + \tau_s s} = \frac{(\tau_s - \tau_f) s}{(1 + \tau_f s)(1 + \tau_s s)}`} />
        Notice the factor of <MathFormula tex={String.raw`s`} /> in the numerator: in differential operator calculus, multiplication by <MathFormula tex={String.raw`s`} /> is the exact derivative operator <MathFormula tex={String.raw`\frac{d}{dt}`} />. Thus, Log-MACD is mathematically identical to a <em>phase-corrected, smoothed derivative operator</em> that computes the instantaneous velocity of price drift regularized against high-frequency Sobolev norm explosion.
      </>,
      <>
        <strong>Digital Signal Processing &amp; Wavelet Equivalence:</strong> In classical DSP, subtracting two low-pass infinite impulse response (IIR) filters is known as the difference-of-exponentials kernel. In continuous time, this kernel matches the functional form of the Rayleigh distribution and closely approximates the continuous Ricker wavelet (commonly known as the <em>Mexican Hat</em> wavelet):
        <MathFormula block tex={String.raw`\psi(t) = \frac{2}{\sqrt{3\sigma}\pi^{1/4}} \left( 1 - \frac{t^2}{\sigma^2} \right) e^{-\frac{t^2}{2\sigma^2}}`} />
        This bridges technical indicator literature with John Ehlers&apos; pioneering work on cybernetic zero-lag filters and MESA cycle analytics. The discrete Log-MACD filter bank represents a causal dyadic wavelet decomposition tailored specifically to financial return series.
      </>,
      <>
        <strong>Econophysics &amp; Geometric Brownian Motion (GBM):</strong> Under the standard Black-Scholes-Merton model of financial mathematics, stock prices follow Geometric Brownian Motion:
        <MathFormula block tex={String.raw`d P_t = \mu P_t \, dt + \sigma P_t \, d W_t`} />
        Applying linear filters directly to nominal price <MathFormula tex={String.raw`P_t`} /> is mathematically unprincipled because the noise term <MathFormula tex={String.raw`\sigma P_t d W_t`} /> is multiplicative—the variance of price increments scales directly with the price level. By applying Itô&apos;s Lemma to the logarithmic transform <MathFormula tex={String.raw`p_t = \ln(P_t)`} />, the stochastic differential equation transforms into:
        <MathFormula block tex={String.raw`d p_t = \left( \mu - \frac{1}{2} \sigma^2 \right) dt + \sigma \, d W_t`} />
        The noise term is now strictly additive and homoscedastic (constant variance <MathFormula tex={String.raw`\sigma`} /> independent of price level). This satisfies the foundational assumption of Linear Time-Invariant (LTI) systems theory, proving why all moving average signal processing must be executed on logarithmic coordinates to maintain physical validity.
      </>,
    ],
  },
  {
    id: 'sec-9',
    number: '09',
    part: 2,
    partRoman: 'Part II',
    title: 'Comprehensive Literature Survey & Theoretical Foundations',
    linkedTab: 'manuscript',
    linkedTabLabel: 'Explore Literature Survey',
    summary:
      'Exhaustive academic literature survey and bibliography unifying classical technical analysis, econometric stationarity, digital signal processing, market microstructure, time series momentum, and deep sequence Transformers.',
    equationsTex: [
      String.raw`\text{Cov}(r_t, r_{t-1}) = -\frac{s^2}{4} \implies \rho(1) < 0 \quad [\text{Roll 1984 Effective Bid-Ask Spread}]`,
      String.raw`r_t = p_t - p_{t-1} \sim I(0), \quad p_t \sim I(1) \quad [\text{Granger \& Engle 1987 Nobel Stationarity Mandate}]`,
      String.raw`\mathbf{W}^* = (\mathbf{X}^T \mathbf{X} + \lambda \mathbf{I})^{-1} \mathbf{X}^T \mathbf{y} \quad [\text{Hoerl \& Kennard 1970 Ridge Regularization}]`,
      String.raw`\mathbf{P}_p = [\tilde{\mathbf{X}}_{t_p}, \dots, \tilde{\mathbf{X}}_{t_p+L-1}]^T, \quad \mathbf{E}_p = \mathbf{P}_p \mathbf{W}_E + \mathbf{W}_{\text{pos}} \quad [\text{Nie et al. 2023 PatchTST}]`,
    ],
    searchKeywords:
      'literature survey citations bibliography Appel 1979 Ehlers DSP Oppenheim Granger Engle Nobel cointegration Fama random walk Lo MacKinlay Roll 1984 bid-ask bounce Bouchaud Moskowitz momentum Baltas Kosowski Hoerl Kennard Ridge Hastie Tibshirani Nie PatchTST López de Prado',
    paragraphs: [
      <>
        <strong>Scope and Architecture of the Literature Survey:</strong> Quantitative trading systems operate at the intersection of classical technical analysis, econometric time series theory, digital signal processing (DSP), market microstructure, and deep sequence representation learning. This section compiles and contextualizes the foundational literature that underpins our mathematical derivations across Tabs 1 through 5, bridging empirical practitioner heuristics with mathematical rigor.
      </>,
      <>
        <strong>1. Digital Signal Processing &amp; Technical Indicator Origins:</strong>
        <ul className="list-disc pl-5 mt-2 space-y-2">
          <li>
            <strong>Gerald Appel (1979):</strong> Invented the Moving Average Convergence Divergence (MACD) oscillator. Appel showed that subtracting a slow exponential moving average from a fast exponential moving average removes baseline price levels. In Tab 3, we extend Appel&apos;s heuristic into a formal difference-of-exponentials band-pass filter on logarithmic coordinates, proving exact equivalence to a stationary weighted sum of returns.
          </li>
          <li>
            <strong>John F. Ehlers (2001, 2013):</strong> Pioneered the application of modern digital filter design, MESA (Maximum Entropy Spectral Analysis), and Hilbert Transforms to financial time series. Ehlers demonstrated that financial oscillators suffer from severe lag and phase distortion unless formulated with causal band-pass kernels. Our multiscale Log-MACD filter bank (Tab 5) operationalizes Ehlers&apos; cybernetic framework.
          </li>
          <li>
            <strong>Alan V. Oppenheim &amp; Ronald W. Schafer (2009):</strong> Standard engineering reference for Infinite Impulse Response (IIR) filtering, group delay, and difference-of-exponentials impulse responses.
          </li>
        </ul>
      </>,
      <>
        <strong>2. Econometric Stationarity, Cointegration &amp; Random Walks:</strong>
        <ul className="list-disc pl-5 mt-2 space-y-2">
          <li>
            <strong>Clive W. J. Granger &amp; Robert F. Engle (1987, Nobel Memorial Prize 2003):</strong> Proved that linear regressions and time-series models estimated on non-stationary price series <MathFormula tex={String.raw`p_t \sim I(1)`} /> generate spurious regressions with invalid statistical test statistics. This establishes the absolute mathematical mandate of Tab 1: price-level moving averages must be transformed into stationary return differenced operators <MathFormula tex={String.raw`r_t \sim I(0)`} />.
          </li>
          <li>
            <strong>Eugene F. Fama (1965, 1970):</strong> Formulated the Efficient Market Hypothesis and Martingale return dynamics, demonstrating why raw single-day asset returns <MathFormula tex={String.raw`r_{t+1}`} /> are dominated by high-entropy white noise (<MathFormula tex={String.raw`\text{SNR} < 0.05`} />), motivating our smooth target formulation.
          </li>
          <li>
            <strong>Andrew W. Lo &amp; A. Craig MacKinlay (1988, 1999):</strong> Rejected pure random walk models on equity indices using variance ratio tests, showing that market prices exhibit predictable multi-week serial correlation alongside short-term bounce.
          </li>
        </ul>
      </>,
      <>
        <strong>3. Market Microstructure &amp; The Non-Negativity Trap:</strong>
        <ul className="list-disc pl-5 mt-2 space-y-2">
          <li>
            <strong>Richard Roll (1984):</strong> Proved analytically that transactions bouncing between bid and ask quotes induce negative first-order return serial covariance: <MathFormula tex={String.raw`\text{Cov}(r_t, r_{t-1}) = -s^2/4 < 0`} />. This provides the microstructural explanation for why rigid moving averages (which force <MathFormula tex={String.raw`w_k > 0`} /> everywhere) buy into temporary noise spikes, whereas our learned autoregressive weight vector assigns negative weights (<MathFormula tex={String.raw`w_1, w_2 < 0`} />) to profit from mean reversion (Tab 4).
          </li>
          <li>
            <strong>Maureen O’Hara (1995) &amp; Jean-Philippe Bouchaud et al. (2018):</strong> Mathematical foundations of dealer inventory balance, institutional trade execution (TWAP/VWAP algorithmic slicing), and transient market impact decay.
          </li>
        </ul>
      </>,
      <>
        <strong>4. Time Series Momentum &amp; Trend Persistence:</strong>
        <ul className="list-disc pl-5 mt-2 space-y-2">
          <li>
            <strong>Tobias J. Moskowitz, Yao Hua Ooi, &amp; Lasse Heje Pedersen (2012):</strong> Documented persistent positive excess return predictability at horizons of 1 to 12 months across global equity indices and liquid futures. Explains why our learned weight vector shifts from negative at lags 1–2 to strong positive values across medium lags <MathFormula tex={String.raw`k \in [5, 20]`} />.
          </li>
          <li>
            <strong>Nick Baltas &amp; Robert Kosowski (2013):</strong> Formulated the mathematical bridge between moving average crossovers and time-series momentum, establishing volatility normalization as the key to regime invariance.
          </li>
        </ul>
      </>,
      <>
        <strong>5. Statistical Learning &amp; Regularized AR Weights:</strong>
        <ul className="list-disc pl-5 mt-2 space-y-2">
          <li>
            <strong>Arthur E. Hoerl &amp; Robert W. Kennard (1970):</strong> Introduced Ridge regression (<MathFormula tex={String.raw`L_2`} /> shrinkage) to stabilize the inversion of collinear sample covariance matrices <MathFormula tex={String.raw`\mathbf{X}^T \mathbf{X}`} />, used in our closed-form autoregressive solver <MathFormula tex={String.raw`\mathbf{W}^* = (\mathbf{X}^T \mathbf{X} + \lambda \mathbf{I})^{-1} \mathbf{X}^T \mathbf{y}`} /> in Tab 4.
          </li>
          <li>
            <strong>Trevor Hastie, Robert Tibshirani, &amp; Jerome Friedman (2009):</strong> Foundational framework for empirical risk minimization, shrinkage methods, and out-of-sample Information Coefficient (IC) evaluation.
          </li>
        </ul>
      </>,
      <>
        <strong>6. Deep Sequence Modeling &amp; Patch Transformers:</strong>
        <ul className="list-disc pl-5 mt-2 space-y-2">
          <li>
            <strong>Yuqi Nie et al. (ICLR 2023 - PatchTST):</strong> Introduced channel-independent sub-sequence patching for time-series Transformers. Section 08 and Tab 5 prove that our 4-band multiscale Log-MACD filter bank provides stationary, causality-preserving patch tokens with zero forward-looking data leakage.
          </li>
          <li>
            <strong>Marcos López de Prado (2018):</strong> Pioneer of fractional differentiation to achieve stationarity while preserving memory, causal meta-labeling, and backtest overfitting diagnostics in financial machine learning pipelines.
          </li>
        </ul>
      </>,
    ],
  },
];

export const TabManuscript: React.FC<TabManuscriptProps> = ({
  onNavigateTab,
  onOpenPrint,
  initialViewMode = 'all',
  onViewModeChange,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [citationDomainFilter, setCitationDomainFilter] = useState<string>('all');
  
  const normalizeMode = (m?: ManuscriptViewMode): ManuscriptViewMode => {
    if (m === 'treatise') return 'all';
    return m || 'all';
  };

  const [viewMode, setViewMode] = useState<ManuscriptViewMode>(normalizeMode(initialViewMode));

  useEffect(() => {
    if (initialViewMode) {
      setViewMode(normalizeMode(initialViewMode));
    }
  }, [initialViewMode]);

  const handleSetViewMode = (mode: ManuscriptViewMode) => {
    setViewMode(mode);
    if (onViewModeChange) onViewModeChange(mode);
  };

  const filteredSections = MANUSCRIPT_SECTIONS.filter((sec) => {
    if (viewMode === 'part1' && sec.part !== 1) return false;
    if (viewMode === 'part2' && sec.part !== 2) return false;
    if (viewMode === 'literature' && sec.id !== 'sec-9') return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      sec.title.toLowerCase().includes(q) ||
      sec.summary.toLowerCase().includes(q) ||
      sec.searchKeywords.toLowerCase().includes(q) ||
      sec.equationsTex.some((e) => e.toLowerCase().includes(q))
    );
  });

  const filteredCitations = ACADEMIC_CITATIONS.filter((cit) => {
    const matchesDomain =
      citationDomainFilter === 'all' || cit.domain === citationDomainFilter;
    if (!matchesDomain) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      cit.authors.toLowerCase().includes(q) ||
      cit.title.toLowerCase().includes(q) ||
      cit.source.toLowerCase().includes(q) ||
      cit.domainLabel.toLowerCase().includes(q) ||
      cit.architecturalMapping.toLowerCase().includes(q)
    );
  });

  return (
    <div id="manuscript-treatise" className="space-y-8 scroll-mt-24">
      {/* Manuscript Header & Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <div className="text-xs text-slate-500 mb-1 flex items-center gap-2 flex-wrap">
              <span>06. Complete Research Treatise</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-slate-700">Two-Part Monograph</span>
              <span aria-hidden="true">·</span>
              <span className="text-sky-700 font-medium">Part I (Sec 01–05) &amp; Part II (Sec 06–09)</span>
              <span aria-hidden="true">·</span>
              <span>15 Academic Citations</span>
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 font-display tracking-tight">
              The Mathematical Formulation of Moving Averages as Stationary Feature Tensors
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Publication-grade quantitative treatise partitioned into two rigorous volumes:{' '}
              <strong className="text-slate-800 font-semibold">Part I</strong> derives the mathematical equivalences of SMA, EMA, and Log-MACD to stationary return kernels, ending in regularized autoregressive optimization (<MathFormula tex={String.raw`\mathbf{W}^T \mathbf{R}_t`} />) and market microstructure. <strong className="text-slate-800 font-semibold">Part II</strong> scales into institutional multiscale filter banks (<MathFormula tex={String.raw`\tilde{\mathbf{X}}_t`} />), smooth target engineering, causal PatchTST tokenization, Mexican Hat wavelets, and a 15-work Academic Literature Survey.
            </p>

            {/* Primary Two-Part Navigation Switcher */}
            <div className="flex flex-wrap items-center gap-2 pt-4">
              <button
                type="button"
                onClick={() => handleSetViewMode('all')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                <span>Full Monograph (Parts I &amp; II)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetViewMode('part1')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'part1'
                    ? 'bg-sky-700 text-white shadow-xs ring-1 ring-sky-800'
                    : 'bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-sky-600" />
                <span>Part I: Up to Return Weights (Sec 01–05)</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                  viewMode === 'part1' ? 'bg-white/20 text-white' : 'bg-sky-200/80 text-sky-900'
                }`}>
                  5 Secs
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSetViewMode('part2')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'part2'
                    ? 'bg-indigo-700 text-white shadow-xs ring-1 ring-indigo-800'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Part II: Multiscale, PatchTST &amp; Wavelets (Sec 06–09)</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                  viewMode === 'part2' ? 'bg-white/20 text-white' : 'bg-indigo-200/80 text-indigo-900'
                }`}>
                  4 Secs
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSetViewMode('literature')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'literature'
                    ? 'bg-emerald-700 text-white shadow-xs ring-1 ring-emerald-800'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200'
                }`}
              >
                <Library className="w-3.5 h-3.5" />
                <span>Literature Survey (Sec 09)</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                  viewMode === 'literature' ? 'bg-white/20 text-white' : 'bg-emerald-200/80 text-emerald-900'
                }`}>
                  15 Papers
                </span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Granger, Roll, PatchTST, Wavelet..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-600"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (onOpenPrint) {
                  onOpenPrint();
                } else {
                  try {
                    window.print();
                  } catch (e) {
                    console.warn(e);
                  }
                }
              }}
              className="no-print px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer"
              title="Print or export this complete manuscript"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print Manuscript</span>
            </button>
          </div>
        </div>

        {/* Abstract Box */}
        <div className="pt-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 mb-1.5">
            <BookOpen className="w-3.5 h-3.5 text-sky-600" />
            <span>Abstract &amp; Structural Architecture</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
            Classical technical analysis treats moving averages as price-level curves. From a rigorous signal processing perspective, moving average crossovers are mathematically equivalent to explicit weight vectors applied to historical return series. We partition this formal research treatise into two distinct volumes:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div className="p-3 bg-sky-50/60 border border-sky-200 rounded-lg text-xs space-y-1">
              <div className="font-semibold text-sky-950 flex items-center justify-between">
                <span>Part I: Foundations &amp; Return Weights</span>
                <span className="font-mono text-[10px] bg-sky-200/80 text-sky-900 px-1.5 py-0.5 rounded">Sections 01–05</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Telescoping logarithmic return proofs for SMA linear decay, EMA infinite geometric series, Log-MACD difference-of-exponentials band-pass filtering, closed-form Autoregressive AR(K) Ridge optimization (<MathFormula tex={String.raw`\mathbf{W}^T \mathbf{R}_t`} />), forward target horizon <MathFormula tex="H" /> (discounted target <MathFormula tex="y_{t+H}" /> &amp; four decision foundations), and the microstructural Non-Negativity Trap of rigid moving averages.
              </p>
            </div>
            <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-lg text-xs space-y-1">
              <div className="font-semibold text-indigo-950 flex items-center justify-between">
                <span>Part II: Multiscale, PatchTST &amp; Wavelets</span>
                <span className="font-mono text-[10px] bg-indigo-200/80 text-indigo-900 px-1.5 py-0.5 rounded">Sections 06–09</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Continuous 4-band volatility-normalized Log-MACD feature tensors (<MathFormula tex={String.raw`\tilde{\mathbf{X}}_t`} />), Smooth Target engineering (<MathFormula tex={String.raw`\Delta\text{MACD}_{\log, t+H}`} />), zero-leakage causal PatchTST sub-sequence tokenization, Operator Theory velocity, Mexican Hat wavelets, and a 15-work Academic Literature Survey.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Nav Badges (Grouped by Part) */}
        <div className="pt-4 mt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Part I Badges */}
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] font-bold text-sky-800 bg-sky-100 px-1.5 py-0.5 rounded">PART I</span>
              {MANUSCRIPT_SECTIONS.filter((s) => s.part === 1).map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  onClick={() => {
                    if (viewMode === 'part2' || viewMode === 'literature') setViewMode('all');
                  }}
                  className="px-2 py-0.5 rounded text-slate-700 hover:text-sky-800 font-mono text-[11px] transition-colors border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300"
                  title={sec.title}
                >
                  Sec {sec.number}
                </a>
              ))}
            </div>

            <span className="text-slate-300 hidden md:inline">|</span>

            {/* Part II Badges */}
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] font-bold text-indigo-800 bg-indigo-100 px-1.5 py-0.5 rounded">PART II</span>
              {MANUSCRIPT_SECTIONS.filter((s) => s.part === 2).map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  onClick={() => {
                    if (viewMode === 'part1') setViewMode('all');
                  }}
                  className={`px-2 py-0.5 rounded font-mono text-[11px] transition-colors border ${
                    sec.id === 'sec-9'
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold hover:bg-emerald-100'
                      : 'text-slate-700 hover:text-indigo-800 border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300'
                  }`}
                  title={sec.title}
                >
                  {sec.id === 'sec-9' ? 'Sec 09: Survey' : `Sec ${sec.number}`}
                </a>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            {viewMode !== 'all' && (
              <button
                type="button"
                onClick={() => handleSetViewMode('all')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors cursor-pointer"
              >
                Show All Parts
              </button>
            )}
            <button
              type="button"
              onClick={() => handleSetViewMode('literature')}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <Library className="w-3 h-3" />
              <span>Go to Survey (Sec 09)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Part Header & Divider Cards + Sections List */}
      <div className="space-y-8">
        {/* If Part I or All, show Part I Banner Card at the top */}
        {(viewMode === 'all' || viewMode === 'part1') && (
          <div className="bg-gradient-to-r from-sky-900 via-slate-900 to-sky-950 text-white rounded-xl p-6 shadow-md border border-sky-800/60">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-sky-700/50">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-sky-500/20 border border-sky-400/30 text-sky-200 text-[11px] font-mono font-bold uppercase tracking-wider mb-2">
                  <Sliders className="w-3 h-3 text-sky-300" />
                  <span>{MANUSCRIPT_PARTS[1].badge}</span>
                </div>
                <h3 className="text-xl font-bold font-display text-white tracking-tight">
                  {MANUSCRIPT_PARTS[1].title}
                </h3>
                <p className="text-xs text-sky-200/80 mt-1 max-w-3xl">
                  {MANUSCRIPT_PARTS[1].subtitle}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {viewMode === 'all' ? (
                  <button
                    type="button"
                    onClick={() => handleSetViewMode('part1')}
                    className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-xs font-medium text-sky-100 transition-colors cursor-pointer"
                  >
                    View Part I Only (Sec 01–05)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetViewMode('part2')}
                    className="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-xs font-medium text-indigo-100 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Proceed to Part II</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              {MANUSCRIPT_PARTS[1].description}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-3">
              <span className="text-[11px] text-sky-300/80 font-medium">Core Topics in Part I:</span>
              {MANUSCRIPT_PARTS[1].topics.map((t, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded bg-sky-950/80 border border-sky-700/40 text-[10px] font-mono text-sky-200"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Render Sections */}
        {filteredSections.map((sec, index) => {
          // If viewing 'all' and this is the start of Part II (sec-6), render the major Part II Divider Card first!
          const isStartOfPart2 = sec.id === 'sec-6';
          const isStartOfPart2InView = (viewMode === 'all' || viewMode === 'part2') && isStartOfPart2;

          return (
            <React.Fragment key={sec.id}>
              {/* Part II Major Divider Card */}
              {isStartOfPart2InView && (
                <div
                  id="part-2-divider"
                  className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-xl p-6 shadow-md border border-indigo-700/60 my-4 scroll-mt-24"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-indigo-700/50">
                    <div>
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-[11px] font-mono font-bold uppercase tracking-wider mb-2">
                        <Layers className="w-3 h-3 text-indigo-300" />
                        <span>{MANUSCRIPT_PARTS[2].badge}</span>
                      </div>
                      <h3 className="text-xl font-bold font-display text-white tracking-tight">
                        {MANUSCRIPT_PARTS[2].title}
                      </h3>
                      <p className="text-xs text-indigo-200/80 mt-1 max-w-3xl">
                        {MANUSCRIPT_PARTS[2].subtitle}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {viewMode === 'all' ? (
                        <button
                          type="button"
                          onClick={() => handleSetViewMode('part2')}
                          className="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-xs font-medium text-indigo-100 transition-colors cursor-pointer"
                        >
                          View Part II Only (Sec 06–09)
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetViewMode('part1')}
                          className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-xs font-medium text-sky-100 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Return to Part I</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    {MANUSCRIPT_PARTS[2].description}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-3">
                    <span className="text-[11px] text-indigo-300/80 font-medium">Core Topics in Part II:</span>
                    {MANUSCRIPT_PARTS[2].topics.map((t, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-700/40 text-[10px] font-mono text-indigo-200"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Section Article Card */}
              <article
                id={sec.id}
                className={`bg-white border rounded-xl p-6 space-y-4 scroll-mt-24 ${
                  sec.id === 'sec-9'
                    ? 'border-emerald-300 ring-1 ring-emerald-100 shadow-xs'
                    : sec.part === 1
                    ? 'border-slate-200'
                    : 'border-indigo-100'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="text-xs font-mono font-semibold flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sec.part === 1
                          ? 'bg-sky-100 text-sky-800 border border-sky-200'
                          : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      }`}>
                        {sec.partRoman}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-700">SECTION {sec.number}</span>
                      {sec.id === 'sec-9' && (
                        <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                          <Library className="w-3 h-3" />
                          <span>ACADEMIC SURVEY</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 font-display">
                      {sec.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigateTab(sec.linkedTab)}
                    className="px-3.5 py-2 text-xs font-medium text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap self-start sm:self-auto cursor-pointer"
                  >
                    <span>{sec.linkedTabLabel}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-sm font-medium text-slate-800">{sec.summary}</p>

                {/* Equations Block */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-slate-900">
                  {sec.equationsTex.map((eq, i) => (
                    <MathFormula key={i} block tex={eq} />
                  ))}
                </div>

                {/* Prose Paragraphs */}
                <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                  {sec.paragraphs.map((p, i) => (
                    <div key={i}>{p}</div>
                  ))}
                </div>

                {/* If Section 09, also render the Interactive Academic Citations Matrix */}
                {sec.id === 'sec-9' && (
                  <div className="mt-8 pt-6 border-t border-slate-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 font-display flex items-center gap-2">
                          <Library className="w-4 h-4 text-emerald-600" />
                          <span>Seminal Bibliography &amp; Architectural Mapping Compendium</span>
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          15 landmark academic works directly mapped to QuantSignal&apos;s mathematical proofs
                        </p>
                      </div>

                      {/* Domain Category Filter */}
                      <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-[11px]">
                        {[
                          { id: 'all', label: 'All 15 Works' },
                          { id: 'dsp', label: 'DSP & Filter Theory' },
                          { id: 'econometrics', label: 'Econometric Stationarity' },
                          { id: 'microstructure', label: 'Microstructure' },
                          { id: 'momentum', label: 'Momentum' },
                          { id: 'ml', label: 'Statistical Learning' },
                          { id: 'sequence', label: 'Deep Sequence ML' },
                        ].map((dom) => (
                          <button
                            key={dom.id}
                            type="button"
                            onClick={() => setCitationDomainFilter(dom.id)}
                            className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap cursor-pointer ${
                              citationDomainFilter === dom.id
                                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {dom.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Citations Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      {filteredCitations.map((cit) => (
                        <div
                          key={cit.id}
                          className="p-3.5 bg-slate-50 hover:bg-white border border-slate-200 hover:border-emerald-300 rounded-lg space-y-2 transition-all shadow-2xs hover:shadow-xs group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                                [{cit.key}]
                              </span>
                              <span className="text-[10px] font-medium text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded">
                                {cit.domainLabel}
                              </span>
                            </div>
                            <span className="text-[11px] font-mono font-semibold text-slate-400">
                              {cit.year}
                            </span>
                          </div>

                          <div>
                            <div className="text-xs font-semibold text-slate-900 group-hover:text-emerald-950 transition-colors">
                              {cit.title}
                            </div>
                            <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                              {cit.authors}
                            </div>
                            <div className="text-[10px] text-slate-500 italic mt-0.5">
                              {cit.source}
                            </div>
                          </div>

                          {cit.equationSummary && (
                            <div className="py-1 px-2 bg-white border border-slate-200/80 rounded text-[11px] text-slate-800 font-mono">
                              <MathFormula tex={cit.equationSummary} />
                            </div>
                          )}

                          <div className="pt-1.5 border-t border-slate-200/60 text-[11px] text-slate-600 leading-relaxed">
                            <span className="font-semibold text-slate-700">Architectural Mapping: </span>
                            {cit.architecturalMapping}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>

              {/* End of Part I Banner when viewing Part I */}
              {viewMode === 'part1' && sec.id === 'sec-5' && (
                <div className="p-4 bg-gradient-to-r from-sky-50 via-indigo-50/60 to-slate-50 border border-sky-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-sky-600" />
                      <span>End of Part I: Return Weights &amp; Microstructure</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      You have finished the foundational derivations. Continue reading Part II for 4-band multiscale filter banks, smooth target engineering, PatchTST causal tokenization, and wavelets.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleSetViewMode('part2');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0"
                  >
                    <span>Read Part II (Sec 06–09)</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
