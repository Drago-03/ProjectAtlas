// Test Coverage Visualization - Interactive test coverage reports and recommendations
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface CoverageData {
  file: string;
  statements: CoverageMetric;
  branches: CoverageMetric;
  functions: CoverageMetric;
  lines: CoverageMetric;
  uncoveredLines: number[];
}

export interface CoverageMetric {
  total: number;
  covered: number;
  percentage: number;
}

export interface TestFile {
  path: string;
  name: string;
  testCount: number;
  coverage?: CoverageData;
  lastRun?: Date;
  status: 'passing' | 'failing' | 'skipped' | 'unknown';
}

export interface CoverageSummary {
  overall: CoverageMetric;
  files: CoverageData[];
  testFiles: TestFile[];
  recommendations: string[];
  uncoveredFiles: string[];
  hotspots: Array<{ file: string; risk: 'high' | 'medium' | 'low'; reason: string }>;
}

export class TestCoverageAnalyzer {
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  async findCoverageReports(): Promise<string[]> {
    const coverageFiles: string[] = [];
    
    try {
      // Common coverage report locations
      const commonPaths = [
        'coverage/lcov.info',
        'coverage/clover.xml',
        'coverage/coverage-final.json',
        'coverage/index.html',
        'test-results/coverage.xml',
        '.nyc_output/coverage-final.json',
        'jest-coverage/lcov.info'
      ];

      for (const relativePath of commonPaths) {
        const fullPath = path.join(this.workspaceRoot, relativePath);
        if (fs.existsSync(fullPath)) {
          coverageFiles.push(fullPath);
        }
      }

      // Search for coverage files recursively
      const files = await vscode.workspace.findFiles(
        '**/coverage/**/*.{json,xml,info,html}',
        '**/node_modules/**',
        50
      );

      coverageFiles.push(...files.map(f => f.fsPath));
    } catch (error) {
      console.error('Error finding coverage reports:', error);
    }

    return [...new Set(coverageFiles)]; // Remove duplicates
  }

  async findTestFiles(): Promise<TestFile[]> {
    const testFiles: TestFile[] = [];

    try {
      // Find test files using common patterns
      const testPatterns = [
        '**/*.test.{js,ts,jsx,tsx}',
        '**/*.spec.{js,ts,jsx,tsx}',
        '**/test/**/*.{js,ts,jsx,tsx}',
        '**/tests/**/*.{js,ts,jsx,tsx}',
        '**/__tests__/**/*.{js,ts,jsx,tsx}'
      ];

      for (const pattern of testPatterns) {
        const files = await vscode.workspace.findFiles(pattern, '**/node_modules/**', 100);
        
        for (const file of files) {
          try {
            const document = await vscode.workspace.openTextDocument(file);
            const content = document.getText();
            
            // Count test cases
            const testCount = this.countTests(content);
            
            testFiles.push({
              path: file.fsPath,
              name: path.basename(file.fsPath),
              testCount,
              status: 'unknown'
            });
          } catch (error) {
            console.warn('Could not read test file:', file.fsPath);
          }
        }
      }
    } catch (error) {
      console.error('Error finding test files:', error);
    }

    return testFiles;
  }

  private countTests(content: string): number {
    // Count various test function patterns
    const patterns = [
      /\b(test|it|describe)\s*\(/g,
      /\b(Test|It|Describe)\s*\(/g,
      /@Test\s*\n/g,
      /def\s+test_\w+/g, // Python tests
      /func\s+Test\w+/g  // Go tests
    ];

    let count = 0;
    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        count += matches.length;
      }
    }

    return count;
  }

  async parseLcovReport(filePath: string): Promise<CoverageData[]> {
    const coverageData: CoverageData[] = [];

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const sections = content.split('end_of_record');

      for (const section of sections) {
        if (!section.trim()) continue;

        const lines = section.split('\n');
        let currentFile = '';
        const statements = { total: 0, covered: 0, percentage: 0 };
        const branches = { total: 0, covered: 0, percentage: 0 };
        const functions = { total: 0, covered: 0, percentage: 0 };
        const lineMetrics = { total: 0, covered: 0, percentage: 0 };
        const uncoveredLines: number[] = [];

        for (const line of lines) {
          if (line.startsWith('SF:')) {
            currentFile = line.substring(3);
          } else if (line.startsWith('LF:')) {
            lineMetrics.total = parseInt(line.substring(3));
          } else if (line.startsWith('LH:')) {
            lineMetrics.covered = parseInt(line.substring(3));
            lineMetrics.percentage = lineMetrics.total > 0 ? 
              (lineMetrics.covered / lineMetrics.total) * 100 : 0;
          } else if (line.startsWith('BRF:')) {
            branches.total = parseInt(line.substring(4));
          } else if (line.startsWith('BRH:')) {
            branches.covered = parseInt(line.substring(4));
            branches.percentage = branches.total > 0 ? 
              (branches.covered / branches.total) * 100 : 0;
          } else if (line.startsWith('FNF:')) {
            functions.total = parseInt(line.substring(4));
          } else if (line.startsWith('FNH:')) {
            functions.covered = parseInt(line.substring(4));
            functions.percentage = functions.total > 0 ? 
              (functions.covered / functions.total) * 100 : 0;
          } else if (line.startsWith('DA:')) {
            const [lineNum, hits] = line.substring(3).split(',');
            if (parseInt(hits) === 0) {
              uncoveredLines.push(parseInt(lineNum));
            }
          }
        }

        if (currentFile) {
          coverageData.push({
            file: currentFile,
            statements,
            branches,
            functions,
            lines: lineMetrics,
            uncoveredLines
          });
        }
      }
    } catch (error) {
      console.error('Error parsing LCOV report:', error);
    }

    return coverageData;
  }

  async parseJestCoverage(filePath: string): Promise<CoverageData[]> {
    const coverageData: CoverageData[] = [];

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);

      for (const [file, metrics] of Object.entries(data)) {
        if (file === 'total') continue;

        const fileMetrics = metrics as any;
        
        coverageData.push({
          file,
          statements: {
            total: fileMetrics.statements?.total || 0,
            covered: fileMetrics.statements?.covered || 0,
            percentage: fileMetrics.statements?.pct || 0
          },
          branches: {
            total: fileMetrics.branches?.total || 0,
            covered: fileMetrics.branches?.covered || 0,
            percentage: fileMetrics.branches?.pct || 0
          },
          functions: {
            total: fileMetrics.functions?.total || 0,
            covered: fileMetrics.functions?.covered || 0,
            percentage: fileMetrics.functions?.pct || 0
          },
          lines: {
            total: fileMetrics.lines?.total || 0,
            covered: fileMetrics.lines?.covered || 0,
            percentage: fileMetrics.lines?.pct || 0
          },
          uncoveredLines: Object.keys(fileMetrics.statementMap || {})
            .filter(key => !fileMetrics.s?.[key])
            .map(key => fileMetrics.statementMap[key].start.line)
        });
      }
    } catch (error) {
      console.error('Error parsing Jest coverage:', error);
    }

    return coverageData;
  }

  async generateCoverageSummary(): Promise<CoverageSummary> {
    const testFiles = await this.findTestFiles();
    const coverageReports = await this.findCoverageReports();
    
    const allCoverageData: CoverageData[] = [];

    // Parse coverage reports
    for (const reportPath of coverageReports) {
      if (reportPath.includes('lcov.info')) {
        const data = await this.parseLcovReport(reportPath);
        allCoverageData.push(...data);
      } else if (reportPath.includes('.json')) {
        const data = await this.parseJestCoverage(reportPath);
        allCoverageData.push(...data);
      }
    }

    // Calculate overall coverage
    const overall = this.calculateOverallCoverage(allCoverageData);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(allCoverageData, testFiles);
    
    // Find uncovered files
    const uncoveredFiles = await this.findUncoveredFiles(allCoverageData);
    
    // Identify coverage hotspots
    const hotspots = this.identifyHotspots(allCoverageData);

    return {
      overall,
      files: allCoverageData,
      testFiles,
      recommendations,
      uncoveredFiles,
      hotspots
    };
  }

  private calculateOverallCoverage(coverageData: CoverageData[]): CoverageMetric {
    if (coverageData.length === 0) {
      return { total: 0, covered: 0, percentage: 0 };
    }

    const totals = coverageData.reduce(
      (acc, data) => ({
        total: acc.total + data.lines.total,
        covered: acc.covered + data.lines.covered
      }),
      { total: 0, covered: 0 }
    );

    return {
      ...totals,
      percentage: totals.total > 0 ? (totals.covered / totals.total) * 100 : 0
    };
  }

  private generateRecommendations(coverageData: CoverageData[], testFiles: TestFile[]): string[] {
    const recommendations: string[] = [];

    // Low coverage files
    const lowCoverageFiles = coverageData.filter(d => d.lines.percentage < 50);
    if (lowCoverageFiles.length > 0) {
      recommendations.push(`${lowCoverageFiles.length} files have less than 50% line coverage`);
    }

    // Missing branch coverage
    const lowBranchCoverage = coverageData.filter(d => d.branches.percentage < 80);
    if (lowBranchCoverage.length > 0) {
      recommendations.push(`${lowBranchCoverage.length} files need better branch coverage`);
    }

    // Test file recommendations
    if (testFiles.length === 0) {
      recommendations.push('No test files found - consider adding unit tests');
    } else {
      const avgTestsPerFile = testFiles.reduce((sum, f) => sum + f.testCount, 0) / testFiles.length;
      if (avgTestsPerFile < 3) {
        recommendations.push('Consider adding more test cases per file');
      }
    }

    return recommendations;
  }

  private async findUncoveredFiles(coverageData: CoverageData[]): Promise<string[]> {
    const uncoveredFiles: string[] = [];
    const coveredFilePaths = new Set(coverageData.map(d => d.file));

    try {
      const sourceFiles = await vscode.workspace.findFiles(
        '**/*.{js,ts,jsx,tsx}',
        '**/node_modules/**',
        200
      );

      for (const file of sourceFiles) {
        if (!coveredFilePaths.has(file.fsPath) && !file.fsPath.includes('test')) {
          uncoveredFiles.push(file.fsPath);
        }
      }
    } catch (error) {
      console.error('Error finding uncovered files:', error);
    }

    return uncoveredFiles;
  }

  private identifyHotspots(coverageData: CoverageData[]): Array<{ file: string; risk: 'high' | 'medium' | 'low'; reason: string }> {
    const hotspots: Array<{ file: string; risk: 'high' | 'medium' | 'low'; reason: string }> = [];

    for (const data of coverageData) {
      // High risk: low coverage and many uncovered lines
      if (data.lines.percentage < 30 && data.uncoveredLines.length > 20) {
        hotspots.push({
          file: data.file,
          risk: 'high',
          reason: `Very low coverage (${data.lines.percentage.toFixed(1)}%) with ${data.uncoveredLines.length} uncovered lines`
        });
      }
      // Medium risk: moderate coverage issues
      else if (data.lines.percentage < 60 || data.branches.percentage < 50) {
        hotspots.push({
          file: data.file,
          risk: 'medium',
          reason: `Coverage below recommended thresholds (lines: ${data.lines.percentage.toFixed(1)}%, branches: ${data.branches.percentage.toFixed(1)}%)`
        });
      }
      // Low risk: good coverage but could be better
      else if (data.lines.percentage < 80) {
        hotspots.push({
          file: data.file,
          risk: 'low',
          reason: `Good coverage but room for improvement (${data.lines.percentage.toFixed(1)}%)`
        });
      }
    }

    return hotspots.sort((a, b) => {
      const riskOrder = { high: 3, medium: 2, low: 1 };
      return riskOrder[b.risk] - riskOrder[a.risk];
    });
  }
}
