import React, { useState } from 'react';
import { CenturionProvider } from './context/CenturionContext';
import Navbar from './components/layout/Navbar';
import LiveTickerBar from './components/layout/LiveTickerBar';
import Footer from './components/layout/Footer';
import RiskEngineView from './components/views/RiskEngineView';
import RdbmsExplorerView from './components/views/RdbmsExplorerView';
import CloudAnalyticsView from './components/views/CloudAnalyticsView';
import SecurityGovernanceView from './components/views/SecurityGovernanceView';
import ApiTesterView from './components/views/ApiTesterView';

function CenturionApp() {
  const [activeTab, setActiveTab] = useState('risk');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
      {/* Top Header & Navigation Strip */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Live Financial Ingress Ticker Bar */}
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

      {/* Enterprise Institutional Footer */}
      <Footer />
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
