import React, { useState } from 'react';
import { useCenturion } from '../../context/CenturionContext';
import { 
  Terminal, 
  Send, 
  Copy, 
  Check, 
  Code
} from 'lucide-react';

const ApiTesterView = () => {
  const { portfolio, tickers, metrics, triggerAutomatedMicroHedge } = useCenturion();
  const [selectedRoute, setSelectedRoute] = useState('register');
  const [copied, setCopied] = useState(false);

  // Route 1 State: Register
  const [regEmail, setRegEmail] = useState('quant.analyst@centurion-institutional.com');
  const [regPass, setRegPass] = useState('Centurion#Quant2026!');
  const [regRole, setRegRole] = useState('Risk_Officer');
  const [regResponse, setRegResponse] = useState(null);

  // Route 2 State: Risk Exposure
  const [riskPortId, setRiskPortId] = useState(1);
  const [riskResponse, setRiskResponse] = useState(null);

  // Route 3 State: Hedge Execute
  const [hedgeAsset, setHedgeAsset] = useState('USDT');
  const [hedgeOrderType, setHedgeOrderType] = useState('BUY');
  const [hedgeQty, setHedgeQty] = useState(500);
  const [hedgeResponse, setHedgeResponse] = useState(null);

  // Handle Route 1: POST /api/v1/auth/register
  const handleTestRegister = () => {
    setRegResponse({
      status_code: 201,
      headers: {
        'content-type': 'application/json',
        'x-sync-engine': 'fastapi-uvicorn-blas',
        'x-jwt-algorithm': 'RS256'
      },
      payload: {
        user_id: 4,
        email: regEmail,
        role_name: regRole,
        password_hash: '$2b$12$K8yT0Y9uR5K7vY7K7K7K7uK7K7K7K7K7K7K7K7K7K7K7K7K7K7K7K',
        created_at: new Date().toISOString(),
        jwt_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0IiwiZW1haWwiOiJxdWFudC5hbmFseXN0QGNlbnR1cmlvbi1pbnN0aXR1dGlvbmFsLmNvbSIsInJvbGUiOiJSaXNrX09mZmljZXIifQ...',
        message: 'User credentials encrypted with bcrypt (12 rounds) and provisioned in users table.'
      }
    });
  };

  // Handle Route 2: GET /api/v1/risk/portfolio/{id}
  const handleTestRisk = () => {
    setRiskResponse({
      status_code: 200,
      headers: {
        'content-type': 'application/json',
        'x-sql-procedure': 'CalculatePortfolioExposure',
        'x-latency-ms': '0.78'
      },
      payload: {
        portfolio_id: riskPortId,
        portfolio_name: portfolio.portfolio_name,
        total_equity: metrics.currentEquity,
        margin_threshold: portfolio.margin_threshold,
        is_flagged_critical: metrics.isBreached,
        parametric_var_99_1day: +metrics.var99_1d.toFixed(2),
        basel_var_99_10day: +metrics.baselVaR_10d.toFixed(2),
        expected_shortfall_975: +metrics.es975.toFixed(2),
        weighted_volatility_index: +metrics.weightedVol.toFixed(6),
        status: metrics.isBreached ? 'CRITICAL_MARGIN_BREACH' : 'NORMAL_DELTA_NEUTRAL',
        calculated_via: 'EXEC CalculatePortfolioExposure @PortfolioID = 1;',
        timestamp: new Date().toISOString()
      }
    });
  };

  // Handle Route 3: POST /api/v1/hedge/execute
  const handleTestHedge = () => {
    triggerAutomatedMicroHedge(`API_ENDPOINT_TRIGGERED_${hedgeOrderType}_${hedgeAsset}`);
    const price = tickers[hedgeAsset] ? tickers[hedgeAsset].current_price : 1.0;
    const cost = hedgeQty * price;

    setHedgeResponse({
      status_code: 200,
      headers: {
        'content-type': 'application/json',
        'x-acid-boundary': 'committed',
        'x-cosmos-feed': 'hot-partition-seek'
      },
      payload: {
        order_id: 105,
        portfolio_id: portfolio.portfolio_id,
        hedge_asset: hedgeAsset,
        order_type: hedgeOrderType,
        executed_quantity: hedgeQty,
        execution_price: price,
        deducted_capital: cost,
        remaining_equity: Math.max(0, portfolio.total_equity - cost),
        is_flagged_critical: false,
        status: 'SUCCESS_ATOMIC_HEDGE_SETTLED',
        cosmos_tick_timestamp: new Date().toISOString(),
        sql_transaction: 'COMMITTED (BEGIN TRAN ... COMMIT TRAN)'
      }
    });
  };

  const getCurlSnippet = () => {
    if (selectedRoute === 'register') {
      return `curl -X POST "http://127.0.0.1:8000/api/v1/auth/register" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"${regEmail}","password":"${regPass}","role_name":"${regRole}"}'`;
    }
    if (selectedRoute === 'risk') {
      return `curl -X GET "http://127.0.0.1:8000/api/v1/risk/portfolio/${riskPortId}" \\
  -H "Authorization: Bearer <JWT_TOKEN>"`;
    }
    return `curl -X POST "http://127.0.0.1:8000/api/v1/hedge/execute" \\
  -H "Content-Type: application/json" \\
  -d '{"portfolio_id":${portfolio.portfolio_id},"hedge_asset":"${hedgeAsset}","order_type":"${hedgeOrderType}","executed_quantity":${hedgeQty}}'`;
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(getCurlSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Header Panel */}
      <div className="ent-panel">
        <div className="ent-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: 'var(--color-primary-light)',
              border: '1px solid var(--color-primary-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)'
            }}>
              <Terminal size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                Production FastAPI REST API Console & Documentation
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Directly maps HTTP routes to 3NF SQL procedures, atomic transaction blocks, and Cosmos DB feeds
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.45rem' }}>
            <span className="ent-badge ent-badge-blue">FastAPI 0.110+</span>
            <span className="ent-badge ent-badge-normal">Pydantic v2 Type Guard</span>
          </div>
        </div>
      </div>

      {/* Route Switcher & Interactive Tester */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Left: Route Selection & Input Form */}
        <div className="ent-panel">
          <div className="ent-panel-header">
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>Endpoint Selector</span>
            <span className="ent-badge ent-badge-neutral">Pydantic Schema</span>
          </div>

          <div className="ent-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Route Chips */}
            <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <button
                onClick={() => setSelectedRoute('register')}
                className={selectedRoute === 'register' ? 'ent-btn ent-btn-primary' : 'ent-btn ent-btn-secondary'}
                style={{ flex: 1, fontSize: '0.78rem', padding: '0.45rem' }}
              >
                POST /auth/register
              </button>

              <button
                onClick={() => setSelectedRoute('risk')}
                className={selectedRoute === 'risk' ? 'ent-btn ent-btn-primary' : 'ent-btn ent-btn-secondary'}
                style={{ flex: 1, fontSize: '0.78rem', padding: '0.45rem' }}
              >
                GET /risk/portfolio
              </button>

              <button
                onClick={() => setSelectedRoute('hedge')}
                className={selectedRoute === 'hedge' ? 'ent-btn ent-btn-primary' : 'ent-btn ent-btn-secondary'}
                style={{ flex: 1, fontSize: '0.78rem', padding: '0.45rem' }}
              >
                POST /hedge/execute
              </button>
            </div>

            {/* Form: Route 1 */}
            {selectedRoute === 'register' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem', fontWeight: 700 }}>
                    Corporate Email:
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="ent-input mono"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem', fontWeight: 700 }}>
                    Password (Bcrypt encrypted):
                  </label>
                  <input
                    type="password"
                    value={regPass}
                    onChange={(e) => setRegPass(e.target.value)}
                    className="ent-input mono"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem', fontWeight: 700 }}>
                    Enterprise Role:
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="ent-select"
                    style={{ width: '100%' }}
                  >
                    <option value="Risk_Officer">Risk_Officer</option>
                    <option value="Portfolio_Manager">Portfolio_Manager</option>
                    <option value="Auditor">Auditor</option>
                  </select>
                </div>

                <button onClick={handleTestRegister} className="ent-btn ent-btn-primary" style={{ marginTop: '0.35rem', fontSize: '0.825rem' }}>
                  <Send size={14} /> Send POST /api/v1/auth/register
                </button>
              </div>
            )}

            {/* Form: Route 2 */}
            {selectedRoute === 'risk' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem', fontWeight: 700 }}>
                    Portfolio ID (Path Param):
                  </label>
                  <input
                    type="number"
                    value={riskPortId}
                    onChange={(e) => setRiskPortId(parseInt(e.target.value))}
                    className="ent-input mono"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-subtle)', lineHeight: 1.5 }}>
                  Invokes SQL procedure <code className="mono">EXEC dbo.CalculatePortfolioExposure</code> and evaluates Parametric VaR (99%) and Expected Shortfall.
                </div>

                <button onClick={handleTestRisk} className="ent-btn ent-btn-primary" style={{ marginTop: '0.35rem', fontSize: '0.825rem' }}>
                  <Send size={14} /> Send GET /api/v1/risk/portfolio/{riskPortId}
                </button>
              </div>
            )}

            {/* Form: Route 3 */}
            {selectedRoute === 'hedge' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem', fontWeight: 700 }}>
                    Hedge Asset Target:
                  </label>
                  <select
                    value={hedgeAsset}
                    onChange={(e) => setHedgeAsset(e.target.value)}
                    className="ent-select"
                    style={{ width: '100%' }}
                  >
                    <option value="USDT">USDT (Capital Preservation Reserve)</option>
                    <option value="SPY">SPY (Delta-Neutral Inverse Offset)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem', fontWeight: 700 }}>
                    Order Type:
                  </label>
                  <select
                    value={hedgeOrderType}
                    onChange={(e) => setHedgeOrderType(e.target.value)}
                    className="ent-select"
                    style={{ width: '100%' }}
                  >
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem', fontWeight: 700 }}>
                    Executed Quantity:
                  </label>
                  <input
                    type="number"
                    value={hedgeQty}
                    onChange={(e) => setHedgeQty(parseFloat(e.target.value))}
                    className="ent-input mono"
                    style={{ width: '100%' }}
                  />
                </div>

                <button onClick={handleTestHedge} className="ent-btn ent-btn-primary" style={{ marginTop: '0.35rem', fontSize: '0.825rem' }}>
                  <Send size={14} /> Send POST /api/v1/hedge/execute
                </button>
              </div>
            )}

            {/* cURL Snippet */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>cURL Snippet</span>
                <button
                  onClick={handleCopyCurl}
                  style={{ background: 'transparent', border: 'none', color: copied ? 'var(--color-profit)' : 'var(--text-muted)', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="code-container" style={{ fontSize: '0.72rem', overflowX: 'auto' }}>
                {getCurlSnippet()}
              </pre>
            </div>
          </div>
        </div>

        {/* Right: API JSON Response Output */}
        <div className="ent-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="ent-panel-header">
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>JSON Response Telemetry</span>
            <span className="ent-badge ent-badge-normal">HTTP 200 OK</span>
          </div>

          <pre className="code-container" style={{
            flex: 1,
            margin: 0,
            borderRadius: 0,
            borderBottomLeftRadius: 'var(--radius-md)',
            borderBottomRightRadius: 'var(--radius-md)',
            maxHeight: '480px',
            overflowY: 'auto'
          }}>
{selectedRoute === 'register' && JSON.stringify(regResponse || { message: 'Click "Send POST /api/v1/auth/register" to execute bcrypt test.' }, null, 2)}
{selectedRoute === 'risk' && JSON.stringify(riskResponse || { message: 'Click "Send GET /api/v1/risk/portfolio/1" to execute SP and VaR engine.' }, null, 2)}
{selectedRoute === 'hedge' && JSON.stringify(hedgeResponse || { message: 'Click "Send POST /api/v1/hedge/execute" to fire atomic transaction.' }, null, 2)}
          </pre>
        </div>
      </div>

    </div>
  );
};

export default ApiTesterView;
