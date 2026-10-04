import React, { useState } from 'react';
import { SpyBar, computeLogMacdAnalysis } from '../data/spyData';
import { MathFormula } from './MathFormula';
import { Sliders, Waves, Activity } from 'lucide-react';

interface TabLogMacdFilterProps {
  bars: SpyBar[];
  selectedIdx: number;
  onSelectIdx: (idx: number) => void;
}

export const TabLogMacdFilter: React.FC<TabLogMacdFilterProps> = ({
  bars,
  selectedIdx,
  onSelectIdx,
}) => {
  const [fastN, setFastN] = useState<number>(12);
  const [slowN, setSlowN] = useState<number>(26);
  const [showLowPassComponents, setShowLowPassComponents] = useState<boolean>(true);
  const [showWaveletEnvelope, setShowWaveletEnvelope] = useState<boolean>(true);
  const [hoveredLag, setHoveredLag] = useState<number>(9);

  const {
    alphaF,
    alphaS,
    decayF,
    decayS,
    exactPeakLag,
    discretePeakLag,
    peakWeight,
    lagWeights,
    series,
    selectedPoint,
  } = computeLogMacdAnalysis(bars, fastN, slowN, selectedIdx);

  const applyPreset = (f: number, s: number) => {
    setFastN(f);
    setSlowN(s);
    const dF = 1 - 2 / (f + 1);
    const dS = 1 - 2 / (s + 1);
    const pk = Math.max(
      1,
      Math.round(Math.log(Math.log(dF) / Math.log(dS)) / Math.log(dS / dF))
    );
    setHoveredLag(Math.min(45, pk));
  };

  const inspectedLagObj =
    lagWeights.find((l) => l.lag === hoveredLag) ??
    lagWeights.find((l) => l.lag === discretePeakLag) ??
    lagWeights[0];

  const recentSeries = series.slice(-95);
  const maxLogBps = Math.max(
    10,
    ...recentSeries.map((d) => Math.abs(d.logMacdBps))
  );
  const minPrice = Math.min(
    ...recentSeries.map((d) =>
      Math.min(d.close, d.emaFastClose, d.emaSlowClose)
    )
  );
  const maxPrice = Math.max(
    ...recentSeries.map((d) =>
      Math.max(d.close, d.emaFastClose, d.emaSlowClose)
    )
  );
  const priceRange = Math.max(1e-4, maxPrice - minPrice);

  return (
    <div className="space-y-8">
      {/* Header & Timescale Filter Presets */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <div className="text-xs text-slate-500 mb-1">
              <span>03. Causal Band-Pass Filter &amp; DSP Wavelet Equivalence</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Section 3.4 &amp; Turn 8</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Asset: SPY</span>
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 font-display tracking-tight">
              Log-MACD as a Causal Band-Pass Filter of Stationary Returns
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Subtracting a Slow Log-EMA from a Fast Log-EMA cancels out the current log-price{' '}
              <MathFormula tex="p_t" className="text-slate-900" /> and constructs a band-pass weight kernel{' '}
              <MathFormula tex={String.raw`w_k = (1 - \alpha_S)^k - (1 - \alpha_F)^k`} className="text-sky-700 font-medium" />{' '}
              that suppresses 1-to-3 day noise, peaks at medium-term momentum (lag{' '}
              <MathFormula tex={`k^* = ${discretePeakLag}`} className="font-semibold text-slate-900" />), and attenuates old history.
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <span className="text-xs font-medium text-slate-500">
              Filter Bank Timescale Presets
            </span>
            <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
              {[
                { label: 'Standard (12, 26)', f: 12, s: 26 },
                { label: 'Fast Reversal (2, 5)', f: 2, s: 5 },
                { label: 'Swing (8, 21)', f: 8, s: 21 },
                { label: 'Cycle (21, 55)', f: 21, s: 55 },
              ].map((preset) => {
                const isActive = fastN === preset.f && slowN === preset.s;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyPreset(preset.f, preset.s)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sliders & Analytical Band-Pass Telemetry */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-6 items-center">
          <div className="md:col-span-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="macd-fast-slider" className="font-medium text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-sky-600" />
                <span>Fast EMA (<MathFormula tex="N_F" />):</span>
              </label>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {fastN}d (<MathFormula tex={`\\alpha_F=${alphaF.toFixed(3)}`} />)
              </span>
            </div>
            <input
              id="macd-fast-slider"
              type="range"
              min={2}
              max={Math.max(3, slowN - 2)}
              step={1}
              value={fastN}
              onChange={(e) => setFastN(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="text-[11px] font-mono text-slate-500 tabular-nums">
              <MathFormula tex={`1 - \\alpha_F = ${decayF.toFixed(4)}`} />
            </div>
          </div>

          <div className="md:col-span-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="macd-slow-slider" className="font-medium text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-600" />
                <span>Slow EMA (<MathFormula tex="N_S" />):</span>
              </label>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {slowN}d (<MathFormula tex={`\\alpha_S=${alphaS.toFixed(3)}`} />)
              </span>
            </div>
            <input
              id="macd-slow-slider"
              type="range"
              min={fastN + 2}
              max={65}
              step={1}
              value={slowN}
              onChange={(e) => setSlowN(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="text-[11px] font-mono text-slate-500 tabular-nums">
              <MathFormula tex={`1 - \\alpha_S = ${decayS.toFixed(4)}`} />
            </div>
          </div>

          <div className="md:col-span-6 grid grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
            <div>
              <div className="text-xs text-slate-500">Lag-1 Noise Weight (k=1)</div>
              <div className="text-lg font-mono font-semibold text-slate-900 tabular-nums mt-0.5">
                {lagWeights[0].bandPassWeight.toFixed(4)}
              </div>
              <div className="text-[11px] text-slate-500">
                Suppresses 1-day microstructure
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500">
                Passband Peak (Lag k*={discretePeakLag})
              </div>
              <div className="text-lg font-mono font-semibold text-sky-700 tabular-nums mt-0.5">
                {peakWeight.toFixed(4)}
              </div>
              <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                Exact k* = {exactPeakLag.toFixed(2)} days ago
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500">SPY Log-MACD ({selectedPoint.date})</div>
              <div className="text-lg font-mono font-semibold text-emerald-700 tabular-nums mt-0.5">
                {selectedPoint.logMacdBps >= 0 ? '+' : ''}
                {selectedPoint.logMacdBps.toFixed(2)} bps
              </div>
              <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                Dollar MACD: ${selectedPoint.priceMacdDollars.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Band-Pass Kernel & Mathematical Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 7 Cols: Causal Band-Pass Impulse Response Chart */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <div className="text-xs text-slate-500">
                  Digital Signal Processing Kernel · Hover or click any lag bar k
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  Band-Pass Weight Vector: <MathFormula tex={String.raw`w_k = (1 - \alpha_S)^k - (1 - \alpha_F)^k`} />
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLowPassComponents(!showLowPassComponents)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
                    showLowPassComponents
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Low-Pass Curves
                </button>
                <button
                  type="button"
                  onClick={() => setShowWaveletEnvelope(!showWaveletEnvelope)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap flex items-center gap-1 ${
                    showWaveletEnvelope
                      ? 'bg-sky-700 text-white border-sky-700'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Waves className="w-3 h-3" />
                  <span>Wavelet Envelope</span>
                </button>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <svg viewBox="0 0 640 280" className="w-full h-auto select-none">
                {/* Y-axis gridlines: 0 to 1.0 if low-pass shown, else 0 to 0.35 */}
                {(showLowPassComponents
                  ? [0, 0.25, 0.5, 0.75, 1.0]
                  : [0, 0.1, 0.2, 0.3, 0.4]
                ).map((tick) => {
                  const maxScale = showLowPassComponents ? 1.0 : Math.max(0.35, peakWeight * 1.15);
                  const y = 230 - (tick / maxScale) * 195;
                  if (y < 15) return null;
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

                {/* Band-Pass Bars */}
                {lagWeights.map((item, idx) => {
                  const maxScale = showLowPassComponents ? 1.0 : Math.max(0.35, peakWeight * 1.15);
                  const slotW = 574 / lagWeights.length;
                  const barW = Math.max(5, slotW * 0.72);
                  const x = 48 + idx * slotW + (slotW - barW) / 2;
                  const barH = (item.bandPassWeight / maxScale) * 195;
                  const y = 230 - barH;
                  const isPeak = item.lag === discretePeakLag;
                  const isHovered = item.lag === hoveredLag;

                  return (
                    <g
                      key={item.lag}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredLag(item.lag)}
                      onClick={() => setHoveredLag(item.lag)}
                    >
                      <rect
                        x={x}
                        y={y}
                        width={barW}
                        height={Math.max(1, barH)}
                        rx={1.5}
                        fill={
                          isPeak
                            ? '#059669'
                            : isHovered
                            ? '#0369A1'
                            : item.lag <= 3
                            ? '#94A3B8'
                            : '#0284C7'
                        }
                        fillOpacity={isHovered || isPeak ? 1 : 0.85}
                      />
                      {(item.lag === 1 ||
                        item.lag === discretePeakLag ||
                        item.lag % 5 === 0) && (
                        <text
                          x={x + barW / 2}
                          y={246}
                          textAnchor="middle"
                          className={`text-[10px] font-mono ${
                            isPeak ? 'fill-emerald-700 font-bold' : 'fill-slate-600'
                          }`}
                        >
                          {item.lag === discretePeakLag ? `k*=${item.lag}` : `k=${item.lag}`}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Slow & Fast Low-Pass Decay Curves */}
                {showLowPassComponents && (
                  <>
                    {/* Slow EMA Low-Pass (1 - \alpha_S)^k */}
                    <polyline
                      fill="none"
                      stroke="#D97706"
                      strokeWidth={1.8}
                      strokeDasharray="4 3"
                      points={lagWeights
                        .map((item, idx) => {
                          const slotW = 574 / lagWeights.length;
                          const cx = 48 + idx * slotW + slotW / 2;
                          const cy = 230 - item.slowDecay * 195;
                          return `${cx},${cy}`;
                        })
                        .join(' ')}
                    />
                    {/* Fast EMA Low-Pass (1 - \alpha_F)^k */}
                    <polyline
                      fill="none"
                      stroke="#64748B"
                      strokeWidth={1.8}
                      strokeDasharray="2 3"
                      points={lagWeights
                        .map((item, idx) => {
                          const slotW = 574 / lagWeights.length;
                          const cx = 48 + idx * slotW + slotW / 2;
                          const cy = 230 - item.fastDecay * 195;
                          return `${cx},${cy}`;
                        })
                        .join(' ')}
                    />
                  </>
                )}

                {/* Mexican Hat / Ricker Wavelet Reference Curve */}
                {showWaveletEnvelope && (
                  <polyline
                    fill="none"
                    stroke="#0F172A"
                    strokeWidth={1.75}
                    points={lagWeights
                      .map((item, idx) => {
                        const maxScale = showLowPassComponents
                          ? 1.0
                          : Math.max(0.35, peakWeight * 1.15);
                        const slotW = 574 / lagWeights.length;
                        const cx = 48 + idx * slotW + slotW / 2;
                        const cy = 230 - (item.mexicanHatRef / maxScale) * 195;
                        return `${cx},${cy}`;
                      })
                      .join(' ')}
                  />
                )}
              </svg>
            </div>
          </div>

          {/* Inspected Lag Readout Bar */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs tabular-nums">
            <div className="text-slate-800">
              <span className="font-semibold text-sky-800">Inspected Lag <MathFormula tex={`k=${inspectedLagObj.lag}`} />:</span>{' '}
              Slow <MathFormula tex={`(1-\\alpha_S)^{${inspectedLagObj.lag}} = ${inspectedLagObj.slowDecay.toFixed(4)}`} /> − Fast{' '}
              <MathFormula tex={`(1-\\alpha_F)^{${inspectedLagObj.lag}} = ${inspectedLagObj.fastDecay.toFixed(4)}`} />
            </div>
            <div className="font-semibold text-slate-900">
              Band-Pass Weight <MathFormula tex={`w_{${inspectedLagObj.lag}} = ${inspectedLagObj.bandPassWeight.toFixed(4)}`} />
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Three-Regime DSP Decomposition & Exact Values Table */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <div className="text-xs text-slate-500 mb-1">
                Three-Zone Frequency Response (Turn 6 &amp; Section 3.4)
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                Why Subtracting Two Low-Pass Filters Creates a Band-Pass Wavelet
              </h3>
            </div>

            <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-lg text-xs text-sky-950">
              <MathFormula
                block
                tex={String.raw`\text{MACD}_{\log, t} = \text{EMA}_{\text{fast}}(p_t) - \text{EMA}_{\text{slow}}(p_t) = \sum_{k=1}^{\infty} \left[ (1 - \alpha_S)^k - (1 - \alpha_F)^k \right] r_{t-k+1}`}
              />
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="font-semibold text-slate-900 flex items-center justify-between">
                  <span>1. Short-Lag Noise Rejection (<MathFormula tex={String.raw`k = 1\dots 3`} />)</span>
                  <span className="font-mono text-slate-600">
                    <MathFormula tex={`w_1 = ${lagWeights[0].bandPassWeight.toFixed(4)}`} />
                  </span>
                </div>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  For yesterday&apos;s return (<MathFormula tex="k=1" />), both{' '}
                  <MathFormula tex={String.raw`(1-\alpha_S)^1`} /> and{' '}
                  <MathFormula tex={String.raw`(1-\alpha_F)^1`} /> are near 1.0, so their difference is small. High-frequency bid-ask bounce is suppressed.
                </p>
              </div>

              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg">
                <div className="font-semibold text-emerald-950 flex items-center justify-between">
                  <span>2. Medium-Term Passband Peak (<MathFormula tex={`k^* = ${discretePeakLag}`} />)</span>
                  <span className="font-mono text-emerald-800">
                    <MathFormula tex={`w_{${discretePeakLag}} = ${peakWeight.toFixed(4)}`} />
                  </span>
                </div>
                <p className="text-emerald-900/80 mt-1 leading-relaxed">
                  Around lag <MathFormula tex={`${discretePeakLag}`} />, the fast EMA has decayed substantially while the slow EMA remains elevated, isolating intermediate swing momentum.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="font-semibold text-slate-900 flex items-center justify-between">
                  <span>3. Long-Horizon Attenuation (<MathFormula tex="k > 25" />)</span>
                  <span className="font-mono text-slate-600">
                    <MathFormula tex={`w_{30} = ${lagWeights[29]?.bandPassWeight.toFixed(4)}`} />
                  </span>
                </div>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  For distant lags, both geometric series approach zero, preventing stale regime prices from polluting the current feature vector.
                </p>
              </div>
            </div>
          </div>

          {/* Exact Manuscript Reference Table for 12-26 MACD */}
          <div className="mt-5 pt-4 border-t border-slate-200">
            <div className="text-xs font-medium text-slate-600 mb-2">
              Lag Weight Schedule ({fastN}-{slowN} Log-MACD · Click row to highlight)
            </div>
            <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-1.5 px-2.5 font-medium">Lag <MathFormula tex="k" /></th>
                    <th className="py-1.5 px-2.5 font-medium text-right"><MathFormula tex={String.raw`(1-\alpha_S)^k`} /></th>
                    <th className="py-1.5 px-2.5 font-medium text-right"><MathFormula tex={String.raw`(1-\alpha_F)^k`} /></th>
                    <th className="py-1.5 px-2.5 font-medium text-right">Weight <MathFormula tex="w_k" /></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[1, 2, 3, 5, 7, 8, 9, 10, 12, 15, 20, 30].map((kVal) => {
                    const row = lagWeights[kVal - 1];
                    if (!row) return null;
                    const isPeak = row.lag === discretePeakLag;
                    return (
                      <tr
                        key={row.lag}
                        onClick={() => setHoveredLag(row.lag)}
                        className={`cursor-pointer ${
                          isPeak
                            ? 'bg-emerald-50/80 font-semibold text-emerald-950'
                            : hoveredLag === row.lag
                            ? 'bg-sky-50'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-1 px-2.5">
                          k={row.lag} {isPeak ? '★ Peak' : ''}
                        </td>
                        <td className="py-1 px-2.5 text-right text-amber-700">
                          {row.slowDecay.toFixed(4)}
                        </td>
                        <td className="py-1 px-2.5 text-right text-slate-500">
                          {row.fastDecay.toFixed(4)}
                        </td>
                        <td className="py-1 px-2.5 text-right text-sky-700 font-medium">
                          {row.bandPassWeight.toFixed(4)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Chart: Stationary Log-MACD vs Non-Stationary Dollar MACD on SPY */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-600" />
              <span>Synchronized Dual-Pane Time Series on SPY · Scale-Invariance &amp; Exact Return Identity</span>
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              SPY Price &amp; Fast/Slow EMAs (Top) + Log-MACD Oscillator vs. Band-Pass Return Sum (Bottom)
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <span className="w-3 h-0.5 bg-emerald-600 inline-block" />
              SPY Close ($)
            </span>
            <span className="flex items-center gap-1.5 text-sky-600 font-medium">
              <span className="w-3 h-0.5 bg-sky-500 inline-block border-b border-dotted border-sky-600" />
              Fast EMA({fastN})
            </span>
            <span className="flex items-center gap-1.5 text-amber-600 font-medium">
              <span className="w-3 h-0.5 bg-amber-500 inline-block border-b border-dashed border-amber-600" />
              Slow EMA({slowN})
            </span>
            <span className="flex items-center gap-1.5 text-slate-900 font-medium">
              <span className="w-3 h-0.5 bg-slate-900 inline-block" />
              Log-MACD (bps)
            </span>
            <span className="flex items-center gap-1.5 text-sky-700 font-medium">
              <span className="w-3 h-0.5 bg-sky-500 inline-block border-b border-dashed border-sky-600" />
              <MathFormula tex={String.raw`\sum [(1-\alpha_S)^k - (1-\alpha_F)^k] r_k`} />
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
            {/* ================= TOP PANE: SPY PRICE + FAST EMA & SLOW EMA (y: 16..138) ================= */}
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
              TOP: SPY Close Price ($) with Fast EMA({fastN}) &amp; Slow EMA({slowN})
            </text>

            {/* Slow EMA Curve */}
            <polyline
              fill="none"
              stroke="#D97706"
              strokeWidth={1.7}
              strokeDasharray="4 3"
              points={recentSeries
                .map((d, i) => {
                  const x = 55 + (i / (recentSeries.length - 1)) * 845;
                  const y = 22 + ((maxPrice - d.emaSlowClose) / priceRange) * 110;
                  return `${x},${y}`;
                })
                .join(' ')}
            />

            {/* Fast EMA Curve */}
            <polyline
              fill="none"
              stroke="#0284C7"
              strokeWidth={1.6}
              strokeDasharray="2 2"
              points={recentSeries
                .map((d, i) => {
                  const x = 55 + (i / (recentSeries.length - 1)) * 845;
                  const y = 22 + ((maxPrice - d.emaFastClose) / priceRange) * 110;
                  return `${x},${y}`;
                })
                .join(' ')}
            />

            {/* SPY Close Curve */}
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

            {/* ================= BOTTOM PANE: LOG-MACD OSCILLATOR & WEIGHTED SUM + SCALED SPY (center y=240) ================= */}
            <text
              x={63}
              y={164}
              className="text-[10px] font-mono font-semibold fill-slate-700"
            >
              BOTTOM: Log-MACD Oscillator (bps) vs. Band-Pass Weighted Return Sum + Scaled SPY Reference
            </text>

            {/* Zero Line */}
            <line x1={55} y1={240} x2={900} y2={240} stroke="#CBD5E1" strokeWidth={1} />

            {/* Histogram Bars for Log-MACD */}
            {recentSeries.map((d, i) => {
              const x = 55 + (i / (recentSeries.length - 1)) * 845;
              const h = (Math.abs(d.logMacdBps) / maxLogBps) * 68;
              const y = d.logMacdBps >= 0 ? 240 - h : 240;
              return (
                <rect
                  key={d.index}
                  x={x - 2.5}
                  y={y}
                  width={5}
                  height={Math.max(1, h)}
                  fill={d.logMacdBps >= 0 ? '#10B981' : '#F43F5E'}
                  fillOpacity={0.28}
                />
              );
            })}

            {/* Subtle Scaled SPY Trajectory Overlaid on Bottom Pane */}
            <polyline
              fill="none"
              stroke="#10B981"
              strokeWidth={1.4}
              strokeOpacity={0.38}
              points={recentSeries
                .map((d, i) => {
                  const x = 55 + (i / (recentSeries.length - 1)) * 845;
                  const y = 170 + ((maxPrice - d.close) / priceRange) * 140;
                  return `${x},${y}`;
                })
                .join(' ')}
            />

            {/* Log-MACD Curve */}
            <polyline
              fill="none"
              stroke="#0F172A"
              strokeWidth={2}
              points={recentSeries
                .map((d, i) => {
                  const x = 55 + (i / (recentSeries.length - 1)) * 845;
                  const y = 240 - (d.logMacdBps / maxLogBps) * 68;
                  return `${x},${y}`;
                })
                .join(' ')}
            />

            {/* Weighted Sum of Log-Returns Curve */}
            <polyline
              fill="none"
              stroke="#0284C7"
              strokeWidth={2}
              strokeDasharray="5 3"
              points={recentSeries
                .map((d, i) => {
                  const x = 55 + (i / (recentSeries.length - 1)) * 845;
                  const y = 240 - (d.weightedReturnSumBps / maxLogBps) * 68;
                  return `${x},${y}`;
                })
                .join(' ')}
            />

            {recentSeries.map((d, i) => {
              if (d.index !== selectedPoint.index) return null;
              const x = 55 + (i / (recentSeries.length - 1)) * 845;
              const yTop = 22 + ((maxPrice - d.close) / priceRange) * 110;
              const yBot = 240 - (d.logMacdBps / maxLogBps) * 68;
              return (
                <g key={d.index}>
                  <line
                    x1={x}
                    y1={16}
                    x2={x}
                    y2={318}
                    stroke="#0284C7"
                    strokeWidth={1.2}
                    strokeDasharray="2 2"
                  />
                  <circle cx={x} cy={yTop} r={4} fill="#059669" stroke="#FFFFFF" strokeWidth={1.5} />
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
