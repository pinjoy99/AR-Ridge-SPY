import React, { useState } from 'react';
import { SpyBar, computeMultiscaleSequenceTensors } from '../data/spyData';
import { MathFormula } from './MathFormula';
import { Sliders, Layers, Code2, ShieldCheck } from 'lucide-react';

interface TabSequenceModelingProps {
  bars: SpyBar[];
}

export const TabSequenceModeling: React.FC<TabSequenceModelingProps> = ({
  bars,
}) => {
  const [patchLength, setPatchLength] = useState<number>(12);
  const [targetHorizonH, setTargetHorizonH] = useState<number>(5);
  const [selectedPatchIdx, setSelectedPatchIdx] = useState<number>(0);
  const [showCodeModal, setShowCodeModal] = useState<boolean>(false);

  const { tensorRows, noisyAutocorr, smoothAutocorr, patches } =
    computeMultiscaleSequenceTensors(bars, patchLength, targetHorizonH);

  const recentRows = tensorRows.slice(-72);
  const activePatch =
    patches[Math.min(selectedPatchIdx, Math.max(0, patches.length - 1))] ??
    patches[0];

  const minSpyClose = Math.min(...recentRows.map((r) => r.close));
  const maxSpyClose = Math.max(...recentRows.map((r) => r.close));
  const spyCloseRange = Math.max(1e-4, maxSpyClose - minSpyClose);

  const getHeatmapColor = (z: number) => {
    const clamped = Math.max(-2.2, Math.min(2.2, z));
    if (clamped >= 0) {
      const intensity = Math.round((clamped / 2.2) * 100);
      if (intensity > 65) return 'bg-sky-700 text-white';
      if (intensity > 30) return 'bg-sky-500/80 text-white';
      return 'bg-sky-100 text-slate-800';
    } else {
      const intensity = Math.round((Math.abs(clamped) / 2.2) * 100);
      if (intensity > 65) return 'bg-rose-700 text-white';
      if (intensity > 30) return 'bg-rose-500/80 text-white';
      return 'bg-rose-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <div className="text-xs text-slate-500 mb-1">
              <span>05. Institutional Sequence Modeling &amp; PatchTST Feature Engineering</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Section 4 &amp; Turn 10</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Asset: SPY</span>
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 font-display tracking-tight">
              Multiscale Log-MACD Filter Bank (<MathFormula tex={String.raw`\tilde{\mathbf{X}}_t`} />), Smooth Targets &amp; Causal Patching
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              In institutional pipelines, Log-MACD is deployed as a continuous, volatility-normalized multiscale tensor{' '}
              <MathFormula tex={String.raw`\tilde{\mathbf{X}}_t \in \mathbb{R}^{T \times 4}`} className="text-slate-900 font-medium" />{' '}
              that decomposes SPY returns into isolated frequency bands and provides a smooth target{' '}
              <MathFormula
                tex={`y_t = \\text{MACD}_{\\log, t+${targetHorizonH}} - \\text{MACD}_{\\log, t}`}
                className="text-sky-700 font-medium"
              />{' '}
              for sequence models.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowCodeModal(!showCodeModal)}
              className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap flex items-center gap-2 ${
                showCodeModal
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{showCodeModal ? 'Hide Pipeline Code' : 'View PyTorch / LEAN Tensor Code'}</span>
            </button>
          </div>
        </div>

        {/* Sliders & Telemetry */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-6 items-center">
          <div className="md:col-span-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="patch-len-slider" className="font-medium text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-600" />
                <span>PatchTST Sub-Sequence Length (P):</span>
              </label>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                P = {patchLength} trading days
              </span>
            </div>
            <input
              id="patch-len-slider"
              type="range"
              min={6}
              max={16}
              step={2}
              value={patchLength}
              onChange={(e) => {
                setPatchLength(Number(e.target.value));
                setSelectedPatchIdx(0);
              }}
              className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="text-[11px] font-mono text-slate-500">
              {patches.length} causal patches over 96-day SPY window
            </div>
          </div>

          <div className="md:col-span-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="target-h-slider" className="font-medium text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                <span>Smooth Target Forecast Horizon (H):</span>
              </label>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                H = +{targetHorizonH} days
              </span>
            </div>
            <input
              id="target-h-slider"
              type="range"
              min={2}
              max={10}
              step={1}
              value={targetHorizonH}
              onChange={(e) => setTargetHorizonH(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="text-[11px] text-slate-500">
              <MathFormula tex={`y_t = \\text{MACD}_{\\log, t+${targetHorizonH}} - \\text{MACD}_{\\log, t}`} />
            </div>
          </div>

          <div className="md:col-span-4 grid grid-cols-2 gap-4 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
            <div>
              <div className="text-xs text-slate-500">
                Raw <MathFormula tex="r_{t+1}" /> Autocorr <MathFormula tex={String.raw`\rho(1)`} />
              </div>
              <div className="text-lg font-mono font-semibold text-rose-700 tabular-nums mt-0.5">
                {noisyAutocorr.toFixed(3)}
              </div>
              <div className="text-[11px] text-slate-500">
                Chaotic daily gradient noise
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500">
                Smooth <MathFormula tex={String.raw`\Delta\text{MACD}_{\log}`} /> <MathFormula tex={String.raw`\rho(1)`} />
              </div>
              <div className="text-lg font-mono font-semibold text-emerald-700 tabular-nums mt-0.5">
                +{smoothAutocorr.toFixed(3)}
              </div>
              <div className="text-[11px] text-slate-500">
                Smooth loss landscape
              </div>
            </div>
          </div>
        </div>

        {/* Optional Code Drawer */}
        {showCodeModal && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="text-xs font-semibold text-slate-900 mb-2">
              Reference Implementation: Volatility-Normalized Multiscale Log-MACD Tensor &amp; Smooth Target
            </div>
            <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
{`# Institutional Multiscale Log-MACD Feature Bank (X_t) & Smooth Target (y_t)
import numpy as np

def build_spy_multiscale_tensor(spy_close: np.ndarray, scales=[(2,5), (8,21), (21,55), (50,100)], horizon_h=${targetHorizonH}):
    log_p = np.log(spy_close)               # 1. Stationarity Mandate: p_t = ln(P_t)
    r_t = np.diff(log_p, prepend=log_p[0])  # Additive log-returns r_t = p_t - p_{t-1}
    features = []
    for fast_n, slow_n in scales:
        a_f, a_s = 2.0 / (fast_n + 1), 2.0 / (slow_n + 1)
        # Causal band-pass weights: w_k = (1 - a_s)^k - (1 - a_f)^k
        lags = np.arange(1, 120)
        w_k = (1.0 - a_s) ** lags - (1.0 - a_f) ** lags
        macd_log = np.convolve(r_t, w_k, mode='full')[:len(r_t)]
        # 4.2 Cross-Asset Volatility Normalization (mu=0, sigma=1)
        rolling_vol = np.std(macd_log[-slow_n:]) + 1e-8
        features.append(macd_log / rolling_vol)
    X_t = np.stack(features, axis=-1)       # Shape: [T, 4] multiscale frequency tensor
    # 4.3 Smooth Target Engineering: predict forward band-pass momentum shift
    y_smooth = np.roll(features[1], -horizon_h) - features[1]
    return X_t, y_smooth`}
            </pre>
          </div>
        )}
      </div>

      {/* Section 4.1 & 4.2: Multiscale Frequency Bank Heatmap on SPY */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <div className="text-xs text-slate-500">
              4.1 Multiscale Frequency Decomposition &amp; 4.2 Volatility Normalization (<MathFormula tex={String.raw`\mu=0, \sigma=1`} />)
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              SPY Price Trajectory (Top) + 4-Band Stationary Log-MACD Feature Tensor <MathFormula tex={String.raw`\tilde{\mathbf{X}}_t`} /> (Last 72 Trading Days)
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <span className="w-3 h-0.5 bg-emerald-600 inline-block" />
              SPY Close ($)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-rose-600 rounded-xs inline-block" />
              -2.0σ (Bearish Band)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-slate-100 border border-slate-300 rounded-xs inline-block" />
              0.0σ (Neutral)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-sky-600 rounded-xs inline-block" />
              +2.0σ (Bullish Band)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[760px] space-y-2">
            {/* Synchronized SPY Close Price Top Row aligned with the 72 Heatmap Columns */}
            <div className="grid grid-cols-12 items-center gap-3 pb-2 border-b border-slate-100">
              <div className="col-span-3 pr-2">
                <div className="text-xs font-semibold text-emerald-800">
                  SPY Close Price ($)
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  Range: ${minSpyClose.toFixed(2)} – ${maxSpyClose.toFixed(2)}
                </div>
              </div>
              <div className="col-span-9">
                <svg viewBox="0 0 720 64" className="w-full h-16 bg-slate-50/80 rounded-md border border-slate-200/80">
                  <line x1={0} y1={32} x2={720} y2={32} stroke="#E2E8F0" strokeDasharray="3 3" />
                  <polyline
                    fill="none"
                    stroke="#059669"
                    strokeWidth={2}
                    points={recentRows
                      .map((r, idx) => {
                        const x = ((idx + 0.5) / recentRows.length) * 720;
                        const y = 8 + ((maxSpyClose - r.close) / spyCloseRange) * 48;
                        return `${x},${y}`;
                      })
                      .join(' ')}
                  />
                </svg>
              </div>
            </div>

            {[
              {
                label: 'Band 1: Fast (2, 5)',
                desc: 'Microstructure / Short Reversal',
                getter: (r: (typeof recentRows)[0]) => r.bandFast,
              },
              {
                label: 'Band 2: Swing (8, 21)',
                desc: 'Multi-Week Momentum',
                getter: (r: (typeof recentRows)[0]) => r.bandSwing,
              },
              {
                label: 'Band 3: Cycle (21, 55)',
                desc: 'Intermediate Quarterly Trend',
                getter: (r: (typeof recentRows)[0]) => r.bandCycle,
              },
              {
                label: 'Band 4: Macro (50, 100)',
                desc: 'Long-Term Regime Filter',
                getter: (r: (typeof recentRows)[0]) => r.bandMacro,
              },
            ].map((band) => (
              <div
                key={band.label}
                className="grid grid-cols-12 items-center gap-3 py-1"
              >
                <div className="col-span-3 pr-2">
                  <div className="text-xs font-semibold text-slate-900">
                    {band.label}
                  </div>
                  <div className="text-[11px] text-slate-500">{band.desc}</div>
                </div>
                <div className="col-span-9 grid grid-cols-72 gap-0.5">
                  {recentRows.map((row) => {
                    const z = band.getter(row);
                    return (
                      <div
                        key={row.index}
                        title={`${row.date} (SPY $${row.close.toFixed(2)}) · ${band.label}: ${z >= 0 ? '+' : ''}${z.toFixed(2)}σ`}
                        className={`h-7 rounded-[2px] transition-opacity hover:opacity-80 ${getHeatmapColor(
                          z
                        )}`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two-Column Stage: 4.3 Smooth Target Engineering & 4.4 PatchTST Causal Tokenization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 6 Cols: 4.3 Target Engineering (Smooth Target vs Chaotic Raw Return) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <div className="text-xs text-slate-500">
                  4.3 Target Engineering (The Smooth Target)
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  SPY Price (Top) + Noisy <MathFormula tex="r_{t+1}" /> vs. Smooth Target <MathFormula tex={`\\Delta\\text{MACD}_{\\log, t+${targetHorizonH}}`} /> (Bottom)
                </h3>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <svg viewBox="0 0 560 285" className="w-full h-auto select-none">
                {/* ================= TOP PANE: SPY CLOSE PRICE ($) (y: 10..82) ================= */}
                <rect x={40} y={10} width={505} height={72} fill="#F8FAFC" rx={4} />
                {[0, 1].map((frac, idx) => {
                  const y = 18 + frac * 56;
                  const val = maxSpyClose - frac * spyCloseRange;
                  return (
                    <g key={idx}>
                      <line
                        x1={40}
                        y1={y}
                        x2={545}
                        y2={y}
                        stroke="#E2E8F0"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={36}
                        y={y + 3.5}
                        textAnchor="end"
                        className="text-[9px] font-mono fill-slate-500"
                      >
                        ${val.toFixed(0)}
                      </text>
                    </g>
                  );
                })}
                <text
                  x={48}
                  y={24}
                  className="text-[9px] font-mono font-semibold fill-emerald-800"
                >
                  TOP: SPY Close Price ($) Reference
                </text>
                <polyline
                  fill="none"
                  stroke="#059669"
                  strokeWidth={1.8}
                  points={recentRows
                    .map((r, i) => {
                      const x = 44 + (i / (recentRows.length - 1)) * 495;
                      const y = 18 + ((maxSpyClose - r.close) / spyCloseRange) * 56;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                />

                {/* ================= BOTTOM PANE: TARGET COMPARISON (center y=185) ================= */}
                <text
                  x={48}
                  y={104}
                  className="text-[9px] font-mono font-semibold fill-slate-700"
                >
                  BOTTOM: Chaotic 1-Day Return vs. Smooth Forward Target (+{targetHorizonH}d Log-MACD Shift)
                </text>
                <line x1={40} y1={185} x2={545} y2={185} stroke="#CBD5E1" strokeWidth={1} />

                {/* Noisy 1-day return bars */}
                {recentRows.map((r, i) => {
                  const x = 44 + (i / (recentRows.length - 1)) * 495;
                  const normY = Math.max(-1, Math.min(1, r.noisyTargetNextDayBps / 180));
                  const h = Math.abs(normY) * 75;
                  const y = normY >= 0 ? 185 - h : 185;
                  return (
                    <rect
                      key={r.index}
                      x={x - 2}
                      y={y}
                      width={4}
                      height={Math.max(1, h)}
                      fill="#94A3B8"
                      fillOpacity={0.45}
                    />
                  );
                })}

                {/* Smooth Target Curve (MACD_log_{t+H} - MACD_log_t) */}
                <polyline
                  fill="none"
                  stroke="#059669"
                  strokeWidth={2.4}
                  points={recentRows
                    .map((r, i) => {
                      const x = 44 + (i / (recentRows.length - 1)) * 495;
                      const normY = Math.max(
                        -1,
                        Math.min(1, r.smoothTargetMacdDelta / 95)
                      );
                      const y = 185 - normY * 75;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                />
              </svg>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 bg-slate-400/60 inline-block rounded-xs" />
              Gray Bars: Chaotic 1-day log-return <MathFormula tex="r_{t+1}" /> (<MathFormula tex={`\\rho = ${noisyAutocorr.toFixed(2)}`} />)
            </span>
            <span className="flex items-center gap-1.5 font-medium text-emerald-800">
              <span className="w-3 h-0.5 bg-emerald-600 inline-block" />
              Emerald Curve: Smooth <MathFormula tex={`\\Delta\\text{MACD}_{\\log, t+${targetHorizonH}}`} /> (<MathFormula tex={`\\rho = +${smoothAutocorr.toFixed(2)}`} />)
            </span>
          </div>
        </div>

        {/* Right 6 Cols: 4.4 PatchTST Sub-Sequence Patching & Causality */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <div className="text-xs text-slate-500">
                  4.4 Causality &amp; Patching in Transformer Architectures (PatchTST)
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  Causal Sub-Sequence Tokens (Click any patch to inspect tensor)
                </h3>
              </div>
              <span className="text-xs font-mono text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Zero Leakage (<MathFormula tex={String.raw`k \ge 1`} />)
              </span>
            </div>

            {/* Interactive Patch Selector Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {patches.map((p, idx) => {
                const isSelected = idx === selectedPatchIdx;
                return (
                  <button
                    key={p.patchId}
                    type="button"
                    onClick={() => setSelectedPatchIdx(idx)}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      isSelected
                        ? 'bg-sky-50/80 border-sky-600 text-slate-900'
                        : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono font-semibold">
                      <span>Patch #{p.patchId}</span>
                      <span className="text-sky-700">
                        {(p.attentionScore * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5 truncate">
                      {p.startDate.slice(5)} → {p.endDate.slice(5)}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Inspected Patch Tensor Table */}
            {activePatch && (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">
                    Token Patch #{activePatch.patchId} ({activePatch.startDate} to {activePatch.endDate})
                  </span>
                  <span className="font-mono text-slate-500">
                    Shape: [{activePatch.rows.length} × 4]
                  </span>
                </div>
                <div className="max-h-36 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                    <thead className="bg-white text-slate-500 border-b border-slate-100 sticky top-0">
                      <tr>
                        <th className="py-1 px-2.5">Date</th>
                        <th className="py-1 px-2 text-right">Fast(2,5)</th>
                        <th className="py-1 px-2 text-right">Swing(8,21)</th>
                        <th className="py-1 px-2 text-right">Cycle(21,55)</th>
                        <th className="py-1 px-2.5 text-right">Macro(50,100)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activePatch.rows.map((r) => (
                        <tr key={r.index} className="hover:bg-slate-50">
                          <td className="py-1 px-2.5 text-slate-700">{r.date}</td>
                          <td className="py-1 px-2 text-right">{r.bandFast.toFixed(2)}σ</td>
                          <td className="py-1 px-2 text-right text-sky-700 font-medium">
                            {r.bandSwing.toFixed(2)}σ
                          </td>
                          <td className="py-1 px-2 text-right">{r.bandCycle.toFixed(2)}σ</td>
                          <td className="py-1 px-2.5 text-right">{r.bandMacro.toFixed(2)}σ</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-600">
            Because every Log-MACD band relies strictly on historical return lags{' '}
            <MathFormula tex={String.raw`k \ge 1`} className="text-slate-900" />, patch boundaries introduce zero forward-looking data leakage during Transformer training.
          </div>
        </div>
      </div>
    </div>
  );
};
