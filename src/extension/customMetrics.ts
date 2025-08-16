// Custom Metrics - User-defined metrics and extensible analysis framework
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface CustomMetric {
  id: string;
  name: string;
  description: string;
  type: 'count' | 'percentage' | 'ratio' | 'time' | 'size';
  query: {
    pattern?: string; // Regex pattern to search for
    filePattern?: string; // File glob pattern
    excludePattern?: string; // Files to exclude
    countType?: 'lines' | 'matches' | 'files' | 'functions' | 'classes';
  };
  thresholds?: {
    good?: number;
    warning?: number;
    critical?: number;
  };
  unit?: string;
  category: 'quality' | 'performance' | 'security' | 'maintenance' | 'custom';
  createdBy: string;
  createdAt: Date;
  lastUpdated: Date;
}

export interface MetricResult {
  metric: CustomMetric;
  value: number;
  status: 'good' | 'warning' | 'critical' | 'unknown';
  message?: string;
  details?: Array<{
    file: string;
    line?: number;
    match?: string;
  }>;
  timestamp: Date;
}

export interface MetricDashboard {
  id: string;
  name: string;
  description: string;
  metrics: string[]; // Metric IDs
  layout: {
    columns: number;
    rows: number;
  };
  createdBy: string;
  createdAt: Date;
  shared: boolean;
}

export interface CustomMetricsConfig {
  metrics: CustomMetric[];
  dashboards: MetricDashboard[];
  settings: {
    refreshInterval: number;
    autoRefresh: boolean;
    enableNotifications: boolean;
  };
}

export class CustomMetricsFramework {
  private workspaceRoot: string;
  private configFile: string;
  private resultsFile: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.configFile = path.join(workspaceRoot, '.vscode', 'projectatlas-metrics.json');
    this.resultsFile = path.join(workspaceRoot, '.vscode', 'projectatlas-metric-results.json');
  }

  async loadConfiguration(): Promise<CustomMetricsConfig> {
    const defaultConfig: CustomMetricsConfig = {
      metrics: [],
      dashboards: [],
      settings: {
        refreshInterval: 300000, // 5 minutes
        autoRefresh: true,
        enableNotifications: true
      }
    };

    try {
      if (fs.existsSync(this.configFile)) {
        const content = fs.readFileSync(this.configFile, 'utf8');
        const config = JSON.parse(content);
        return {
          ...defaultConfig,
          ...config,
          metrics: config.metrics || [],
          dashboards: config.dashboards || []
        };
      }
    } catch (error) {
      console.error('Error loading custom metrics configuration:', error);
    }

    return defaultConfig;
  }

  async saveConfiguration(config: CustomMetricsConfig): Promise<void> {
    try {
      const vscodeDir = path.dirname(this.configFile);
      if (!fs.existsSync(vscodeDir)) {
        fs.mkdirSync(vscodeDir, { recursive: true });
      }

      fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error('Error saving custom metrics configuration:', error);
    }
  }

  async createMetric(metric: Omit<CustomMetric, 'id' | 'createdAt' | 'lastUpdated'>): Promise<CustomMetric> {
    const newMetric: CustomMetric = {
      ...metric,
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      lastUpdated: new Date()
    };

    const config = await this.loadConfiguration();
    config.metrics.push(newMetric);
    await this.saveConfiguration(config);

    return newMetric;
  }

  async updateMetric(id: string, updates: Partial<CustomMetric>): Promise<void> {
    const config = await this.loadConfiguration();
    const metricIndex = config.metrics.findIndex(m => m.id === id);
    
    if (metricIndex !== -1) {
      config.metrics[metricIndex] = {
        ...config.metrics[metricIndex],
        ...updates,
        lastUpdated: new Date()
      };
      await this.saveConfiguration(config);
    }
  }

  async deleteMetric(id: string): Promise<void> {
    const config = await this.loadConfiguration();
    config.metrics = config.metrics.filter(m => m.id !== id);
    
    // Remove from dashboards
    config.dashboards.forEach(dashboard => {
      dashboard.metrics = dashboard.metrics.filter(metricId => metricId !== id);
    });
    
    await this.saveConfiguration(config);
  }

  async executeMetric(metric: CustomMetric): Promise<MetricResult> {
    const result: MetricResult = {
      metric,
      value: 0,
      status: 'unknown',
      details: [],
      timestamp: new Date()
    };

    try {
      switch (metric.query.countType) {
        case 'lines':
          result.value = await this.countLines(metric);
          break;
        case 'matches':
          result.value = await this.countMatches(metric);
          break;
        case 'files':
          result.value = await this.countFiles(metric);
          break;
        case 'functions':
          result.value = await this.countFunctions(metric);
          break;
        case 'classes':
          result.value = await this.countClasses(metric);
          break;
        default:
          result.value = await this.countMatches(metric);
      }

      // Determine status based on thresholds
      if (metric.thresholds) {
        if (metric.thresholds.critical !== undefined && result.value >= metric.thresholds.critical) {
          result.status = 'critical';
          result.message = `Value ${result.value} exceeds critical threshold ${metric.thresholds.critical}`;
        } else if (metric.thresholds.warning !== undefined && result.value >= metric.thresholds.warning) {
          result.status = 'warning';
          result.message = `Value ${result.value} exceeds warning threshold ${metric.thresholds.warning}`;
        } else if (metric.thresholds.good !== undefined && result.value >= metric.thresholds.good) {
          result.status = 'good';
          result.message = `Value ${result.value} meets good threshold ${metric.thresholds.good}`;
        } else {
          result.status = 'good';
        }
      } else {
        result.status = 'good';
      }

    } catch (error) {
      console.error(`Error executing metric ${metric.name}:`, error);
      result.message = `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.status = 'critical';
    }

    return result;
  }

  private async countLines(metric: CustomMetric): Promise<number> {
    let totalLines = 0;
    const files = await this.getMatchingFiles(metric);

    for (const file of files) {
      try {
        const document = await vscode.workspace.openTextDocument(file);
        totalLines += document.lineCount;
      } catch (error) {
        // Skip files that can't be read
      }
    }

    return totalLines;
  }

  private async countMatches(metric: CustomMetric): Promise<number> {
    let totalMatches = 0;
    const files = await this.getMatchingFiles(metric);

    if (!metric.query.pattern) {
      return files.length; // Just count files if no pattern
    }

    const regex = new RegExp(metric.query.pattern, 'gi');

    for (const file of files) {
      try {
        const document = await vscode.workspace.openTextDocument(file);
        const content = document.getText();
        const matches = content.match(regex);
        totalMatches += matches ? matches.length : 0;
      } catch (error) {
        // Skip files that can't be read
      }
    }

    return totalMatches;
  }

  private async countFiles(metric: CustomMetric): Promise<number> {
    const files = await this.getMatchingFiles(metric);
    return files.length;
  }

  private async countFunctions(metric: CustomMetric): Promise<number> {
    let totalFunctions = 0;
    const files = await this.getMatchingFiles(metric);

    const functionPatterns = [
      /function\s+\w+/g,
      /\w+\s*:\s*function/g,
      /\w+\s*=\s*function/g,
      /def\s+\w+/g, // Python
      /func\s+\w+/g, // Go
      /public\s+\w+\s+\w+\s*\(/g, // Java/C#
    ];

    for (const file of files) {
      try {
        const document = await vscode.workspace.openTextDocument(file);
        const content = document.getText();
        
        for (const pattern of functionPatterns) {
          const matches = content.match(pattern);
          totalFunctions += matches ? matches.length : 0;
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    return totalFunctions;
  }

  private async countClasses(metric: CustomMetric): Promise<number> {
    let totalClasses = 0;
    const files = await this.getMatchingFiles(metric);

    const classPatterns = [
      /class\s+\w+/g,
      /interface\s+\w+/g,
      /struct\s+\w+/g,
      /enum\s+\w+/g,
    ];

    for (const file of files) {
      try {
        const document = await vscode.workspace.openTextDocument(file);
        const content = document.getText();
        
        for (const pattern of classPatterns) {
          const matches = content.match(pattern);
          totalClasses += matches ? matches.length : 0;
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    return totalClasses;
  }

  private async getMatchingFiles(metric: CustomMetric): Promise<vscode.Uri[]> {
    const filePattern = metric.query.filePattern || '**/*';
    const excludePattern = metric.query.excludePattern || '**/node_modules/**';
    
    return await vscode.workspace.findFiles(filePattern, excludePattern, 1000);
  }

  async executeAllMetrics(): Promise<MetricResult[]> {
    const config = await this.loadConfiguration();
    const results: MetricResult[] = [];

    for (const metric of config.metrics) {
      const result = await this.executeMetric(metric);
      results.push(result);
    }

    // Save results
    await this.saveResults(results);

    return results;
  }

  async saveResults(results: MetricResult[]): Promise<void> {
    try {
      const vscodeDir = path.dirname(this.resultsFile);
      if (!fs.existsSync(vscodeDir)) {
        fs.mkdirSync(vscodeDir, { recursive: true });
      }

      // Load existing results
      let allResults: MetricResult[] = [];
      if (fs.existsSync(this.resultsFile)) {
        const content = fs.readFileSync(this.resultsFile, 'utf8');
        allResults = JSON.parse(content);
      }

      // Add new results
      allResults.push(...results);

      // Keep only last 1000 results
      allResults = allResults.slice(-1000);

      fs.writeFileSync(this.resultsFile, JSON.stringify(allResults, null, 2));
    } catch (error) {
      console.error('Error saving metric results:', error);
    }
  }

  async loadResults(): Promise<MetricResult[]> {
    try {
      if (fs.existsSync(this.resultsFile)) {
        const content = fs.readFileSync(this.resultsFile, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('Error loading metric results:', error);
    }
    return [];
  }

  async createDashboard(dashboard: Omit<MetricDashboard, 'id' | 'createdAt'>): Promise<MetricDashboard> {
    const newDashboard: MetricDashboard = {
      ...dashboard,
      id: `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };

    const config = await this.loadConfiguration();
    config.dashboards.push(newDashboard);
    await this.saveConfiguration(config);

    return newDashboard;
  }

  async getBuiltInMetrics(): Promise<CustomMetric[]> {
    return [
      {
        id: 'todo_comments',
        name: 'TODO Comments',
        description: 'Count of TODO comments in code',
        type: 'count',
        query: {
          pattern: '//\\s*TODO|#\\s*TODO|/\\*\\s*TODO',
          filePattern: '**/*.{ts,js,tsx,jsx,py,go,java,c,cpp,cs}',
          countType: 'matches'
        },
        thresholds: {
          good: 0,
          warning: 10,
          critical: 25
        },
        category: 'maintenance',
        createdBy: 'system',
        createdAt: new Date(),
        lastUpdated: new Date()
      },
      {
        id: 'console_logs',
        name: 'Console Logs',
        description: 'Count of console.log statements (potential debug code)',
        type: 'count',
        query: {
          pattern: 'console\\.log\\s*\\(',
          filePattern: '**/*.{ts,js,tsx,jsx}',
          countType: 'matches'
        },
        thresholds: {
          good: 0,
          warning: 5,
          critical: 15
        },
        category: 'quality',
        createdBy: 'system',
        createdAt: new Date(),
        lastUpdated: new Date()
      },
      {
        id: 'large_files',
        name: 'Large Files',
        description: 'Files with more than 500 lines',
        type: 'count',
        query: {
          filePattern: '**/*.{ts,js,tsx,jsx,py,go,java}',
          countType: 'files'
        },
        thresholds: {
          good: 0,
          warning: 5,
          critical: 15
        },
        category: 'quality',
        createdBy: 'system',
        createdAt: new Date(),
        lastUpdated: new Date()
      },
      {
        id: 'test_files',
        name: 'Test Files',
        description: 'Number of test files in the project',
        type: 'count',
        query: {
          filePattern: '**/*.{test,spec}.{ts,js,tsx,jsx}',
          countType: 'files'
        },
        thresholds: {
          good: 10,
          warning: 5,
          critical: 0
        },
        category: 'quality',
        createdBy: 'system',
        createdAt: new Date(),
        lastUpdated: new Date()
      }
    ];
  }

  async getMetricTrends(metricId: string, days: number = 30): Promise<Array<{ date: Date; value: number }>> {
    const results = await this.loadResults();
    const metricResults = results.filter(r => r.metric.id === metricId);
    
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentResults = metricResults.filter(r => r.timestamp >= cutoffDate);
    
    return recentResults.map(r => ({
      date: r.timestamp,
      value: r.value
    })).sort((a, b) => a.date.getTime() - b.date.getTime());
  }
}
