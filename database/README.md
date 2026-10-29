# Centurion Database Architecture & Scripts

This directory houses the complete relational database scripts, schema specifications, and programmability objects for **Centurion**.

## Directory Structure

- **`schema.sql`**: Production DDL script creating all 6 relational tables (`users`, `portfolios`, `asset_holdings`, `market_tickers`, `hedging_orders`, `compliance_audit_ledger`) and non-clustered performance indexes.
- **`queries.sql`**: Stored procedure `CalculatePortfolioExposure`, automated risk trigger `InitiateHedgingSignal`, and ACID atomic transaction execution block.
- **`seeds.sql`**: Production seed data for institutional accounts and baseline asset allocations.

## Relational Entity-Relationship Summary

| Entity | Primary Key | Foreign Keys | Constraints |
| :--- | :--- | :--- | :--- |
| `users` | `user_id` | - | `email` UNIQUE, `role_name` IN ('Risk_Officer', 'Portfolio_Manager', 'Auditor') |
| `portfolios` | `portfolio_id` | `user_id` -> `users(user_id)` | `total_equity` >= 0, `margin_threshold` (0.05 - 0.30) |
| `asset_holdings` | `holding_id` | `portfolio_id` -> `portfolios(portfolio_id)` | UNIQUE (`portfolio_id`, `asset_ticker`), `quantity` >= 0 |
| `market_tickers` | `ticker_id` | - | `asset_ticker` UNIQUE, `current_price` > 0 |
| `hedging_orders` | `order_id` | `portfolio_id` -> `portfolios(portfolio_id)` | `order_type` IN ('BUY', 'SELL'), `executed_quantity` > 0 |
| `compliance_audit_ledger` | `audit_id` | `portfolio_id` -> `portfolios(portfolio_id)` | Immutable write-once, SHA-256 hash checksum |

## Execution Instructions (Azure SQL / SQL Server)

```bash
# 1. Execute DDL Schema Creation
sqlcmd -S <server>.database.windows.net -d CenturionDB -U <admin> -P <password> -i database/schema.sql

# 2. Execute Stored Procedures & Triggers
sqlcmd -S <server>.database.windows.net -d CenturionDB -U <admin> -P <password> -i database/queries.sql

# 3. Seed Initial Accounts & Benchmarks
sqlcmd -S <server>.database.windows.net -d CenturionDB -U <admin> -P <password> -i database/seeds.sql
```
