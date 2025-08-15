import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  activeTab:
    | 'overview'
    | 'analysis'
    | 'performance'
    | 'dependencies'
    | 'search'
    | 'export';
  searchQuery: string;
  searchResults: any[];
  loadingProgress: number;
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: number;
  }>;
  codeMetrics: {
    complexity: number;
    maintainabilityIndex: number;
    codeSmells: number;
    testCoverage: number;
    technicalDebt: string;
    linesOfCode: number;
    duplicateCode: number;
    cyclomaticComplexity: number;
  };
  performanceData: {
    buildTime: number;
    bundleSize: number;
    loadTime: number;
    memoryUsage: number;
    cpuUsage: number;
    diskSpace: number;
  };
  dependencies: {
    total: number;
    outdated: number;
    vulnerable: number;
    licenses: string[];
    devDependencies: number;
    peerDependencies: number;
  };
  stats: {
    files: number;
    symbols: number;
    errors: number;
    warnings: number;
    functions: number;
    classes: number;
    interfaces: number;
  };
  debugInfo: {
    vscodeApi: boolean;
    timestamp: string;
    loadTime: number;
    retryCount: number;
    dataReceived: number;
  };
  realTimeUpdates: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
}

const LOADING_TIMEOUT = 30000; // 30 seconds - increased from 10
const MAX_RETRIES = 7; // Increased from 3

export const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    isLoading: true,
    error: null,
    theme: 'default',
    symbols: [],
    diagnostics: [],
    activeTab: 'overview',
    searchQuery: '',
    searchResults: [],
    loadingProgress: 0,
    notifications: [],
    codeMetrics: {
      complexity: 0,
      maintainabilityIndex: 85,
      codeSmells: 0,
      testCoverage: 0,
      technicalDebt: '0h',
      linesOfCode: 0,
      duplicateCode: 0,
      cyclomaticComplexity: 0,
    },
    performanceData: {
      buildTime: 0,
      bundleSize: 0,
      loadTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      diskSpace: 0,
    },
    dependencies: {
      total: 0,
      outdated: 0,
      vulnerable: 0,
      licenses: [],
      devDependencies: 0,
      peerDependencies: 0,
    },
    stats: {
      files: 0,
      symbols: 0,
      errors: 0,
      warnings: 0,
      functions: 0,
      classes: 0,
      interfaces: 0,
    },
    debugInfo: {
      vscodeApi: false,
      timestamp: new Date().toISOString(),
      loadTime: 0,
      retryCount: 0,
      dataReceived: 0,
    },
    realTimeUpdates: true,
    autoRefresh: false,
    refreshInterval: 30000,
  });

  const [vscodeApi, setVscodeApi] = useState<VSCodeAPI | null>(null);
  const [startTime] = useState(Date.now());
  const dataReceivedRef = useRef(0);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Notification system
  const addNotification = useCallback(
    (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
      const notification = {
        id: Date.now().toString(),
        type,
        message,
        timestamp: Date.now(),
      };
      setState((prev) => ({
        ...prev,
        notifications: [...prev.notifications.slice(-4), notification], // Keep only last 5
      }));

      // Auto-remove after 5 seconds
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          notifications: prev.notifications.filter(
            (n) => n.id !== notification.id
          ),
        }));
      }, 5000);
    },
    []
  );

  // Search functionality
  const handleSearch = useCallback(
    (query: string) => {
      setState((prev) => ({ ...prev, searchQuery: query }));

      if (!query.trim()) {
        setState((prev) => ({ ...prev, searchResults: [] }));
        return;
      }

      // Search through symbols and diagnostics
      const symbolResults = state.symbols.filter(
        (symbol) =>
          symbol.name?.toLowerCase().includes(query.toLowerCase()) ||
          symbol.kind?.toLowerCase().includes(query.toLowerCase())
      );

      const diagnosticResults = state.diagnostics.filter(
        (diagnostic) =>
          diagnostic.message?.toLowerCase().includes(query.toLowerCase()) ||
          diagnostic.source?.toLowerCase().includes(query.toLowerCase())
      );

      setState((prev) => ({
        ...prev,
        searchResults: [
          ...symbolResults.map((s) => ({ ...s, type: 'symbol' })),
          ...diagnosticResults.map((d) => ({ ...d, type: 'diagnostic' })),
        ],
      }));
    },
    [state.symbols, state.diagnostics]
  );

  // Progress tracking
  const updateProgress = useCallback((progress: number) => {
    setState((prev) => ({
      ...prev,
      loadingProgress: Math.min(100, Math.max(0, progress)),
    }));
  }, []);

  // Export functionality
  const exportData = useCallback(
    (format: 'json' | 'csv' | 'pdf') => {
      const data = {
        timestamp: new Date().toISOString(),
        stats: state.stats,
        codeMetrics: state.codeMetrics,
        performanceData: state.performanceData,
        dependencies: state.dependencies,
        symbols: state.symbols,
        diagnostics: state.diagnostics,
      };

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `project-atlas-export-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        addNotification('success', 'Data exported as JSON successfully!');
      } else if (format === 'csv') {
        // Convert to CSV format
        const csvContent = [
          'Metric,Value',
          `Files,${state.stats.files}`,
          `Symbols,${state.stats.symbols}`,
          `Errors,${state.stats.errors}`,
          `Warnings,${state.stats.warnings}`,
          `Complexity,${state.codeMetrics.complexity}`,
          `Maintainability Index,${state.codeMetrics.maintainabilityIndex}`,
          `Build Time,${state.performanceData.buildTime}ms`,
          `Bundle Size,${state.performanceData.bundleSize}KB`,
          `Dependencies,${state.dependencies.total}`,
          `Outdated Dependencies,${state.dependencies.outdated}`,
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `project-atlas-export-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        addNotification('success', 'Data exported as CSV successfully!');
      }
    },
    [state, addNotification]
  );

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

        // Request initial data with a small delay to ensure everything is ready
        setTimeout(() => {
          api.postMessage({ command: 'getSymbols' });
          api.postMessage({ command: 'getDiagnostics' });
          api.postMessage({ command: 'getCodeMetrics' });
          api.postMessage({ command: 'getPerformanceData' });
          api.postMessage({ command: 'getDependencies' });
        }, 100);

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
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      const message = event.data;

      switch (message.command) {
        case 'updateSymbols':
          dataReceivedRef.current += 1;
          updateProgress(20);
          setState((prev) => ({
            ...prev,
            symbols: message.symbols || [],
            isLoading: false,
            error: null,
            stats: {
              ...prev.stats,
              symbols: message.symbols?.length || 0,
              functions:
                message.symbols?.filter((s: any) => s.kind === 'Function')
                  .length || 0,
              classes:
                message.symbols?.filter((s: any) => s.kind === 'Class')
                  .length || 0,
              interfaces:
                message.symbols?.filter((s: any) => s.kind === 'Interface')
                  .length || 0,
            },
            debugInfo: {
              ...prev.debugInfo,
              dataReceived: dataReceivedRef.current,
            },
          }));
          addNotification(
            'success',
            `Loaded ${message.symbols?.length || 0} symbols`
          );
          break;

        case 'updateDiagnostics':
          dataReceivedRef.current += 1;
          updateProgress(40);
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
            debugInfo: {
              ...prev.debugInfo,
              dataReceived: dataReceivedRef.current,
            },
          }));
          break;

        case 'updateCodeMetrics':
          dataReceivedRef.current += 1;
          updateProgress(60);
          setState((prev) => ({
            ...prev,
            codeMetrics: { ...prev.codeMetrics, ...message.metrics },
            debugInfo: {
              ...prev.debugInfo,
              dataReceived: dataReceivedRef.current,
            },
          }));
          break;

        case 'updatePerformanceData':
          dataReceivedRef.current += 1;
          updateProgress(80);
          setState((prev) => ({
            ...prev,
            performanceData: { ...prev.performanceData, ...message.data },
            debugInfo: {
              ...prev.debugInfo,
              dataReceived: dataReceivedRef.current,
            },
          }));
          break;

        case 'updateDependencies':
          dataReceivedRef.current += 1;
          updateProgress(100);
          setState((prev) => ({
            ...prev,
            dependencies: { ...prev.dependencies, ...message.dependencies },
            debugInfo: {
              ...prev.debugInfo,
              dataReceived: dataReceivedRef.current,
            },
          }));
          addNotification(
            'info',
            `Analyzed ${message.dependencies?.total || 0} dependencies`
          );
          break;

        case 'updateStats':
          dataReceivedRef.current += 1;
          setState((prev) => ({
            ...prev,
            stats: { ...prev.stats, ...message.stats },
            debugInfo: {
              ...prev.debugInfo,
              dataReceived: dataReceivedRef.current,
            },
          }));
          break;

        default:
          console.log('Received unknown message:', message);
      }
    },
    [addNotification, updateProgress]
  );

  // Retry initialization
  const retryInitialization = useCallback(async () => {
    dataReceivedRef.current = 0; // Reset counter
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
                dataReceivedRef.current === 0
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

  // Auto-refresh functionality
  useEffect(() => {
    if (state.autoRefresh && vscodeApi) {
      refreshIntervalRef.current = setInterval(() => {
        refreshData();
      }, state.refreshInterval);
    } else if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [state.autoRefresh, state.refreshInterval, vscodeApi, refreshData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'r':
            event.preventDefault();
            refreshData();
            break;
          case 'f':
            event.preventDefault();
            document.querySelector('.search-input')?.focus();
            break;
          case '1':
            event.preventDefault();
            switchTab('overview');
            break;
          case '2':
            event.preventDefault();
            switchTab('analysis');
            break;
          case '3':
            event.preventDefault();
            switchTab('performance');
            break;
          case '4':
            event.preventDefault();
            switchTab('dependencies');
            break;
          case '5':
            event.preventDefault();
            switchTab('search');
            break;
          case '6':
            event.preventDefault();
            switchTab('export');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [refreshData, switchTab]);

  // Auto-refresh functionality
  useEffect(() => {
    if (state.autoRefresh && state.refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        refreshData();
      }, state.refreshInterval);
    } else if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [state.autoRefresh, state.refreshInterval, vscodeApi, refreshData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'r':
            event.preventDefault();
            refreshData();
            break;
          case 'f':
            event.preventDefault();
            document.querySelector('.search-input')?.focus();
            break;
          case '1':
            event.preventDefault();
            switchTab('overview');
            break;
          case '2':
            event.preventDefault();
            switchTab('analysis');
            break;
          case '3':
            event.preventDefault();
            switchTab('performance');
            break;
          case '4':
            event.preventDefault();
            switchTab('dependencies');
            break;
          case '5':
            event.preventDefault();
            switchTab('search');
            break;
          case '6':
            event.preventDefault();
            switchTab('export');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [refreshData, switchTab]);

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
      dataReceivedRef.current = 0; // Reset counter
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

  // Enhanced loading state
  if (state.isLoading) {
    return (
      <div className={`container theme-${state.theme}`}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h1 className="loading-title">🚀 Loading ProjectAtlas UI...</h1>
          <div className="loading-progress">
            <div
              className="loading-progress-bar"
              style={{ width: `${state.loadingProgress}%` }}
            ></div>
          </div>
          <div className="loading-details">
            <p>Initializing VS Code integration...</p>
            <p>Gathering project symbols and diagnostics...</p>
            <p>Analyzing code metrics and dependencies...</p>
            <p>Progress: {state.loadingProgress}%</p>
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
              <li>Data responses: {state.debugInfo.dataReceived}/5</li>
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
            <button className="btn btn-primary" onClick={retryInitialization}>
              🔄 Retry
            </button>
            <button className="btn btn-secondary" onClick={refreshData}>
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
              <li>Data responses: {state.debugInfo.dataReceived}/5</li>
            </ul>
          </details>
        </div>
      </div>
    );
  }

  // Main UI
  return (
    <div className={`container theme-${state.theme}`}>
      {/* Notifications */}
      {state.notifications.length > 0 && (
        <div className="notifications-container">
          {state.notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification notification-${notification.type}`}
            >
              <span className="notification-icon">
                {notification.type === 'success'
                  ? '✅'
                  : notification.type === 'error'
                    ? '❌'
                    : notification.type === 'warning'
                      ? '⚠️'
                      : 'ℹ️'}
              </span>
              <span className="notification-message">
                {notification.message}
              </span>
              <button
                className="notification-close"
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    notifications: prev.notifications.filter(
                      (n) => n.id !== notification.id
                    ),
                  }))
                }
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="header">
        <div className="header-section">
          <h1>🗺️ ProjectAtlas</h1>
          <span className="badge">v0.2.5</span>
          {state.realTimeUpdates && (
            <span className="status-indicator status-success">🔴 Live</span>
          )}
        </div>
        <div className="header-controls">
          {/* Search Bar */}
          <div className="search-container">
            <input
              type="text"
              placeholder="Search symbols, diagnostics..."
              value={state.searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="search-input"
            />
            {state.searchQuery && (
              <button className="search-clear" onClick={() => handleSearch('')}>
                ✕
              </button>
            )}
          </div>

          <button
            className="btn btn-secondary"
            onClick={() =>
              setState((prev) => ({ ...prev, autoRefresh: !prev.autoRefresh }))
            }
          >
            {state.autoRefresh ? '⏸️ Stop Auto-refresh' : '▶️ Auto-refresh'}
          </button>

          <button
            className="btn btn-secondary theme-toggle"
            onClick={toggleTheme}
          >
            🎨{' '}
            {state.theme === 'default'
              ? 'Light'
              : state.theme === 'dark'
                ? 'Dark'
                : 'Playful'}
          </button>

          <button className="btn btn-primary refresh-btn" onClick={refreshData}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Enhanced Navigation Tabs */}
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
        <button
          className={`nav-tab ${state.activeTab === 'search' ? 'active' : ''}`}
          onClick={() => switchTab('search')}
        >
          🔎 Search
        </button>
        <button
          className={`nav-tab ${state.activeTab === 'export' ? 'active' : ''}`}
          onClick={() => switchTab('export')}
        >
          📤 Export
        </button>
      </div>

      {/* Enhanced Stats Bar */}
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
          <div className="stat-label">Functions</div>
          <div className="stat-value">{state.stats.functions}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Classes</div>
          <div className="stat-value">{state.stats.classes}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Errors</div>
          <div className="stat-value status-error">{state.stats.errors}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Warnings</div>
          <div className="stat-value status-warning">
            {state.stats.warnings}
          </div>
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

        {/* Search Tab */}
        {state.activeTab === 'search' && (
          <div className="tab-content">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">🔎 Search Results</h2>
                <div className="card-actions">
                  <span className="status-indicator status-info">
                    {state.searchResults.length} results
                  </span>
                </div>
              </div>

              {state.searchQuery ? (
                state.searchResults.length > 0 ? (
                  <div className="search-results">
                    {state.searchResults.map((result, index) => (
                      <div key={index} className="search-result-item">
                        <div className="result-header">
                          <span className={`result-type ${result.type}`}>
                            {result.type === 'symbol' ? '🔶' : '🔍'}{' '}
                            {result.type}
                          </span>
                          <h4>{result.name || result.message}</h4>
                        </div>
                        {result.kind && (
                          <div className="result-meta">Kind: {result.kind}</div>
                        )}
                        {result.uri && (
                          <div className="result-location">📁 {result.uri}</div>
                        )}
                        {result.severity && (
                          <div
                            className={`result-severity severity-${result.severity}`}
                          >
                            Severity:{' '}
                            {result.severity === 1
                              ? 'Error'
                              : result.severity === 2
                                ? 'Warning'
                                : 'Info'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <h3>No results found</h3>
                    <p>
                      Try adjusting your search query or check if data is
                      loaded.
                    </p>
                  </div>
                )
              ) : (
                <div className="empty-state">
                  <h3>Start searching</h3>
                  <p>
                    Use the search bar above to find symbols, diagnostics, and
                    more.
                  </p>
                  <div className="search-tips">
                    <h4>Search Tips:</h4>
                    <ul>
                      <li>
                        Search for function names, class names, or interfaces
                      </li>
                      <li>Look for error messages or diagnostic text</li>
                      <li>
                        Filter by symbol kinds (Function, Class, Interface)
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Export Tab */}
        {state.activeTab === 'export' && (
          <div className="tab-content">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">📤 Export Data</h2>
              </div>

              <div className="export-options">
                <div className="export-section">
                  <h3>Export Formats</h3>
                  <div className="export-buttons">
                    <button
                      className="btn btn-primary"
                      onClick={() => exportData('json')}
                    >
                      📄 Export JSON
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => exportData('csv')}
                    >
                      📊 Export CSV
                    </button>
                  </div>
                </div>

                <div className="export-preview">
                  <h3>What's Included</h3>
                  <div className="export-items">
                    <div className="export-item">
                      <span className="export-icon">📈</span>
                      <div className="export-info">
                        <h4>Project Statistics</h4>
                        <p>
                          Files, symbols, functions, classes, and interfaces
                          count
                        </p>
                      </div>
                    </div>
                    <div className="export-item">
                      <span className="export-icon">🔍</span>
                      <div className="export-info">
                        <h4>Code Metrics</h4>
                        <p>
                          Complexity, maintainability index, and code quality
                          metrics
                        </p>
                      </div>
                    </div>
                    <div className="export-item">
                      <span className="export-icon">⚡</span>
                      <div className="export-info">
                        <h4>Performance Data</h4>
                        <p>Build times, bundle sizes, and resource usage</p>
                      </div>
                    </div>
                    <div className="export-item">
                      <span className="export-icon">📦</span>
                      <div className="export-info">
                        <h4>Dependencies</h4>
                        <p>
                          Package information, versions, and security status
                        </p>
                      </div>
                    </div>
                    <div className="export-item">
                      <span className="export-icon">🔶</span>
                      <div className="export-info">
                        <h4>Symbols & Diagnostics</h4>
                        <p>Complete symbol table and diagnostic information</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Footer */}
        <div className="footer">
          <div className="footer-content">
            <div className="footer-section">
              <p>
                <strong>ProjectAtlas v0.2.5</strong> - Navigate your codebase
                with confidence 🧭
              </p>
              <div className="footer-stats">
                <span
                  className={
                    state.debugInfo.vscodeApi
                      ? 'status-success'
                      : 'status-error'
                  }
                >
                  {state.debugInfo.vscodeApi
                    ? '🟢 Connected'
                    : '🔴 Disconnected'}
                </span>
                <span>Load time: {state.debugInfo.loadTime}ms</span>
                <span>Theme: {state.theme}</span>
                <span>Real-time: {state.realTimeUpdates ? '✅' : '❌'}</span>
              </div>
            </div>
            <div className="footer-actions">
              {state.autoRefresh && (
                <span className="status-indicator status-info">
                  🔄 Auto-refreshing every {state.refreshInterval / 1000}s
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
