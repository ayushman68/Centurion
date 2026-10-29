import React, { useState } from 'react';
import { CenturionProvider } from './context/CenturionContext';
import Navbar from './components/Navbar';
import LiveTickerBar from './components/LiveTickerBar';
import RiskEngineView from './components/RiskEngineView';
import RdbmsExplorerView from './components/RdbmsExplorerView';
import CloudAnalyticsView from './components/CloudAnalyticsView';
import SecurityGovernanceView from './components/SecurityGovernanceView';
import ApiTesterView from './components/ApiTesterView';

function CenturionApp() {
  const [activeTab, setActiveTab] = useState('risk');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
      {/* Top Header & Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Financial Ticker Bar */}
      <LiveTickerBar />

      {/* Main Operational Container */}
      <main style={{
        flex: 1,
        maxWidth: '1720px',
        width: '100%',
        margin: '0 auto',
        padding: '1.25rem 1.5rem'
      }}>
        {activeTab === 'risk' && <RiskEngineView />}
        {activeTab === 'rdbms' && <RdbmsExplorerView />}
        {activeTab === 'cloud' && <CloudAnalyticsView />}
        {activeTab === 'security' && <SecurityGovernanceView />}
        {activeTab === 'api' && <ApiTesterView />}
      </main>

      {/* Enterprise Institutional Footer - Crisp Light Theme */}
      <footer style={{
        background: '#ffffff',
        borderTop: '1px solid var(--border-subtle)',
        padding: '1.15rem 1.5rem',
        marginTop: 'auto',
        fontSize: '0.78rem',
        color: 'var(--text-muted)',
        boxShadow: '0 -1px 3px rgba(15, 23, 42, 0.03)'
      }}>
        <div style={{
          maxWidth: '1720px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <span style={{ fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
              Centurion Institutional Platform
            </span> — Automated Delta-Neutral Micro-Hedging & Real-Time Portfolio Risk Engine
            <div style={{ fontSize: '0.72rem', marginTop: '0.2rem', color: 'var(--text-muted)' }}>
              Basel III / FRTB Market Risk Compliant • SOC 2 Type II Immutable Audit Logging • Zero-Trust Virtual Perimeter
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.74rem' }}>
            <span>Compute: <strong style={{ color: 'var(--text-main)' }}>Python FastAPI (In-Memory BLAS Core)</strong></span>
            <span>•</span>
            <span>Persistence: <strong style={{ color: 'var(--color-primary)' }}>Azure SQL (3NF) + Cosmos DB + Blob</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <CenturionProvider>
      <CenturionApp />
    </CenturionProvider>
  );
}

export default App;

