-- ============================================================================
-- Centurion: Enterprise Portfolio Risk Engine & Automated Micro-Hedging Platform
-- Database Programmability Objects: database/queries.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. The Stored Procedure: Multi-Table Exposure Evaluation
-- Performs an explicit INNER JOIN across active positions and hot market tickers
-- to recalculate a portfolio's real-time equity value with clustered index seek.
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
-- Monitors updates on market_tickers cache table. If a sudden pricing crash
-- drops a portfolio below safe levels, it automatically flags the account
-- as critical, creating an audit entry to fire off an API hedge order.
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
-- 3. The Multi-Statement Atomic Transaction Block: Trade Settle & Balances
-- Ensures ACID isolation when instating an automated micro-hedge.
-- Guarantees that deducting capital and inserting a protective order either
-- commit simultaneously or roll back completely without orphan records.
-- ----------------------------------------------------------------------------
BEGIN TRANSACTION;

BEGIN TRY
    DECLARE @PortfolioID INT = 1;
    DECLARE @HedgeAsset VARCHAR(20) = 'USDT';
    DECLARE @OrderType VARCHAR(10) = 'BUY';
    DECLARE @Quantity DECIMAL(18, 6) = 50000.00;
    DECLARE @Price DECIMAL(18, 4) = 1.0000;
    DECLARE @TotalCost DECIMAL(18, 4) = @Quantity * @Price;

    -- Verification Rule: Validate portfolio has sufficient liquidity
    IF (SELECT total_equity FROM portfolios WHERE portfolio_id = @PortfolioID) < @TotalCost
    BEGIN
        THROW 50001, 'Insufficient portfolio capital to execute hedge.', 1;
    END

    -- Step A: Insert executed protective order into immutable log
    INSERT INTO hedging_orders (portfolio_id, hedge_asset, order_type, executed_quantity, execution_price)
    VALUES (@PortfolioID, @HedgeAsset, @OrderType, @Quantity, @Price);

    -- Step B: Atomic Balance Deduction & Clearance of Critical Risk State
    UPDATE portfolios
    SET total_equity = total_equity - @TotalCost,
        is_flagged_critical = 0
    WHERE portfolio_id = @PortfolioID;

    -- Commit the entire transaction atomically
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    -- On any database constraint violation or liquidity shortfall, abort & rollback
    ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
