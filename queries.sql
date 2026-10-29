-- ============================================================================
-- Centurion: Enterprise Portfolio Risk Engine & Automated Micro-Hedging Platform
-- Database Programmability Objects: queries.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. The Stored Procedure: Multi-Table Exposure Evaluation
-- This procedure performs an explicit INNER JOIN across active positions and
-- hot market tickers to recalculate a portfolio's real-time equity value.
-- ----------------------------------------------------------------------------
CREATE PROCEDURE CalculatePortfolioExposure
    @PortfolioID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Update the portfolio's total equity dynamically based on current market rates
    UPDATE portfolios
    SET total_equity = ISNULL((
        SELECT SUM(h.quantity * t.current_price)
        FROM asset_holdings h
        INNER JOIN market_tickers t ON h.asset_ticker = t.asset_ticker
        WHERE h.portfolio_id = @PortfolioID
    ), 0)
    WHERE portfolio_id = @PortfolioID;
END;
GO

-- ----------------------------------------------------------------------------
-- 2. The Database Trigger: Automated Risk Margin Sentinel
-- This trigger monitors updates on the market_tickers cache table. If a sudden
-- pricing crash drops a portfolio below safe levels, it automatically flags
-- the account as critical, creating an audit entry to fire off an API hedge order.
-- ----------------------------------------------------------------------------
CREATE TRIGGER InitiateHedgingSignal
ON market_tickers
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Flag any portfolio that breaches risk limits due to market price swings
    UPDATE portfolios
    SET is_flagged_critical = 1
    WHERE portfolio_id IN (
        SELECT DISTINCT h.portfolio_id
        FROM asset_holdings h
        INNER JOIN inserted i ON h.asset_ticker = i.asset_ticker
        INNER JOIN portfolios p ON h.portfolio_id = p.portfolio_id
        -- Risk Condition: Volatility exceeds allowable threshold limits
        WHERE i.daily_volatility_index > p.margin_threshold
    );
END;
GO

-- ----------------------------------------------------------------------------
-- 3. The Multi-Statement Transaction Block: Atomic Hedge Execution
-- Guarantees that a programmatic asset purchase and its ledger deduction
-- succeed together or fail safely without vanishing investment capital.
-- ----------------------------------------------------------------------------
BEGIN TRANSACTION;
BEGIN TRY
    -- Step A: Log the automated asset mitigation order
    INSERT INTO hedging_orders (portfolio_id, hedge_asset, order_type, executed_quantity, execution_price)
    VALUES (1, 'USDT', 'BUY', 500.000000, 1.0000);

    -- Step B: Atomic adjustment to balance parameters
    UPDATE portfolios
    SET total_equity = total_equity - 500.0000,
        is_flagged_critical = 0 -- Reset threat status post-hedge
    WHERE portfolio_id = 1;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
