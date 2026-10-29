import React, { useState } from 'react';
import { useCenturion } from '../../context/CenturionContext';
import { 
  Cloud, 
  BarChart2, 
  Layers, 
  FileText, 
  Download, 
  Database, 
  Code, 
  ShieldCheck,
  Server
} from 'lucide-react';

const CloudAnalyticsView = () => {
  const { portfolio, metrics, hedgingOrders, tickers } = useCenturion();
  const [activeDaxModal, setActiveDaxModal] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Simulated Historical Drawdown Points
  const drawdownHistory = [
    { date: '10:00', nav: 1045000, hwm: 1045000, dd: 0.00 },
    { date: '10:30', nav: 1032000, hwm: 1045000, dd: 1.24 },
    { date: '11:00', nav: 1018000, hwm: 1045000, dd: 2.58 },
    { date: '11:15', nav: 980000,  hwm: 1045000, dd: 6.22 },
    { date: '11:30', nav: metrics.currentEquity, hwm: 1045000, dd: Math.max(0, ((1045000 - metrics.currentEquity) / 1045000) * 100) },
  ];

  const currentDdPct = Math.max(0, ((1045000 - metrics.currentEquity) / 1045000) * 100);

  // Micro-Hedge Cost-Efficiency Score
  const totalNotionalHedged = hedgingOrders.reduce((acc, o) => acc + (o.executed_quantity * o.execution_price), 0);
  const frictionalCost = totalNotionalHedged * 0.00015; // 1.5 bps fee
  const preservedTailLoss = totalNotionalHedged * 0.035; // 3.5% saved
  const efficiencyScore = frictionalCost > 0 ? (preservedTailLoss / frictionalCost).toFixed(1) : '233.3';

  const handleDownloadPdf = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Header Panel */}
      <div className="ent-panel">
        <div className="ent-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: 'var(--color-primary-light)',
              border: '1px solid var(--color-primary-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)'
            }}>
              <Cloud size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                DP-900 Multi-Tier Cloud Persistence & Analytics Architecture
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Structured (Azure SQL) • Semi-Structured (Cosmos DB) • Unstructured (Blob Storage) • Microsoft Power BI
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button
              onClick={() => setActiveDaxModal(true)}
              className="ent-btn ent-btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
            >
              <Code size={14} />
              <span>Inspect DAX Measures</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              className="ent-btn ent-btn-primary"
              style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
            >
              <Download size={14} />
              <span>{downloadSuccess ? 'Statement Exported' : 'Export Basel III Report (PDF)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* DP-900 Multi-Tier Data Storage Topology */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1rem'
      }}>
        {/* Tier 1: Structured Azure SQL */}
        <div className="ent-panel">
          <div className="ent-panel-header">
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>1. Structured Tier (Azure SQL)</span>
            <span className="ent-badge ent-badge-neutral">0.8ms Seek</span>
          </div>
          <div className="ent-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.8rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>
              Master transactional ledger housing account equity, granular positions, and order confirmations with strict ACID isolation.
            </p>
            <div className="code-container" style={{ color: '#93c5fd' }}>
              Service Tier: Azure SQL Business Critical<br/>
              SLA: 99.995% • In-Memory OLTP • TDE Encryption
            </div>
          </div>
        </div>

        {/* Tier 2: Semi-Structured Azure Cosmos DB */}
        <div className="ent-panel">
          <div className="ent-panel-header">
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>2. Semi-Structured (Cosmos DB)</span>
            <span className="ent-badge ent-badge-normal">2.1ms Latency</span>
          </div>
          <div className="ent-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.8rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>
              High-throughput ingestion of raw JSON market feeds. Document-based retrieval with automatic 7-day TTL expiration.
            </p>
            <div className="code-container" style={{ color: '#86efac' }}>
              Partition Key: /asset_ticker (Hot Colocation)<br/>
              Throughput: 12,000 RU/s Autoscale • Core SQL API
            </div>
          </div>
        </div>

        {/* Tier 3: Unstructured Azure Blob Storage */}
        <div className="ent-panel">
          <div className="ent-panel-header">
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>3. Unstructured (Azure Blob)</span>
            <span className="ent-badge ent-badge-caution">WORM Vault</span>
          </div>
          <div className="ent-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.8rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>
              Long-term regulatory archival: signed Basel III PDF risk statements, historical snapshots, and 7-year tamper-evident audit logs.
            </p>
            <div className="code-container" style={{ color: '#fde047' }}>
              Policy: Hot (30d) → Cool (180d) → Archive (7yr)<br/>
              Compliance: BCBS 239 Legal Hold WORM Container
            </div>
          </div>
        </div>
      </div>

      {/* Power BI Analytics Dashboard */}
      <div className="ent-panel">
        <div className="ent-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <BarChart2 size={18} style={{ color: '#d97706' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
              Power BI Embedded Executive Portfolio Analytics
            </span>
          </div>
          <span className="ent-badge ent-badge-neutral">SQL Views: dbo.vw_PortfolioContinuousDrawdown</span>
        </div>

        <div className="ent-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Analytics KPI Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem'
          }}>
            <div className="ent-kpi">
              <div className="ent-kpi-title">Current Peak Drawdown</div>
              <div className="ent-kpi-val" style={{ color: currentDdPct > 5 ? 'var(--color-loss)' : 'var(--color-profit)' }}>
                {currentDdPct.toFixed(2)}%
              </div>
              <div className="ent-kpi-sub">
                Peak NAV: <span className="mono" style={{ color: 'var(--text-main)', fontWeight: 700 }}>${portfolio.peak_equity.toLocaleString()}</span>
              </div>
            </div>

            <div className="ent-kpi">
              <div className="ent-kpi-title">Micro-Hedge Efficiency Ratio</div>
              <div className="ent-kpi-val" style={{ color: 'var(--color-primary)' }}>
                {efficiencyScore}x
              </div>
              <div className="ent-kpi-sub">
                Preserved Capital / Execution Cost
              </div>
            </div>

            <div className="ent-kpi">
              <div className="ent-kpi-title">FRTB Buffer Status</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: metrics.isBreached ? 'var(--color-loss)' : 'var(--color-profit)', marginTop: '0.35rem', letterSpacing: '-0.01em' }}>
                {metrics.isBreached ? 'MARGIN BREACH (HEDGED)' : 'ADEQUATE CAPITAL BUFFER'}
              </div>
              <div className="ent-kpi-sub">
                10-Day VaR: <span className="mono" style={{ color: 'var(--text-main)', fontWeight: 700 }}>${metrics.baselVaR_10d.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          </div>

          {/* Drawdown Timeline Chart */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '1.25rem',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Continuous Drawdown Timeline (High-Water Mark Comparison)
              </span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Analytical View: <code className="mono">dbo.vw_PortfolioContinuousDrawdown</code></span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem', height: '140px', padding: '0.85rem 0', borderBottom: '1px solid var(--border-medium)' }}>
              {drawdownHistory.map((pt, idx) => {
                const heightPct = Math.max(15, 100 - (pt.dd * 10));
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '0.45rem' }}>
                    <span className="mono" style={{ fontSize: '0.74rem', fontWeight: 700, color: pt.dd > 5 ? 'var(--color-loss)' : 'var(--text-secondary)' }}>
                      -{pt.dd.toFixed(1)}%
                    </span>
                    <div style={{
                      width: '100%',
                      maxWidth: '46px',
                      height: `${heightPct}%`,
                      background: pt.dd > 5 ? '#dc2626' : '#1d4ed8',
                      borderRadius: '4px 4px 0 0',
                      boxShadow: '0 2px 4px rgba(15, 23, 42, 0.08)',
                      transition: 'all 0.3s'
                    }} />
                    <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{pt.date}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* DAX Measures Modal */}
      {activeDaxModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div className="ent-panel" style={{ width: '100%', maxWidth: '720px', maxHeight: '85vh', overflowY: 'auto', boxShadow: 'var(--shadow-elevated)' }}>
            <div className="ent-panel-header">
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>Power BI DAX Measure Definitions</span>
              <button onClick={() => setActiveDaxModal(false)} className="ent-btn ent-btn-secondary" style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}>
                Close
              </button>
            </div>

            <div className="ent-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.8rem' }}>
              <div>
                <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>1. Rolling_VaR_99</span>
                <pre className="code-container" style={{ marginTop: '0.35rem' }}>
{`Rolling_VaR_99 = 
VAR TotalEquity = SUM(vw_RollingVaRTrends[total_equity])
VAR ParametricVaR = SUM(vw_RollingVaRTrends[parametric_var_99_1day])
RETURN IF(ISBLANK(ParametricVaR), 0, ParametricVaR)`}
                </pre>
              </div>

              <div>
                <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>2. Max_Drawdown_Percentage</span>
                <pre className="code-container" style={{ marginTop: '0.35rem' }}>
{`Max_Drawdown_Percentage = 
VAR CurrentEquity = SUM(vw_PortfolioContinuousDrawdown[current_equity])
VAR HighWaterMark = SUM(vw_PortfolioContinuousDrawdown[peak_high_water_mark])
VAR Drawdown = DIVIDE(HighWaterMark - CurrentEquity, HighWaterMark, 0)
RETURN FORMAT(Drawdown, "0.00%")`}
                </pre>
              </div>

              <div>
                <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>3. Micro_Hedge_Efficiency_Ratio</span>
                <pre className="code-container" style={{ marginTop: '0.35rem' }}>
{`Micro_Hedge_Efficiency_Ratio = 
VAR PreservedCapital = SUM(vw_MicroHedgeCostEfficiencyScore[estimated_preserved_capital_tail_loss])
VAR FrictionalCost = SUM(vw_MicroHedgeCostEfficiencyScore[total_hedge_frictional_cost])
RETURN DIVIDE(PreservedCapital, FrictionalCost, 1.0)`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CloudAnalyticsView;
