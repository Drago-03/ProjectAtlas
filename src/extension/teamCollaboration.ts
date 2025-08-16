// Team Collaboration - Multi-developer workspace insights and shared configurations
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { GitIntegration } from './gitIntegration';

export interface TeamMember {
  name: string;
  email: string;
  avatarUrl?: string;
  commits: number;
  linesAdded: number;
  linesDeleted: number;
  filesModified: string[];
  lastActive: Date;
  role?: 'lead' | 'senior' | 'junior' | 'intern';
  specialization?: string[];
}

export interface WorkspaceActivity {
  date: Date;
  author: string;
  action: 'commit' | 'file_edit' | 'file_create' | 'file_delete';
  description: string;
  files: string[];
}

export interface CodeOwnership {
  file: string;
  primaryOwner: string;
  contributors: Array<{
    name: string;
    percentage: number;
    commits: number;
  }>;
  lastModified: Date;
  complexity: 'low' | 'medium' | 'high';
}

export interface TeamMetrics {
  totalMembers: number;
  activeMembers: number; // Active in last 30 days
  avgCommitsPerMember: number;
  codeDistribution: Array<{
    member: string;
    percentage: number;
  }>;
  collaborationScore: number; // 0-100
  knowledgeRisk: Array<{
    file: string;
    risk: 'high' | 'medium' | 'low';
    reason: string;
  }>;
}

export interface SharedConfiguration {
  settings: Record<string, any>;
  extensions: string[];
  tasks: Array<{
    name: string;
    command: string;
    shared: boolean;
  }>;
  codeStyle: {
    formatter: string;
    rules: Record<string, any>;
  };
  lastUpdated: Date;
  updatedBy: string;
}

export interface TeamInsights {
  members: TeamMember[];
  recentActivity: WorkspaceActivity[];
  codeOwnership: CodeOwnership[];
  metrics: TeamMetrics;
  sharedConfig: SharedConfiguration;
  recommendations: string[];
}

export class TeamCollaborationAnalyzer {
  private workspaceRoot: string;
  private gitIntegration: GitIntegration;
  private configFile: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.gitIntegration = new GitIntegration(workspaceRoot);
    this.configFile = path.join(workspaceRoot, '.vscode', 'projectatlas-team.json');
  }

  async analyzeTeam(): Promise<TeamInsights> {
    const [members, recentActivity, codeOwnership] = await Promise.all([
      this.analyzeTeamMembers(),
      this.getRecentActivity(),
      this.analyzeCodeOwnership()
    ]);

    const metrics = this.calculateTeamMetrics(members, codeOwnership);
    const sharedConfig = await this.getSharedConfiguration();
    const recommendations = this.generateRecommendations(members, metrics, codeOwnership);

    return {
      members,
      recentActivity,
      codeOwnership,
      metrics,
      sharedConfig,
      recommendations
    };
  }

  private async analyzeTeamMembers(): Promise<TeamMember[]> {
    const members = new Map<string, TeamMember>();

    try {
      if (await this.gitIntegration.isGitRepository()) {
        const commits = await this.gitIntegration.getCommitHistory(200);
        
        for (const commit of commits) {
          const key = `${commit.author}`;
          
          if (!members.has(key)) {
            members.set(key, {
              name: commit.author,
              email: '', // Would need additional git command to get email
              commits: 0,
              linesAdded: 0,
              linesDeleted: 0,
              filesModified: [],
              lastActive: commit.date,
              specialization: []
            });
          }

          const member = members.get(key)!;
          member.commits++;
          member.linesAdded += commit.additions;
          member.linesDeleted += commit.deletions;
          member.filesModified.push(...commit.files);
          
          if (commit.date > member.lastActive) {
            member.lastActive = commit.date;
          }
        }

        // Analyze specializations based on file types
        for (const member of members.values()) {
          member.specialization = this.analyzeSpecialization(member.filesModified);
          member.role = this.inferRole(member);
          member.filesModified = [...new Set(member.filesModified)]; // Remove duplicates
        }
      }
    } catch (error) {
      console.error('Error analyzing team members:', error);
    }

    return Array.from(members.values()).sort((a, b) => b.commits - a.commits);
  }

  private analyzeSpecialization(files: string[]): string[] {
    const specializations: string[] = [];
    const extensions = new Map<string, number>();

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      extensions.set(ext, (extensions.get(ext) || 0) + 1);
    }

    const sortedExts = Array.from(extensions.entries()).sort((a, b) => b[1] - a[1]);
    
    for (const [ext, count] of sortedExts.slice(0, 3)) {
      if (count > files.length * 0.2) { // At least 20% of files
        switch (ext) {
          case '.ts':
          case '.tsx':
            specializations.push('TypeScript');
            break;
          case '.js':
          case '.jsx':
            specializations.push('JavaScript');
            break;
          case '.py':
            specializations.push('Python');
            break;
          case '.css':
          case '.scss':
          case '.less':
            specializations.push('Styling');
            break;
          case '.md':
            specializations.push('Documentation');
            break;
          case '.json':
            specializations.push('Configuration');
            break;
          case '.test.ts':
          case '.spec.ts':
            specializations.push('Testing');
            break;
        }
      }
    }

    // Analyze directory patterns
    const directories = files.map(f => path.dirname(f));
    const dirCounts = new Map<string, number>();
    
    for (const dir of directories) {
      dirCounts.set(dir, (dirCounts.get(dir) || 0) + 1);
    }

    for (const [dir, count] of dirCounts.entries()) {
      if (count > files.length * 0.3) {
        if (dir.includes('test') || dir.includes('__tests__')) {
          specializations.push('Testing');
        } else if (dir.includes('component') || dir.includes('ui')) {
          specializations.push('UI/UX');
        } else if (dir.includes('api') || dir.includes('service')) {
          specializations.push('Backend');
        } else if (dir.includes('doc')) {
          specializations.push('Documentation');
        }
      }
    }

    return [...new Set(specializations)];
  }

  private inferRole(member: TeamMember): 'lead' | 'senior' | 'junior' | 'intern' {
    const daysSinceLastActive = (Date.now() - member.lastActive.getTime()) / (1000 * 60 * 60 * 24);
    
    if (member.commits > 100 && daysSinceLastActive < 7) {
      return 'lead';
    } else if (member.commits > 50) {
      return 'senior';
    } else if (member.commits > 10) {
      return 'junior';
    } else {
      return 'intern';
    }
  }

  private async getRecentActivity(): Promise<WorkspaceActivity[]> {
    const activities: WorkspaceActivity[] = [];

    try {
      if (await this.gitIntegration.isGitRepository()) {
        const commits = await this.gitIntegration.getCommitHistory(50);
        
        for (const commit of commits) {
          activities.push({
            date: commit.date,
            author: commit.author,
            action: 'commit',
            description: commit.message,
            files: commit.files
          });
        }
      }

      // Add file system activity (recent file modifications)
      const recentFiles = await vscode.workspace.findFiles('**/*.{ts,js,tsx,jsx,py,go}', '**/node_modules/**', 20);
      
      for (const file of recentFiles.slice(0, 10)) {
        try {
          const stat = await vscode.workspace.fs.stat(file);
          const daysSinceModified = (Date.now() - stat.mtime) / (1000 * 60 * 60 * 24);
          
          if (daysSinceModified < 7) { // Modified in last week
            activities.push({
              date: new Date(stat.mtime),
              author: 'Unknown', // Would need git blame or other method
              action: 'file_edit',
              description: `Modified ${path.basename(file.fsPath)}`,
              files: [file.fsPath]
            });
          }
        } catch (error) {
          // Skip files that can't be stat'd
        }
      }
    } catch (error) {
      console.error('Error getting recent activity:', error);
    }

    return activities.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 20);
  }

  private async analyzeCodeOwnership(): Promise<CodeOwnership[]> {
    const ownership: CodeOwnership[] = [];

    try {
      if (await this.gitIntegration.isGitRepository()) {
        const files = await vscode.workspace.findFiles('**/*.{ts,js,tsx,jsx,py,go}', '**/node_modules/**', 100);
        
        for (const file of files.slice(0, 50)) { // Limit for performance
          try {
            const fileHistory = await this.gitIntegration.getFileHistory(file.fsPath, 20);
            
            if (fileHistory.length > 0) {
              const contributors = new Map<string, number>();
              
              for (const commit of fileHistory) {
                contributors.set(commit.author, (contributors.get(commit.author) || 0) + 1);
              }

              const sortedContributors = Array.from(contributors.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([name, commits]) => ({
                  name,
                  commits,
                  percentage: (commits / fileHistory.length) * 100
                }));

              const primaryOwner = sortedContributors[0]?.name || 'Unknown';
              const lastModified = fileHistory[0]?.date || new Date();
              
              // Analyze file complexity (simplified)
              const document = await vscode.workspace.openTextDocument(file);
              const content = document.getText();
              const complexity = this.analyzeFileComplexity(content);

              ownership.push({
                file: file.fsPath,
                primaryOwner,
                contributors: sortedContributors,
                lastModified,
                complexity
              });
            }
          } catch (error) {
            // Skip files that can't be analyzed
          }
        }
      }
    } catch (error) {
      console.error('Error analyzing code ownership:', error);
    }

    return ownership.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  }

  private analyzeFileComplexity(content: string): 'low' | 'medium' | 'high' {
    const lines = content.split('\n').length;
    const functions = (content.match(/function\s+\w+|def\s+\w+|func\s+\w+/g) || []).length;
    const controlStructures = (content.match(/if\s*\(|while\s*\(|for\s*\(/g) || []).length;
    
    const complexityScore = lines * 0.1 + functions * 2 + controlStructures * 1.5;
    
    if (complexityScore > 100) return 'high';
    if (complexityScore > 50) return 'medium';
    return 'low';
  }

  private calculateTeamMetrics(members: TeamMember[], ownership: CodeOwnership[]): TeamMetrics {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeMembers = members.filter(m => m.lastActive > thirtyDaysAgo);
    
    const totalCommits = members.reduce((sum, m) => sum + m.commits, 0);
    const avgCommitsPerMember = members.length > 0 ? totalCommits / members.length : 0;
    
    const codeDistribution = members.map(m => ({
      member: m.name,
      percentage: totalCommits > 0 ? (m.commits / totalCommits) * 100 : 0
    })).sort((a, b) => b.percentage - a.percentage);

    // Calculate collaboration score based on code distribution and active members
    const maxPercentage = Math.max(...codeDistribution.map(d => d.percentage));
    const collaborationScore = Math.max(0, 100 - maxPercentage + (activeMembers.length * 10));

    // Identify knowledge risk (files with single contributors)
    const knowledgeRisk = ownership
      .filter(o => o.contributors.length === 1 && o.complexity !== 'low')
      .map(o => ({
        file: o.file,
        risk: o.complexity === 'high' ? 'high' as const : 'medium' as const,
        reason: `Only ${o.primaryOwner} has worked on this ${o.complexity} complexity file`
      }));

    return {
      totalMembers: members.length,
      activeMembers: activeMembers.length,
      avgCommitsPerMember: Math.round(avgCommitsPerMember),
      codeDistribution,
      collaborationScore: Math.round(collaborationScore),
      knowledgeRisk
    };
  }

  private async getSharedConfiguration(): Promise<SharedConfiguration> {
    const defaultConfig: SharedConfiguration = {
      settings: {},
      extensions: [],
      tasks: [],
      codeStyle: {
        formatter: 'prettier',
        rules: {}
      },
      lastUpdated: new Date(),
      updatedBy: 'system'
    };

    try {
      // Load from workspace settings
      const settingsJson = path.join(this.workspaceRoot, '.vscode', 'settings.json');
      
      if (fs.existsSync(settingsJson)) {
        const settings = JSON.parse(fs.readFileSync(settingsJson, 'utf8'));
        defaultConfig.settings = settings;
      }

      // Load extensions
      const extensionsJson = path.join(this.workspaceRoot, '.vscode', 'extensions.json');
      if (fs.existsSync(extensionsJson)) {
        const extensions = JSON.parse(fs.readFileSync(extensionsJson, 'utf8'));
        defaultConfig.extensions = extensions.recommendations || [];
      }

      // Load tasks
      const tasksJson = path.join(this.workspaceRoot, '.vscode', 'tasks.json');
      if (fs.existsSync(tasksJson)) {
        const tasks = JSON.parse(fs.readFileSync(tasksJson, 'utf8'));
        defaultConfig.tasks = (tasks.tasks || []).map((task: any) => ({
          name: task.label,
          command: task.command,
          shared: true
        }));
      }

      // Load code style from prettier/eslint configs
      const prettierConfig = path.join(this.workspaceRoot, '.prettierrc');
      if (fs.existsSync(prettierConfig)) {
        try {
          const config = JSON.parse(fs.readFileSync(prettierConfig, 'utf8'));
          defaultConfig.codeStyle.rules = config;
        } catch (error) {
          // Handle non-JSON prettier configs
        }
      }

    } catch (error) {
      console.error('Error loading shared configuration:', error);
    }

    return defaultConfig;
  }

  private generateRecommendations(members: TeamMember[], metrics: TeamMetrics, _ownership: CodeOwnership[]): string[] {
    const recommendations: string[] = [];

    // Team size recommendations
    if (metrics.activeMembers < 2) {
      recommendations.push('Consider adding more active team members to reduce knowledge risk');
    }

    // Code distribution recommendations
    const topContributor = metrics.codeDistribution[0];
    if (topContributor && topContributor.percentage > 70) {
      recommendations.push(`${topContributor.member} contributes ${topContributor.percentage.toFixed(1)}% of code - consider distributing work more evenly`);
    }

    // Knowledge risk recommendations
    if (metrics.knowledgeRisk.length > 5) {
      recommendations.push(`${metrics.knowledgeRisk.length} files have single contributors - encourage code reviews and pair programming`);
    }

    // Collaboration recommendations
    if (metrics.collaborationScore < 50) {
      recommendations.push('Low collaboration score - consider implementing pair programming or code review practices');
    }

    // Specialization recommendations
    const specialists = members.filter(m => m.specialization && m.specialization.length === 1);
    if (specialists.length > members.length * 0.5) {
      recommendations.push('Many team members are highly specialized - consider cross-training to reduce risks');
    }

    // Activity recommendations
    const inactiveMembers = members.filter(m => {
      const daysSinceActive = (Date.now() - m.lastActive.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceActive > 14;
    });

    if (inactiveMembers.length > 0) {
      recommendations.push(`${inactiveMembers.length} team members have been inactive for 2+ weeks`);
    }

    return recommendations;
  }

  async saveTeamConfiguration(config: Partial<SharedConfiguration>): Promise<void> {
    try {
      const vscodeDir = path.dirname(this.configFile);
      if (!fs.existsSync(vscodeDir)) {
        fs.mkdirSync(vscodeDir, { recursive: true });
      }

      const existingConfig = await this.getSharedConfiguration();
      const updatedConfig = {
        ...existingConfig,
        ...config,
        lastUpdated: new Date(),
        updatedBy: 'current-user' // Would get from VS Code user settings
      };

      fs.writeFileSync(this.configFile, JSON.stringify(updatedConfig, null, 2));
    } catch (error) {
      console.error('Error saving team configuration:', error);
    }
  }
}
