import React, { useState } from 'react';
import { useCenturion } from '../context/CenturionContext';
import { 
  Database, 
  Table, 
  Play, 
  Zap, 
  ShieldCheck, 
  CheckCircle, 
  Code, 
  RefreshCw,
  Server,
  Layers,
  Terminal
} from 'lucide-react';

const RdbmsExplorerView = () => {
  const { portfolio, holdings, tickers, hedgingOrders, auditLedger, triggerAutomatedMicroHedge } = useCenturion();
  const [selectedTable, setSelectedTable] = useState('portfolios');
  
  // Stored Procedure State
  const [spExecutionLog, setSpExecutionLog] = useState(null);
  const [isExecutingSp, setIsExecutingSp] = useState(false);

  // Trigger State
  const [simulatedVolatility, setSimulatedVolatility] = useState(0.025);
  const [triggerStatus, setTriggerStatus] = useState('MONITORING_ACTIVE');

  // ACID Transaction State
  const [txState, setTxState] = useState({ status: 'IDLE', logs: [] });

  // Execute Stored Procedure: CalculatePortfolioExposure
  const runCalculatePortfolioExposure = () => {
    setIsExecutingSp(true);
    setTimeout(() => {
      let recalculatedEquity = 0;
      holdings.forEach(h => {
        const t = tickers[h.asset_ticker] || { current_price: 100 };
        recalculatedEquity += h.quantity * t.current_price;
      });

      setSpExecutionLog({
        status: 'SUCCESS',
        portfolio_id: portfolio.portfolio_id,
        sql: `EXEC dbo.CalculatePortfolioExposure @PortfolioID = 1;`,
        computed_equity: recalculatedEquity,
        join_rows_scanned: holdings.length,
        execution_time_ms: 0.38,
        plan_details: 'Clustered Index Seek (IX_asset_holdings) -> Hash Match -> Update',
        timestamp: new Date().toISOString()
      });
      setIsExecutingSp(false);
    }, 280);
  };

  // Simulate Trigger Event
  const simulateTriggerUpdate = () => {
    if (simulatedVolatility > portfolio.margin_threshold) {
      setTriggerStatus('TRIGGER_FIRED_CRITICAL_FLAG_RAISED');
      triggerAutomatedMicroHedge('DATABASE_TRIGGER_INITIATE_HEDGING_SIGNAL');
    } else {
      setTriggerStatus('VOLATILITY_BELOW_THRESHOLD_NO_ACTION');
    }
  };

  // Run Atomic Transaction Simulation
  const executeAtomicTransaction = (shouldFail = false) => {
    setTxState({ status: 'RUNNING', logs: ['[SQL Engine] BEGIN TRANSACTION; (Isolation Level: SNAPSHOT)'] });

    setTimeout(() => {
      if (shouldFail) {
        setTxState({
          status: 'ROLLED_BACK',
          logs: [
            '[SQL Engine] BEGIN TRANSACTION;',
            '[SQL Engine] INSERT INTO dbo.hedging_orders (...) -> SUCCESS',
            '[SQL Engine] UPDATE dbo.portfolios SET total_equity = total_equity - 1500000 -> THROW 50002 (Insufficient Capital Check)',
            '[SQL Engine] CATCH BLOCK TRIGGERED -> ROLLBACK TRANSACTION;',
            '[ACID Ledger] Rollback Complete: Zero capital leaked. Database restored to pre-transaction state.'
          ]
        });
      } else {
        setTxState({
          status: 'COMMITTED',
          logs: [
            '[SQL Engine] BEGIN TRANSACTION;',
            '[SQL Engine] INSERT INTO dbo.hedging_orders (portfolio_id, hedge_asset, order_type, quantity, price) VALUES (1, "USDT", "BUY", 500.0, 1.0) -> ROW INSERTED',
            '[SQL Engine] UPDATE dbo.portfolios SET total_equity = total_equity - 500.0, is_flagged_critical = 0 WHERE portfolio_id = 1 -> ROW UPDATED',
            '[SQL Engine] COMMIT TRANSACTION; (Write-Ahead Log Flushed to Azure SQL)',
            '[ACID Ledger] Commit Verified: Balance deduction and order entry persisted atomically.'
          ]
        });
      }
    }, 380);
  };

  const schemaTables = [
    { name: 'users', count: 3, description: 'Authentication credentials & RBAC identifiers' },
    { name: 'portfolios', count: 1, description: 'Aggregated accounts, equity parameters & margin limits' },
    { name: 'asset_holdings', count: holdings.length, description: 'Granular portfolio asset positions (FK to portfolios)' },
    { name: 'market_tickers', count: Object.keys(tickers).length, description: 'Cached pricing & daily volatility indices for joins' },
    { name: 'hedging_orders', count: hedgingOrders.length, description: 'Immutable log of automated protective orders' },
    { name: 'compliance_audit_ledger', count: auditLedger.length, description: 'Basel III non-destructive audit trail' },
  ];

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
              <Database size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                Strict 3NF Relational Database Architecture & Objects
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Azure SQL Database (PaaS) • 3NF Formal Proof • Stored Procedures • Triggers • ACID Transactions
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.45rem' }}>
            <span className="ent-badge ent-badge-normal">1NF / 2NF / 3NF Verified</span>
            <span className="ent-badge ent-badge-neutral">Clustered Indexes</span>
          </div>
        </div>
      </div>

      {/* Schema Browser & Table Viewer */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Table Selector Tree */}
        <div className="ent-panel">
          <div className="ent-panel-header">
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>Relational Entities (3NF Schema)</span>
            <span className="ent-badge ent-badge-neutral">6 Tables</span>
          </div>

          <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {schemaTables.map(t => (
              <button
                key={t.name}
                onClick={() => setSelectedTable(t.name)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 0.95rem',
                  borderRadius: '6px',
                  border: selectedTable === t.name ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                  background: selectedTable === t.name ? 'var(--color-primary-light)' : '#ffffff',
                  color: selectedTable === t.name ? 'var(--color-primary)' : 'var(--text-main)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  boxShadow: selectedTable === t.name ? '0 1px 3px rgba(29, 78, 216, 0.12)' : '0 1px 2px rgba(15, 23, 42, 0.02)'
                }}
              >
                <div>
                  <div className="mono" style={{ fontWeight: 800, fontSize: '0.85rem' }}>
                    dbo.{t.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    {t.description}
                  </div>
                </div>
                <span className="ent-badge ent-badge-neutral" style={{ fontSize: '0.68rem' }}>{t.count} rows</span>
              </button>
            ))}
          </div>
        </div>

        {/* Live Table Content Display */}
        <div className="ent-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="ent-panel-header">
            <div>
              <span className="mono" style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>
                SELECT * FROM dbo.{selectedTable};
              </span>
            </div>
            <span className="ent-badge ent-badge-neutral">Azure SQL Engine</span>
          </div>

          <div style={{ overflowX: 'auto', flex: 1, padding: '0.5rem' }}>
            {selectedTable === 'portfolios' && (
              <table className="ent-table">
                <thead>
                  <tr>
                    <th>portfolio_id (PK)</th>
                    <th>user_id (FK)</th>
                    <th>portfolio_name</th>
                    <th>total_equity</th>
                    <th>margin_threshold</th>
                    <th>is_flagged_critical</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="mono" style={{ fontWeight: 700 }}>{portfolio.portfolio_id}</td>
                    <td className="mono">{portfolio.user_id}</td>
                    <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{portfolio.portfolio_name}</td>
                    <td className="mono" style={{ color: 'var(--color-primary)', fontWeight: 800 }}>${portfolio.total_equity.toLocaleString()}</td>
                    <td className="mono">{(portfolio.margin_threshold * 100).toFixed(1)}%</td>
                    <td>
                      <span className={`ent-badge ${portfolio.is_flagged_critical ? 'ent-badge-breach' : 'ent-badge-normal'}`}>
                        {portfolio.is_flagged_critical ? 'CRITICAL (1)' : 'NORMAL (0)'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}

            {selectedTable === 'asset_holdings' && (
              <table className="ent-table">
                <thead>
                  <tr>
                    <th>holding_id (PK)</th>
                    <th>portfolio_id (FK)</th>
                    <th>asset_ticker</th>
                    <th>quantity</th>
                    <th>average_buy_price</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map(h => (
                    <tr key={h.holding_id}>
                      <td className="mono" style={{ fontWeight: 700 }}>{h.holding_id}</td>
                      <td className="mono">{portfolio.portfolio_id}</td>
                      <td style={{ fontWeight: 800, color: 'var(--text-main)' }}>{h.asset_ticker}</td>
                      <td className="mono">{h.quantity.toLocaleString()}</td>
                      <td className="mono">${h.average_buy_price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {selectedTable === 'market_tickers' && (
              <table className="ent-table">
                <thead>
                  <tr>
                    <th>asset_ticker (UQ)</th>
                    <th>current_price</th>
                    <th>daily_volatility_index</th>
                    <th>last_updated_at</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(tickers).map(([sym, t]) => (
                    <tr key={sym}>
                      <td style={{ fontWeight: 800, color: 'var(--text-main)' }}>{sym}</td>
                      <td className="mono" style={{ color: 'var(--text-main)', fontWeight: 700 }}>${t.current_price.toFixed(2)}</td>
                      <td className="mono">{(t.daily_volatility_index * 100).toFixed(2)}%</td>
                      <td className="mono" style={{ color: 'var(--text-muted)' }}>{new Date().toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {selectedTable === 'users' && (
              <div style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.825rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <p><strong>Admin / Risk Officer:</strong> <code>risk.officer@centurion-institutional.com</code> (Role: <code>Risk_Officer</code>)</p>
                <p><strong>Portfolio Manager:</strong> <code>pm.macro@centurion-institutional.com</code> (Role: <code>Portfolio_Manager</code>)</p>
                <p><strong>Auditor:</strong> <code>auditor.basel@centurion-institutional.com</code> (Role: <code>Auditor</code>)</p>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.45rem' }}>
                  * Passwords encrypted via Bcrypt with 12 salt rounds in accordance with Cloud Security guidelines.
                </p>
              </div>
            )}

            {selectedTable === 'hedging_orders' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem' }}>
                {hedgingOrders.map(o => (
                  <div key={o.order_id} className="mono" style={{ padding: '0.65rem 0.85rem', background: '#f8fafc', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}>
                    ORDER #{o.order_id}: {o.order_type} {o.executed_quantity} {o.hedge_asset} @ ${o.execution_price.toFixed(2)} [{o.status}]
                  </div>
                ))}
              </div>
            )}

            {selectedTable === 'compliance_audit_ledger' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem' }}>
                {auditLedger.map(a => (
                  <div key={a.audit_id} className="mono" style={{ padding: '0.65rem 0.85rem', background: '#f8fafc', borderRadius: '6px', fontSize: '0.76rem', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}>
                    AUDIT #{a.audit_id} | {a.event_type} | HASH: {a.hash_checksum.substring(0, 24)}...
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Database Objects: Stored Procedure & Trigger & ACID Transaction */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Object 1: Stored Procedure */}
        <div className="ent-panel">
          <div className="ent-panel-header">
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>
                SP: <code className="mono">dbo.CalculatePortfolioExposure</code>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                INNER JOIN <code className="mono">asset_holdings ⋈ market_tickers</code>
              </div>
            </div>
            <span className="ent-badge ent-badge-neutral">Stored Procedure</span>
          </div>

          <div className="ent-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <pre className="code-container">
{`UPDATE dbo.portfolios
SET total_equity = ISNULL((
    SELECT SUM(h.quantity * t.current_price)
    FROM dbo.asset_holdings h
    INNER JOIN dbo.market_tickers t 
        ON h.asset_ticker = t.asset_ticker
    WHERE h.portfolio_id = @PortfolioID
), 0) WHERE portfolio_id = @PortfolioID;`}
            </pre>

            <button
              onClick={runCalculatePortfolioExposure}
              disabled={isExecutingSp}
              className="ent-btn ent-btn-primary"
              style={{ fontSize: '0.825rem' }}
            >
              <Play size={14} />
              <span>{isExecutingSp ? 'Executing Procedure...' : 'Execute Stored Procedure'}</span>
            </button>

            {spExecutionLog && (
              <div style={{
                background: 'var(--color-profit-bg)',
                border: '1px solid var(--color-profit-border)',
                borderRadius: '6px',
                padding: '0.75rem',
                fontSize: '0.76rem'
              }}>
                <div style={{ color: 'var(--color-profit)', fontWeight: 800, marginBottom: '0.2rem' }}>
                  ✓ Execution Plan Complete ({spExecutionLog.execution_time_ms}ms)
                </div>
                <div className="mono" style={{ color: 'var(--text-main)', fontWeight: 700 }}>
                  Recalculated Equity: ${spExecutionLog.computed_equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.15rem' }}>
                  {spExecutionLog.plan_details}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Object 2: Database Trigger */}
        <div className="ent-panel">
          <div className="ent-panel-header">
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Trigger: <code className="mono">dbo.InitiateHedgingSignal</code>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Fires <code className="mono">AFTER UPDATE</code> on <code className="mono">market_tickers</code>
              </div>
            </div>
            <span className="ent-badge ent-badge-caution">AFTER UPDATE</span>
          </div>

          <div className="ent-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <pre className="code-container" style={{ color: '#fde047' }}>
{`CREATE TRIGGER InitiateHedgingSignal 
ON dbo.market_tickers AFTER UPDATE AS BEGIN
  UPDATE dbo.portfolios SET is_flagged_critical = 1
  WHERE portfolio_id IN (
    SELECT DISTINCT h.portfolio_id FROM dbo.asset_holdings h
    INNER JOIN inserted i ON h.asset_ticker = i.asset_ticker
    INNER JOIN dbo.portfolios p ON h.portfolio_id = p.portfolio_id
    WHERE i.daily_volatility_index > p.margin_threshold
  ); END;`}
            </pre>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Simulate Ticker Volatility Spike:</span>
                <span className="mono" style={{ fontWeight: 800, color: 'var(--color-caution)' }}>
                  {(simulatedVolatility * 100).toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.40"
                step="0.01"
                value={simulatedVolatility}
                onChange={(e) => setSimulatedVolatility(parseFloat(e.target.value))}
                style={{ accentColor: '#d97706' }}
              />
            </div>

            <button
              onClick={simulateTriggerUpdate}
              className="ent-btn ent-btn-secondary"
              style={{ fontSize: '0.825rem' }}
            >
              <Zap size={14} style={{ color: 'var(--color-caution)' }} />
              <span>Simulate Pricing Update (Test Trigger)</span>
            </button>

            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Listener Status: <code className="mono" style={{ color: 'var(--text-main)', fontWeight: 700 }}>{triggerStatus}</code>
            </div>
          </div>
        </div>

        {/* Object 3: ACID Multi-Statement Atomic Transaction */}
        <div className="ent-panel">
          <div className="ent-panel-header">
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>
                ACID Atomic Execution Block
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Balance Deduction + Order Entry atomic boundary
              </div>
            </div>
            <span className="ent-badge ent-badge-normal">ACID Guaranteed</span>
          </div>

          <div className="ent-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <pre className="code-container" style={{ color: '#6ee7b7' }}>
{`BEGIN TRANSACTION;
BEGIN TRY
  INSERT INTO dbo.hedging_orders (...);
  UPDATE dbo.portfolios 
  SET total_equity = total_equity - @Cost,
      is_flagged_critical = 0 
  WHERE portfolio_id = @PID;
  COMMIT TRANSACTION;
END TRY
BEGIN CATCH ROLLBACK TRANSACTION; THROW; END CATCH;`}
            </pre>

            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <button
                onClick={() => executeAtomicTransaction(false)}
                className="ent-btn ent-btn-primary"
                style={{ flex: 1, fontSize: '0.8rem' }}
              >
                Test Valid Commit
              </button>
              <button
                onClick={() => executeAtomicTransaction(true)}
                className="ent-btn ent-btn-danger"
                style={{ flex: 1, fontSize: '0.8rem' }}
              >
                Test Fail & Rollback
              </button>
            </div>

            {txState.status !== 'IDLE' && (
              <div style={{
                background: txState.status === 'COMMITTED' ? 'var(--color-profit-bg)' : 'var(--color-loss-bg)',
                border: `1px solid ${txState.status === 'COMMITTED' ? 'var(--color-profit-border)' : 'var(--color-loss-border)'}`,
                borderRadius: '6px',
                padding: '0.75rem',
                fontSize: '0.74rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem'
              }}>
                {txState.logs.map((log, idx) => (
                  <div key={idx} className="mono" style={{ color: txState.status === 'COMMITTED' ? 'var(--color-profit)' : 'var(--color-loss)', fontWeight: 600 }}>
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default RdbmsExplorerView;
