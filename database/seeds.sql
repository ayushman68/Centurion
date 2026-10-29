-- ============================================================================
-- Centurion: Enterprise Portfolio Risk Engine & Automated Micro-Hedging Platform
-- Initial Institutional Seed Data: database/seeds.sql
-- ============================================================================

-- 1. Insert Initial RBAC Enterprise Users
INSERT INTO users (email, password_hash, role_name) VALUES
('risk.officer@centurion-institutional.com', '$2b$12$K8yT0Y9uR5K7vY7K7K7K7uK7K7K7K7K7K7K7K7K7K7K7K7K7K7K7K', 'Risk_Officer'),
('pm.macro@centurion-institutional.com', '$2b$12$K8yT0Y9uR5K7vY7K7K7K7uK7K7K7K7K7K7K7K7K7K7K7K7K7K7K7K', 'Portfolio_Manager'),
('auditor.basel@centurion-institutional.com', '$2b$12$K8yT0Y9uR5K7vY7K7K7K7uK7K7K7K7K7K7K7K7K7K7K7K7K7K7K7K', 'Auditor');

-- 2. Insert Flagship Institutional Portfolio
INSERT INTO portfolios (user_id, portfolio_name, total_equity, margin_threshold, is_flagged_critical) VALUES
(1, 'Centurion Quantitative Macro Alpha [ACC-001]', 1000000.0000, 0.1500, 0);

-- 3. Insert Granular Portfolio Positions
INSERT INTO asset_holdings (portfolio_id, asset_ticker, quantity, average_buy_price) VALUES
(1, 'AAPL', 2500.000000, 175.0000),
(1, 'MSFT', 1200.000000, 400.0000),
(1, 'NVDA', 1500.000000, 110.0000),
(1, 'SPY',  400.000000,  495.0000);

-- 4. Insert Market Ticker Benchmarks
INSERT INTO market_tickers (asset_ticker, current_price, daily_volatility_index) VALUES
('AAPL', 185.5000, 0.0182),
('MSFT', 420.2500, 0.0164),
('NVDA', 125.0000, 0.0345),
('SPY',  505.0000, 0.0112),
('USDT', 1.0000,   0.0001);

-- 5. Insert Baseline Hedging Orders
INSERT INTO hedging_orders (portfolio_id, hedge_asset, order_type, executed_quantity, execution_price) VALUES
(1, 'SPY',  'SELL', 150.000000, 504.8000),
(1, 'USDT', 'BUY',  50000.000000, 1.0000);

-- 6. Insert System Boot Audit Trail
INSERT INTO compliance_audit_ledger (portfolio_id, event_type, payload_json, hash_checksum) VALUES
(1, 'SYSTEM_BOOT_INITIALIZED', '{"status":"NORMAL","nav":1000000.00,"margin":0.15}', '8f4e2a1b9c3d5e7f0123456789abcdef0123456789abcdef0123456789abcdef'),
(1, 'PARAMETRIC_VAR_RECALCULATED', '{"var_99_1d":41250.00,"confidence":"99.0%"}', 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef');
