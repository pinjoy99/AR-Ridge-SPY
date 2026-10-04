import React, { useState } from 'react';
import {
  SpyBar,
  ReturnFormulationMode,
  computeSmaEquivalence,
} from '../data/spyData';
import { MathFormula } from './MathFormula';
import { ArrowRight, CheckCircle2, AlertTriangle, Sliders } from 'lucide-react';

interface TabSmaEquivalenceProps {
  bars: SpyBar[];
  selectedIdx: number;
  onSelectIdx: (idx: number) => void;
}

export const TabSmaEquivalence: React.FC<TabSmaEquivalenceProps> = ({
  bars,
  selectedIdx,
  onSelectIdx,
}) => {
  const [lookbackK, setLookbackK] = useState<number>(10);
  const [mode, setMode] = useState<ReturnFormulationMode>('log');
  const [activeProofStep, setActiveProofStep] = useState<number>(4);

  const {
    series,
    lagContributions,
    selectedPoint,
    maxDiscrepancy,
    meanDiscrepancy,
  } = computeSmaEquivalence(bars, lookbackK, mode, selectedIdx);

  const recentSeries = series.slice(-90);
  const minSig = Math.min(
    ...recentSeries.map((d) => Math.min(d.directSignal, d.weightedSumSignal))
  );
  const maxSig = Math.max(
    ...recentSeries.map((d) => Math.max(d.directSignal, d.weightedSumSignal))
  );
  const sigRange = Math.max(1e-6, maxSig - minSig);

  const minPrice = Math.min(
    ...recentSeries.map((d) =>
      Math.min(
        mode === 'log' ? d.logPrice : d.close,
        mode === 'log' ? d.smaValue : d.smaValue
      )
    )
  );
  const maxPrice = Math.max(
    ...recentSeries.map((d) =>
      Math.max(
        mode === 'log' ? d.logPrice : d.close,
        mode === 'log' ? d.smaValue : d.smaValue
      )
    )
  );
  const priceRange = Math.max(1e-6, maxPrice - minPrice);

  const formatUnit = (val: number) => {
    if (mode === 'log') return `${(val * 10000).toFixed(2)} bps`;
    if (mode === 'abs') return `$${val.toFixed(3)}`;
    return `${(val * 100).toFixed(3)}%`;
  };

  const formatRaw = (val: number) => {
    if (mode === 'log') return val.toFixed(6);
    if (mode === 'abs') return val.toFixed(4);
    return (val * 100).toFixed(4) + '%';
  };

  return (
    <div className="space-y-8">
      {/* Section Header & Interactive Parameter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <div className="text-xs text-slate-500 mb-1">
              <span>01. Mathematical Equivalence Proof</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Low-Pass Linear Decay Filter</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Asset: SPY Daily</span>
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 font-display tracking-tight">
              SMA Price Oscillator vs. Linearly Decaying Return Weights
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Measuring the distance between current SPY price and a{' '}
              <MathFormula tex={`k=${lookbackK}`} className="font-medium text-slate-900" />{' '}
              Simple Moving Average cancels out the price level entirely, reducing to a weighted sum of the past{' '}
              <MathFormula tex={`${lookbackK - 1}`} className="font-medium text-slate-900" />{' '}
              single-period returns with weights{' '}
              <MathFormula tex={String.raw`w_i = 1 - \frac{i}{k}`} className="text-sky-700 font-medium" />.
            </p>
          </div>

          {/* Return Space Segmented Control */}
          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <span className="text-xs font-medium text-slate-500">
              Return Formulation Space (Turn 3 &amp; 4 Verification)
            </span>
            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setMode('log')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  mode === 'log'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Log-Prices <MathFormula tex={String.raw`\ln(P_t)`} />
              </button>
              <button
                type="button"
                onClick={() => setMode('abs')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  mode === 'abs'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Absolute Diff (<MathFormula tex="P_t - P_{t-1}" />)
              </button>
              <button
                type="button"
                onClick={() => setMode('pct')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  mode === 'pct'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Simple % Return (Drift Error)
              </button>
            </div>
          </div>
        </div>

        {/* Sliders & Live Identity Proof Telemetry */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-6 items-center">
          <div className="md:col-span-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="sma-k-slider" className="font-medium text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-sky-600" />
                <span>SMA Lookback Window (k):</span>
              </label>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                k = {lookbackK} days ({lookbackK - 1} return lags)
              </span>
            </div>
            <input
              id="sma-k-slider"
              type="range"
              min={4}
              max={25}
              step={1}
              value={lookbackK}
              onChange={(e) => setLookbackK(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-500 tabular-nums">
              <span>k=4 (Fast)</span>
              <span>k=10 (Manuscript Default)</span>
              <span>k=25 (Monthly)</span>
            </div>
          </div>

          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
            <div>
              <div className="text-xs text-slate-500">
                Direct Oscillator (<MathFormula tex={mode === 'log' ? 'p_t - \\text{SMA}_k(p)' : 'P_t - \\text{SMA}_k(P)'} />)
              </div>
              <div className="text-lg font-mono font-semibold text-slate-900 tabular-nums mt-0.5">
                {formatUnit(selectedPoint.directSignal)}
              </div>
              <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                Raw: {formatRaw(selectedPoint.directSignal)}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500">
                Weighted Sum of Returns (<MathFormula tex={String.raw`\sum w_i r_i`} />)
              </div>
              <div className="text-lg font-mono font-semibold text-sky-700 tabular-nums mt-0.5">
                {formatUnit(selectedPoint.weightedSumSignal)}
              </div>
              <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                Raw: {formatRaw(selectedPoint.weightedSumSignal)}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500">Identity Discrepancy |Δ|</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {mode === 'pct' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <span
                  className={`text-lg font-mono font-semibold tabular-nums ${
                    mode === 'pct' ? 'text-amber-700' : 'text-emerald-700'
                  }`}
                >
                  {mode === 'pct'
                    ? `${(selectedPoint.discrepancy * 10000).toFixed(2)} bps`
                    : '0.000000'}
                </span>
              </div>
              <div className="text-[11px] text-slate-600">
                {mode === 'log'
                  ? '● Exact Identity + Stationary'
                  : mode === 'abs'
                  ? '● Exact Identity (Non-Stationary $)'
                  : '▲ Compounding Drift Error'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Visual Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Linearly Decaying Return Weights Bar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <div className="text-xs text-slate-500">
                  Impulse Response Kernel · k = {lookbackK}
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  Linearly Decaying Return Weights: <MathFormula tex={`w_i = 1 - \\frac{i}{${lookbackK}}`} />
                </h3>
              </div>
              <div className="text-xs font-mono text-slate-600 tabular-nums text-right">
                <div>Most Recent (i=1): {((lookbackK - 1) / lookbackK).toFixed(3)}</div>
                <div>Oldest (i={lookbackK - 1}): {(1 / lookbackK).toFixed(3)}</div>
              </div>
            </div>

            {/* SVG Bar Chart of Linearly Decaying Weights */}
            <div className="w-full overflow-x-auto">
              <svg
                viewBox="0 0 640 270"
                className="w-full h-auto select-none"
                role="img"
                aria-label={`Bar chart showing linearly decaying weights for ${lookbackK}-period SMA`}
              >
                {/* Horizontal gridlines */}
                {[0, 0.25, 0.5, 0.75, 1.0].map((tick) => {
                  const y = 220 - tick * 185;
                  return (
                    <g key={tick}>
                      <line
                        x1={48}
                        y1={y}
                        x2={620}
                        y2={y}
                        stroke="#E2E8F0"
                        strokeDasharray={tick === 0 ? undefined : '3 3'}
                      />
                      <text
                        x={40}
                        y={y + 4}
                        textAnchor="end"
                        className="text-[10px] fill-slate-500 font-mono"
                      >
                        {tick.toFixed(2)}
                      </text>
                    </g>
                  );
                })}

                {/* Linear theoretical slope line connecting bar tops */}
                {lagContributions.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#0284C7"
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    points={lagContributions
                      .map((item, idx) => {
                        const slotW = 560 / lagContributions.length;
                        const cx = 54 + idx * slotW + slotW * 0.4;
                        const cy = 220 - item.weight * 185;
                        return `${cx},${cy}`;
                      })
                      .join(' ')}
                  />
                )}

                {/* Bars */}
                {lagContributions.map((item, idx) => {
                  const count = lagContributions.length;
                  const slotW = 560 / count;
                  const barW = Math.max(8, Math.min(38, slotW * 0.68));
                  const x = 54 + idx * slotW + (slotW - barW) / 2;
                  const barH = item.weight * 185;
                  const y = 220 - barH;
                  const isPositiveRet = item.returnVal >= 0;

                  return (
                    <g key={item.lag}>
                      <rect
                        x={x}
                        y={y}
                        width={barW}
                        height={barH}
                        rx={3}
                        fill="#0284C7"
                        fillOpacity={0.85}
                      />
                      {/* Weight label above bar if count <= 14 */}
                      {(count <= 14 || idx === 0 || idx === count - 1 || idx % 2 === 0) && (
                        <text
                          x={x + barW / 2}
                          y={y - 6}
                          textAnchor="middle"
                          className="text-[10px] font-mono fill-slate-700 font-medium"
                        >
                          {item.weight.toFixed(2)}
                        </text>
                      )}
                      {/* Lag label on X-axis */}
                      {(count <= 16 || idx % 2 === 0 || idx === count - 1) && (
                        <text
                          x={x + barW / 2}
                          y={238}
                          textAnchor="middle"
                          className="text-[10px] font-mono fill-slate-600"
                        >
                          {idx === 0 ? 't' : `t-${idx}`}
                        </text>
                      )}
                      {/* Appearances count (k-i) */}
                      {(count <= 14 || idx % 2 === 0) && (
                        <text
                          x={x + barW / 2}
                          y={254}
                          textAnchor="middle"
                          className={`text-[9px] font-mono ${
                            isPositiveRet ? 'fill-emerald-700' : 'fill-rose-700'
                          }`}
                        >
                          {item.appearancesInSum}/{lookbackK}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <span>
              Bottom fraction <MathFormula tex={String.raw`\frac{k-i}{k}`} className="text-slate-900" /> shows how many times return{' '}
              <MathFormula tex="r_{t-i+1}" className="text-slate-900" /> appears in the cascading summation.
            </span>
            <span className="font-mono text-slate-700 tabular-nums">
              Sum of weights <MathFormula tex={String.raw`\sum w_i`} /> = {((lookbackK - 1) / 2).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Right Column: Step-by-Step Algebraic Proof & Cascading Triangle (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="text-xs text-slate-500 mb-1">
              Interactive Derivation Walkthrough (Turns 2, 3 &amp; 4)
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-3">
              Why Absolute Price Cancels Out Completely
            </h3>

            {/* 4 Step Tabs */}
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 mb-4">
              {[
                { step: 1, label: '1. Factor p_t' },
                { step: 2, label: '2. Sum Returns' },
                { step: 3, label: '3. Swap Sums' },
                { step: 4, label: '4. Weights w_i' },
              ].map((s) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setActiveProofStep(s.step)}
                  className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    activeProofStep === s.step
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {activeProofStep === 1 && (
              <div className="space-y-3 text-sm text-slate-700">
                <p>
                  Start with the price-minus-SMA oscillator on log-prices{' '}
                  <MathFormula tex={String.raw`p_t = \ln(P_t)`} className="text-slate-900" />:
                </p>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900">
                  <MathFormula
                    block
                    tex={`\\text{Signal}_t = p_t - \\frac{1}{k} \\sum_{i=0}^{k-1} p_{t-i}`}
                  />
                </div>
                <p>
                  Rewrite <MathFormula tex={String.raw`p_t = \frac{1}{k} \sum_{i=0}^{k-1} p_t`} className="text-slate-900" />{' '}
                  and bring it inside the summation. Since the <MathFormula tex="i=0" /> term is{' '}
                  <MathFormula tex="p_t - p_t = 0" />, it drops out:
                </p>
                <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-lg text-xs text-sky-950">
                  <MathFormula
                    block
                    tex={`\\text{Signal}_t = \\frac{1}{${lookbackK}} \\sum_{i=1}^{${lookbackK - 1}} (p_t - p_{t-i})`}
                  />
                </div>
              </div>
            )}

            {activeProofStep === 2 && (
              <div className="space-y-3 text-sm text-slate-700">
                <p>
                  <strong>Turn 3 Resolution:</strong> For simple percentage returns, additivity fails because of geometric compounding. For <strong>log-prices</strong>, every multi-period change is the exact sum of intermediate 1-day log-returns:
                </p>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900">
                  <MathFormula
                    block
                    tex={String.raw`p_t - p_{t-i} = \ln\!\left(\frac{P_t}{P_{t-i}}\right) = r_1 + r_2 + \dots + r_i = \sum_{j=1}^{i} r_j`}
                  />
                </div>
                <p>
                  Substituting this into Step 1 replaces all prices with stationary single-period returns:
                </p>
                <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-lg text-xs text-sky-950">
                  <MathFormula
                    block
                    tex={`\\text{Signal}_t = \\frac{1}{${lookbackK}} \\sum_{i=1}^{${lookbackK - 1}} (r_1 + r_2 + \\dots + r_i)`}
                  />
                </div>
              </div>
            )}

            {activeProofStep === 3 && (
              <div className="space-y-3 text-sm text-slate-700">
                <p>
                  Expanding the sum of sums produces a cascading triangle where recent returns appear in almost every row:
                </p>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 space-y-1">
                  <div><MathFormula tex={String.raw`i=1 : \quad r_1`} /></div>
                  <div><MathFormula tex={String.raw`i=2 : \quad r_1 + r_2`} /></div>
                  <div><MathFormula tex={String.raw`i=3 : \quad r_1 + r_2 + r_3`} /></div>
                  <div className="text-slate-400 pl-8">⋮</div>
                  <div>
                    <MathFormula tex={`i=${lookbackK - 1} : \\quad r_1 + r_2 + \\dots + r_{${lookbackK - 1}}`} />
                  </div>
                </div>
                <p>
                  Summing vertically by column: <MathFormula tex="r_1" className="text-slate-900" /> appears{' '}
                  <span className="font-mono font-semibold text-sky-700">{lookbackK - 1}</span> times,{' '}
                  <MathFormula tex="r_2" className="text-slate-900" /> appears{' '}
                  <span className="font-mono font-semibold text-sky-700">{lookbackK - 2}</span> times, down to{' '}
                  <MathFormula tex={`r_{${lookbackK - 1}}`} className="text-slate-900" /> appearing once.
                </p>
              </div>
            )}

            {activeProofStep === 4 && (
              <div className="space-y-3 text-sm text-slate-700">
                <p>
                  Dividing each column tally <MathFormula tex="(k - i)" /> by the window{' '}
                  <MathFormula tex={`k = ${lookbackK}`} /> isolates the exact linear decay weight vector:
                </p>
                <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-lg text-xs text-sky-950">
                  <MathFormula
                    block
                    tex={`\\text{Signal}_t = \\sum_{i=1}^{${lookbackK - 1}} \\left(1 - \\frac{i}{${lookbackK}}\\right) r_{t-i+1}`}
                  />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Quantitative Implication:</strong> Passing an SMA signal into a neural network forces a rigid linear decay prior. Passing the stationary return vector{' '}
                  <MathFormula tex={String.raw`\mathbf{R}_t`} className="text-slate-900" /> lets attention mechanisms learn non-linear lag weights directly.
                </p>
              </div>
            )}
          </div>

          {/* Live SPY Selected Date Cascading Table Preview */}
          <div className="mt-6 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>SPY Lag Breakdown on {selectedPoint.date}</span>
              <span className="font-mono text-slate-900">
                SPY Close: ${selectedPoint.close.toFixed(2)}
              </span>
            </div>
            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-1.5 px-2.5 font-medium">Lag <MathFormula tex="i" /></th>
                    <th className="py-1.5 px-2.5 font-medium text-right"><MathFormula tex={String.raw`w_i = 1 - \tfrac{i}{k}`} /></th>
                    <th className="py-1.5 px-2.5 font-medium text-right">SPY Return</th>
                    <th className="py-1.5 px-2.5 font-medium text-right"><MathFormula tex={String.raw`w_i \cdot r_i`} /></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lagContributions.map((row) => (
                    <tr key={row.lag} className="hover:bg-slate-50">
                      <td className="py-1 px-2.5 text-slate-700">
                        r_{row.lag} ({row.date.slice(5)})
                      </td>
                      <td className="py-1 px-2.5 text-right text-sky-700">
                        {row.weight.toFixed(3)}
                      </td>
                      <td
                        className={`py-1 px-2.5 text-right ${
                          row.returnVal >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {formatUnit(row.returnVal)}
                      </td>
                      <td className="py-1 px-2.5 text-right font-medium text-slate-900">
                        {formatUnit(row.weightedContribution)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Synchronized Verification Chart on SPY */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <div className="text-xs text-slate-500">
              Synchronized Dual-Pane Time Series on SPY (Last 90 Trading Days · Click any point to inspect date)
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              SPY Price &amp; SMA({lookbackK}) Trajectory (Top) + Oscillator vs. Weighted Return Sum (Bottom)
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <span className="w-3 h-0.5 bg-emerald-600 inline-block" />
              SPY ({mode === 'log' ? <MathFormula tex={String.raw`\ln(P_t)`} /> : '$ Close'})
            </span>
            <span className="flex items-center gap-1.5 text-amber-600 font-medium">
              <span className="w-3 h-0.5 bg-amber-500 inline-block border-b border-dashed border-amber-600" />
              <MathFormula tex={`\\text{SMA}_{${lookbackK}}`} />
            </span>
            <span className="flex items-center gap-1.5 text-slate-800">
              <span className="w-3 h-0.5 bg-slate-900 inline-block" />
              Direct Signal (<MathFormula tex={mode === 'log' ? 'p_t - \\text{SMA}_k(p)' : 'P_t - \\text{SMA}_k(P)'} />)
            </span>
            <span className="flex items-center gap-1.5 text-sky-700 font-medium">
              <span className="w-3 h-0.5 bg-sky-500 inline-block border-b border-dashed border-sky-600" />
              Weighted Return Sum (<MathFormula tex={String.raw`\sum w_i r_i`} />)
            </span>
            <span className="text-slate-500 font-mono tabular-nums">
              Max |Δ|: {mode === 'pct' ? `${(maxDiscrepancy * 10000).toFixed(2)} bps` : '0.000000'}
            </span>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <svg
            viewBox="0 0 920 350"
            className="w-full h-auto cursor-crosshair select-none"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const relX = (e.clientX - rect.left) / rect.width;
              const idxInRecent = Math.round(
                Math.max(0, Math.min(1, (relX * 920 - 55) / 845)) *
                  (recentSeries.length - 1)
              );
              const target = recentSeries[idxInRecent];
              if (target) onSelectIdx(target.index);
            }}
          >
            {/* ================= TOP PANE: SPY PRICE & SMA(k) (y: 18..135) ================= */}
            <rect
              x={55}
              y={16}
              width={845}
              height={122}
              fill="#F8FAFC"
              rx={4}
            />
            {[0, 0.5, 1].map((frac, idx) => {
              const y = 22 + frac * 110;
              const val = maxPrice - frac * priceRange;
              return (
                <g key={idx}>
                  <line
                    x1={55}
                    y1={y}
                    x2={900}
                    y2={y}
                    stroke="#E2E8F0"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={49}
                    y={y + 3.5}
                    textAnchor="end"
                    className="text-[10px] font-mono fill-slate-500"
                  >
                    {mode === 'log' ? val.toFixed(3) : `$${val.toFixed(0)}`}
                  </text>
                </g>
              );
            })}
            <text
              x={63}
              y={30}
              className="text-[10px] font-mono font-semibold fill-emerald-800"
            >
              TOP: SPY {mode === 'log' ? 'Log-Price ln(P_t)' : 'Close Price ($)'} vs. {lookbackK}-Day SMA (Spread = Oscillator Below)
            </text>

            {/* SMA_k Line on Top Pane */}
            <polyline
              fill="none"
              stroke="#D97706"
              strokeWidth={1.8}
              strokeDasharray="4 3"
              points={recentSeries
                .map((d, i) => {
                  const x = 55 + (i / (recentSeries.length - 1)) * 845;
                  const y = 22 + ((maxPrice - d.smaValue) / priceRange) * 110;
                  return `${x},${y}`;
                })
                .join(' ')}
            />

            {/* SPY Price Line on Top Pane */}
            <polyline
              fill="none"
              stroke="#059669"
              strokeWidth={2.2}
              points={recentSeries
                .map((d, i) => {
                  const x = 55 + (i / (recentSeries.length - 1)) * 845;
                  const pVal = mode === 'log' ? d.logPrice : d.close;
                  const y = 22 + ((maxPrice - pVal) / priceRange) * 110;
                  return `${x},${y}`;
                })
                .join(' ')}
            />

            {/* ================= BOTTOM PANE: OSCILLATOR & WEIGHTED SUM + SCALED SPY OVERLAY (y: 155..315) ================= */}
            <text
              x={63}
              y={166}
              className="text-[10px] font-mono font-semibold fill-slate-700"
            >
              BOTTOM: Direct Oscillator ({mode === 'log' ? 'p_t - SMA(p)' : 'P_t - SMA(P)'}) vs. Weighted Return Sum (Σ w_i · r_i) + Scaled SPY Reference
            </text>

            {/* Zero baseline */}
            {minSig < 0 && maxSig > 0 && (
              <line
                x1={55}
                y1={160 + ((maxSig - 0) / sigRange) * 155}
                x2={900}
                y2={160 + ((maxSig - 0) / sigRange) * 155}
                stroke="#CBD5E1"
                strokeWidth={1}
              />
            )}

            {/* Subtle Scaled SPY Trajectory Overlaid directly on the Oscillator Pane */}
            <polyline
              fill="none"
              stroke="#10B981"
              strokeWidth={1.4}
              strokeOpacity={0.38}
              points={recentSeries
                .map((d, i) => {
                  const x = 55 + (i / (recentSeries.length - 1)) * 845;
                  const pVal = mode === 'log' ? d.logPrice : d.close;
                  const y = 160 + ((maxPrice - pVal) / priceRange) * 155;
                  return `${x},${y}`;
                })
                .join(' ')}
            />

            {/* Direct Signal Line (Solid Slate) */}
            <polyline
              fill="none"
              stroke="#0F172A"
              strokeWidth={2.2}
              points={recentSeries
                .map((d, i) => {
                  const x = 55 + (i / (recentSeries.length - 1)) * 845;
                  const y = 160 + ((maxSig - d.directSignal) / sigRange) * 155;
                  return `${x},${y}`;
                })
                .join(' ')}
            />

            {/* Weighted Return Sum Line (Dashed Sky Blue - overlaps 100% in log/abs modes!) */}
            <polyline
              fill="none"
              stroke="#0284C7"
              strokeWidth={2}
              strokeDasharray="5 4"
              points={recentSeries
                .map((d, i) => {
                  const x = 55 + (i / (recentSeries.length - 1)) * 845;
                  const y = 160 + ((maxSig - d.weightedSumSignal) / sigRange) * 155;
                  return `${x},${y}`;
                })
                .join(' ')}
            />

            {/* Unified Selected Day Vertical Marker across Both Panes */}
            {recentSeries.map((d, i) => {
              if (d.index !== selectedPoint.index) return null;
              const x = 55 + (i / (recentSeries.length - 1)) * 845;
              const pVal = mode === 'log' ? d.logPrice : d.close;
              const yTop = 22 + ((maxPrice - pVal) / priceRange) * 110;
              const ySma = 22 + ((maxPrice - d.smaValue) / priceRange) * 110;
              const yBot = 160 + ((maxSig - d.directSignal) / sigRange) * 155;
              return (
                <g key={d.index}>
                  <line
                    x1={x}
                    y1={16}
                    x2={x}
                    y2={320}
                    stroke="#0284C7"
                    strokeWidth={1.2}
                    strokeDasharray="2 2"
                  />
                  {/* Spread connector on top pane */}
                  <line
                    x1={x}
                    y1={yTop}
                    x2={x}
                    y2={ySma}
                    stroke="#059669"
                    strokeWidth={2.5}
                  />
                  <circle cx={x} cy={yTop} r={4} fill="#059669" stroke="#FFFFFF" strokeWidth={1.5} />
                  <circle cx={x} cy={ySma} r={3.5} fill="#D97706" stroke="#FFFFFF" strokeWidth={1.2} />
                  <circle cx={x} cy={yBot} r={4.5} fill="#0284C7" stroke="#FFFFFF" strokeWidth={1.5} />
                </g>
              );
            })}

            {/* X-axis Date Ticks */}
            {recentSeries.map((d, i) => {
              if (i % 15 !== 0 && i !== recentSeries.length - 1) return null;
              const x = 55 + (i / (recentSeries.length - 1)) * 845;
              return (
                <text
                  key={d.date}
                  x={x}
                  y={338}
                  textAnchor="middle"
                  className="text-[10px] font-mono fill-slate-500"
                >
                  {d.date}
                </text>
              );
            })}
          </svg>
        </div>

        <div className="mt-2 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <span>
            {mode === 'pct' ? (
              <span className="text-amber-800 font-medium">
                ▲ Notice the separation between curves: Simple percentage returns violate additivity due to geometric compounding (Mean drift error: {(meanDiscrepancy * 10000).toFixed(2)} bps).
              </span>
            ) : (
              <span className="text-emerald-800 font-medium">
                ● Top pane shows SPY vs. SMA({lookbackK}); bottom pane shows their exact difference superposed with the weighted return sum.
              </span>
            )}
          </span>
          <span className="flex items-center gap-1 font-mono text-slate-500">
            Selected Date: {selectedPoint.date} (SPY ${selectedPoint.close.toFixed(2)}) <ArrowRight className="w-3 h-3" /> Click chart to inspect any SPY trading day
          </span>
        </div>
      </div>
    </div>
  );
};
