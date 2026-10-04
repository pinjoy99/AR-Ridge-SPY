import React from 'react';
import { MathFormula } from './MathFormula';

interface PrintDocumentHeaderProps {
  tabNumber: string;
  tabTitle: string;
  subtitleTex?: string;
  subtitleText?: string;
  inspectedDate: string;
  inspectedClose: number;
  periodStart: string;
  periodEnd: string;
  barCount: number;
  regimeLabel: string;
}

export const PrintDocumentHeader: React.FC<PrintDocumentHeaderProps> = ({
  tabNumber,
  tabTitle,
  subtitleTex,
  subtitleText,
  inspectedDate,
  inspectedClose,
  periodStart,
  periodEnd,
  barCount,
  regimeLabel,
}) => {
  return (
    <div className="hidden print:block mb-8 pb-4 border-b-2 border-slate-900">
      <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-600 mb-1">
        <span>QuantSignal Research · Quantitative Technical Signal Processing Monograph</span>
        <span>Doc Ref: QS-SPY-SEC{tabNumber}</span>
      </div>
      <div className="flex items-baseline justify-between gap-4 mt-2">
        <h1 className="text-2xl font-bold font-display text-slate-900">
          Section {tabNumber}: {tabTitle}
        </h1>
        <span className="text-xs font-mono text-slate-700 whitespace-nowrap">
          Asset: NYSE:SPY · Close: ${inspectedClose.toFixed(2)}
        </span>
      </div>
      <div className="mt-2 text-sm text-sky-900 font-medium">
        {subtitleTex ? (
          <MathFormula tex={subtitleTex} />
        ) : (
          <span className="font-mono text-xs">{subtitleText}</span>
        )}
      </div>
      <div className="mt-2 pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-mono">
        <span>
          Sample: {periodStart} to {periodEnd} ({barCount} daily bars) · Regime: {regimeLabel}
        </span>
        <span>
          Inspected Target Date: {inspectedDate} · Printed {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
      </div>
    </div>
  );
};

export const PrintDocumentFooter: React.FC<{ tabNumber: string }> = ({ tabNumber }) => {
  return (
    <div className="hidden print:flex items-center justify-between mt-8 pt-3 border-t border-slate-300 text-[10px] font-mono text-slate-500">
      <span>QuantSignal SPY Mathematical Research Group · Equivalence Monograph (Sec {tabNumber})</span>
      <span>Confidential &amp; Proprietary Quantitative Technical Analysis</span>
    </div>
  );
};
