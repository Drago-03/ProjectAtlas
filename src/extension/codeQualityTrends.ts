// Code Quality Trends - Historical tracking of code quality metrics over time
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface QualityMetric {
  timestamp: Date;
  complexity: number;
  maintainabilityIndex: number;
  codeSmells: number;
  technicalDebt: number; // in hours
  linesOfCode: number;
  duplicateCode: number;
  testCoverage: number;
  vulnerabilities: number;
  issues: {
    critical: number;
    major: number;
    minor: number;
    info: number;
  };
}

export interface QualityTrend {
  metric: keyof QualityMetric;
  trend: 'improving' | 'degrading' | 'stable';
  changePercent: number;
  description: string;
}

export interface QualityReport {
  current: QualityMetric;
  history: QualityMetric[];
  trends: QualityTrend[];
  recommendations: string[];
  alerts: Array<{
    level: 'error' | 'warning' | 'info';
    message: string;
    timestamp: Date;
  }>;
}

export class CodeQualityTracker {
  private workspaceRoot: string;
  private historyFile: string;
  private maxHistoryEntries = 100;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.historyFile = path.join(workspaceRoot, '.vscode', 'projectatlas-quality-history.json');
  }

  async loadHistory(): Promise<QualityMetric[]> {
    try {
      if (fs.existsSync(this.historyFile)) {
        const content = fs.readFileSync(this.historyFile, 'utf8');
        const data = JSON.parse(content);
        return data.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading quality history:', error);
    }
    return [];
  }

  async saveHistory(history: QualityMetric[]): Promise<void> {
    try {
      // Ensure .vscode directory exists
      const vscodeDir = path.dirname(this.historyFile);
      if (!fs.existsSync(vscodeDir)) {
        fs.mkdirSync(vscodeDir, { recursive: true });
      }

      // Keep only the most recent entries
      const trimmedHistory = history.slice(-this.maxHistoryEntries);
      
      fs.writeFileSync(this.historyFile, JSON.stringify(trimmedHistory, null, 2));
    } catch (error) {
      console.error('Error saving quality history:', error);
    }
  }

  async recordCurrentMetrics(): Promise<QualityMetric> {
    const timestamp = new Date();
    
    // Calculate current metrics
    const complexity = await this.calculateComplexity();
    const maintainabilityIndex = await this.calculateMaintainabilityIndex();
    const codeSmells = await this.detectCodeSmells();
    const technicalDebt = await this.calculateTechnicalDebt();
    const linesOfCode = await this.countLinesOfCode();
    const duplicateCode = await this.detectDuplicateCode();
    const testCoverage = await this.getTestCoverage();
    const vulnerabilities = await this.scanVulnerabilities();
    const issues = await this.analyzeIssues();

    const currentMetric: QualityMetric = {
      timestamp,
      complexity,
      maintainabilityIndex,
      codeSmells,
      technicalDebt,
      linesOfCode,
      duplicateCode,
      testCoverage,
      vulnerabilities,
      issues
    };

    // Load existing history
    const history = await this.loadHistory();
    
    // Add current metric to history
    history.push(currentMetric);
    
    // Save updated history
    await this.saveHistory(history);

    return currentMetric;
  }

  async generateQualityReport(): Promise<QualityReport> {
    const current = await this.recordCurrentMetrics();
    const history = await this.loadHistory();
    
    const trends = this.calculateTrends(history);
    const recommendations = this.generateRecommendations(current, history);
    const alerts = this.generateAlerts(current, history);

    return {
      current,
      history,
      trends,
      recommendations,
      alerts
    };
  }

  private calculateTrends(history: QualityMetric[]): QualityTrend[] {
    const trends: QualityTrend[] = [];
    
    if (history.length < 2) {
      return trends; // Need at least 2 data points
    }

    const recent = history.slice(-5); // Last 5 entries
    const older = history.slice(-10, -5); // Previous 5 entries
    
    if (older.length === 0) {
      return trends;
    }

    const metrics: Array<keyof QualityMetric> = [
      'complexity',
      'maintainabilityIndex',
      'codeSmells',
      'technicalDebt',
      'linesOfCode',
      'duplicateCode',
      'testCoverage',
      'vulnerabilities'
    ];

    for (const metric of metrics) {
      const recentAvg = recent.reduce((sum, m) => sum + (m[metric] as number), 0) / recent.length;
      const olderAvg = older.reduce((sum, m) => sum + (m[metric] as number), 0) / older.length;
      
      const changePercent = olderAvg !== 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
      
      let trend: 'improving' | 'degrading' | 'stable' = 'stable';
      
      // Determine trend direction (some metrics are better when lower, others when higher)
      const lowerIsBetter = ['complexity', 'codeSmells', 'technicalDebt', 'duplicateCode', 'vulnerabilities'];
      const higherIsBetter = ['maintainabilityIndex', 'testCoverage'];
      
      if (Math.abs(changePercent) > 5) { // 5% threshold for significance
        if (lowerIsBetter.includes(metric)) {
          trend = changePercent < 0 ? 'improving' : 'degrading';
        } else if (higherIsBetter.includes(metric)) {
          trend = changePercent > 0 ? 'improving' : 'degrading';
        }
      }

      trends.push({
        metric,
        trend,
        changePercent,
        description: this.getTrendDescription(metric, trend, changePercent)
      });
    }

    return trends;
  }

  private getTrendDescription(metric: keyof QualityMetric, trend: string, changePercent: number): string {
    const metricNames: Record<string, string> = {
      complexity: 'Code Complexity',
      maintainabilityIndex: 'Maintainability Index',
      codeSmells: 'Code Smells',
      technicalDebt: 'Technical Debt',
      linesOfCode: 'Lines of Code',
      duplicateCode: 'Duplicate Code',
      testCoverage: 'Test Coverage',
      vulnerabilities: 'Vulnerabilities'
    };

    const direction = trend === 'improving' ? 'improved' : trend === 'degrading' ? 'degraded' : 'remained stable';
    return `${metricNames[metric]} has ${direction} by ${Math.abs(changePercent).toFixed(1)}%`;
  }

  private generateRecommendations(current: QualityMetric, history: QualityMetric[]): string[] {
    const recommendations: string[] = [];

    // High complexity
    if (current.complexity > 15) {
      recommendations.push('Consider refactoring complex methods to improve maintainability');
    }

    // Low maintainability
    if (current.maintainabilityIndex < 60) {
      recommendations.push('Focus on improving code maintainability through better structure and documentation');
    }

    // Code smells
    if (current.codeSmells > 10) {
      recommendations.push('Address code smells to improve overall code quality');
    }

    // Technical debt
    if (current.technicalDebt > 40) {
      recommendations.push('Allocate time to reduce technical debt in upcoming sprints');
    }

    // Test coverage
    if (current.testCoverage < 70) {
      recommendations.push('Increase test coverage to improve code reliability');
    }

    // Duplicate code
    if (current.duplicateCode > 5) {
      recommendations.push('Refactor duplicate code into reusable components or functions');
    }

    // Vulnerabilities
    if (current.vulnerabilities > 0) {
      recommendations.push('Address security vulnerabilities as high priority');
    }

    // Trend-based recommendations
    if (history.length > 5) {
      const recent = history.slice(-3);
      const avgComplexity = recent.reduce((sum, m) => sum + m.complexity, 0) / recent.length;
      
      if (avgComplexity > current.complexity * 1.2) {
        recommendations.push('Complexity has been trending upward - consider establishing complexity limits');
      }
    }

    return recommendations;
  }

  private generateAlerts(current: QualityMetric, history: QualityMetric[]): Array<{
    level: 'error' | 'warning' | 'info';
    message: string;
    timestamp: Date;
  }> {
    const alerts: Array<{
      level: 'error' | 'warning' | 'info';
      message: string;
      timestamp: Date;
    }> = [];

    const timestamp = new Date();

    // Critical thresholds
    if (current.vulnerabilities > 0) {
      alerts.push({
        level: 'error',
        message: `${current.vulnerabilities} security vulnerabilities detected`,
        timestamp
      });
    }

    if (current.maintainabilityIndex < 40) {
      alerts.push({
        level: 'error',
        message: 'Maintainability index is critically low',
        timestamp
      });
    }

    // Warning thresholds
    if (current.complexity > 20) {
      alerts.push({
        level: 'warning',
        message: 'Code complexity is very high',
        timestamp
      });
    }

    if (current.testCoverage < 50) {
      alerts.push({
        level: 'warning',
        message: 'Test coverage is below 50%',
        timestamp
      });
    }

    if (current.technicalDebt > 80) {
      alerts.push({
        level: 'warning',
        message: 'Technical debt is accumulating rapidly',
        timestamp
      });
    }

    // Trend alerts
    if (history.length >= 3) {
      const recent = history.slice(-3);
      const complexityTrend = recent.every((m, i) => i === 0 || m.complexity > recent[i - 1].complexity);
      
      if (complexityTrend) {
        alerts.push({
          level: 'warning',
          message: 'Code complexity has been consistently increasing',
          timestamp
        });
      }
    }

    return alerts;
  }

  // Mock implementations - would integrate with actual analysis tools
  private async calculateComplexity(): Promise<number> {
    try {
      const files = await vscode.workspace.findFiles('**/*.{ts,js,tsx,jsx}', '**/node_modules/**', 100);
      let totalComplexity = 0;
      let fileCount = 0;

      for (const file of files.slice(0, 50)) { // Limit for performance
        try {
          const document = await vscode.workspace.openTextDocument(file);
          const content = document.getText();
          
          // Simple complexity calculation based on control structures
          const complexityNodes = (content.match(/if\s*\(|while\s*\(|for\s*\(|switch\s*\(|catch\s*\(/g) || []).length;
          totalComplexity += complexityNodes;
          fileCount++;
        } catch (error) {
          // Skip files that can't be read
        }
      }

      return fileCount > 0 ? Math.round(totalComplexity / fileCount) : 0;
    } catch (error) {
      console.error('Error calculating complexity:', error);
      return 0;
    }
  }

  private async calculateMaintainabilityIndex(): Promise<number> {
    // Simplified maintainability index calculation
    const complexity = await this.calculateComplexity();
    const linesOfCode = await this.countLinesOfCode();
    
    // Simplified formula based on Halstead complexity, cyclomatic complexity, and lines of code
    const maintainabilityIndex = Math.max(0, 
      171 - 5.2 * Math.log(linesOfCode / 1000) - 0.23 * complexity - 16.2 * Math.log(linesOfCode / 10000)
    );
    
    return Math.round(Math.min(100, maintainabilityIndex));
  }

  private async detectCodeSmells(): Promise<number> {
    try {
      const files = await vscode.workspace.findFiles('**/*.{ts,js,tsx,jsx}', '**/node_modules/**', 100);
      let codeSmells = 0;

      for (const file of files.slice(0, 50)) {
        try {
          const document = await vscode.workspace.openTextDocument(file);
          const content = document.getText();
          
          // Detect various code smells
          if (content.length > 1000 && (content.match(/function\s+\w+/g) || []).length < 5) {
            codeSmells++; // Large file with few functions
          }
          
          if ((content.match(/console\.log/g) || []).length > 5) {
            codeSmells++; // Too many console.log statements
          }
          
          if ((content.match(/TODO|FIXME|HACK/g) || []).length > 0) {
            codeSmells++; // TODO comments
          }
          
          // Long parameter lists
          const longParameterLists = content.match(/\([^)]{50,}\)/g);
          if (longParameterLists && longParameterLists.length > 0) {
            codeSmells++;
          }
          
        } catch (error) {
          // Skip files that can't be read
        }
      }

      return codeSmells;
    } catch (error) {
      console.error('Error detecting code smells:', error);
      return 0;
    }
  }

  private async calculateTechnicalDebt(): Promise<number> {
    const codeSmells = await this.detectCodeSmells();
    const complexity = await this.calculateComplexity();
    
    // Estimate technical debt in hours based on smells and complexity
    return Math.round((codeSmells * 2) + (complexity * 0.5));
  }

  private async countLinesOfCode(): Promise<number> {
    try {
      const files = await vscode.workspace.findFiles('**/*.{ts,js,tsx,jsx}', '**/node_modules/**', 200);
      let totalLines = 0;

      for (const file of files) {
        try {
          const document = await vscode.workspace.openTextDocument(file);
          totalLines += document.lineCount;
        } catch (error) {
          // Skip files that can't be read
        }
      }

      return totalLines;
    } catch (error) {
      console.error('Error counting lines of code:', error);
      return 0;
    }
  }

  private async detectDuplicateCode(): Promise<number> {
    // Simplified duplicate code detection
    try {
      const files = await vscode.workspace.findFiles('**/*.{ts,js,tsx,jsx}', '**/node_modules/**', 50);
      const codeBlocks = new Map<string, number>();
      
      for (const file of files.slice(0, 30)) {
        try {
          const document = await vscode.workspace.openTextDocument(file);
          const lines = document.getText().split('\n');
          
          // Check for duplicate blocks of 3+ lines
          for (let i = 0; i < lines.length - 2; i++) {
            const block = lines.slice(i, i + 3).join('\n').trim();
            if (block.length > 20) { // Ignore very short blocks
              codeBlocks.set(block, (codeBlocks.get(block) || 0) + 1);
            }
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }
      
      // Count blocks that appear more than once
      let duplicateBlocks = 0;
      for (const [, count] of codeBlocks) {
        if (count > 1) {
          duplicateBlocks++;
        }
      }
      
      return duplicateBlocks;
    } catch (error) {
      console.error('Error detecting duplicate code:', error);
      return 0;
    }
  }

  private async getTestCoverage(): Promise<number> {
    // Mock implementation - would integrate with actual coverage tools
    return Math.floor(Math.random() * 40 + 60); // 60-100%
  }

  private async scanVulnerabilities(): Promise<number> {
    // Mock implementation - would integrate with security scanners
    return Math.floor(Math.random() * 3); // 0-2 vulnerabilities
  }

  private async analyzeIssues(): Promise<{
    critical: number;
    major: number;
    minor: number;
    info: number;
  }> {
    // Mock implementation - would integrate with linters and static analysis tools
    return {
      critical: Math.floor(Math.random() * 2),
      major: Math.floor(Math.random() * 5),
      minor: Math.floor(Math.random() * 10),
      info: Math.floor(Math.random() * 15)
    };
  }
}
