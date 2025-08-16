// Git Integration - Branch analysis, commit history, and merge conflict detection
import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface GitBranch {
  name: string;
  current: boolean;
  remote?: string;
  lastCommit?: string;
  lastCommitDate?: Date;
  author?: string;
  ahead?: number;
  behind?: number;
}

export interface GitCommit {
  hash: string;
  author: string;
  date: Date;
  message: string;
  files: string[];
  additions: number;
  deletions: number;
}

export interface MergeConflict {
  file: string;
  conflictMarkers: number;
  content: string;
  resolved: boolean;
}

export interface GitStats {
  totalCommits: number;
  totalBranches: number;
  activeBranch: string;
  remoteUrl?: string;
  contributors: string[];
  lastCommit?: GitCommit;
  conflicts: MergeConflict[];
}

export class GitIntegration {
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  async isGitRepository(): Promise<boolean> {
    try {
      await execAsync('git rev-parse --git-dir', { cwd: this.workspaceRoot });
      return true;
    } catch {
      return false;
    }
  }

  async getCurrentBranch(): Promise<string> {
    try {
      const { stdout } = await execAsync('git branch --show-current', { cwd: this.workspaceRoot });
      return stdout.trim();
    } catch {
      return 'main';
    }
  }

  async getBranches(): Promise<GitBranch[]> {
    try {
      const { stdout } = await execAsync('git branch -a -v --format="%(refname:short)|%(HEAD)|%(upstream:short)|%(objectname:short)|%(committerdate:iso8601)|%(authorname)"', 
        { cwd: this.workspaceRoot });
      
      const branches: GitBranch[] = [];
      const lines = stdout.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const parts = line.split('|');
        if (parts.length >= 6) {
          branches.push({
            name: parts[0].trim(),
            current: parts[1].trim() === '*',
            remote: parts[2].trim() || undefined,
            lastCommit: parts[3].trim(),
            lastCommitDate: new Date(parts[4].trim()),
            author: parts[5].trim()
          });
        }
      }
      
      return branches;
    } catch (error) {
      console.error('Error getting branches:', error);
      return [];
    }
  }

  async getCommitHistory(limit = 50): Promise<GitCommit[]> {
    try {
      const { stdout } = await execAsync(
        `git log --pretty=format:"%H|%an|%ad|%s" --date=iso --numstat -${limit}`,
        { cwd: this.workspaceRoot }
      );

      const commits: GitCommit[] = [];
      const sections = stdout.split('\n\n');
      
      for (const section of sections) {
        const lines = section.split('\n').filter(line => line.trim());
        if (lines.length === 0) continue;
        
        const [commitLine, ...statLines] = lines;
        const [hash, author, date, message] = commitLine.split('|');
        
        let additions = 0;
        let deletions = 0;
        const files: string[] = [];
        
        for (const statLine of statLines) {
          const parts = statLine.split('\t');
          if (parts.length === 3) {
            const [add, del, file] = parts;
            additions += parseInt(add) || 0;
            deletions += parseInt(del) || 0;
            files.push(file);
          }
        }
        
        commits.push({
          hash: hash.trim(),
          author: author.trim(),
          date: new Date(date.trim()),
          message: message.trim(),
          files,
          additions,
          deletions
        });
      }
      
      return commits;
    } catch (error) {
      console.error('Error getting commit history:', error);
      return [];
    }
  }

  async getMergeConflicts(): Promise<MergeConflict[]> {
    try {
      const { stdout } = await execAsync('git diff --name-only --diff-filter=U', { cwd: this.workspaceRoot });
      const conflictFiles = stdout.split('\n').filter(line => line.trim());
      
      const conflicts: MergeConflict[] = [];
      
      for (const file of conflictFiles) {
        try {
          const filePath = vscode.Uri.file(`${this.workspaceRoot}/${file}`);
          const document = await vscode.workspace.openTextDocument(filePath);
          const content = document.getText();
          
          const conflictMarkers = (content.match(/^<{7} /gm) || []).length;
          
          conflicts.push({
            file,
            conflictMarkers,
            content,
            resolved: conflictMarkers === 0
          });
        } catch (error) {
          console.error(`Error reading conflict file ${file}:`, error);
        }
      }
      
      return conflicts;
    } catch (error) {
      console.error('Error getting merge conflicts:', error);
      return [];
    }
  }

  async getGitStats(): Promise<GitStats> {
    try {
      const [branches, commits, conflicts, currentBranch] = await Promise.all([
        this.getBranches(),
        this.getCommitHistory(100),
        this.getMergeConflicts(),
        this.getCurrentBranch()
      ]);

      let remoteUrl: string | undefined;
      try {
        const { stdout } = await execAsync('git remote get-url origin', { cwd: this.workspaceRoot });
        remoteUrl = stdout.trim();
      } catch {
        // No remote origin
      }

      const contributors = [...new Set(commits.map(c => c.author))];
      
      return {
        totalCommits: commits.length,
        totalBranches: branches.length,
        activeBranch: currentBranch,
        remoteUrl,
        contributors,
        lastCommit: commits[0],
        conflicts
      };
    } catch (error) {
      console.error('Error getting git stats:', error);
      return {
        totalCommits: 0,
        totalBranches: 0,
        activeBranch: 'main',
        contributors: [],
        conflicts: []
      };
    }
  }

  async analyzeBranchDivergence(branch1: string, branch2: string): Promise<{ ahead: number; behind: number }> {
    try {
      const { stdout: aheadOutput } = await execAsync(
        `git rev-list --count ${branch1}..${branch2}`,
        { cwd: this.workspaceRoot }
      );
      const { stdout: behindOutput } = await execAsync(
        `git rev-list --count ${branch2}..${branch1}`,
        { cwd: this.workspaceRoot }
      );
      
      return {
        ahead: parseInt(aheadOutput.trim()) || 0,
        behind: parseInt(behindOutput.trim()) || 0
      };
    } catch (error) {
      console.error('Error analyzing branch divergence:', error);
      return { ahead: 0, behind: 0 };
    }
  }

  async getFileHistory(filePath: string, limit = 20): Promise<GitCommit[]> {
    try {
      const { stdout } = await execAsync(
        `git log --pretty=format:"%H|%an|%ad|%s" --date=iso -${limit} -- "${filePath}"`,
        { cwd: this.workspaceRoot }
      );

      const commits: GitCommit[] = [];
      const lines = stdout.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const [hash, author, date, message] = line.split('|');
        
        commits.push({
          hash: hash.trim(),
          author: author.trim(),
          date: new Date(date.trim()),
          message: message.trim(),
          files: [filePath],
          additions: 0, // Would need additional call to get stats
          deletions: 0
        });
      }
      
      return commits;
    } catch (error) {
      console.error('Error getting file history:', error);
      return [];
    }
  }
}
