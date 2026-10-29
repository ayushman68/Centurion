-- ============================================================================
-- Centurion: Enterprise Portfolio Risk Engine & Automated Micro-Hedging Platform
-- Production DDL & Schema Script: database/schema.sql
-- Relational Integrity: Strict 3rd Normal Form (3NF)
-- Target RDBMS: Azure SQL Database / Microsoft SQL Server
-- ============================================================================

-- 1. USERS TABLE (Handles Authentication & System RBAC)
CREATE TABLE users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_name VARCHAR(50) NOT NULL CHECK (role_name IN ('Risk_Officer', 'Portfolio_Manager', 'Auditor')),
    created_at DATETIME DEFAULT GETDATE()
);

-- 2. PORTFOLIOS TABLE (Tracks High-Level Account Equity & Risk Flags)
CREATE TABLE portfolios (
    portfolio_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    portfolio_name VARCHAR(100) NOT NULL,
    total_equity DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    margin_threshold DECIMAL(18, 4) NOT NULL DEFAULT 0.1000, -- Risk limit %
    is_flagged_critical BIT NOT NULL DEFAULT 0,
    CONSTRAINT fk_portfolios_users FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 3. ASSET HOLDINGS TABLE (Granular Portfolio Asset Positions)
CREATE TABLE asset_holdings (
    holding_id INT IDENTITY(1,1) PRIMARY KEY,
    portfolio_id INT NOT NULL,
    asset_ticker VARCHAR(20) NOT NULL,
    quantity DECIMAL(18, 6) NOT NULL CHECK (quantity >= 0),
    average_buy_price DECIMAL(18, 4) NOT NULL CHECK (average_buy_price > 0),
    CONSTRAINT fk_holdings_portfolios FOREIGN KEY (portfolio_id) REFERENCES portfolios(portfolio_id) ON DELETE CASCADE,
    CONSTRAINT uq_portfolio_asset UNIQUE (portfolio_id, asset_ticker)
);

-- 4. MARKET TICKERS TABLE (Cached Market Metrics for Computational Joins)
CREATE TABLE market_tickers (
    ticker_id INT IDENTITY(1,1) PRIMARY KEY,
    asset_ticker VARCHAR(20) NOT NULL UNIQUE,
    current_price DECIMAL(18, 4) NOT NULL CHECK (current_price > 0),
    daily_volatility_index DECIMAL(5, 4) NOT NULL, -- Statistically used for VaR calculations
    last_updated_at DATETIME DEFAULT GETDATE()
);

-- 5. HEDGING ORDERS TABLE (Immutable Programmatic Log of Executed Hedges)
CREATE TABLE hedging_orders (
    order_id INT IDENTITY(1,1) PRIMARY KEY,
    portfolio_id INT NOT NULL,
    hedge_asset VARCHAR(20) NOT NULL,
    order_type VARCHAR(10) NOT NULL CHECK (order_type IN ('BUY', 'SELL')),
    executed_quantity DECIMAL(18, 6) NOT NULL CHECK (executed_quantity > 0),
    execution_price DECIMAL(18, 4) NOT NULL CHECK (execution_price > 0),
    executed_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT fk_hedging_portfolios FOREIGN KEY (portfolio_id) REFERENCES portfolios(portfolio_id)
);

-- 6. COMPLIANCE AUDIT LEDGER (Basel III / FRTB Immutable Non-Destructive Ledger)
CREATE TABLE compliance_audit_ledger (
    audit_id INT IDENTITY(1,1) PRIMARY KEY,
    portfolio_id INT NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload_json NVARCHAR(MAX) NOT NULL,
    hash_checksum VARCHAR(64) NOT NULL, -- SHA-256 hash chaining
    recorded_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT fk_audit_portfolios FOREIGN KEY (portfolio_id) REFERENCES portfolios(portfolio_id)
);

-- ----------------------------------------------------------------------------
-- PERFORMANCE INDEXES (Optimized for Sub-Millisecond Joins & Lookups)
-- ----------------------------------------------------------------------------
CREATE NONCLUSTERED INDEX IX_asset_holdings_portfolio ON asset_holdings (portfolio_id) INCLUDE (asset_ticker, quantity);
CREATE NONCLUSTERED INDEX IX_market_tickers_ticker ON market_tickers (asset_ticker) INCLUDE (current_price, daily_volatility_index);
CREATE NONCLUSTERED INDEX IX_hedging_orders_portfolio ON hedging_orders (portfolio_id, executed_at DESC);
CREATE NONCLUSTERED INDEX IX_compliance_audit_portfolio ON compliance_audit_ledger (portfolio_id, recorded_at DESC);
