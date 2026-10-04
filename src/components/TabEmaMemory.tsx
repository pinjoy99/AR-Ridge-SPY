import React, { useState } from 'react';
import { SpyBar, computeEmaEquivalence } from '../data/spyData';
import { MathFormula } from './MathFormula';
import { Sliders, CheckCircle2, Layers } from 'lucide-react';

interface TabEmaMemoryProps {
  bars: SpyBar[];
  selectedIdx: number;
  onSelectIdx: (idx: number) => void;
}

export const TabEmaMemory: React.FC<TabEmaMemoryProps> = ({
  bars,
  selectedIdx,
  onSelectIdx,
}) => {
  const [spanN, setSpanN] = useState<number>(14);
  const [truncationM, setTruncationM] = useState<number>(28);
  const [showSmaComparison, setShowSmaComparison] = useState<boolean>(true);

  const {
    alpha,
    oneMinusAlpha,
    series,
    lagWeights,
    capturedFraction,
    selectedPoint,
  } = computeEmaEquivalence(bars, spanN, truncationM, selectedIdx);

  const recentSeries = series.slice(-90);
  const minSig = Math.min(
    ...recentSeries.map((d) =>
      Math.min(d.exactLogSignal * 10000, d.truncatedSumSignal * 10000)
    )
  );
  const maxSig = Math.max(
    ...recentSeries.map((d) =>
      Math.max(d.exactLogSignal * 10000, d.truncatedSumSignal * 10000)
    )
  );
  const sigRange = Math.max(1e-4, maxSig - minSig);

  const minPrice = Math.min(
    ...recentSeries.map((d) => Math.min(d.close, Math.exp(d.emaLogPrice)))
  );
  const maxPrice = Math.max(
    ...recentSeries.map((d) => Math.max(d.close, Math.exp(d.emaLogPrice)))
  );
  const priceRange = Math.max(1e-4, maxPrice - minPrice);

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <div className="text-xs text-slate-500 mb-1">
              <span>02. Infinite Geometric Series Expansion</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Exponential Return Decay</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Asset: SPY Log-Prices <MathFormula tex={String.raw`\ln(P_t)`} /></span>
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 font-display tracking-tight">
              Log-EMA Oscillator as an Infinite Geometric Sum of Log-Returns
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Because the smoothing weights of an Exponential Moving Average sum to unity{' '}
              <MathFormula tex={String.raw`\left(\alpha \sum_{i=0}^{\infty} (1-\alpha)^i = 1\right)`} className="text-slate-900" />, the log-price{' '}
              <MathFormula tex="p_t" className="text-slate-900" /> cancels out cleanly and reduces to an infinite series of stationary log-returns weighted by{' '}
              <MathFormula tex={String.raw`(1 - \alpha)^k`} className="text-sky-700 font-medium" />.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowSmaComparison(!showSmaComparison)}
              className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap flex items-center gap-2 ${
                showSmaComparison
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{showSmaComparison ? 'Hide SMA Linear Overlay' : 'Compare SMA Linear Decay'}</span>
            </button>
          </div>
        </div>

        {/* Sliders & Live Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-6 items-center">
          <div className="md:col-span-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="ema-span-slider" className="font-medium text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-sky-600" />
                <span>EMA Span N (α = 2/(N+1)):</span>
              </label>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                N = {spanN} (α = {alpha.toFixed(4)})
              </span>
            </div>
            <input
              id="ema-span-slider"
              type="range"
              min={4}
              max={35}
              step={1}
              value={spanN}
              onChange={(e) => setSpanN(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-500 tabular-nums">
              <span>1 - α = {oneMinusAlpha.toFixed(4)}</span>
              <span>Half-life: {(Math.LN2 / -Math.log(oneMinusAlpha)).toFixed(1)} days</span>
            </div>
          </div>

          <div className="md:col-span-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="ema-trunc-slider" className="font-medium text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                <span>Finite Truncation Horizon (M lags):</span>
              </label>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                M = {truncationM} days
              </span>
            </div>
            <input
              id="ema-trunc-slider"
              type="range"
              min={5}
              max={45}
              step={1}
              value={truncationM}
              onChange={(e) => setTruncationM(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-500 tabular-nums">
              <span>M=5 (Truncated)</span>
              <span>Weight Captured: {(capturedFraction * 100).toFixed(2)}%</span>
              <span>M=45 (Full Tail)</span>
            </div>
          </div>

          <div className="md:col-span-4 grid grid-cols-2 gap-4 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
            <div>
              <div className="text-xs text-slate-500">
                Exact <MathFormula tex={String.raw`p_t - \text{EMA}_t(p)`} />
              </div>
              <div className="text-lg font-mono font-semibold text-slate-900 tabular-nums mt-0.5">
                {(selectedPoint.exactLogSignal * 10000).toFixed(2)} bps
              </div>
              <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                Infinite Recursive Memory
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500">Truncated Sum (M={truncationM})</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                <span className="text-lg font-mono font-semibold text-sky-700 tabular-nums">
                  {(selectedPoint.truncatedSumSignal * 10000).toFixed(2)} bps
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                Tail Residual: {(selectedPoint.truncationError * 10000).toFixed(2)} bps
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Exponential Decay Weight Kernel Chart */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <div className="text-xs text-slate-500">
                  Infinite Geometric Weight Profile · <MathFormula tex={String.raw`w_k = (1 - \alpha)^k`} />
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  Exponential Decay Kernel vs. Linear SMA Cutoff
                </h3>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-sky-700 font-medium">
                  <span className="w-2.5 h-2.5 rounded-xs bg-sky-600 inline-block" />
                  Included (k ≤ {truncationM})
                </span>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-xs bg-slate-300 inline-block" />
                  Truncated Tail (k &gt; {truncationM})
                </span>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <svg viewBox="0 0 640 270" className="w-full h-auto select-none">
                {[0, 0.25, 0.5, 0.75, 1.0].map((tick) => {
                  const y = 225 - tick * 190;
                  return (
                    <g key={tick}>
                      <line
                        x1={46}
                        y1={y}
                        x2={624}
                        y2={y}
                        stroke="#E2E8F0"
                        strokeDasharray={tick === 0 ? undefined : '3 3'}
                      />
                      <text
                        x={38}
                        y={y + 4}
                        textAnchor="end"
                        className="text-[10px] font-mono fill-slate-500"
                      >
                        {tick.toFixed(2)}
                      </text>
                    </g>
                  );
                })}

                {/* Bars for EMA weights k = 1 .. 45 */}
                {lagWeights.map((item, idx) => {
                  const slotW = 574 / lagWeights.length;
                  const barW = Math.max(5, slotW * 0.72);
                  const x = 48 + idx * slotW + (slotW - barW) / 2;
                  const barH = item.emaWeight * 190;
                  const y = 225 - barH;

                  return (
                    <g key={item.lag}>
                      <rect
                        x={x}
                        y={y}
                        width={barW}
                        height={barH}
                        rx={1.5}
                        fill={item.inTruncationWindow ? '#0284C7' : '#CBD5E1'}
                      />
                      {item.lag % 5 === 0 || item.lag === 1 ? (
                        <text
                          x={x + barW / 2}
                          y={242}
                          textAnchor="middle"
                          className="text-[10px] font-mono fill-slate-600"
                        >
                          k={item.lag}
                        </text>
                      ) : null}
                    </g>
                  );
                })}

                {/* Optional SMA Linear Decay Overlay Curve */}
                {showSmaComparison && (
                  <polyline
                    fill="none"
                    stroke="#D97706"
                    strokeWidth={2}
                    strokeDasharray="5 3"
                    points={lagWeights
                      .map((item, idx) => {
                        const slotW = 574 / lagWeights.length;
                        const cx = 48 + idx * slotW + slotW / 2;
                        const cy = 225 - item.smaWeight * 190;
                        return `${cx},${cy}`;
                      })
                      .join(' ')}
                  />
                )}

                {/* Vertical Truncation Boundary Line at M */}
                {(() => {
                  const slotW = 574 / lagWeights.length;
                  const tx = 48 + truncationM * slotW;
                  return (
                    <g>
                      <line
                        x1={tx}
                        y1={20}
                        x2={tx}
                        y2={225}
                        stroke="#059669"
                        strokeWidth={1.5}
                        strokeDasharray="4 2"
                      />
                      <text
                        x={Math.min(610, tx + 6)}
                        y={34}
                        className="text-[10px] font-mono font-semibold fill-emerald-700"
                      >
                        Cutoff M={truncationM} ({(capturedFraction * 100).toFixed(1)}% mass)
                      </text>
                    </g>
                  );
                })()}
              </svg>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <span>
              Lag 1 weight <MathFormula tex={`(1-\\alpha)^1 = ${oneMinusAlpha.toFixed(4)}`} className="text-slate-900" /> · Lag 10 weight{' '}
              <MathFormula tex={`(1-\\alpha)^{10} = ${Math.pow(oneMinusAlpha, 10).toFixed(4)}`} className="text-slate-900" />
            </span>
            {showSmaComparison && (
              <span className="text-amber-700 font-medium">
                --- Amber dashed line: SMA({spanN}) linear cutoff at k={spanN}
              </span>
            )}
          </div>
        </div>

        {/* Right: Geometric Series Proof & ML Feature Engineering Insight */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <div className="text-xs text-slate-500 mb-1">
                Section 3.3 Proof (Turns 5, 6 &amp; 7)
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                Closed-Form Geometric Reduction on Log-Prices
              </h3>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="font-semibold text-slate-900 mb-1">
                  1. Unity Normalization Identity
                </div>
                <div className="text-slate-900">
                  <MathFormula
                    block
                    tex={String.raw`\text{EMA}_t(p) = \alpha \sum_{i=0}^{\infty} (1-\alpha)^i p_{t-i}`}
                  />
                </div>
                <p className="mt-1 text-slate-600">
                  Since <MathFormula tex={String.raw`\alpha \sum_{i=0}^{\infty} (1-\alpha)^i = \frac{\alpha}{1 - (1-\alpha)} = 1`} />, we substitute{' '}
                  <MathFormula tex={String.raw`p_t = \alpha \sum_{i=0}^{\infty} (1-\alpha)^i p_t`} />:
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="font-semibold text-slate-900 mb-1">
                  2. Additive Log-Return Substitution
                </div>
                <div className="text-slate-900">
                  <MathFormula
                    block
                    tex={String.raw`p_t - \text{EMA}_t(p) = \sum_{i=1}^{\infty} \alpha(1-\alpha)^i (r_1 + r_2 + \dots + r_i)`}
                  />
                </div>
                <p className="mt-1 text-slate-600">
                  To isolate the coefficient on historical log-return <MathFormula tex="r_k" />, sum every row <MathFormula tex={String.raw`i \ge k`} /> in the infinite series:
                </p>
              </div>

              <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-lg">
                <div className="font-semibold text-sky-950 mb-1">
                  3. Infinite Geometric Series Collapse
                </div>
                <div className="text-sky-950">
                  <MathFormula
                    block
                    tex={String.raw`w_k = \sum_{i=k}^{\infty} \alpha(1-\alpha)^i = \frac{\alpha(1-\alpha)^k}{1 - (1-\alpha)} = (1-\alpha)^k`}
                  />
                </div>
                <div className="font-semibold text-sky-900 mt-1">
                  <MathFormula
                    block
                    tex={String.raw`\Longrightarrow \quad \text{Signal}_t = \sum_{k=1}^{\infty} (1 - \alpha)^k r_{t-k+1}`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200">
            <div className="text-xs font-semibold text-slate-900 mb-1">
              Why Log-EMA Is Essential for Sequence Models (Turn 7)
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Calculating an EMA on raw dollar SPY prices ($660 → $771) introduces non-linear compounding drift, forcing LSTMs or Transformers to waste capacity normalizing price levels. Operating on{' '}
              <MathFormula tex={String.raw`\ln(\text{SPY})`} className="text-slate-900" /> yields a pure, stationary geometric filter of log-returns{' '}
              <MathFormula tex={String.raw`\mathbf{R}_t`} className="text-slate-900" />.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Time-Series Convergence Verification on SPY */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <div className="text-xs text-slate-500">
              Synchronized Dual-Pane Time Series on SPY (Drag Truncation Slider M above to watch finite sum lock onto recursive EMA)
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              SPY Price &amp; EMA({spanN}) Trajectory (Top) + Recursive Log-EMA vs. Finite M-Lag Return Sum (Bottom)
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <span className="w-3 h-0.5 bg-emerald-600 inline-block" />
              SPY Close ($)
            </span>
            <span className="flex items-center gap-1.5 text-amber-600 font-medium">
              <span className="w-3 h-0.5 bg-amber-500 inline-block border-b border-dashed border-amber-600" />
              <MathFormula tex={`\\exp(\\text{EMA}_{${spanN}}(p))`} />
            </span>
            <span className="flex items-center gap-1.5 text-slate-800">
              <span className="w-3 h-0.5 bg-slate-900 inline-block" />
              Exact Recursive <MathFormula tex={String.raw`p_t - \text{EMA}_t(p)`} />
            </span>
            <span className="flex items-center gap-1.5 text-sky-700 font-medium">
              <span className="w-3 h-0.5 bg-sky-500 inline-block border-b border-dashed border-sky-600" />
              Finite Sum <MathFormula tex={`\\sum_{k=1}^{${truncationM}} (1-\\alpha)^k r_k`} />
            </span>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <svg
            viewBox="0 0 920 345"
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
            {/* ================= TOP PANE: SPY PRICE & EMA(N) (y: 16..138) ================= */}
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
                    ${val.toFixed(0)}
                  </text>
                </g>
              );
            })}
            <text
              x={63}
              y={30}
              className="text-[10px] font-mono font-semibold fill-emerald-800"
            >
              TOP: SPY Close Price ($) vs. Exponential Moving Average (N={spanN}, α={alpha.toFixed(3)})
            </text>

            {/* EMA(N) Curve on Top Pane */}
            <polyline
              fill="none"
              stroke="#D97706"
              strokeWidth={1.8}
              strokeDasharray="4 3"
              points={recentSeries
                .map((d, i) => {
                  const x = 55 + (i / (recentSeries.length - 1)) * 845;
                  const emaDollar = Math.exp(d.emaLogPrice);
                  const y = 22 + ((maxPrice - emaDollar) / priceRange) * 110;
                  return `${x},${y}`;
                })
                .join(' ')}
            />

            {/* SPY Close Curve on Top Pane */}
            <polyline
              fill="none"
              stroke="#059669"
              strokeWidth={2.2}
              points={recentSeries
                .map((d, i) => {
                  const x = 55 + (i / (recentSeries.length - 1)) * 845;
                  const y = 22 + ((maxPrice - d.close) / priceRange) * 110;
                  return `${x},${y}`;
                })
                .join(' ')}
            />

            {/* ================= BOTTOM PANE: LOG-EMA OSCILLATOR & FINITE SUM + SCALED SPY OVERLAY (y: 160..315) ================= */}
            <text
              x={63}
              y={166}
              className="text-[10px] font-mono font-semibold fill-slate-700"
            >
              BOTTOM: Exact Log-EMA Signal (bps) vs. Finite M={truncationM} Geometric Return Sum + Scaled SPY Reference
            </text>

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

            {/* Subtle Scaled SPY Trajectory Overlaid on Bottom Pane */}
            <polyline
              fill="none"
              stroke="#10B981"
              strokeWidth={1.4}
              strokeOpacity={0.38}
              points={recentSeries
                .map((d, i) => {
                  const x = 55 + (i / (recentSeries.length - 1)) * 845;
                  const y = 160 + ((maxPrice - d.close) / priceRange) * 155;
                  return `${x},${y}`;
                })
                .join(' ')}
            />

            <polyline
              fill="none"
              stroke="#0F172A"
              strokeWidth={2.2}
              points={recentSeries
                .map((d, i) => {
                  const x = 55 + (i / (recentSeries.length - 1)) * 845;
                  const y =
                    160 + ((maxSig - d.exactLogSignal * 10000) / sigRange) * 155;
                  return `${x},${y}`;
                })
                .join(' ')}
            />

            <polyline
              fill="none"
              stroke="#0284C7"
              strokeWidth={2}
              strokeDasharray="5 3"
              points={recentSeries
                .map((d, i) => {
                  const x = 55 + (i / (recentSeries.length - 1)) * 845;
                  const y =
                    160 +
                    ((maxSig - d.truncatedSumSignal * 10000) / sigRange) * 155;
                  return `${x},${y}`;
                })
                .join(' ')}
            />

            {recentSeries.map((d, i) => {
              if (d.index !== selectedPoint.index) return null;
              const x = 55 + (i / (recentSeries.length - 1)) * 845;
              const yTop = 22 + ((maxPrice - d.close) / priceRange) * 110;
              const yEma =
                22 + ((maxPrice - Math.exp(d.emaLogPrice)) / priceRange) * 110;
              const yBot =
                160 + ((maxSig - d.exactLogSignal * 10000) / sigRange) * 155;
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
                  <line
                    x1={x}
                    y1={yTop}
                    x2={x}
                    y2={yEma}
                    stroke="#059669"
                    strokeWidth={2.5}
                  />
                  <circle cx={x} cy={yTop} r={4} fill="#059669" stroke="#FFFFFF" strokeWidth={1.5} />
                  <circle cx={x} cy={yEma} r={3.5} fill="#D97706" stroke="#FFFFFF" strokeWidth={1.2} />
                  <circle cx={x} cy={yBot} r={4.5} fill="#0284C7" stroke="#FFFFFF" strokeWidth={1.5} />
                </g>
              );
            })}

            {recentSeries.map((d, i) => {
              if (i % 15 !== 0 && i !== recentSeries.length - 1) return null;
              const x = 55 + (i / (recentSeries.length - 1)) * 845;
              return (
                <text
                  key={d.date}
                  x={x}
                  y={336}
                  textAnchor="middle"
                  className="text-[10px] font-mono fill-slate-500"
                >
                  {d.date}
                </text>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};
