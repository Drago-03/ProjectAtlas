import React, { useState, useEffect, useCallback } from 'react';
import './styles.css';

// VS Code API types
declare global {
  interface Window {
    acquireVsCodeApi: () => {
      postMessage: (message: any) => void;
      setState: (state: any) => void;
      getState: () => any;
    };
  }
}

interface VSCodeAPI {
  postMessage: (message: any) => void;
  setState: (state: any) => void;
  getState: () => any;
}

interface AppState {
  isLoading: boolean;
  error: string | null;
  theme: 'default' | 'dark' | 'playful';
  symbols: any[];
  diagnostics: any[];
  activeTab: 'overview' | 'analysis' | 'performance' | 'dependencies';
  codeMetrics: {
    complexity: number;
    maintainabilityIndex: number;
    codeSmells: number;
    testCoverage: number;
    technicalDebt: string;
  };
  performanceData: {
    buildTime: number;
    bundleSize: number;
    loadTime: number;
    memoryUsage: number;
  };
  dependencies: {
    total: number;
    outdated: number;
    vulnerable: number;
    licenses: string[];
  };
  stats: {
    files: number;
    symbols: number;
    errors: number;
    warnings: number;
  };
  debugInfo: {
    vscodeApi: boolean;
    timestamp: string;
    loadTime: number;
    retryCount: number;
  };
}

const LOADING_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;

export const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    isLoading: true,
    error: null,
    theme: 'default',
    symbols: [],
    diagnostics: [],
    activeTab: 'overview',
    codeMetrics: {
      complexity: 0,
      maintainabilityIndex: 85,
      codeSmells: 0,
      testCoverage: 0,
      technicalDebt: '0h',
    },
    performanceData: {
      buildTime: 0,
      bundleSize: 0,
      loadTime: 0,
      memoryUsage: 0,
    },
    dependencies: {
      total: 0,
      outdated: 0,
      vulnerable: 0,
      licenses: [],
    },
    stats: { files: 0, symbols: 0, errors: 0, warnings: 0 },
    debugInfo: {
      vscodeApi: false,
      timestamp: new Date().toISOString(),
      loadTime: 0,
      retryCount: 0,
    },
  });

  const [vscodeApi, setVscodeApi] = useState<VSCodeAPI | null>(null);
  const [startTime] = useState(Date.now());

  // Initialize VS Code API
  const initializeVSCodeApi = useCallback(async () => {
    try {
      if (typeof window.acquireVsCodeApi === 'function') {
        const api = window.acquireVsCodeApi();
        setVscodeApi(api);

        setState((prev) => ({
          ...prev,
          debugInfo: {
            ...prev.debugInfo,
            vscodeApi: true,
            loadTime: Date.now() - startTime,
          },
        }));

        // Request initial data
        api.postMessage({ command: 'getSymbols' });
        api.postMessage({ command: 'getDiagnostics' });
        api.postMessage({ command: 'getCodeMetrics' });
        api.postMessage({ command: 'getPerformanceData' });
        api.postMessage({ command: 'getDependencies' });

        return true;
      } else {
        throw new Error('VS Code API not available');
      }
    } catch (err) {
      console.error('Failed to initialize VS Code API:', err);
      setState((prev) => ({
        ...prev,
        error: `VS Code API initialization failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        debugInfo: {
          ...prev.debugInfo,
          vscodeApi: false,
          loadTime: Date.now() - startTime,
        },
      }));
      return false;
    }
  }, [startTime]);

  // Handle messages from extension
  const handleMessage = useCallback((event: MessageEvent) => {
    const message = event.data;

    switch (message.command) {
      case 'updateSymbols':
        setState((prev) => ({
          ...prev,
          symbols: message.symbols || [],
          isLoading: false,
          stats: {
            ...prev.stats,
            symbols: message.symbols?.length || 0,
          },
        }));
        break;

      case 'updateDiagnostics':
        setState((prev) => ({
          ...prev,
          diagnostics: message.diagnostics || [],
          stats: {
            ...prev.stats,
            errors:
              message.diagnostics?.filter((d: any) => d.severity === 1)
                .length || 0,
            warnings:
              message.diagnostics?.filter((d: any) => d.severity === 2)
                .length || 0,
          },
        }));
        break;

      case 'updateCodeMetrics':
        setState((prev) => ({
          ...prev,
          codeMetrics: { ...prev.codeMetrics, ...message.metrics },
        }));
        break;

      case 'updatePerformanceData':
        setState((prev) => ({
          ...prev,
          performanceData: { ...prev.performanceData, ...message.data },
        }));
        break;

      case 'updateDependencies':
        setState((prev) => ({
          ...prev,
          dependencies: { ...prev.dependencies, ...message.dependencies },
        }));
        break;

      case 'updateStats':
        setState((prev) => ({
          ...prev,
          stats: { ...prev.stats, ...message.stats },
        }));
        break;

      default:
        console.log('Received unknown message:', message);
    }
  }, []);

  // Retry initialization
  const retryInitialization = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      debugInfo: {
        ...prev.debugInfo,
        retryCount: prev.debugInfo.retryCount + 1,
        timestamp: new Date().toISOString(),
      },
    }));

    const success = await initializeVSCodeApi();
    if (!success && state.debugInfo.retryCount < MAX_RETRIES) {
      setTimeout(retryInitialization, 2000);
    } else if (!success) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Failed to initialize after maximum retries',
      }));
    }
  }, [initializeVSCodeApi, state.debugInfo.retryCount]);

  // Initial setup
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const setup = async () => {
      // Add message listener
      window.addEventListener('message', handleMessage);

      // Initialize API
      const success = await initializeVSCodeApi();

      if (success && mounted) {
        // Set loading timeout
        timeoutId = setTimeout(() => {
          if (mounted) {
            setState((prev) => ({
              ...prev,
              isLoading: false,
              error:
                prev.symbols.length === 0
                  ? 'Loading timeout - no data received'
                  : null,
            }));
          }
        }, LOADING_TIMEOUT);
      }
    };

    setup();

    return () => {
      mounted = false;
      window.removeEventListener('message', handleMessage);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [initializeVSCodeApi, handleMessage]);

  // Theme management
  const toggleTheme = useCallback(() => {
    setState((prev) => ({
      ...prev,
      theme:
        prev.theme === 'default'
          ? 'dark'
          : prev.theme === 'dark'
            ? 'playful'
            : 'default',
    }));
  }, []);

  // Tab management
  const switchTab = useCallback((tab: AppState['activeTab']) => {
    setState((prev) => ({ ...prev, activeTab: tab }));
  }, []);

  // Refresh data
  const refreshData = useCallback(() => {
    if (vscodeApi) {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      vscodeApi.postMessage({ command: 'getSymbols' });
      vscodeApi.postMessage({ command: 'getDiagnostics' });
      vscodeApi.postMessage({ command: 'getCodeMetrics' });
      vscodeApi.postMessage({ command: 'getPerformanceData' });
      vscodeApi.postMessage({ command: 'getDependencies' });
    } else {
      retryInitialization();
    }
  }, [vscodeApi, retryInitialization]);

  // Get complexity color
  const getComplexityColor = (complexity: number) => {
    if (complexity < 10) return 'var(--success-color)';
    if (complexity < 20) return 'var(--warning-color)';
    return 'var(--error-color)';
  };

  // Get maintainability color
  const getMaintainabilityColor = (index: number) => {
    if (index >= 80) return 'var(--success-color)';
    if (index >= 60) return 'var(--warning-color)';
    return 'var(--error-color)';
  };

  // Loading state
  if (state.isLoading) {
    return (
      <div className={`container theme-${state.theme}`}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>🚀 Loading ProjectAtlas UI...</h2>
          <div className="loading-details">
            <p>Initializing VS Code integration...</p>
            <p>Gathering project symbols and diagnostics...</p>
            <p>Analyzing code metrics and dependencies...</p>
            {state.debugInfo.retryCount > 0 && (
              <p>
                Retry attempt: {state.debugInfo.retryCount}/{MAX_RETRIES}
              </p>
            )}
          </div>
          <details className="debug-info">
            <summary>🔧 Debug Information</summary>
            <ul>
              <li>
                VS Code API:{' '}
                {state.debugInfo.vscodeApi
                  ? '✅ Connected'
                  : '❌ Not available'}
              </li>
              <li>Load time: {state.debugInfo.loadTime}ms</li>
              <li>Timestamp: {state.debugInfo.timestamp}</li>
              <li>Retry count: {state.debugInfo.retryCount}</li>
            </ul>
          </details>
        </div>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div className={`container theme-${state.theme}`}>
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>ProjectAtlas Error</h2>
          <div className="error-message">
            <strong>Error:</strong> {state.error}
          </div>
          <div className="error-actions">
            <button className="btn-primary" onClick={retryInitialization}>
              🔄 Retry
            </button>
            <button className="btn-secondary" onClick={refreshData}>
              📊 Refresh Data
            </button>
          </div>
          <details className="debug-info">
            <summary>🔧 Debug Information</summary>
            <ul>
              <li>
                VS Code API:{' '}
                {state.debugInfo.vscodeApi ? '✅ Available' : '❌ Missing'}
              </li>
              <li>Window location: {window.location.href}</li>
              <li>User agent: {navigator.userAgent}</li>
              <li>Load time: {state.debugInfo.loadTime}ms</li>
              <li>Retry count: {state.debugInfo.retryCount}</li>
              <li>Timestamp: {state.debugInfo.timestamp}</li>
            </ul>
          </details>
        </div>
      </div>
    );
  }

  // Main UI
  return (
    <div className={`container theme-${state.theme}`}>
      {/* Header */}
      <div className="header">
        <div className="header-section">
          <h1>🗺️ ProjectAtlas</h1>
          <span className="badge">v0.2.4</span>
        </div>
        <div className="header-controls">
          <button className="theme-toggle" onClick={toggleTheme}>
            🎨{' '}
            {state.theme === 'default'
              ? 'Light'
              : state.theme === 'dark'
                ? 'Dark'
                : 'Playful'}
          </button>
          <button className="refresh-btn" onClick={refreshData}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="nav-tabs">
        <button
          className={`nav-tab ${state.activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => switchTab('overview')}
        >
          📋 Overview
        </button>
        <button
          className={`nav-tab ${state.activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => switchTab('analysis')}
        >
          🔍 Code Analysis
        </button>
        <button
          className={`nav-tab ${state.activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => switchTab('performance')}
        >
          ⚡ Performance
        </button>
        <button
          className={`nav-tab ${state.activeTab === 'dependencies' ? 'active' : ''}`}
          onClick={() => switchTab('dependencies')}
        >
          📦 Dependencies
        </button>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat">
          <div className="stat-label">Files</div>
          <div className="stat-value">{state.stats.files}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Symbols</div>
          <div className="stat-value">{state.stats.symbols}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Errors</div>
          <div className="stat-value">{state.stats.errors}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Warnings</div>
          <div className="stat-value">{state.stats.warnings}</div>
        </div>
      </div>

      {/* Content */}
      <div className="main-content">
        {/* Overview Tab */}
        {state.activeTab === 'overview' && (
          <>
            {/* Symbols Section */}
            <div className="diagrams-section">
              <h2>📋 Project Symbols</h2>
              {state.symbols.length > 0 ? (
                <div className="symbols-info">
                  <p>Found {state.symbols.length} symbols in your project:</p>
                  <ul>
                    {state.symbols
                      .slice(0, 10)
                      .map((symbol: any, index: number) => (
                        <li key={index}>
                          <strong>{symbol.name}</strong> ({symbol.kind}) -{' '}
                          {symbol.location?.uri}
                        </li>
                      ))}
                  </ul>
                  {state.symbols.length > 10 && (
                    <p>
                      <em>... and {state.symbols.length - 10} more symbols</em>
                    </p>
                  )}
                </div>
              ) : (
                <div className="empty-state">
                  <p>📄 No symbols found</p>
                  <small>Open a source file to see project symbols</small>
                </div>
              )}
            </div>

            {/* Diagnostics Section */}
            <div className="diagnostics-section">
              <h2>🔍 Diagnostics</h2>
              {state.diagnostics.length > 0 ? (
                <ul className="diagnostics-list">
                  {state.diagnostics
                    .slice(0, 5)
                    .map((diagnostic: any, index: number) => (
                      <li key={index} className="diagnostic-item">
                        <strong>
                          {diagnostic.severity === 1 ? '❌' : '⚠️'}
                        </strong>{' '}
                        {diagnostic.message}
                        <br />
                        <small>
                          📁 {diagnostic.source} - Line{' '}
                          {diagnostic.range?.start?.line + 1}
                        </small>
                      </li>
                    ))}
                </ul>
              ) : (
                <div className="empty-state">
                  <p>✅ No diagnostics found</p>
                  <small>Your code looks clean!</small>
                </div>
              )}
            </div>

            {/* Workflow Section */}
            <div className="workflow-section">
              <h2>⚡ Quick Actions</h2>
              <div className="action-buttons">
                <button
                  className="btn-primary"
                  onClick={() =>
                    vscodeApi?.postMessage({ command: 'generateDiagram' })
                  }
                >
                  📊 Generate Diagram
                </button>
                <button
                  className="btn-secondary"
                  onClick={() =>
                    vscodeApi?.postMessage({ command: 'openSettings' })
                  }
                >
                  ⚙️ Settings
                </button>
                <button
                  className="btn-secondary"
                  onClick={() =>
                    vscodeApi?.postMessage({ command: 'showHelp' })
                  }
                >
                  ❓ Help
                </button>
              </div>
            </div>
          </>
        )}

        {/* Code Analysis Tab */}
        {state.activeTab === 'analysis' && (
          <div className="analysis-dashboard">
            <h2>🔍 Code Analysis Dashboard</h2>

            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-header">
                  <h3>📊 Complexity Score</h3>
                  <div
                    className="metric-value"
                    style={{
                      color: getComplexityColor(state.codeMetrics.complexity),
                    }}
                  >
                    {state.codeMetrics.complexity}
                  </div>
                </div>
                <div className="metric-description">
                  Cyclomatic complexity of your codebase
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-fill ${
                      state.codeMetrics.complexity < 10
                        ? 'complexity-low'
                        : state.codeMetrics.complexity < 20
                          ? 'complexity-medium'
                          : 'complexity-high'
                    }`}
                  ></div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <h3>🛠️ Maintainability</h3>
                  <div
                    className="metric-value"
                    style={{
                      color: getMaintainabilityColor(
                        state.codeMetrics.maintainabilityIndex
                      ),
                    }}
                  >
                    {state.codeMetrics.maintainabilityIndex}
                  </div>
                </div>
                <div className="metric-description">
                  Maintainability index (0-100)
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-fill ${
                      state.codeMetrics.maintainabilityIndex >= 80
                        ? 'maintainability-high'
                        : state.codeMetrics.maintainabilityIndex >= 60
                          ? 'maintainability-medium'
                          : 'maintainability-low'
                    }`}
                  ></div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <h3>🚨 Code Smells</h3>
                  <div className="metric-value">
                    {state.codeMetrics.codeSmells}
                  </div>
                </div>
                <div className="metric-description">
                  Potential code issues detected
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <h3>🧪 Test Coverage</h3>
                  <div className="metric-value">
                    {state.codeMetrics.testCoverage}%
                  </div>
                </div>
                <div className="metric-description">
                  Percentage of code covered by tests
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-fill ${
                      state.codeMetrics.testCoverage >= 80
                        ? 'coverage-high'
                        : state.codeMetrics.testCoverage >= 60
                          ? 'coverage-medium'
                          : 'coverage-low'
                    }`}
                  ></div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <h3>⏱️ Technical Debt</h3>
                  <div className="metric-value">
                    {state.codeMetrics.technicalDebt}
                  </div>
                </div>
                <div className="metric-description">
                  Estimated time to fix issues
                </div>
              </div>
            </div>

            <div className="analysis-actions">
              <button
                className="btn-primary"
                onClick={() =>
                  vscodeApi?.postMessage({ command: 'runCodeAnalysis' })
                }
              >
                🔄 Refresh Analysis
              </button>
              <button
                className="btn-secondary"
                onClick={() =>
                  vscodeApi?.postMessage({ command: 'exportReport' })
                }
              >
                📄 Export Report
              </button>
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {state.activeTab === 'performance' && (
          <div className="performance-dashboard">
            <h2>⚡ Performance Metrics</h2>

            <div className="performance-grid">
              <div className="perf-card">
                <div className="perf-icon">🏗️</div>
                <div className="perf-content">
                  <h3>Build Time</h3>
                  <div className="perf-value">
                    {state.performanceData.buildTime}ms
                  </div>
                  <div className="perf-trend">
                    {state.performanceData.buildTime < 5000
                      ? '🟢 Excellent'
                      : state.performanceData.buildTime < 15000
                        ? '🟡 Good'
                        : '🔴 Slow'}
                  </div>
                </div>
              </div>

              <div className="perf-card">
                <div className="perf-icon">📦</div>
                <div className="perf-content">
                  <h3>Bundle Size</h3>
                  <div className="perf-value">
                    {(state.performanceData.bundleSize / 1024 / 1024).toFixed(
                      2
                    )}{' '}
                    MB
                  </div>
                  <div className="perf-trend">
                    {state.performanceData.bundleSize < 1024 * 1024
                      ? '🟢 Optimized'
                      : state.performanceData.bundleSize < 5 * 1024 * 1024
                        ? '🟡 Moderate'
                        : '🔴 Large'}
                  </div>
                </div>
              </div>

              <div className="perf-card">
                <div className="perf-icon">⚡</div>
                <div className="perf-content">
                  <h3>Load Time</h3>
                  <div className="perf-value">
                    {state.performanceData.loadTime}ms
                  </div>
                  <div className="perf-trend">
                    {state.performanceData.loadTime < 1000
                      ? '🟢 Fast'
                      : state.performanceData.loadTime < 3000
                        ? '🟡 Average'
                        : '🔴 Slow'}
                  </div>
                </div>
              </div>

              <div className="perf-card">
                <div className="perf-icon">🧠</div>
                <div className="perf-content">
                  <h3>Memory Usage</h3>
                  <div className="perf-value">
                    {(state.performanceData.memoryUsage / 1024 / 1024).toFixed(
                      1
                    )}{' '}
                    MB
                  </div>
                  <div className="perf-trend">
                    {state.performanceData.memoryUsage < 50 * 1024 * 1024
                      ? '🟢 Efficient'
                      : state.performanceData.memoryUsage < 100 * 1024 * 1024
                        ? '🟡 Moderate'
                        : '🔴 High'}
                  </div>
                </div>
              </div>
            </div>

            <div className="performance-actions">
              <button
                className="btn-primary"
                onClick={() =>
                  vscodeApi?.postMessage({ command: 'profilePerformance' })
                }
              >
                📊 Profile Performance
              </button>
              <button
                className="btn-secondary"
                onClick={() =>
                  vscodeApi?.postMessage({ command: 'optimizeBuild' })
                }
              >
                🚀 Optimize Build
              </button>
            </div>
          </div>
        )}

        {/* Dependencies Tab */}
        {state.activeTab === 'dependencies' && (
          <div className="dependencies-dashboard">
            <h2>📦 Dependencies Overview</h2>

            <div className="deps-summary">
              <div className="deps-card">
                <div className="deps-icon">📦</div>
                <div className="deps-content">
                  <h3>Total Dependencies</h3>
                  <div className="deps-value">{state.dependencies.total}</div>
                </div>
              </div>

              <div className="deps-card warning">
                <div className="deps-icon">⬆️</div>
                <div className="deps-content">
                  <h3>Outdated</h3>
                  <div className="deps-value">
                    {state.dependencies.outdated}
                  </div>
                </div>
              </div>

              <div className="deps-card danger">
                <div className="deps-icon">🚨</div>
                <div className="deps-content">
                  <h3>Vulnerable</h3>
                  <div className="deps-value">
                    {state.dependencies.vulnerable}
                  </div>
                </div>
              </div>
            </div>

            <div className="licenses-section">
              <h3>📜 License Distribution</h3>
              {state.dependencies.licenses.length > 0 ? (
                <div className="licenses-list">
                  {state.dependencies.licenses.map((license, index) => (
                    <span key={index} className="license-badge">
                      {license}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No license information available</p>
                </div>
              )}
            </div>

            <div className="dependencies-actions">
              <button
                className="btn-primary"
                onClick={() =>
                  vscodeApi?.postMessage({ command: 'checkDependencies' })
                }
              >
                🔍 Audit Dependencies
              </button>
              <button
                className="btn-secondary"
                onClick={() =>
                  vscodeApi?.postMessage({ command: 'updateDependencies' })
                }
              >
                ⬆️ Update All
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="footer">
          <p>
            <strong>ProjectAtlas</strong> - Navigate your codebase with
            confidence 🧭
          </p>
          <small>
            {state.debugInfo.vscodeApi ? '🟢 Connected' : '🔴 Disconnected'} •
            Load time: {state.debugInfo.loadTime}ms • Theme: {state.theme} •
            Version: 0.2.4
          </small>
        </div>
      </div>
    </div>
  );
};

export default App;
