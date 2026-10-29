import React from 'react';
import { useCenturion } from '../context/CenturionContext';
import { TrendingUp, TrendingDown, Radio, RotateCcw, Database } from 'lucide-react';

const MiniSparkline = ({ data = [], isDown = false }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  const width = 50;
  const height = 18;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const strokeColor = isDown ? '#dc2626' : '#059669';

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

const LiveTickerBar = () => {
  const { tickers, isLiveStreaming, setIsLiveStreaming, resetPortfolioEquity } = useCenturion();

  return (
    <div style={{
      background: '#f8fafc',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '0.45rem 1.5rem',
      fontSize: '0.78rem'
    }}>
      <div style={{
        maxWidth: '1720px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        overflowX: 'auto'
      }}>
        {/* Stream Ingress State */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 'max-content' }}>
          <button
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            className="ent-badge"
            style={{
              background: isLiveStreaming ? 'var(--color-profit-bg)' : 'var(--color-loss-bg)',
              color: isLiveStreaming ? 'var(--color-profit)' : 'var(--color-loss)',
              border: `1px solid ${isLiveStreaming ? 'var(--color-profit-border)' : 'var(--color-loss-border)'}`,
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            <Radio size={12} />
            <span>{isLiveStreaming ? 'COSMOS DB TICK FEED: LIVE' : 'FEED PAUSED'}</span>
          </button>

          <button
            onClick={resetPortfolioEquity}
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: '4px',
              padding: '0.2rem 0.55rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.74rem',
              fontWeight: 600,
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)'
            }}
            title="Reset pricing parameters to baseline benchmarks"
          >
            <RotateCcw size={11} />
            <span>Reset Baseline</span>
          </button>
        </div>

        {/* Ticker Grid */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, justifyContent: 'center', minWidth: 'max-content' }}>
          {Object.entries(tickers).map(([ticker, data]) => {
            const isUp = data.tick_dir === 'up';
            const isDown = data.tick_dir === 'down';

            return (
              <div
                key={ticker}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '6px',
                  background: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.8rem' }}>{ticker}</span>
                  <span className="mono" style={{ 
                    color: isDown ? 'var(--color-loss)' : isUp ? 'var(--color-profit)' : 'var(--text-main)', 
                    fontWeight: 700,
                    fontSize: '0.82rem'
                  }}>
                    ${data.current_price.toFixed(2)}
                  </span>
                </div>

                <MiniSparkline data={data.sparkline} isDown={isDown} />

                <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  σ:{(data.daily_volatility_index * 100).toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Storage Partitioning Meta */}
        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', minWidth: 'max-content', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Database size={12} style={{ color: 'var(--color-primary)' }} />
          <span>Azure Cosmos DB: <code className="mono" style={{ color: 'var(--color-primary)', background: 'var(--color-primary-light)', padding: '0.1rem 0.35rem', borderRadius: '3px', border: '1px solid var(--color-primary-border)' }}>/asset_ticker</code></span>
        </div>
      </div>
    </div>
  );
};

export default LiveTickerBar;

