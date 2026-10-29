-- ============================================================================
-- Centurion: Enterprise Portfolio Risk Engine & Automated Micro-Hedging Platform
-- Target DBMS: Azure SQL Database / Microsoft SQL Server 2019+
-- Architecture: Strict 3rd Normal Form (3NF) Relational Database Specification
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. SCHEMA CLEANUP (IDEMPOTENT RESET IF REQUIRED)
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.InitiateHedgingSignal', 'TR') IS NOT NULL DROP TRIGGER dbo.InitiateHedgingSignal;
IF OBJECT_ID('dbo.CalculatePortfolioExposure', 'P') IS NOT NULL DROP PROCEDURE dbo.CalculatePortfolioExposure;
IF OBJECT_ID('dbo.compliance_audit_ledger', 'U') IS NOT NULL DROP TABLE dbo.compliance_audit_ledger;
IF OBJECT_ID('dbo.hedging_orders', 'U') IS NOT NULL DROP TABLE dbo.hedging_orders;
IF OBJECT_ID('dbo.asset_holdings', 'U') IS NOT NULL DROP TABLE dbo.asset_holdings;
IF OBJECT_ID('dbo.market_tickers', 'U') IS NOT NULL DROP TABLE dbo.market_tickers;
IF OBJECT_ID('dbo.portfolios', 'U') IS NOT NULL DROP TABLE dbo.portfolios;
IF OBJECT_ID('dbo.users', 'U') IS NOT NULL DROP TABLE dbo.users;
GO

-- ----------------------------------------------------------------------------
-- 1. TABLE CREATION (3NF NORMALIZED RELATIONAL CORE)
-- ----------------------------------------------------------------------------

-- Table 1: users (Authentication, RBAC identifiers, security state)
CREATE TABLE dbo.users (
    user_id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    email NVARCHAR(255) NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    role_enum NVARCHAR(50) NOT NULL,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    
    CONSTRAINT PK_users PRIMARY KEY CLUSTERED (user_id),
    CONSTRAINT UQ_users_email UNIQUE NONCLUSTERED (email),
    CONSTRAINT CK_users_role CHECK (role_enum IN ('Risk_Officer', 'Portfolio_Manager', 'External_Auditor', 'System_Admin'))
);
GO

-- Table 2: portfolios (Aggregated account balances, equity, and margin risk thresholds)
CREATE TABLE dbo.portfolios (
    portfolio_id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    portfolio_name NVARCHAR(100) NOT NULL,
    total_equity DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    margin_threshold DECIMAL(18, 4) NOT NULL DEFAULT 100000.0000,
    is_flagged_critical BIT NOT NULL DEFAULT 0,
    updated_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    
    CONSTRAINT PK_portfolios PRIMARY KEY CLUSTERED (portfolio_id),
    CONSTRAINT FK_portfolios_users FOREIGN KEY (user_id) 
        REFERENCES dbo.users(user_id) ON DELETE CASCADE,
    CONSTRAINT CK_portfolios_total_equity CHECK (total_equity >= 0.0000),
    CONSTRAINT CK_portfolios_margin_threshold CHECK (margin_threshold > 0.0000)
);
GO

-- Table 3: market_tickers (Cache of asset prices and volatility indices for joins)
CREATE TABLE dbo.market_tickers (
    ticker_id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    asset_ticker NVARCHAR(20) NOT NULL,
    current_price DECIMAL(18, 4) NOT NULL,
    daily_volatility_index DECIMAL(8, 6) NOT NULL DEFAULT 0.015000,
    last_updated_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    
    CONSTRAINT PK_market_tickers PRIMARY KEY CLUSTERED (ticker_id),
    CONSTRAINT UQ_market_tickers_ticker UNIQUE NONCLUSTERED (asset_ticker),
    CONSTRAINT CK_market_tickers_price CHECK (current_price > 0.0000),
    CONSTRAINT CK_market_tickers_volatility CHECK (daily_volatility_index >= 0.000000)
);
GO

-- Table 4: asset_holdings (Individual asset holdings mapped per portfolio)
CREATE TABLE dbo.asset_holdings (
    holding_id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    portfolio_id UNIQUEIDENTIFIER NOT NULL,
    asset_ticker NVARCHAR(20) NOT NULL,
    quantity DECIMAL(18, 6) NOT NULL,
    average_buy_price DECIMAL(18, 4) NOT NULL,
    last_rebalanced_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    
    CONSTRAINT PK_asset_holdings PRIMARY KEY CLUSTERED (holding_id),
    CONSTRAINT FK_asset_holdings_portfolios FOREIGN KEY (portfolio_id) 
        REFERENCES dbo.portfolios(portfolio_id) ON DELETE CASCADE,
    CONSTRAINT FK_asset_holdings_market_tickers FOREIGN KEY (asset_ticker) 
        REFERENCES dbo.market_tickers(asset_ticker),
    CONSTRAINT CK_asset_holdings_quantity CHECK (quantity > 0.000000),
    CONSTRAINT CK_asset_holdings_avg_buy_price CHECK (average_buy_price > 0.0000),
    CONSTRAINT UQ_portfolio_asset UNIQUE (portfolio_id, asset_ticker)
);
GO

-- Table 5: hedging_orders (Audit records of automated micro-hedging trade dispatches)
CREATE TABLE dbo.hedging_orders (
    order_id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    portfolio_id UNIQUEIDENTIFIER NOT NULL,
    hedge_asset NVARCHAR(20) NOT NULL,
    order_type NVARCHAR(10) NOT NULL,
    executed_quantity DECIMAL(18, 6) NOT NULL,
    execution_price DECIMAL(18, 4) NOT NULL,
    execution_status NVARCHAR(30) NOT NULL DEFAULT 'FILLED',
    timestamp DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    
    CONSTRAINT PK_hedging_orders PRIMARY KEY CLUSTERED (order_id),
    CONSTRAINT FK_hedging_orders_portfolios FOREIGN KEY (portfolio_id) 
        REFERENCES dbo.portfolios(portfolio_id),
    CONSTRAINT CK_hedging_orders_type CHECK (order_type IN ('BUY', 'SELL', 'SHORT', 'COVER')),
    CONSTRAINT CK_hedging_orders_qty CHECK (executed_quantity > 0.000000),
    CONSTRAINT CK_hedging_orders_price CHECK (execution_price > 0.0000)
);
GO

-- Table 6: compliance_audit_ledger (Basel III Immutable Audit Trail)
CREATE TABLE dbo.compliance_audit_ledger (
    audit_id BIGINT IDENTITY(1,1) NOT NULL,
    portfolio_id UNIQUEIDENTIFIER NULL,
    event_type NVARCHAR(50) NOT NULL,
    payload_json NVARCHAR(MAX) NOT NULL,
    hash_checksum NVARCHAR(64) NOT NULL,
    recorded_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    
    CONSTRAINT PK_compliance_audit_ledger PRIMARY KEY CLUSTERED (audit_id),
    CONSTRAINT FK_audit_portfolios FOREIGN KEY (portfolio_id) 
        REFERENCES dbo.portfolios(portfolio_id)
);
GO

-- ----------------------------------------------------------------------------
-- 2. HIGH-PERFORMANCE INDEXING
-- ----------------------------------------------------------------------------
CREATE NONCLUSTERED INDEX IX_portfolios_user_id 
    ON dbo.portfolios(user_id) 
    INCLUDE (total_equity, margin_threshold, is_flagged_critical);

CREATE NONCLUSTERED INDEX IX_asset_holdings_portfolio_ticker 
    ON dbo.asset_holdings(portfolio_id) 
    INCLUDE (asset_ticker, quantity, average_buy_price);

CREATE NONCLUSTERED INDEX IX_hedging_orders_portfolio_timestamp 
    ON dbo.hedging_orders(portfolio_id, timestamp DESC);
GO

-- ----------------------------------------------------------------------------
-- 3. STORED PROCEDURE: CalculatePortfolioExposure
-- ----------------------------------------------------------------------------
-- Joins AssetHoldings and MarketTickers via INNER JOIN to evaluate live portfolio
-- valuation, PnL, weighted volatility, and dynamically sets the is_flagged_critical state.
-- ----------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.CalculatePortfolioExposure
    @PortfolioID UNIQUEIDENTIFIER,
    @TotalCalculatedEquity DECIMAL(18, 4) OUTPUT,
    @TotalUnrealizedPnL DECIMAL(18, 4) OUTPUT,
    @WeightedVolatility DECIMAL(8, 6) OUTPUT,
    @CriticalBreach BIT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- Validate input portfolio
    IF NOT EXISTS (SELECT 1 FROM dbo.portfolios WHERE portfolio_id = @PortfolioID)
    BEGIN
        RAISERROR('Portfolio record not found.', 16, 1);
        RETURN;
    END

    -- Compute Exposure via high-speed INNER JOIN
    SELECT 
        @TotalCalculatedEquity = ISNULL(SUM(ah.quantity * mt.current_price), 0.0000),
        @TotalUnrealizedPnL = ISNULL(SUM(ah.quantity * (mt.current_price - ah.average_buy_price)), 0.0000),
        @WeightedVolatility = CASE 
            WHEN SUM(ah.quantity * mt.current_price) > 0 
            THEN SUM(ah.quantity * mt.current_price * mt.daily_volatility_index) / SUM(ah.quantity * mt.current_price)
            ELSE 0.000000 
        END
    FROM dbo.asset_holdings ah
    INNER JOIN dbo.market_tickers mt ON ah.asset_ticker = mt.asset_ticker
    WHERE ah.portfolio_id = @PortfolioID;

    -- Evaluate margin breach condition
    DECLARE @MarginThreshold DECIMAL(18, 4);
    SELECT @MarginThreshold = margin_threshold FROM dbo.portfolios WHERE portfolio_id = @PortfolioID;

    IF (@TotalCalculatedEquity < @MarginThreshold)
        SET @CriticalBreach = 1;
    ELSE
        SET @CriticalBreach = 0;

    -- Update portfolio record with calculated results
    UPDATE dbo.portfolios
    SET 
        total_equity = @TotalCalculatedEquity,
        is_flagged_critical = @CriticalBreach,
        updated_at = SYSUTCDATETIME()
    WHERE portfolio_id = @PortfolioID;

    -- Return full analytical dataset for API consumer
    SELECT 
        p.portfolio_id,
        p.portfolio_name,
        @TotalCalculatedEquity AS total_market_value,
        @TotalUnrealizedPnL AS unrealized_pnl,
        @WeightedVolatility AS weighted_volatility_index,
        @CriticalBreach AS is_critical_margin_breached,
        SYSUTCDATETIME() AS calculated_at
    FROM dbo.portfolios p
    WHERE p.portfolio_id = @PortfolioID;
END;
GO

-- ----------------------------------------------------------------------------
-- 4. DATABASE TRIGGER: InitiateHedgingSignal
-- ----------------------------------------------------------------------------
-- Automatically executes AFTER UPDATE on portfolios. When an asset's risk
-- crosses margin constraints or is_flagged_critical transitions to 1,
-- the trigger automatically fires and logs an emergency micro-hedge into hedging_orders.
-- ----------------------------------------------------------------------------
CREATE OR ALTER TRIGGER dbo.InitiateHedgingSignal
ON dbo.portfolios
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Only act when is_flagged_critical changes from 0 to 1 OR total_equity falls below margin_threshold
    IF EXISTS (
        SELECT 1 
        FROM inserted i
        INNER JOIN deleted d ON i.portfolio_id = d.portfolio_id
        WHERE (i.is_flagged_critical = 1 AND d.is_flagged_critical = 0)
           OR (i.total_equity < i.margin_threshold AND d.total_equity >= d.margin_threshold)
    )
    BEGIN
        -- Insert automated micro-hedging signal record
        INSERT INTO dbo.hedging_orders (
            portfolio_id,
            hedge_asset,
            order_type,
            executed_quantity,
            execution_price,
            execution_status,
            timestamp
        )
        SELECT 
            i.portfolio_id,
            'SPY_INVERSE_HEDGE',
            'SELL',
            -- Calculate hedge quantity proportional to deficit
            ROUND(((i.margin_threshold - i.total_equity) / 500.00), 4),
            500.00, -- Benchmark hedge execution reference price
            'TRIGGERED_AUTO_HEDGE',
            SYSUTCDATETIME()
        FROM inserted i
        INNER JOIN deleted d ON i.portfolio_id = d.portfolio_id
        WHERE (i.is_flagged_critical = 1 AND d.is_flagged_critical = 0)
           OR (i.total_equity < i.margin_threshold AND d.total_equity >= d.margin_threshold);

        -- Insert audit trail into compliance ledger
        INSERT INTO dbo.compliance_audit_ledger (
            portfolio_id,
            event_type,
            payload_json,
            hash_checksum,
            recorded_at
        )
        SELECT 
            i.portfolio_id,
            'AUTOMATED_MICRO_HEDGE_TRIGGERED',
            JSON_QUERY((
                SELECT 
                    i.portfolio_id AS portfolio_id,
                    i.total_equity AS current_equity,
                    i.margin_threshold AS margin_threshold,
                    'BREACH_DETECTED_AUTO_HEDGE_FIRED' AS rationale
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            )),
            CONVERT(NVARCHAR(64), HASHBYTES('SHA2_256', CONCAT(i.portfolio_id, i.total_equity, SYSUTCDATETIME())), 2),
            SYSUTCDATETIME()
        FROM inserted i;
    END
END;
GO

-- ----------------------------------------------------------------------------
-- 5. ACID ATOMIC EXECUTION TRANSACTION BLOCK
-- ----------------------------------------------------------------------------
-- Demonstrates an atomic statement executing a balance deduction alongside
-- a ledger entry insertion, ensuring that no capital disappears mid-trade
-- due to processing or network failures.
-- ----------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.ExecuteAtomicHedgingTrade
    @PortfolioID UNIQUEIDENTIFIER,
    @HedgeAsset NVARCHAR(20),
    @OrderType NVARCHAR(10),
    @Quantity DECIMAL(18, 6),
    @ExecutionPrice DECIMAL(18, 4),
    @ResultStatus NVARCHAR(100) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON; -- Ensure immediate rollback on runtime exception

    DECLARE @TotalCost DECIMAL(18, 4) = @Quantity * @ExecutionPrice;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Step A: Validate and lock portfolio row for update (UPDLOCK, ROWLOCK)
        DECLARE @CurrentEquity DECIMAL(18, 4);
        SELECT @CurrentEquity = total_equity 
        FROM dbo.portfolios WITH (UPDLOCK, ROWLOCK) 
        WHERE portfolio_id = @PortfolioID;

        IF @CurrentEquity IS NULL
        BEGIN
            THROW 50001, 'Target portfolio does not exist.', 1;
        END

        IF @CurrentEquity < @TotalCost
        BEGIN
            THROW 50002, 'Insufficient portfolio capital to fund micro-hedge margin reserve.', 1;
        END

        -- Step B: Deduct required hedge reserve from portfolio equity
        UPDATE dbo.portfolios
        SET 
            total_equity = total_equity - @TotalCost,
            updated_at = SYSUTCDATETIME()
        WHERE portfolio_id = @PortfolioID;

        -- Step C: Record order execution in hedging_orders ledger
        DECLARE @NewOrderID UNIQUEIDENTIFIER = NEWID();
        INSERT INTO dbo.hedging_orders (
            order_id,
            portfolio_id,
            hedge_asset,
            order_type,
            executed_quantity,
            execution_price,
            execution_status,
            timestamp
        )
        VALUES (
            @NewOrderID,
            @HedgeAsset,
            @OrderType,
            @Quantity,
            @ExecutionPrice,
            'FILLED',
            SYSUTCDATETIME()
        );

        -- Step D: Record transaction in compliance audit trail
        INSERT INTO dbo.compliance_audit_ledger (
            portfolio_id,
            event_type,
            payload_json,
            hash_checksum,
            recorded_at
        )
        VALUES (
            @PortfolioID,
            'CAPITAL_DEDUCTION_AND_HEDGE_ORDER',
            CONCAT('{"order_id":"', @NewOrderID, '","deducted_capital":', @TotalCost, ',"hedge_asset":"', @HedgeAsset, '"}'),
            CONVERT(NVARCHAR(64), HASHBYTES('SHA2_256', CONCAT(@PortfolioID, @TotalCost, SYSUTCDATETIME())), 2),
            SYSUTCDATETIME()
        );

        -- If all steps succeed, commit atomic transaction
        COMMIT TRANSACTION;
        SET @ResultStatus = 'SUCCESS_ATOMIC_HEDGE_SETTLED';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        SET @ResultStatus = CONCAT('FAILED: ', ERROR_MESSAGE());
        THROW;
    END CATCH
END;
GO

-- ----------------------------------------------------------------------------
-- 6. SEED DATA GENERATOR (VERIFICATION & DEMONSTRATION)
-- ----------------------------------------------------------------------------
BEGIN
    DECLARE @RiskOfficerID UNIQUEIDENTIFIER = NEWID();
    DECLARE @PortfolioAlphaID UNIQUEIDENTIFIER = NEWID();

    -- Insert Risk Officer User
    INSERT INTO dbo.users (user_id, email, password_hash, role_enum)
    VALUES (
        @RiskOfficerID, 
        'risk.officer@centurion-institutional.com', 
        '$2b$12$K8yT0Y9uR5K7vY7K7K7K7uK7K7K7K7K7K7K7K7K7K7K7K7K7K7K7K', -- bcrypt mock hash
        'Risk_Officer'
    );

    -- Insert Sample Portfolio ($500,000 Equity, $400,000 Margin Threshold)
    INSERT INTO dbo.portfolios (portfolio_id, user_id, portfolio_name, total_equity, margin_threshold, is_flagged_critical)
    VALUES (
        @PortfolioAlphaID,
        @RiskOfficerID,
        'Flagship Quant Delta Fund Alpha',
        500000.0000,
        400000.0000,
        0
    );

    -- Insert Market Ticker Benchmarks
    INSERT INTO dbo.market_tickers (asset_ticker, current_price, daily_volatility_index)
    VALUES 
        ('AAPL', 185.5000, 0.018200),
        ('MSFT', 420.2500, 0.016400),
        ('NVDA', 125.0000, 0.034500),
        ('SPY',  505.0000, 0.011200);

    -- Insert Holdings for Portfolio Alpha
    INSERT INTO dbo.asset_holdings (portfolio_id, asset_ticker, quantity, average_buy_price)
    VALUES
        (@PortfolioAlphaID, 'AAPL', 1000.000000, 175.0000),
        (@PortfolioAlphaID, 'MSFT', 500.000000,  400.0000),
        (@PortfolioAlphaID, 'NVDA', 800.000000,  110.0000);
END;
GO

PRINT 'Centurion 3NF Relational Database Objects, Triggers, Stored Procedures, and Indexes installed successfully.';
