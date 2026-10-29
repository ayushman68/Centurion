import React, { createContext, useContext, useState, useEffect } from 'react';

const CenturionContext = createContext();

export const useCenturion = () => useContext(CenturionContext);

export const CenturionProvider = ({ children }) => {
  // Current Active Role: 'Risk_Officer' | 'Portfolio_Manager' | 'Auditor'
  const [currentRole, setCurrentRole] = useState('Risk_Officer');

  // Active Portfolio State (aligned with schema.sql 3NF portfolios table)
  const [portfolio, setPortfolio] = useState({
    portfolio_id: 1,
    user_id: 1,
    portfolio_name: 'Centurion Quantitative Macro Alpha [ACC-001]',
    total_equity: 1000000.00,
    peak_equity: 1045000.00,
    margin_threshold: 0.1500, // 15% risk threshold
    is_flagged_critical: false,
    sentry_armed: true,
    delta_imbalance: 0.12, // Net portfolio delta sensitivity
  });

  // Asset Holdings (aligned with schema.sql asset_holdings table)
  const [holdings, setHoldings] = useState([
    { holding_id: 1, asset_ticker: 'AAPL', quantity: 2500, average_buy_price: 175.00, sector: 'Technology' },
    { holding_id: 2, asset_ticker: 'MSFT', quantity: 1200, average_buy_price: 400.00, sector: 'Cloud & AI' },
    { holding_id: 3, asset_ticker: 'NVDA', quantity: 1500, average_buy_price: 110.00, sector: 'Semiconductors' },
    { holding_id: 4, asset_ticker: 'SPY',  quantity: 400,  average_buy_price: 495.00, sector: 'Broad Index' },
  ]);

  // Market Tickers with Historical Sparkline Buffer
  const [tickers, setTickers] = useState({
    AAPL: { 
      current_price: 185.50, 
      daily_volatility_index: 0.0182, 
      previous_price: 185.50, 
      tick_dir: 'neutral',
      sparkline: [183.2, 184.0, 184.8, 184.2, 185.1, 185.5]
    },
    MSFT: { 
      current_price: 420.25, 
      daily_volatility_index: 0.0164, 
      previous_price: 420.25, 
      tick_dir: 'neutral',
      sparkline: [416.0, 417.5, 418.9, 419.0, 419.8, 420.25]
    },
    NVDA: { 
      current_price: 125.00, 
      daily_volatility_index: 0.0345, 
      previous_price: 125.00, 
      tick_dir: 'neutral',
      sparkline: [122.5, 123.8, 124.2, 123.9, 124.6, 125.0]
    },
    SPY:  { 
      current_price: 505.00, 
      daily_volatility_index: 0.0112, 
      previous_price: 505.00, 
      tick_dir: 'neutral',
      sparkline: [502.8, 503.4, 504.0, 503.9, 504.6, 505.0]
    },
    USDT: { 
      current_price: 1.0000, 
      daily_volatility_index: 0.0001, 
      previous_price: 1.0000, 
      tick_dir: 'neutral',
      sparkline: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
    },
  });

  // Executed Hedging Orders (aligned with schema.sql hedging_orders table)
  const [hedgingOrders, setHedgingOrders] = useState([
    {
      order_id: 101,
      portfolio_id: 1,
      hedge_asset: 'SPY',
      order_type: 'SELL',
      executed_quantity: 150.00,
      execution_price: 504.80,
      executed_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      status: 'FILLED',
      rationale: 'DELTA_NEUTRAL_REBALANCE'
    },
    {
      order_id: 102,
      portfolio_id: 1,
      hedge_asset: 'USDT',
      order_type: 'BUY',
      executed_quantity: 50000.00,
      execution_price: 1.00,
      executed_at: new Date(Date.now() - 1800000).toISOString(),
      status: 'FILLED',
      rationale: 'CAPITAL_PRESERVATION_RESERVE'
    }
  ]);

  // Compliance Audit Ledger (Basel III immutable audit trail)
  const [auditLedger, setAuditLedger] = useState([
    {
      audit_id: 1,
      portfolio_id: 1,
      event_type: 'SYSTEM_BOOT_INITIALIZED',
      payload: { status: 'NORMAL', initial_equity: 1000000.00 },
      hash_checksum: '8f4e2a1b9c3d5e7f0123456789abcdef0123456789abcdef0123456789abcdef',
      recorded_at: new Date(Date.now() - 7200000).toISOString()
    },
    {
      audit_id: 2,
      portfolio_id: 1,
      event_type: 'PARAMETRIC_VAR_RECALCULATED',
      payload: { var_99: 41250.00, confidence: '99%' },
      hash_checksum: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef',
      recorded_at: new Date(Date.now() - 3600000).toISOString()
    }
  ]);

  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [latencyMs, setLatencyMs] = useState(0.82);

  // Dynamic Correlation Matrix
  const correlationMatrix = {
    assets: ['AAPL', 'MSFT', 'NVDA', 'SPY'],
    matrix: [
      [1.00, 0.72, 0.65, 0.84],
      [0.72, 1.00, 0.58, 0.81],
      [0.65, 0.58, 1.00, 0.74],
      [0.84, 0.81, 0.74, 1.00],
    ]
  };

  // Recalculate Live Exposure & VaR metrics
  const calculateExposureMetrics = () => {
    let currentEquity = 0;
    let weightedVolSum = 0;

    holdings.forEach(h => {
      const ticker = tickers[h.asset_ticker];
      if (ticker) {
        const val = h.quantity * ticker.current_price;
        currentEquity += val;
        weightedVolSum += val * ticker.daily_volatility_index;
      }
    });

    const weightedVol = currentEquity > 0 ? weightedVolSum / currentEquity : 0.015;
    
    // Parametric VaR (99% confidence, Z = 2.3263)
    const var99_1d = currentEquity * 2.3263 * weightedVol;
    const baselVaR_10d = var99_1d * Math.sqrt(10);
    // Expected Shortfall (ES_97.5% analytical: 2.665 * sigma * W0)
    const es975 = currentEquity * 2.665 * weightedVol;
    const varPercent = currentEquity > 0 ? var99_1d / currentEquity : 0;
    const isBreached = varPercent > portfolio.margin_threshold;

    // Stress Level gauge score (0 to 100%)
    const stressScore = Math.min(100, Math.round((varPercent / 0.25) * 100));

    return {
      currentEquity,
      weightedVol,
      var99_1d,
      baselVaR_10d,
      es975,
      varPercent,
      isBreached,
      stressScore
    };
  };

  const metrics = calculateExposureMetrics();

  // Automatic Risk Sentry Loop: Checks if margin is breached, triggers auto-hedge
  useEffect(() => {
    if (portfolio.sentry_armed && metrics.isBreached && !portfolio.is_flagged_critical) {
      triggerAutomatedMicroHedge('SYSTEM_SENTINEL_BREACH_DETECTED');
    }
  }, [tickers, portfolio.sentry_armed]);

  // Live stochastic ticker simulation with Sparkline buffer
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      setTickers(prev => {
        const updated = { ...prev };
        const keys = ['AAPL', 'MSFT', 'NVDA', 'SPY'];
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        const current = updated[randomKey];
        
        // Random micro-walk: -0.25% to +0.25%
        const deltaPct = (Math.random() - 0.495) * 0.005;
        const newPrice = Math.max(1, +(current.current_price * (1 + deltaPct)).toFixed(2));
        const tickDir = newPrice > current.current_price ? 'up' : newPrice < current.current_price ? 'down' : 'neutral';

        const newSparkline = [...current.sparkline.slice(-9), newPrice];

        updated[randomKey] = {
          ...current,
          previous_price: current.current_price,
          current_price: newPrice,
          tick_dir: tickDir,
          sparkline: newSparkline
        };
        return updated;
      });

      // Micro jitter on latency (0.75ms - 0.95ms)
      setLatencyMs(+(0.75 + Math.random() * 0.20).toFixed(2));
    }, 1600);

    return () => clearInterval(interval);
  }, [isLiveStreaming]);

  // Trigger Flash Crash Simulation
  const simulateFlashCrash = () => {
    setIsLiveStreaming(false);
    setTickers(prev => ({
      ...prev,
      AAPL: { 
        ...prev.AAPL, 
        current_price: +(prev.AAPL.current_price * 0.935).toFixed(2), 
        daily_volatility_index: 0.0480, 
        tick_dir: 'down',
        sparkline: [...prev.AAPL.sparkline.slice(-6), +(prev.AAPL.current_price * 0.935).toFixed(2)]
      },
      MSFT: { 
        ...prev.MSFT, 
        current_price: +(prev.MSFT.current_price * 0.925).toFixed(2), 
        daily_volatility_index: 0.0420, 
        tick_dir: 'down',
        sparkline: [...prev.MSFT.sparkline.slice(-6), +(prev.MSFT.current_price * 0.925).toFixed(2)]
      },
      NVDA: { 
        ...prev.NVDA, 
        current_price: +(prev.NVDA.current_price * 0.885).toFixed(2), 
        daily_volatility_index: 0.0750, 
        tick_dir: 'down',
        sparkline: [...prev.NVDA.sparkline.slice(-6), +(prev.NVDA.current_price * 0.885).toFixed(2)]
      },
      SPY:  { 
        ...prev.SPY,  
        current_price: +(prev.SPY.current_price * 0.945).toFixed(2),  
        daily_volatility_index: 0.0380, 
        tick_dir: 'down',
        sparkline: [...prev.SPY.sparkline.slice(-6), +(prev.SPY.current_price * 0.945).toFixed(2)]
      },
    }));

    setPortfolio(prev => ({ ...prev, delta_imbalance: 0.38 }));

    setTimeout(() => {
      triggerAutomatedMicroHedge('FLASH_CRASH_VOLATILITY_CASCADE');
      setIsLiveStreaming(true);
    }, 450);
  };

  // Automated Micro-Hedge Execution (simulates Atomic Transaction Block)
  const triggerAutomatedMicroHedge = (rationale) => {
    const hedgeAsset = 'SPY';
    const currentPrice = tickers[hedgeAsset].current_price;
    const requiredHedgeQty = 250.00;

    // 1. Update Portfolio State: Neutralize Delta Imbalance & Deduct margin buffer
    setPortfolio(prev => ({
      ...prev,
      total_equity: Math.max(0, prev.total_equity - 15000),
      is_flagged_critical: false,
      delta_imbalance: 0.01 // Neutralized!
    }));

    // 2. Insert into Hedging Orders
    const newOrderId = hedgingOrders.length + 101;
    const newOrder = {
      order_id: newOrderId,
      portfolio_id: portfolio.portfolio_id,
      hedge_asset: hedgeAsset,
      order_type: 'SELL',
      executed_quantity: requiredHedgeQty,
      execution_price: currentPrice,
      executed_at: new Date().toISOString(),
      status: 'FILLED',
      rationale: rationale || 'AUTONOMOUS_DELTA_NEUTRAL_HEDGE'
    };
    setHedgingOrders(prev => [newOrder, ...prev]);

    // 3. Append to Basel III Audit Ledger with SHA-256 Hash
    const newAuditId = auditLedger.length + 1;
    const payload = {
      order_id: newOrderId,
      hedge_asset: hedgeAsset,
      executed_quantity: requiredHedgeQty,
      execution_price: currentPrice,
      rationale: rationale
    };
    const syntheticHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    
    setAuditLedger(prev => [
      {
        audit_id: newAuditId,
        portfolio_id: portfolio.portfolio_id,
        event_type: 'MICRO_HEDGE_ORDER_EXECUTED',
        payload,
        hash_checksum: syntheticHash,
        recorded_at: new Date().toISOString()
      },
      ...prev
    ]);
  };

  const setMarginThreshold = (newThreshold) => {
    setPortfolio(prev => ({ ...prev, margin_threshold: newThreshold }));
  };

  const toggleSentry = () => {
    setPortfolio(prev => ({ ...prev, sentry_armed: !prev.sentry_armed }));
  };

  const resetPortfolioEquity = () => {
    setPortfolio(prev => ({
      ...prev,
      total_equity: 1000000.00,
      is_flagged_critical: false,
      delta_imbalance: 0.02
    }));
    setTickers({
      AAPL: { 
        current_price: 185.50, 
        daily_volatility_index: 0.0182, 
        previous_price: 185.50, 
        tick_dir: 'neutral',
        sparkline: [183.2, 184.0, 184.8, 184.2, 185.1, 185.5]
      },
      MSFT: { 
        current_price: 420.25, 
        daily_volatility_index: 0.0164, 
        previous_price: 420.25, 
        tick_dir: 'neutral',
        sparkline: [416.0, 417.5, 418.9, 419.0, 419.8, 420.25]
      },
      NVDA: { 
        current_price: 125.00, 
        daily_volatility_index: 0.0345, 
        previous_price: 125.00, 
        tick_dir: 'neutral',
        sparkline: [122.5, 123.8, 124.2, 123.9, 124.6, 125.0]
      },
      SPY:  { 
        current_price: 505.00, 
        daily_volatility_index: 0.0112, 
        previous_price: 505.00, 
        tick_dir: 'neutral',
        sparkline: [502.8, 503.4, 504.0, 503.9, 504.6, 505.0]
      },
      USDT: { 
        current_price: 1.0000, 
        daily_volatility_index: 0.0001, 
        previous_price: 1.0000, 
        tick_dir: 'neutral',
        sparkline: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
      },
    });
  };

  return (
    <CenturionContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        portfolio,
        holdings,
        tickers,
        hedgingOrders,
        auditLedger,
        metrics,
        correlationMatrix,
        latencyMs,
        isLiveStreaming,
        setIsLiveStreaming,
        simulateFlashCrash,
        triggerAutomatedMicroHedge,
        setMarginThreshold,
        toggleSentry,
        resetPortfolioEquity
      }}
    >
      {children}
    </CenturionContext.Provider>
  );
};


