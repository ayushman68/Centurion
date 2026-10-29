import React from 'react';
import { useCenturion } from '../../context/CenturionContext';
import { 
  Shield, 
  Activity, 
  Database, 
  BarChart2, 
  Lock, 
  Terminal, 
  AlertTriangle,
  User
} from 'lucide-react';

const Navbar = ({ activeTab, setActiveTab }) => {
  const { currentRole, setCurrentRole, latencyMs, simulateFlashCrash } = useCenturion();

  const navItems = [
    { id: 'risk', label: 'Portfolio Risk & VaR Engine', icon: Activity },
    { id: 'rdbms', label: '3NF Relational Database', icon: Database },
    { id: 'cloud', label: 'Cloud & Power BI Analytics', icon: BarChart2 },
    { id: 'security', label: 'Zero-Trust Security & Audit', icon: Lock },
    { id: 'api', label: 'REST API Console', icon: Terminal },
  ];

  return (
    <header style={{
      background: '#ffffff',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
    }}>
      {/* Top Utility & Operational Meta Bar */}
      <div style={{
        padding: '0.75rem 1.5rem',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        maxWidth: '1720px',
        margin: '0 auto'
      }}>
        {/* Left: Brand & Desk Identification */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
            boxShadow: '0 2px 4px rgba(29, 78, 216, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff'
          }}>
            <Shield size={20} strokeWidth={2.2} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ 
                fontFamily: 'var(--font-display)', 
                fontSize: '1.2rem', 
                fontWeight: 800, 
                color: 'var(--text-main)', 
                letterSpacing: '-0.03em',
                lineHeight: 1.1
              }}>
                CENTURION<span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>.RISK</span>
              </span>
              <span className="ent-badge ent-badge-blue" style={{ fontSize: '0.68rem', padding: '0.15rem 0.55rem' }}>
                FRTB / BASEL III
              </span>
            </div>
            <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.15rem' }}>
              <span>Desk: Quantitative Macro Fund [ACC-001]</span>
              <span>•</span>
              <span style={{ color: 'var(--color-profit)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669' }} />
                PROD-US-EAST ({latencyMs}ms Sync Core)
              </span>
            </div>
          </div>
        </div>

        {/* Right: Market Shock Test & Role Profile Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* Market Tail Shock Simulator */}
          <button
            onClick={simulateFlashCrash}
            className="ent-btn ent-btn-danger"
            style={{ padding: '0.42rem 0.85rem', fontSize: '0.78rem' }}
            title="Inject stochastic multi-asset tail shock to evaluate automated hedging sentry"
          >
            <AlertTriangle size={14} />
            <span>Simulate Market Shock</span>
          </button>

          {/* User Persona & Role Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: '#f8fafc',
            border: '1px solid var(--border-medium)',
            padding: '0.35rem 0.75rem',
            borderRadius: '6px'
          }}>
            <User size={14} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>Role:</span>
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              className="ent-select"
              style={{
                fontSize: '0.78rem',
                padding: '0.15rem 0.4rem',
                border: 'none',
                background: 'transparent',
                fontWeight: 700,
                color: 'var(--text-main)',
                boxShadow: 'none'
              }}
            >
              <option value="Risk_Officer" style={{ background: '#ffffff', color: '#0f172a' }}>Risk_Officer (Supervisor)</option>
              <option value="Portfolio_Manager" style={{ background: '#ffffff', color: '#0f172a' }}>Portfolio_Manager (Desk)</option>
              <option value="Auditor" style={{ background: '#ffffff', color: '#0f172a' }}>Auditor (Read-Only)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Secondary Navigation Tab Bar (Clean Enterprise Tab Strip) */}
      <div style={{
        maxWidth: '1720px',
        margin: '0 auto',
        padding: '0 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
        overflowX: 'auto'
      }}>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.825rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                letterSpacing: '-0.01em'
              }}
            >
              <Icon size={15} style={{ color: isActive ? 'var(--color-primary)' : 'var(--text-muted)' }} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};

export default Navbar;

