# Centurion — DP-900 Cloud Infrastructure & Enterprise Analytics Specification
**Document Version:** 1.0.0-PROD  
**Target Cloud Platform:** Microsoft Azure  
**Architecture Alignment:** Microsoft Certified: Azure Data Fundamentals (DP-900) Tiering Standards  

---

## 1. Azure Multi-Tier Cloud Storage Topology

Centurion implements an institutional multi-tier persistence model that maps each data workload to its optimal storage engine according to query latency, schema dynamism, durability, and cost-efficiency.

```mermaid
flowchart TD
    subgraph DataIngress ["Data Ingress Pipeline"]
        Ticks["High-Frequency Tick Stream (JSON)"]
        Trades["Risk Engine Micro-Hedge Orders"]
        Audits["EoD Statements & Audit Reports"]
    end

    subgraph AzureStorageTier ["DP-900 Data Architecture Strategy"]
        subgraph SemiStructured ["Semi-Structured Store (NoSQL)"]
            Cosmos["Azure Cosmos DB (Core SQL API)<br/>Container: /MarketTicks<br/>Partition Key: /asset_ticker<br/>TTL: 604,800s (7 Days)<br/>Throughput: Autoscale 4,000 - 20,000 RU/s"]
        end

        subgraph Structured ["Structured Store (Relational OLTP)"]
            AzureSQL["Azure SQL Database (Business Critical)<br/>vCore-based, In-Memory OLTP, 99.995% SLA<br/>Strict 3NF Schema<br/>Tables: users, portfolios, asset_holdings, hedging_orders"]
        end

        subgraph Unstructured ["Unstructured Store (Blob Storage)"]
            BlobHot["Container: compliance-statements-hot<br/>Access Tier: Hot (Immediate PDF Retrieval)"]
            BlobCool["Container: historical-portfolio-snapshots<br/>Access Tier: Cool (Monthly Balances, Parquet)"]
            BlobArchive["Container: basel-regulatory-vault<br/>Access Tier: Archive (7-Year Immutable WORM)"]
        end
    end

    subgraph AnalyticalTier ["Business Intelligence & Analytics"]
        SQLViews["Analytical SQL Views<br/>(vw_PortfolioDrawdown, vw_RollingVaR, vw_HedgeEfficiency)"]
        PowerBI["Microsoft Power BI Service<br/>DirectQuery & Scheduled Semantic Model<br/>Executive Risk Cockpit"]
    end

    Ticks -->|High-throughput Streaming| Cosmos
    Trades -->|Sub-millisecond ACID Transact| AzureSQL
    Audits -->|Async PDF Generation| BlobHot
    BlobHot -->|Lifecycle Rule (30 Days)| BlobCool
    BlobCool -->|Lifecycle Rule (180 Days)| BlobArchive
    AzureSQL --> SQLViews
    SQLViews --> PowerBI
```

---

## 2. Multi-Tier Data Storage Specifications

### 2.1 Structured Store: Azure SQL Database
- **Role:** Master relational transactional ledger for account balances, portfolio compositions, user security profiles, and executed micro-hedging orders.
- **Service Tier:** Azure SQL Business Critical (PaaS, Gen5 8 vCores, local SSD storage, In-Memory OLTP).
- **Features:** 
  - Sub-millisecond transactional latency for balance deductions.
  - Active geo-replication providing 5-second RPO and 30-second RTO.
  - Transparent Data Encryption (TDE) with customer-managed keys (Azure Key Vault).

### 2.2 Semi-Structured Store: Azure Cosmos DB
- **Role:** High-throughput ingestion of hot, raw, polymorphic JSON ticker ticks and order book telemetry streamed from electronic exchange APIs.
- **API Model:** Core (SQL) API.
- **Partition Key Strategy:** `/asset_ticker`
  - Guarantees logical co-location of all ticks for a specific ticker symbol (e.g., `AAPL`, `MSFT`, `SPY`) within the same physical partition.
  - Enables single-partition queries for rolling volatility and correlation calculations with single-digit millisecond latency.
- **Time-to-Live (TTL):** Configured to `604,800` seconds ($7$ days). Raw high-frequency tick data automatically ages out to minimize storage costs, while aggregated metrics are persisted to the structured store.
- **Document Payload Schema:**
```json
{
  "id": "tick_AAPL_1715003410293",
  "asset_ticker": "AAPL",
  "timestamp": "2026-10-29T11:30:00.293Z",
  "bid_price": 185.48,
  "ask_price": 185.50,
  "last_traded_price": 185.49,
  "volume": 1250,
  "implied_volatility": 0.0182,
  "exchange_source": "NASDAQ_ITCH"
}
```

### 2.3 Unstructured Store: Azure Blob Storage
- **Role:** Long-term archival, immutable compliance logs, and export repository for client-facing PDF financial risk statements.
- **Container Structure & Access Tiers:**
  1. `compliance-statements-hot` (**Hot Tier**): Houses daily generated PDF statements and quarterly risk audits for active download via SAS tokens.
  2. `historical-portfolio-snapshots` (**Cool Tier**): Stores compressed Apache Parquet snapshots of daily closing portfolio positions for backtesting.
  3. `basel-regulatory-vault` (**Archive Tier**): Stores tamper-evident WORM (Write Once, Read Many) compliant regulatory archives retained for 7 years.
- **Lifecycle Management Policy (JSON Definition):**
```json
{
  "rules": [
    {
      "enabled": true,
      "name": "TransitionCompliancePdfsToCoolAndArchive",
      "type": "Lifecycle",
      "definition": {
        "filters": {
          "blobTypes": ["blockBlob"],
          "prefixMatch": ["compliance-statements/"]
        },
        "actions": {
          "baseBlob": {
            "tierToCool": { "daysAfterModificationGreaterThan": 30 },
            "tierToArchive": { "daysAfterModificationGreaterThan": 180 },
            "delete": { "daysAfterModificationGreaterThan": 2555 }
          }
        }
      }
    }
  ]
}
```

---

## 3. Power BI Analytics Engine & Analytical Views

Power BI connects to Azure SQL Database via **DirectQuery** for real-time monitoring and an **Import Semantic Model** for longitudinal trend analysis.

### 3.1 Analytical SQL Views in Azure SQL

#### View 1: `vw_PortfolioContinuousDrawdown`
```sql
CREATE OR ALTER VIEW dbo.vw_PortfolioContinuousDrawdown AS
WITH HistoricalHighs AS (
    SELECT 
        portfolio_id,
        portfolio_name,
        total_equity AS current_equity,
        margin_threshold,
        -- Window function to track peak recorded equity for high-water mark
        MAX(total_equity) OVER (PARTITION BY portfolio_id) AS peak_high_water_mark
    FROM dbo.portfolios
)
SELECT 
    portfolio_id,
    portfolio_name,
    current_equity,
    peak_high_water_mark,
    (peak_high_water_mark - current_equity) AS absolute_drawdown,
    CASE 
        WHEN peak_high_water_mark > 0 
        THEN ROUND(((peak_high_water_mark - current_equity) / peak_high_water_mark) * 100.0, 2)
        ELSE 0.00 
    END AS drawdown_percentage,
    CASE 
        WHEN current_equity < margin_threshold THEN 'CRITICAL_MARGIN_CALL'
        WHEN (peak_high_water_mark - current_equity) / NULLIF(peak_high_water_mark, 0) > 0.10 THEN 'WARNING_HIGH_DRAWDOWN'
        ELSE 'NORMAL_RISK'
    END AS risk_status
FROM HistoricalHighs;
GO
```

#### View 2: `vw_RollingVaRTrends`
```sql
CREATE OR ALTER VIEW dbo.vw_RollingVaRTrends AS
SELECT 
    p.portfolio_id,
    p.portfolio_name,
    p.total_equity,
    -- Analytical 99% 1-day Parametric VaR (Z = 2.3263)
    ROUND(p.total_equity * 2.3263 * ISNULL(AVG(mt.daily_volatility_index), 0.0150), 2) AS parametric_var_99_1day,
    -- Basel III 10-day Scaled VaR (VaR_10d = VaR_1d * sqrt(10))
    ROUND(p.total_equity * 2.3263 * ISNULL(AVG(mt.daily_volatility_index), 0.0150) * SQRT(10.0), 2) AS basel_var_99_10day,
    -- Expected Shortfall approximation (ES = 2.665 * sigma * W0)
    ROUND(p.total_equity * 2.6650 * ISNULL(AVG(mt.daily_volatility_index), 0.0150), 2) AS expected_shortfall_975
FROM dbo.portfolios p
LEFT JOIN dbo.asset_holdings ah ON p.portfolio_id = ah.portfolio_id
LEFT JOIN dbo.market_tickers mt ON ah.asset_ticker = mt.asset_ticker
GROUP BY p.portfolio_id, p.portfolio_name, p.total_equity;
GO
```

#### View 3: `vw_MicroHedgeCostEfficiencyScore`
```sql
CREATE OR ALTER VIEW dbo.vw_MicroHedgeCostEfficiencyScore AS
SELECT 
    ho.portfolio_id,
    p.portfolio_name,
    COUNT(ho.order_id) AS total_hedging_trades,
    SUM(ho.executed_quantity * ho.execution_price) AS total_hedged_notional_volume,
    -- Micro-Hedge Cost: assuming standard 1.5 bps execution fee + spread cost
    ROUND(SUM(ho.executed_quantity * ho.execution_price * 0.00015), 2) AS total_hedge_frictional_cost,
    -- Simulated preserved drawdown value
    ROUND(SUM(ho.executed_quantity * ho.execution_price * 0.035), 2) AS estimated_preserved_capital_tail_loss,
    -- Efficiency Score: Preserved Capital / Frictional Cost
    CASE 
        WHEN SUM(ho.executed_quantity * ho.execution_price * 0.00015) > 0 
        THEN ROUND(
            SUM(ho.executed_quantity * ho.execution_price * 0.035) / 
            SUM(ho.executed_quantity * ho.execution_price * 0.00015), 2
        )
        ELSE 1.00 
    END AS hedge_cost_efficiency_score
FROM dbo.hedging_orders ho
INNER JOIN dbo.portfolios p ON ho.portfolio_id = p.portfolio_id
GROUP BY ho.portfolio_id, p.portfolio_name;
GO
```

---

## 4. Production DAX Formulas for Power BI Dashboard

These institutional DAX expressions power the executive Power BI reports:

### Measure 1: Rolling 99% Parametric Value-at-Risk
```dax
Rolling_VaR_99 = 
VAR TotalEquity = SUM(vw_RollingVaRTrends[total_equity])
VAR ParametricVaR = SUM(vw_RollingVaRTrends[parametric_var_99_1day])
RETURN
IF(
    ISBLANK(ParametricVaR), 
    0, 
    ParametricVaR
)
```

### Measure 2: Maximum Portfolio Drawdown Percentage
```dax
Max_Drawdown_Percentage = 
VAR CurrentEquity = SUM(vw_PortfolioContinuousDrawdown[current_equity])
VAR HighWaterMark = SUM(vw_PortfolioContinuousDrawdown[peak_high_water_mark])
VAR Drawdown = DIVIDE(HighWaterMark - CurrentEquity, HighWaterMark, 0)
RETURN
FORMAT(Drawdown, "0.00%")
```

### Measure 3: Micro-Hedge Cost-Efficiency Ratio (Hedge ROI)
```dax
Micro_Hedge_Efficiency_Ratio = 
VAR PreservedCapital = SUM(vw_MicroHedgeCostEfficiencyScore[estimated_preserved_capital_tail_loss])
VAR FrictionalCost = SUM(vw_MicroHedgeCostEfficiencyScore[total_hedge_frictional_cost])
RETURN
DIVIDE(PreservedCapital, FrictionalCost, 1.0)
```

### Measure 4: Dynamic Capital At Risk Flag
```dax
Risk_Margin_Health_Status = 
IF(
    SELECTEDVALUE(vw_PortfolioContinuousDrawdown[risk_status]) = "CRITICAL_MARGIN_CALL",
    "🔴 CRITICAL BREACH - AUTO HEDGE ACTIVE",
    IF(
        SELECTEDVALUE(vw_PortfolioContinuousDrawdown[risk_status]) = "WARNING_HIGH_DRAWDOWN",
        "🟡 ELEVATED VOLATILITY - SENTRY ARMED",
        "🟢 STABLE CAPITAL HEALTH"
    )
)
```
