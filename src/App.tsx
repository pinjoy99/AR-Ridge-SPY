/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  generateSpyDataset,
  SpyRegimePreset,
} from './data/spyData';
import { TabSmaEquivalence } from './components/TabSmaEquivalence';
import { TabEmaMemory } from './components/TabEmaMemory';
import { TabLogMacdFilter } from './components/TabLogMacdFilter';
import { TabLearnedWeights } from './components/TabLearnedWeights';
import { TabSequenceModeling } from './components/TabSequenceModeling';
import { TabStrategyArchitecture } from './components/TabStrategyArchitecture';
import { TabManuscript, DashboardTabId, ManuscriptViewMode } from './components/TabManuscript';
import { MathFormula } from './components/MathFormula';
import {
  PrintDocumentHeader,
  PrintDocumentFooter,
} from './components/PrintDocumentHeader';
import { PrintModal } from './components/PrintModal';
import { Download, Printer, ChevronDown, Check, BookOpen, FileText, ArrowUpRight, Library, Sliders, Layers } from 'lucide-react';

const TABS: {
  id: DashboardTabId;
  shortNav: string;
  tabLabel: string;
  tabNumber: string;
  subtitleTex?: string;
  subtitleText?: string;
}[] = [
  {
    id: 'sma',
    shortNav: 'SMA Proof',
    tabLabel: '01. SMA Linear Decay',
    tabNumber: '01',
    subtitleTex: String.raw`p_t - \text{SMA}_k = \sum (1 - \tfrac{i}{k}) r_i`,
  },
  {
    id: 'ema',
    shortNav: 'EMA Series',
    tabLabel: '02. EMA Geometric Series',
    tabNumber: '02',
    subtitleTex: String.raw`p_t - \text{EMA}(\alpha) = \sum (1 - \alpha)^k r_k`,
  },
  {
    id: 'macd',
    shortNav: 'Log-MACD',
    tabLabel: '03. Log-MACD Band-Pass',
    tabNumber: '03',
    subtitleTex: String.raw`\sum [(1 - \alpha_S)^k - (1 - \alpha_F)^k] r_k`,
  },
  {
    id: 'learned',
    shortNav: 'Return Weights',
    tabLabel: '04. Learned Return Weights',
    tabNumber: '04',
    subtitleTex: String.raw`\text{Forecast}_t = \mathbf{W}^T \mathbf{R}_t`,
  },
  {
    id: 'strategy_arch',
    shortNav: 'Strategy Arch',
    tabLabel: '05. Strategy Architecture & Engine',
    tabNumber: '05',
    subtitleTex: String.raw`\mathbf{R}_t \to \mathbf{W}^* \to \tanh(\kappa \mathbf{W}^T \mathbf{R}) \to \text{PnL}`,
  },
  {
    id: 'sequence',
    shortNav: 'Sequence ML',
    tabLabel: '06. Sequence Tensors & PatchTST',
    tabNumber: '06',
    subtitleTex: String.raw`\tilde{\mathbf{X}}_t \; \& \; \Delta\text{MACD}_{\log, t+H}`,
  },
  {
    id: 'manuscript',
    shortNav: 'Manuscript',
    tabLabel: '07. Research Monograph (Parts I & II)',
    tabNumber: '07',
    subtitleText: 'Part I: Return Weights · Part II: PatchTST & Literature Survey',
  },
];

const REGIME_LABELS: Record<SpyRegimePreset, string> = {
  full_year: '1Y Real SPY (260d)',
  momentum_rally: "Post-Apr '25 Bull Run",
  microstructure_chop: 'Full 2Y SPY Cycle',
  impulse_shock: '+3.2% Impulse Test',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<DashboardTabId>('sma');
  const [regimePreset, setRegimePreset] = useState<SpyRegimePreset>('full_year');
  const [selectedIdx, setSelectedIdx] = useState<number>(259);
  const [isPrintMenuOpen, setIsPrintMenuOpen] = useState<boolean>(false);
  const [isPrintingAll, setIsPrintingAll] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [manuscriptViewMode, setManuscriptViewMode] = useState<ManuscriptViewMode>('all');
  const printMenuRef = useRef<HTMLDivElement>(null);

  const spyBars = useMemo(
    () => generateSpyDataset(regimePreset),
    [regimePreset]
  );

  const handleRegimeChange = (nextPreset: SpyRegimePreset) => {
    const nextBars = generateSpyDataset(nextPreset);
    setRegimePreset(nextPreset);
    setSelectedIdx(nextBars.length - 1);
  };

  const activeBar =
    spyBars[Math.min(selectedIdx, spyBars.length - 1)] ??
    spyBars[spyBars.length - 1];

  const firstBar = spyBars[0];
  const lastBar = spyBars[spyBars.length - 1];
  const totalPeriodReturnPct =
    ((lastBar.close / firstBar.close) - 1) * 100;

  const currentTabMeta = useMemo(
    () => TABS.find((t) => t.id === activeTab) || TABS[0],
    [activeTab]
  );

  // Close print menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        printMenuRef.current &&
        !printMenuRef.current.contains(e.target as Node)
      ) {
        setIsPrintMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset print-all mode after print dialog completes
  useEffect(() => {
    const handleAfterPrint = () => {
      setIsPrintingAll(false);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  const handlePrintCurrentTab = (targetId?: DashboardTabId) => {
    setIsPrintMenuOpen(false);
    setIsPrintingAll(false);
    if (targetId && targetId !== activeTab) {
      setActiveTab(targetId);
    }
    // Always open the Print Interface Modal immediately so the user sees the interface
    setIsPrintModalOpen(true);
    // Also synchronously trigger browser print in direct user gesture
    try {
      window.print();
    } catch (e) {
      console.warn('Native window.print was suppressed or blocked by iframe:', e);
    }
  };

  const handlePrintAllTabs = () => {
    setIsPrintMenuOpen(false);
    setIsPrintingAll(true);
    setIsPrintModalOpen(true);
    try {
      window.print();
    } catch (e) {
      console.warn('Native window.print was suppressed or blocked by iframe:', e);
    }
  };

  const handleOpenManuscript = (mode: ManuscriptViewMode = 'all') => {
    setIsPrintingAll(false);
    setActiveTab('manuscript');
    setManuscriptViewMode(mode);
    setTimeout(() => {
      let targetId = 'manuscript-treatise';
      if (mode === 'literature') {
        targetId = 'sec-9';
      } else if (mode === 'part1') {
        targetId = 'sec-1';
      } else if (mode === 'part2') {
        targetId = 'part-2-divider';
      }
      const el =
        document.getElementById(targetId) ||
        document.getElementById('manuscript-treatise') ||
        document.getElementById('tab-viewport');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 60);
  };

  const handleExportCsv = () => {
    const headers = [
      'index',
      'date',
      'spy_close',
      'log_price_ln_p',
      'abs_return_dollars',
      'pct_return',
      'log_return_r_t',
      'realized_vol_20d_pct',
    ];
    const rows = spyBars.map((b) =>
      [
        b.index,
        b.date,
        b.close.toFixed(4),
        b.logPrice.toFixed(6),
        b.absReturn.toFixed(4),
        b.pctReturn.toFixed(6),
        b.logReturn.toFixed(6),
        b.realizedVol20.toFixed(2),
      ].join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SPY_stationary_returns_${regimePreset}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* Top Bar Contract: Strictly 1 row, 3 zones (Brand Wordmark — Nav Links — Primary Actions) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-6 py-3.5 flex items-center justify-between no-print">
        {/* Zone 1: Single text element brand wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('sma');
          }}
          className="text-lg font-semibold tracking-tight text-slate-900 font-display whitespace-nowrap shrink-0"
        >
          QuantSignal SPY
        </a>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-5 text-sm font-medium text-slate-600">
          {TABS.map((tab, idx) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setIsPrintingAll(false);
              }}
              className={`${
                idx >= 6 ? 'hidden 2xl:inline-flex' : idx >= 5 ? 'hidden xl:inline-flex' : 'inline-flex'
              } py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activeTab === tab.id && !isPrintingAll
                  ? 'text-slate-900 border-sky-600 font-semibold'
                  : 'border-transparent hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {tab.shortNav}
            </button>
          ))}
        </nav>

        {/* Zone 3: Primary Actions (Export CSV & Print Document Menu) */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap inline-flex items-center gap-1.5 shadow-2xs"
            title="Download stationary return series as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Print Document Dropdown / Split Action */}
          <div className="relative" ref={printMenuRef}>
            <div className="inline-flex rounded-lg shadow-xs">
              <button
                type="button"
                onClick={() => handlePrintCurrentTab()}
                className="px-3.5 py-2 text-xs font-medium text-white bg-slate-900 rounded-l-lg hover:bg-slate-800 transition-colors whitespace-nowrap inline-flex items-center gap-1.5"
                title={`Print current tab (${currentTabMeta.shortNav}) as complete publication document`}
              >
                <Printer className="w-3.5 h-3.5 text-sky-400" />
                <span>Print Document</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPrintMenuOpen(!isPrintMenuOpen)}
                className="px-2 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 border-l border-slate-700 rounded-r-lg transition-colors inline-flex items-center justify-center"
                aria-label="Open print options menu"
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    isPrintMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>

            {/* Print Options Popover Menu */}
            {isPrintMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-76 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 text-xs">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <div className="font-semibold text-slate-900">Document Print &amp; PDF Export</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Formatted for Letter/A4 with formulas &amp; vector charts
                  </div>
                </div>

                <div className="p-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => handlePrintCurrentTab()}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-start gap-2.5 transition-colors group"
                  >
                    <FileText className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-900 flex items-center gap-1.5">
                        <span>Print Active Tab</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-sky-50 text-sky-700 rounded border border-sky-200">
                          Tab {currentTabMeta.tabNumber}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {currentTabMeta.tabLabel} as a complete standalone memo
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintAllTabs}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-start gap-2.5 transition-colors group"
                  >
                    <BookOpen className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-900 flex items-center gap-1.5">
                        <span>Print Complete Monograph</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                          All 6 Tabs
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        All sections sequentially compiled with clean page breaks
                      </div>
                    </div>
                  </button>
                </div>

                <div className="my-1 border-t border-slate-100" />

                <div className="px-3.5 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Print Specific Section Document:
                </div>

                <div className="p-1 space-y-0.5 max-h-48 overflow-y-auto">
                  {TABS.map((tab) => {
                    const isSelected = activeTab === tab.id && !isPrintingAll;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => handlePrintCurrentTab(tab.id)}
                        className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
                      >
                        <span className="text-slate-800 font-medium truncate">
                          {tab.tabLabel}
                        </span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-sky-600 shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-[1380px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* SPY Benchmark Context & Regime Switcher Bar (Hidden during print) */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 print:hidden">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div className="space-y-1">
              {/* Unboxed quiet metadata with typographic separators */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 font-mono tabular-nums">
                <span className="font-sans font-semibold text-slate-800">
                  SPDR S&amp;P 500 ETF Trust (NYSE: SPY)
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {spyBars.length} Daily Bars ({firstBar.date} to {lastBar.date})
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-700 font-semibold">
                  Last Close: ${lastBar.close.toFixed(2)} ({lastBar.date})
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Period Change: {totalPeriodReturnPct >= 0 ? '+' : ''}
                  {totalPeriodReturnPct.toFixed(2)}%
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Inspected Date: {activeBar.date} (Close ${activeBar.close.toFixed(2)} /{' '}
                  <MathFormula tex={String.raw`p_t = \ln(P_t) = ${activeBar.logPrice.toFixed(4)}`} /> /{' '}
                  <MathFormula tex={String.raw`r_t = ${(activeBar.logReturn * 10000).toFixed(1)}\text{ bps}`} />)
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 font-display tracking-tight">
                Moving Averages vs. Weighted Sums of Stationary Returns on SPY
              </h1>
            </div>

            {/* Interactive SPY Market Regime Filter Control & In-Card Print Action */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
              <div className="flex flex-col sm:items-end gap-1.5">
                <span className="text-xs font-medium text-slate-500">
                  Historical SPY Window &amp; Regime
                </span>
                <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
                  {[
                    { id: 'full_year', label: '1Y Real SPY (260d)' },
                    { id: 'momentum_rally', label: "Post-Apr '25 Bull Run" },
                    { id: 'microstructure_chop', label: 'Full 2Y SPY Cycle' },
                    { id: 'impulse_shock', label: '+3.2% Impulse Test' },
                  ].map((reg) => (
                    <button
                      key={reg.id}
                      type="button"
                      onClick={() => handleRegimeChange(reg.id as SpyRegimePreset)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                        regimePreset === reg.id
                          ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {reg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Direct In-Card Print Button */}
              <button
                type="button"
                onClick={() => handlePrintCurrentTab()}
                className="mt-3 sm:mt-5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                title="Print current tab as document"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Print {currentTabMeta.shortNav}</span>
              </button>
            </div>
          </div>

          {/* Interactive 7-Tab Workspace Switcher */}
          <div className="mt-5 pt-4 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id && !isPrintingAll;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsPrintingAll(false);
                  }}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50/80 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="text-xs font-semibold whitespace-nowrap truncate">
                    {tab.tabLabel}
                  </div>
                  <div
                    className={`text-[11px] mt-1 whitespace-nowrap truncate ${
                      isActive ? 'text-sky-300' : 'text-slate-500'
                    }`}
                  >
                    {tab.subtitleTex ? (
                      <MathFormula tex={tab.subtitleTex} />
                    ) : (
                      <span className="font-mono">{tab.subtitleText}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Print Viewport: Either Single Current Tab OR Sequential Complete Monograph */}
        {isPrintingAll ? (
          /* ================= COMPLETE 7-PART MONOGRAPH PRINT VIEW ================= */
          <div className="space-y-12">
            {/* Section 01 */}
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
                onSelectIdx={setSelectedIdx}
              />
              <PrintDocumentFooter tabNumber="01" />
            </div>

            {/* Section 02 */}
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
                onSelectIdx={setSelectedIdx}
              />
              <PrintDocumentFooter tabNumber="02" />
            </div>

            {/* Section 03 */}
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
                onSelectIdx={setSelectedIdx}
              />
              <PrintDocumentFooter tabNumber="03" />
            </div>

            {/* Section 04 */}
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

            {/* Section 05 */}
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

            {/* Section 06 */}
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

            {/* Section 07 */}
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
              <TabManuscript
                onNavigateTab={setActiveTab}
                onOpenPrint={() => handlePrintCurrentTab('manuscript')}
                initialViewMode={manuscriptViewMode}
                onViewModeChange={setManuscriptViewMode}
              />
              <PrintDocumentFooter tabNumber="07" />
            </div>
          </div>
        ) : (
          /* ================= SINGLE TAB PRINT & INTERACTIVE VIEW ================= */
          <section id="tab-viewport" aria-live="polite" className="scroll-mt-20">
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
                onSelectIdx={setSelectedIdx}
              />
            )}
            {activeTab === 'ema' && (
              <TabEmaMemory
                bars={spyBars}
                selectedIdx={selectedIdx}
                onSelectIdx={setSelectedIdx}
              />
            )}
            {activeTab === 'macd' && (
              <TabLogMacdFilter
                bars={spyBars}
                selectedIdx={selectedIdx}
                onSelectIdx={setSelectedIdx}
              />
            )}
            {activeTab === 'learned' && <TabLearnedWeights bars={spyBars} />}
            {activeTab === 'strategy_arch' && <TabStrategyArchitecture bars={spyBars} />}
            {activeTab === 'sequence' && <TabSequenceModeling bars={spyBars} />}
            {activeTab === 'manuscript' && (
              <TabManuscript
                onNavigateTab={setActiveTab}
                onOpenPrint={() => handlePrintCurrentTab('manuscript')}
                initialViewMode={manuscriptViewMode}
                onViewModeChange={setManuscriptViewMode}
              />
            )}

            <PrintDocumentFooter tabNumber={currentTabMeta.tabNumber} />
          </section>
        )}
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 py-4 mt-12 no-print">
        <div className="max-w-[1380px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            Quantitative Signal Processing &amp; Stationary Return Weighting Lab · SPY Benchmark Reference
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => handlePrintCurrentTab()}
              className="hover:text-slate-900 transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>Print {currentTabMeta.shortNav}</span>
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => handleOpenManuscript('part1')}
              className="hover:text-slate-900 transition-colors inline-flex items-center gap-1.5 font-medium text-slate-700 hover:text-sky-700 group cursor-pointer"
              title="Jump to Part I: Sections 01–05 (up to Return Weights)"
            >
              <Sliders className="w-3.5 h-3.5 text-sky-600 group-hover:scale-110 transition-transform" />
              <span>Part I: Return Weights (Sec 01–05)</span>
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => handleOpenManuscript('part2')}
              className="hover:text-slate-900 transition-colors inline-flex items-center gap-1.5 font-medium text-slate-700 hover:text-indigo-700 group cursor-pointer"
              title="Jump to Part II: Sections 06–09 (Multiscale, PatchTST, Wavelets & Survey)"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
              <span>Part II: Multiscale &amp; PatchTST (Sec 06–09)</span>
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => handleOpenManuscript('literature')}
              className="hover:text-slate-900 transition-colors inline-flex items-center gap-1.5 font-medium text-emerald-700 hover:text-emerald-800 group cursor-pointer"
              title="Jump directly to Section 09: Academic Literature Survey & Citations"
            >
              <Library className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span>Literature Survey (Sec 09)</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={handleExportCsv}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Download SPY CSV
            </button>
          </div>
        </div>
      </footer>

      {/* Publication Print & PDF Export Document Modal Interface */}
      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isPrintingAll={isPrintingAll}
        onTogglePrintAll={setIsPrintingAll}
        spyBars={spyBars}
        selectedIdx={selectedIdx}
        onSelectIdx={setSelectedIdx}
        regimePreset={regimePreset}
        activeBar={activeBar}
        firstBar={firstBar}
        lastBar={lastBar}
      />
    </div>
  );
}
