// Advanced Search - Semantic code search with AI-powered suggestions
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface SearchResult {
  file: string;
  line: number;
  column: number;
  content: string;
  type: 'function' | 'class' | 'variable' | 'interface' | 'type' | 'import' | 'comment' | 'string';
  context?: string[];
  relevanceScore: number;
  suggestion?: string;
}

export interface SemanticSearchQuery {
  query: string;
  fileTypes?: string[];
  excludePatterns?: string[];
  includePatterns?: string[];
  searchType?: 'exact' | 'fuzzy' | 'semantic' | 'regex';
  contextLines?: number;
  maxResults?: number;
}

export interface SearchInsight {
  relatedTerms: string[];
  suggestedRefinements: string[];
  codePatterns: Array<{
    pattern: string;
    description: string;
    examples: string[];
  }>;
  commonUsages: Array<{
    context: string;
    frequency: number;
    files: string[];
  }>;
}

export interface CodePattern {
  name: string;
  pattern: RegExp;
  type: SearchResult['type'];
  description: string;
  language?: string;
}

export class AdvancedSearchEngine {
  private workspaceRoot: string;
  private indexCache: Map<string, any> = new Map();
  private codePatterns: CodePattern[] = [];

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.initializeCodePatterns();
  }

  private initializeCodePatterns(): void {
    this.codePatterns = [
      // TypeScript/JavaScript patterns
      {
        name: 'Function Declaration',
        pattern: /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\())/g,
        type: 'function',
        description: 'Function declarations and expressions',
        language: 'typescript'
      },
      {
        name: 'Class Declaration',
        pattern: /(?:export\s+)?(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+\w+)?(?:\s+implements\s+[\w,\s]+)?/g,
        type: 'class',
        description: 'Class declarations',
        language: 'typescript'
      },
      {
        name: 'Interface Declaration',
        pattern: /(?:export\s+)?interface\s+(\w+)(?:\s+extends\s+[\w,\s]+)?/g,
        type: 'interface',
        description: 'Interface declarations',
        language: 'typescript'
      },
      {
        name: 'Type Alias',
        pattern: /(?:export\s+)?type\s+(\w+)\s*=/g,
        type: 'type',
        description: 'Type alias declarations',
        language: 'typescript'
      },
      {
        name: 'Variable Declaration',
        pattern: /(?:const|let|var)\s+(\w+)(?:\s*:\s*\w+)?\s*=/g,
        type: 'variable',
        description: 'Variable declarations',
        language: 'typescript'
      },
      {
        name: 'Import Statement',
        pattern: /import\s+(?:(?:\*\s+as\s+\w+)|(?:{\s*[\w,\s]+\s*})|(?:\w+))\s+from\s+['"`]([^'"`]+)['"`]/g,
        type: 'import',
        description: 'Import statements',
        language: 'typescript'
      },
      // Python patterns
      {
        name: 'Python Function',
        pattern: /def\s+(\w+)\s*\(/g,
        type: 'function',
        description: 'Python function definitions',
        language: 'python'
      },
      {
        name: 'Python Class',
        pattern: /class\s+(\w+)(?:\s*\([^)]*\))?:/g,
        type: 'class',
        description: 'Python class definitions',
        language: 'python'
      },
      // Go patterns
      {
        name: 'Go Function',
        pattern: /func\s+(?:\(\w+\s+\*?\w+\)\s+)?(\w+)\s*\(/g,
        type: 'function',
        description: 'Go function definitions',
        language: 'go'
      },
      {
        name: 'Go Struct',
        pattern: /type\s+(\w+)\s+struct/g,
        type: 'type',
        description: 'Go struct definitions',
        language: 'go'
      }
    ];
  }

  async search(query: SemanticSearchQuery): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const files = await this.getSearchableFiles(query);

    for (const file of files) {
      try {
        const fileResults = await this.searchInFile(file, query);
        results.push(...fileResults);
      } catch (error) {
        console.error(`Error searching in file ${file}:`, error);
      }
    }

    // Sort by relevance score
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Limit results
    const maxResults = query.maxResults || 100;
    return results.slice(0, maxResults);
  }

  private async getSearchableFiles(query: SemanticSearchQuery): Promise<vscode.Uri[]> {
    const includePattern = query.includePatterns?.join(',') || '**/*';
    const excludePattern = query.excludePatterns?.join(',') || '**/node_modules/**';
    
    let searchPattern = includePattern;
    if (query.fileTypes && query.fileTypes.length > 0) {
      const extensions = query.fileTypes.map(ext => ext.startsWith('.') ? ext : `.${ext}`);
      searchPattern = `**/*{${extensions.join(',')}}`;
    }

    return await vscode.workspace.findFiles(searchPattern, excludePattern, 1000);
  }

  private async searchInFile(fileUri: vscode.Uri, query: SemanticSearchQuery): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const document = await vscode.workspace.openTextDocument(fileUri);
    const content = document.getText();
    const lines = content.split('\n');

    switch (query.searchType) {
      case 'exact':
        results.push(...this.exactSearch(fileUri.fsPath, lines, query));
        break;
      case 'regex':
        results.push(...this.regexSearch(fileUri.fsPath, lines, query));
        break;
      case 'fuzzy':
        results.push(...this.fuzzySearch(fileUri.fsPath, lines, query));
        break;
      case 'semantic':
      default:
        results.push(...this.semanticSearch(fileUri.fsPath, lines, query));
        break;
    }

    return results;
  }

  private exactSearch(file: string, lines: string[], query: SemanticSearchQuery): SearchResult[] {
    const results: SearchResult[] = [];
    const searchTerm = query.query.toLowerCase();

    lines.forEach((line, index) => {
      const lowerLine = line.toLowerCase();
      let columnIndex = 0;
      
      while ((columnIndex = lowerLine.indexOf(searchTerm, columnIndex)) !== -1) {
        const context = this.getContext(lines, index, query.contextLines || 2);
        const type = this.detectCodeType(line, columnIndex);
        
        results.push({
          file,
          line: index + 1,
          column: columnIndex + 1,
          content: line.trim(),
          type,
          context,
          relevanceScore: this.calculateRelevanceScore(searchTerm, line, type),
          suggestion: this.generateSuggestion(line, type)
        });
        
        columnIndex += searchTerm.length;
      }
    });

    return results;
  }

  private regexSearch(file: string, lines: string[], query: SemanticSearchQuery): SearchResult[] {
    const results: SearchResult[] = [];
    
    try {
      const regex = new RegExp(query.query, 'gi');
      
      lines.forEach((line, index) => {
        let match;
        while ((match = regex.exec(line)) !== null) {
          const context = this.getContext(lines, index, query.contextLines || 2);
          const type = this.detectCodeType(line, match.index);
          
          results.push({
            file,
            line: index + 1,
            column: match.index + 1,
            content: line.trim(),
            type,
            context,
            relevanceScore: this.calculateRelevanceScore(match[0], line, type),
            suggestion: this.generateSuggestion(line, type)
          });
        }
      });
    } catch (error) {
      // Fallback to exact search if regex is invalid
      return this.exactSearch(file, lines, query);
    }

    return results;
  }

  private fuzzySearch(file: string, lines: string[], query: SemanticSearchQuery): SearchResult[] {
    const results: SearchResult[] = [];
    const searchTerm = query.query.toLowerCase();
    const threshold = 0.6; // Minimum similarity score

    lines.forEach((line, index) => {
      const similarity = this.calculateSimilarity(searchTerm, line.toLowerCase());
      
      if (similarity >= threshold) {
        const context = this.getContext(lines, index, query.contextLines || 2);
        const type = this.detectCodeType(line, 0);
        
        results.push({
          file,
          line: index + 1,
          column: 1,
          content: line.trim(),
          type,
          context,
          relevanceScore: similarity * 100,
          suggestion: this.generateSuggestion(line, type)
        });
      }
    });

    return results;
  }

  private semanticSearch(file: string, lines: string[], query: SemanticSearchQuery): SearchResult[] {
    const results: SearchResult[] = [];
    const queryTerms = this.extractSemanticTerms(query.query);
    
    // Search using code patterns
    for (const pattern of this.codePatterns) {
      const language = this.detectLanguage(file);
      if (pattern.language && pattern.language !== language) {
        continue;
      }

      lines.forEach((line, index) => {
        const matches = line.match(pattern.pattern);
        if (matches && this.isSemanticMatch(queryTerms, line, pattern)) {
          const context = this.getContext(lines, index, query.contextLines || 2);
          
          results.push({
            file,
            line: index + 1,
            column: 1,
            content: line.trim(),
            type: pattern.type,
            context,
            relevanceScore: this.calculateSemanticRelevance(queryTerms, line, pattern),
            suggestion: this.generateSemanticSuggestion(line, pattern, queryTerms)
          });
        }
      });
    }

    // Also include exact matches with lower relevance
    const exactResults = this.exactSearch(file, lines, query);
    exactResults.forEach(result => {
      result.relevanceScore *= 0.8; // Reduce relevance for exact matches in semantic search
    });
    
    results.push(...exactResults);

    return results;
  }

  private extractSemanticTerms(query: string): string[] {
    // Extract meaningful terms from the query
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    return query.toLowerCase()
      .split(/\s+/)
      .filter(term => term.length > 2 && !stopWords.has(term))
      .concat(this.extractCamelCaseTerms(query));
  }

  private extractCamelCaseTerms(text: string): string[] {
    // Extract terms from camelCase or PascalCase
    const camelCasePattern = /[a-z]+|[A-Z][a-z]*/g;
    const matches = text.match(camelCasePattern);
    return matches ? matches.map(m => m.toLowerCase()) : [];
  }

  private isSemanticMatch(queryTerms: string[], line: string, pattern: CodePattern): boolean {
    const lineText = line.toLowerCase();
    return queryTerms.some(term => 
      lineText.includes(term) || 
      this.calculateSimilarity(term, lineText) > 0.7
    );
  }

  private calculateSemanticRelevance(queryTerms: string[], line: string, pattern: CodePattern): number {
    let score = 0;
    const lineText = line.toLowerCase();
    
    // Base score for pattern type relevance
    const typeScores = {
      'function': 90,
      'class': 85,
      'interface': 80,
      'type': 75,
      'variable': 70,
      'import': 60,
      'comment': 50,
      'string': 40
    };
    
    score += typeScores[pattern.type] || 50;
    
    // Boost for query term matches
    queryTerms.forEach(term => {
      if (lineText.includes(term)) {
        score += 20;
      } else {
        const similarity = this.calculateSimilarity(term, lineText);
        if (similarity > 0.7) {
          score += similarity * 15;
        }
      }
    });
    
    return Math.min(score, 100);
  }

  private generateSemanticSuggestion(line: string, pattern: CodePattern, queryTerms: string[]): string {
    const suggestions = [
      `Found ${pattern.description.toLowerCase()}`,
      `Related to: ${queryTerms.join(', ')}`,
      `Pattern: ${pattern.name}`
    ];
    
    return suggestions.join(' • ');
  }

  private detectLanguage(file: string): string {
    const ext = path.extname(file).toLowerCase();
    const languageMap: { [key: string]: string } = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.go': 'go',
      '.java': 'java',
      '.cs': 'csharp',
      '.cpp': 'cpp',
      '.c': 'c',
      '.rs': 'rust',
      '.php': 'php',
      '.rb': 'ruby'
    };
    
    return languageMap[ext] || 'unknown';
  }

  private detectCodeType(line: string, position: number): SearchResult['type'] {
    const trimmedLine = line.trim();
    
    // Check patterns in order of specificity
    if (trimmedLine.startsWith('import ') || trimmedLine.includes(' from ')) {
      return 'import';
    }
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine.includes('*/')) {
      return 'comment';
    }
    if (trimmedLine.includes('function ') || trimmedLine.includes('def ') || trimmedLine.includes('func ')) {
      return 'function';
    }
    if (trimmedLine.includes('class ') || trimmedLine.includes('struct ')) {
      return 'class';
    }
    if (trimmedLine.includes('interface ')) {
      return 'interface';
    }
    if (trimmedLine.includes('type ') && trimmedLine.includes(' = ')) {
      return 'type';
    }
    if (trimmedLine.includes('const ') || trimmedLine.includes('let ') || trimmedLine.includes('var ')) {
      return 'variable';
    }
    if (line.includes('"') || line.includes("'") || line.includes('`')) {
      return 'string';
    }
    
    return 'variable'; // Default
  }

  private getContext(lines: string[], currentLine: number, contextLines: number): string[] {
    const start = Math.max(0, currentLine - contextLines);
    const end = Math.min(lines.length, currentLine + contextLines + 1);
    return lines.slice(start, end);
  }

  private calculateRelevanceScore(searchTerm: string, line: string, type: SearchResult['type']): number {
    let score = 50; // Base score
    
    // Type-based scoring
    const typeBonus = {
      'function': 20,
      'class': 18,
      'interface': 16,
      'type': 14,
      'variable': 10,
      'import': 8,
      'comment': 5,
      'string': 3
    };
    
    score += typeBonus[type] || 0;
    
    // Position and context bonuses
    if (line.trim().startsWith(searchTerm)) {
      score += 15; // Starts with search term
    }
    if (line.includes(`${searchTerm}(`)) {
      score += 10; // Function call
    }
    if (line.includes(`.${searchTerm}`)) {
      score += 8; // Property access
    }
    
    // Line length penalty (shorter lines are more relevant)
    const lengthPenalty = Math.max(0, (line.length - 50) / 10);
    score -= lengthPenalty;
    
    return Math.max(0, Math.min(100, score));
  }

  private calculateSimilarity(a: string, b: string): number {
    // Simple Levenshtein distance-based similarity
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
    
    for (let i = 0; i <= a.length; i++) {
      matrix[0][i] = i;
    }
    for (let j = 0; j <= b.length; j++) {
      matrix[j][0] = j;
    }
    
    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + cost
        );
      }
    }
    
    const maxLen = Math.max(a.length, b.length);
    return maxLen === 0 ? 1 : (maxLen - matrix[b.length][a.length]) / maxLen;
  }

  private generateSuggestion(line: string, type: SearchResult['type']): string {
    const suggestions = {
      'function': 'Consider checking function parameters and return type',
      'class': 'Look for related methods and properties',
      'interface': 'Check implementing classes and usage',
      'type': 'Review type usage and related types',
      'variable': 'Check variable usage and assignments',
      'import': 'Review imported modules and dependencies',
      'comment': 'This might contain important documentation',
      'string': 'Check for configuration or literal values'
    };
    
    return suggestions[type] || 'Review this code segment';
  }

  async generateSearchInsights(query: string): Promise<SearchInsight> {
    const relatedTerms = this.generateRelatedTerms(query);
    const suggestedRefinements = this.generateRefinements(query);
    const codePatterns = this.generateCodePatterns(query);
    const commonUsages = await this.analyzeCommonUsages(query);
    
    return {
      relatedTerms,
      suggestedRefinements,
      codePatterns,
      commonUsages
    };
  }

  private generateRelatedTerms(query: string): string[] {
    // Simple related terms based on common programming patterns
    const relatedTermsMap: { [key: string]: string[] } = {
      'function': ['method', 'procedure', 'def', 'func', 'arrow function'],
      'class': ['interface', 'type', 'constructor', 'instance', 'extends'],
      'variable': ['const', 'let', 'var', 'property', 'field'],
      'async': ['await', 'promise', 'then', 'catch', 'callback'],
      'test': ['spec', 'describe', 'it', 'expect', 'assert', 'mock'],
      'error': ['exception', 'try', 'catch', 'throw', 'finally'],
      'component': ['props', 'state', 'render', 'jsx', 'hook'],
      'api': ['endpoint', 'route', 'controller', 'service', 'request'],
    };
    
    const queryLower = query.toLowerCase();
    const related = new Set<string>();
    
    Object.entries(relatedTermsMap).forEach(([key, terms]) => {
      if (queryLower.includes(key)) {
        terms.forEach(term => related.add(term));
      }
    });
    
    return Array.from(related).slice(0, 8);
  }

  private generateRefinements(query: string): string[] {
    const refinements = [
      `"${query}"`, // Exact match
      `${query}*`, // Prefix match
      `*.${query}`, // Property access
      `${query}()`, // Function call
      `/^${query}/`, // Regex start
      `type:function ${query}`, // Type-specific search
      `lang:typescript ${query}`, // Language-specific search
      `path:src ${query}` // Path-specific search
    ];
    
    return refinements.slice(0, 6);
  }

  private generateCodePatterns(query: string): Array<{ pattern: string; description: string; examples: string[] }> {
    const patterns = [
      {
        pattern: `function ${query}`,
        description: 'Function declaration',
        examples: [`function ${query}() {}`, `const ${query} = () => {}`]
      },
      {
        pattern: `class ${query}`,
        description: 'Class declaration',
        examples: [`class ${query} {}`, `export class ${query}`]
      },
      {
        pattern: `.${query}(`,
        description: 'Method call',
        examples: [`obj.${query}()`, `this.${query}(params)`]
      },
      {
        pattern: `const ${query}`,
        description: 'Variable declaration',
        examples: [`const ${query} = value`, `const ${query}: Type = value`]
      }
    ];
    
    return patterns.slice(0, 4);
  }

  private async analyzeCommonUsages(query: string): Promise<Array<{ context: string; frequency: number; files: string[] }>> {
    // This would analyze actual usage patterns in the codebase
    // For now, return mock data
    return [
      {
        context: 'Function calls',
        frequency: 45,
        files: ['src/utils.ts', 'src/helpers.ts']
      },
      {
        context: 'Type definitions',
        frequency: 32,
        files: ['src/types.ts', 'src/interfaces.ts']
      },
      {
        context: 'Import statements',
        frequency: 28,
        files: ['src/components/', 'src/services/']
      }
    ];
  }
}
