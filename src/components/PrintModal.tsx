import React, { useRef, useState } from 'react';
import {
  Printer,
  Download,
  X,
  FileText,
  BookOpen,
  Check,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { DashboardTabId, TabManuscript } from './TabManuscript';
import { TabSmaEquivalence } from './TabSmaEquivalence';
import { TabEmaMemory } from './TabEmaMemory';
import { TabLogMacdFilter } from './TabLogMacdFilter';
import { TabLearnedWeights } from './TabLearnedWeights';
import { TabStrategyArchitecture } from './TabStrategyArchitecture';
import { TabSequenceModeling } from './TabSequenceModeling';
import {
  PrintDocumentHeader,
  PrintDocumentFooter,
} from './PrintDocumentHeader';
import { SpyBar, SpyRegimePreset } from '../data/spyData';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: DashboardTabId;
  onSelectTab: (tab: DashboardTabId) => void;
  isPrintingAll: boolean;
  onTogglePrintAll: (printAll: boolean) => void;
  spyBars: SpyBar[];
  selectedIdx: number;
  onSelectIdx: (idx: number) => void;
  regimePreset: SpyRegimePreset;
  activeBar: SpyBar;
  firstBar: SpyBar;
  lastBar: SpyBar;
}

const TABS: {
  id: DashboardTabId;
  tabLabel: string;
  tabNumber: string;
  shortNav: string;
  subtitleTex?: string;
  subtitleText?: string;
}[] = [
  {
    id: 'sma',
    tabLabel: '01. SMA Linear Decay Equivalence',
    tabNumber: '01',
    shortNav: '01. SMA Proof',
    subtitleTex: String.raw`p_t - \text{SMA}_k = \sum (1 - \tfrac{i}{k}) r_i`,
  },
  {
    id: 'ema',
    tabLabel: '02. EMA Geometric Series Memory',
    tabNumber: '02',
    shortNav: '02. EMA Series',
    subtitleTex: String.raw`p_t - \text{EMA}(\alpha) = \sum (1 - \alpha)^k r_k`,
  },
  {
    id: 'macd',
    tabLabel: '03. Log-MACD Band-Pass Wavelet',
    tabNumber: '03',
    shortNav: '03. Log-MACD',
    subtitleTex: String.raw`\sum [(1 - \alpha_S)^k - (1 - \alpha_F)^k] r_k`,
  },
  {
    id: 'learned',
    tabLabel: '04. Learned Return Weights & AR',
    tabNumber: '04',
    shortNav: '04. Return Weights',
    subtitleTex: String.raw`\text{Forecast}_t = \mathbf{W}^T \mathbf{R}_t`,
  },
  {
    id: 'strategy_arch',
    tabLabel: '05. Strategy Architecture & Implementation',
    tabNumber: '05',
    shortNav: '05. Strategy Arch',
    subtitleTex: String.raw`\mathbf{R}_t \to \mathbf{W}^* \to \tanh(\kappa \mathbf{W}^T \mathbf{R}) \to \text{PnL}`,
  },
  {
    id: 'sequence',
    tabLabel: '06. Sequence ML & PatchTST',
    tabNumber: '06',
    shortNav: '06. Sequence ML',
    subtitleTex: String.raw`\tilde{\mathbf{X}}_t \; \& \; \Delta\text{MACD}_{\log, t+H}`,
  },
  {
    id: 'manuscript',
    tabLabel: '07. Full Research Manuscript',
    tabNumber: '07',
    shortNav: '07. Manuscript',
    subtitleText: 'Unabridged Proofs & Literature Survey',
  },
];

const REGIME_LABELS: Record<SpyRegimePreset, string> = {
  full_year: '1Y Real SPY (260d)',
  momentum_rally: "Post-Apr '25 Bull Run",
  microstructure_chop: 'Full 2Y SPY Cycle',
  impulse_shock: '+3.2% Impulse Test',
};

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  isPrintingAll,
  onTogglePrintAll,
  spyBars,
  selectedIdx,
  onSelectIdx,
  regimePreset,
  activeBar,
  firstBar,
  lastBar,
}) => {
  const printContentRef = useRef<HTMLDivElement>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [browserPrintNotice, setBrowserPrintNotice] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentTabMeta =
    TABS.find((t) => t.id === activeTab) || TABS[0];

  const handleTriggerBrowserPrint = () => {
    try {
      window.print();
    } catch (err) {
      console.warn('Browser print blocked or failed:', err);
      setBrowserPrintNotice(true);
    }
  };

  const handleDownloadStandaloneHtml = () => {
    if (!printContentRef.current) return;

    const htmlContent = printContentRef.current.innerHTML;
    const documentTitle = isPrintingAll
      ? 'QuantSignal_SPY_Complete_Monograph_All_Tabs'
      : `QuantSignal_SPY_Section_${currentTabMeta.tabNumber}_${currentTabMeta.id}`;

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isPrintingAll ? 'QuantSignal SPY Complete Monograph' : currentTabMeta.tabLabel}</title>
  <!-- KaTeX Typography Stylesheet -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --font-display: 'Fraunces', Georgia, serif;
      --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace;
    }
    body {
      font-family: var(--font-sans);
      background-color: #ffffff;
      color: #0F172A;
      margin: 0;
      padding: 24px;
      line-height: 1.5;
    }
    h1, h2, h3, .font-display {
      font-family: var(--font-display);
    }
    code, pre, .font-mono, .tabular-nums {
      font-family: var(--font-mono);
      font-variant-numeric: tabular-nums;
    }
    .print-page-break {
      break-after: page;
      page-break-after: always;
      margin-bottom: 32px;
      padding-bottom: 32px;
      border-bottom: 2px dashed #E2E8F0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 11px;
    }
    th, td {
      border: 1px solid #E2E8F0;
      padding: 6px 8px;
    }
    th {
      background-color: #F8FAFC;
    }
    svg {
      max-width: 100%;
      height: auto;
    }
    .no-print, button, input[type="range"] {
      display: none !important;
    }
    @media print {
      body { padding: 0; }
      .print-page-break { border-bottom: none; }
      @page { size: letter portrait; margin: 15mm; }
    }
  </style>
  <script>
    // Automatically open print dialog when opened in a dedicated browser tab
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 400);
    });
  </script>
</head>
<body>
  <div style="max-width: 900px; margin: 0 auto;">
    ${htmlContent}
  </div>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${documentTitle}.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col w-full max-w-5xl h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* ================= MODAL HEADER ================= */}
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/70 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-sky-700 uppercase tracking-wider">
                Publication Print &amp; PDF Export
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-xs font-mono text-slate-500">
                Letter / A4 Document Preview
              </span>
            </div>
            <h2 className="text-lg font-semibold text-slate-900 font-display mt-0.5">
              {isPrintingAll
                ? 'Complete Quantitative Monograph (All 6 Sections)'
                : currentTabMeta.tabLabel}
            </h2>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              type="button"
              onClick={handleTriggerBrowserPrint}
              className="px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-xs"
              title="Trigger browser print dialog (Ctrl+P / Cmd+P)"
            >
              <Printer className="w-3.5 h-3.5 text-sky-400" />
              <span>Print via Browser</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadStandaloneHtml}
              className="px-3.5 py-2 text-xs font-medium text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-2xs"
              title="Save as self-contained printable HTML document (works 100% outside iframe)"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Saved!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download Printable HTML</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors ml-1"
              aria-label="Close print modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ================= TAB SELECTOR TOOLBAR ================= */}
        <div className="px-6 py-2.5 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-slate-500 mr-1">
              Select Document:
            </span>

            {TABS.map((tab) => {
              const isSelected = !isPrintingAll && activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    onTogglePrintAll(false);
                    onSelectTab(tab.id);
                  }}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    isSelected
                      ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tab.shortNav}
                </button>
              );
            })}

            <span className="text-slate-300 mx-1">|</span>

            <button
              type="button"
              onClick={() => onTogglePrintAll(true)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors inline-flex items-center gap-1.5 ${
                isPrintingAll
                  ? 'bg-emerald-700 text-white font-semibold shadow-2xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>All 6 Tabs (Full Monograph)</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-500">
            Target: SPY Close ${activeBar.close.toFixed(2)} ({activeBar.date})
          </div>
        </div>

        {/* Notice banner if browser blocked print */}
        {browserPrintNotice && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-xs text-amber-900 flex items-center justify-between">
            <span>
              <strong>Sandbox Print Notice:</strong> If your browser blocks the print window inside this AI Studio preview frame, click <strong>Download Printable HTML</strong> above to save a self-contained document that opens and prints automatically in any browser tab.
            </span>
            <button
              type="button"
              onClick={() => setBrowserPrintNotice(false)}
              className="text-amber-700 hover:text-amber-900 text-xs ml-3 font-semibold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ================= SCROLLABLE DOCUMENT PREVIEW PANE ================= */}
        <div className="flex-1 bg-slate-200/70 p-4 sm:p-8 overflow-y-auto">
          {/* Paper Sheet */}
          <div
            ref={printContentRef}
            className="bg-white max-w-[860px] mx-auto p-6 sm:p-12 shadow-md border border-slate-300 rounded-lg text-slate-900 space-y-10"
          >
            {isPrintingAll ? (
              /* ================= ALL 6 TABS IN SEQUENCE ================= */
              <div className="space-y-14">
                {/* 01. SMA */}
                <div className="print-page-break">
                  <PrintDocumentHeader
                    tabNumber="01"
                    tabTitle="01. SMA Linear Decay Equivalence"
                    subtitleTex={TABS[0].subtitleTex}
                    inspectedDate={activeBar.date}
                    inspectedClose={activeBar.close}
                    periodStart={firstBar.date}
                    periodEnd={lastBar.date}
                    barCount={spyBars.length}
                    regimeLabel={REGIME_LABELS[regimePreset]}
                  />
                  <TabSmaEquivalence
                    bars={spyBars}
                    selectedIdx={selectedIdx}
                    onSelectIdx={onSelectIdx}
                  />
                  <PrintDocumentFooter tabNumber="01" />
                </div>

                {/* 02. EMA */}
                <div className="print-page-break">
                  <PrintDocumentHeader
                    tabNumber="02"
                    tabTitle="02. EMA Geometric Series Memory"
                    subtitleTex={TABS[1].subtitleTex}
                    inspectedDate={activeBar.date}
                    inspectedClose={activeBar.close}
                    periodStart={firstBar.date}
                    periodEnd={lastBar.date}
                    barCount={spyBars.length}
                    regimeLabel={REGIME_LABELS[regimePreset]}
                  />
                  <TabEmaMemory
                    bars={spyBars}
                    selectedIdx={selectedIdx}
                    onSelectIdx={onSelectIdx}
                  />
                  <PrintDocumentFooter tabNumber="02" />
                </div>

                {/* 03. MACD */}
                <div className="print-page-break">
                  <PrintDocumentHeader
                    tabNumber="03"
                    tabTitle="03. Log-MACD Causal Band-Pass Filter"
                    subtitleTex={TABS[2].subtitleTex}
                    inspectedDate={activeBar.date}
                    inspectedClose={activeBar.close}
                    periodStart={firstBar.date}
                    periodEnd={lastBar.date}
                    barCount={spyBars.length}
                    regimeLabel={REGIME_LABELS[regimePreset]}
                  />
                  <TabLogMacdFilter
                    bars={spyBars}
                    selectedIdx={selectedIdx}
                    onSelectIdx={onSelectIdx}
                  />
                  <PrintDocumentFooter tabNumber="03" />
                </div>

                {/* 04. Learned Weights */}
                <div className="print-page-break">
                  <PrintDocumentHeader
                    tabNumber="04"
                    tabTitle="04. Learned Return Weights & Autoregressive Optimization"
                    subtitleTex={TABS[3].subtitleTex}
                    inspectedDate={activeBar.date}
                    inspectedClose={activeBar.close}
                    periodStart={firstBar.date}
                    periodEnd={lastBar.date}
                    barCount={spyBars.length}
                    regimeLabel={REGIME_LABELS[regimePreset]}
                  />
                  <TabLearnedWeights bars={spyBars} />
                  <PrintDocumentFooter tabNumber="04" />
                </div>

                {/* 05. Strategy Architecture */}
                <div className="print-page-break">
                  <PrintDocumentHeader
                    tabNumber="05"
                    tabTitle="05. Strategy Architecture & Implementation Engine"
                    subtitleTex={TABS[4].subtitleTex}
                    inspectedDate={activeBar.date}
                    inspectedClose={activeBar.close}
                    periodStart={firstBar.date}
                    periodEnd={lastBar.date}
                    barCount={spyBars.length}
                    regimeLabel={REGIME_LABELS[regimePreset]}
                  />
                  <TabStrategyArchitecture bars={spyBars} />
                  <PrintDocumentFooter tabNumber="05" />
                </div>

                {/* 06. Sequence ML */}
                <div className="print-page-break">
                  <PrintDocumentHeader
                    tabNumber="06"
                    tabTitle="06. Multiscale Sequence Tensors & PatchTST"
                    subtitleTex={TABS[5].subtitleTex}
                    inspectedDate={activeBar.date}
                    inspectedClose={activeBar.close}
                    periodStart={firstBar.date}
                    periodEnd={lastBar.date}
                    barCount={spyBars.length}
                    regimeLabel={REGIME_LABELS[regimePreset]}
                  />
                  <TabSequenceModeling bars={spyBars} />
                  <PrintDocumentFooter tabNumber="06" />
                </div>

                {/* 07. Manuscript */}
                <div>
                  <PrintDocumentHeader
                    tabNumber="07"
                    tabTitle="07. Full Quantitative Research Manuscript"
                    subtitleText={TABS[6].subtitleText}
                    inspectedDate={activeBar.date}
                    inspectedClose={activeBar.close}
                    periodStart={firstBar.date}
                    periodEnd={lastBar.date}
                    barCount={spyBars.length}
                    regimeLabel={REGIME_LABELS[regimePreset]}
                  />
                  <TabManuscript onNavigateTab={onSelectTab} />
                  <PrintDocumentFooter tabNumber="07" />
                </div>
              </div>
            ) : (
              /* ================= SINGLE TAB PREVIEW ================= */
              <div>
                <PrintDocumentHeader
                  tabNumber={currentTabMeta.tabNumber}
                  tabTitle={currentTabMeta.tabLabel}
                  subtitleTex={currentTabMeta.subtitleTex}
                  subtitleText={currentTabMeta.subtitleText}
                  inspectedDate={activeBar.date}
                  inspectedClose={activeBar.close}
                  periodStart={firstBar.date}
                  periodEnd={lastBar.date}
                  barCount={spyBars.length}
                  regimeLabel={REGIME_LABELS[regimePreset]}
                />

                {activeTab === 'sma' && (
                  <TabSmaEquivalence
                    bars={spyBars}
                    selectedIdx={selectedIdx}
                    onSelectIdx={onSelectIdx}
                  />
                )}
                {activeTab === 'ema' && (
                  <TabEmaMemory
                    bars={spyBars}
                    selectedIdx={selectedIdx}
                    onSelectIdx={onSelectIdx}
                  />
                )}
                {activeTab === 'macd' && (
                  <TabLogMacdFilter
                    bars={spyBars}
                    selectedIdx={selectedIdx}
                    onSelectIdx={onSelectIdx}
                  />
                )}
                {activeTab === 'learned' && (
                  <TabLearnedWeights bars={spyBars} />
                )}
                {activeTab === 'strategy_arch' && (
                  <TabStrategyArchitecture bars={spyBars} />
                )}
                {activeTab === 'sequence' && (
                  <TabSequenceModeling bars={spyBars} />
                )}
                {activeTab === 'manuscript' && (
                  <TabManuscript onNavigateTab={onSelectTab} />
                )}

                <PrintDocumentFooter tabNumber={currentTabMeta.tabNumber} />
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Bar */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500 shrink-0">
          <div>
            Publication document layout · Formatted with KaTeX mathematical formulas &amp; vector charts
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTriggerBrowserPrint}
              className="text-slate-800 hover:text-slate-900 font-medium inline-flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Trigger Print Dialog</span>
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={handleDownloadStandaloneHtml}
              className="text-sky-700 hover:text-sky-900 font-medium inline-flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5 text-sky-600" />
              <span>Download Printable Document (.html)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
