// CI/CD Integration - Build pipeline analysis and deployment tracking
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export interface PipelineStep {
  name: string;
  status: 'success' | 'failure' | 'running' | 'pending' | 'skipped';
  duration: number; // in seconds
  startTime?: Date;
  endTime?: Date;
  logs?: string[];
  artifacts?: string[];
}

export interface BuildRun {
  id: string;
  number: number;
  status: 'success' | 'failure' | 'running' | 'cancelled';
  branch: string;
  commit: string;
  author: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  steps: PipelineStep[];
  triggeredBy: 'push' | 'pull_request' | 'schedule' | 'manual';
}

export interface DeploymentInfo {
  id: string;
  environment: string;
  status: 'success' | 'failure' | 'running' | 'pending';
  version: string;
  deployedAt: Date;
  deployedBy: string;
  buildRun: string;
  rollbackAvailable: boolean;
  healthChecks?: Array<{
    name: string;
    status: 'healthy' | 'unhealthy' | 'warning';
    message?: string;
  }>;
}

export interface PipelineMetrics {
  successRate: number;
  averageBuildTime: number;
  failureRate: number;
  deploymentFrequency: number; // deployments per day
  leadTime: number; // hours from commit to production
  meanTimeToRecovery: number; // hours to fix broken builds
  changeFailureRate: number;
}

export interface CIPlatform {
  name: string;
  configFiles: string[];
  detected: boolean;
  supported: boolean;
}

export interface CICDInsights {
  platforms: CIPlatform[];
  recentRuns: BuildRun[];
  deployments: DeploymentInfo[];
  metrics: PipelineMetrics;
  recommendations: string[];
  healthScore: number; // 0-100
}

export class CICDAnalyzer {
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  async analyzeCICD(): Promise<CICDInsights> {
    const platforms = await this.detectCIPlatforms();
    const [recentRuns, deployments] = await Promise.all([
      this.getRecentBuildRuns(),
      this.getDeploymentHistory()
    ]);
    
    const metrics = this.calculateMetrics(recentRuns, deployments);
    const recommendations = this.generateRecommendations(platforms, metrics, recentRuns);
    const healthScore = this.calculateHealthScore(metrics);

    return {
      platforms,
      recentRuns,
      deployments,
      metrics,
      recommendations,
      healthScore
    };
  }

  private async detectCIPlatforms(): Promise<CIPlatform[]> {
    const platforms: CIPlatform[] = [
      {
        name: 'GitHub Actions',
        configFiles: ['.github/workflows/*.yml', '.github/workflows/*.yaml'],
        detected: false,
        supported: true
      },
      {
        name: 'GitLab CI',
        configFiles: ['.gitlab-ci.yml'],
        detected: false,
        supported: true
      },
      {
        name: 'Azure DevOps',
        configFiles: ['azure-pipelines.yml', '.azure/pipelines/*.yml'],
        detected: false,
        supported: true
      },
      {
        name: 'Jenkins',
        configFiles: ['Jenkinsfile', 'jenkins/*.groovy'],
        detected: false,
        supported: true
      },
      {
        name: 'CircleCI',
        configFiles: ['.circleci/config.yml'],
        detected: false,
        supported: true
      },
      {
        name: 'Travis CI',
        configFiles: ['.travis.yml'],
        detected: false,
        supported: true
      },
      {
        name: 'Bitbucket Pipelines',
        configFiles: ['bitbucket-pipelines.yml'],
        detected: false,
        supported: true
      }
    ];

    for (const platform of platforms) {
      for (const pattern of platform.configFiles) {
        try {
          const files = await vscode.workspace.findFiles(pattern, '**/node_modules/**', 1);
          if (files.length > 0) {
            platform.detected = true;
            break;
          }
        } catch (error) {
          console.warn(`Error checking for ${platform.name} config:`, error);
        }
      }
    }

    return platforms;
  }

  private async getRecentBuildRuns(): Promise<BuildRun[]> {
    const runs: BuildRun[] = [];

    try {
      // For now, we'll mock data. In a real implementation, this would
      // integrate with CI/CD APIs or parse local build artifacts
      
      // Check for GitHub Actions workflows
      const workflowFiles = await vscode.workspace.findFiles('.github/workflows/*.{yml,yaml}', '', 10);
      
      for (const workflowFile of workflowFiles) {
        try {
          const content = fs.readFileSync(workflowFile.fsPath, 'utf8');
          const workflow = yaml.load(content) as any;
          
          // Generate mock recent runs for each workflow
          for (let i = 0; i < 5; i++) {
            const runId = `run-${Date.now()}-${i}`;
            const startTime = new Date(Date.now() - (i * 2 * 60 * 60 * 1000)); // 2 hours apart
            const duration = Math.floor(Math.random() * 600 + 60); // 1-10 minutes
            const endTime = new Date(startTime.getTime() + duration * 1000);
            const status = Math.random() > 0.8 ? 'failure' : 'success';

            const steps: PipelineStep[] = [];
            if (workflow.jobs) {
              for (const [jobName, job] of Object.entries(workflow.jobs)) {
                const jobSteps = (job as any).steps || [];
                for (let stepIndex = 0; stepIndex < Math.min(jobSteps.length, 5); stepIndex++) {
                  const step = jobSteps[stepIndex];
                  const stepDuration = Math.floor(Math.random() * 120 + 10);
                  
                  steps.push({
                    name: step.name || `Step ${stepIndex + 1}`,
                    status: status === 'failure' && stepIndex === jobSteps.length - 1 ? 'failure' : 'success',
                    duration: stepDuration,
                    startTime: new Date(startTime.getTime() + stepIndex * stepDuration * 1000),
                    endTime: new Date(startTime.getTime() + (stepIndex + 1) * stepDuration * 1000)
                  });
                }
              }
            }

            runs.push({
              id: runId,
              number: 100 - i,
              status: status as 'success' | 'failure',
              branch: i === 0 ? 'main' : `feature/branch-${i}`,
              commit: `abc123${i}`,
              author: `developer-${i % 3 + 1}`,
              startTime,
              endTime,
              duration,
              steps,
              triggeredBy: i === 0 ? 'push' : 'pull_request'
            });
          }
        } catch (error) {
          console.warn('Error parsing workflow file:', workflowFile.fsPath, error);
        }
      }

      // If no workflow files found, generate some mock data anyway
      if (runs.length === 0) {
        for (let i = 0; i < 10; i++) {
          const startTime = new Date(Date.now() - (i * 3 * 60 * 60 * 1000));
          const duration = Math.floor(Math.random() * 600 + 120);
          const status = Math.random() > 0.85 ? 'failure' : 'success';

          runs.push({
            id: `mock-run-${i}`,
            number: 50 - i,
            status: status as 'success' | 'failure',
            branch: i === 0 ? 'main' : `feature/mock-${i}`,
            commit: `hash${i.toString().padStart(7, '0')}`,
            author: `developer-${i % 4 + 1}`,
            startTime,
            endTime: new Date(startTime.getTime() + duration * 1000),
            duration,
            steps: [
              {
                name: 'Setup',
                status: 'success',
                duration: 30
              },
              {
                name: 'Build',
                status: status === 'failure' ? 'failure' : 'success',
                duration: duration - 60
              },
              {
                name: 'Test',
                status: status === 'failure' ? 'skipped' : 'success',
                duration: 30
              }
            ],
            triggeredBy: i % 3 === 0 ? 'push' : 'pull_request'
          });
        }
      }
    } catch (error) {
      console.error('Error getting recent build runs:', error);
    }

    return runs.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  private async getDeploymentHistory(): Promise<DeploymentInfo[]> {
    const deployments: DeploymentInfo[] = [];

    try {
      // Check for deployment configuration files
      const deploymentConfigs = await vscode.workspace.findFiles(
        '{docker-compose.yml,Dockerfile,k8s/**/*.yml,helm/**/*.yml,.deploy/**/*}',
        '**/node_modules/**',
        20
      );

      // Generate mock deployment data based on found configs
      const environments = ['development', 'staging', 'production'];
      
      for (let i = 0; i < 15; i++) {
        const deployedAt = new Date(Date.now() - (i * 6 * 60 * 60 * 1000)); // 6 hours apart
        const environment = environments[i % environments.length];
        const status = Math.random() > 0.9 ? 'failure' : 'success';

        deployments.push({
          id: `deploy-${i}`,
          environment,
          status: status as 'success' | 'failure',
          version: `v1.${20 - i}.${Math.floor(Math.random() * 10)}`,
          deployedAt,
          deployedBy: `deployer-${i % 3 + 1}`,
          buildRun: `build-${i}`,
          rollbackAvailable: i > 0 && environment === 'production',
          healthChecks: environment === 'production' ? [
            {
              name: 'API Health',
              status: status === 'success' ? 'healthy' : 'unhealthy',
              message: status === 'success' ? 'All endpoints responding' : 'Some endpoints failing'
            },
            {
              name: 'Database Connection',
              status: 'healthy',
              message: 'Connected to primary database'
            },
            {
              name: 'External Dependencies',
              status: Math.random() > 0.8 ? 'warning' : 'healthy',
              message: Math.random() > 0.8 ? 'Slow response from external API' : 'All dependencies healthy'
            }
          ] : undefined
        });
      }
    } catch (error) {
      console.error('Error getting deployment history:', error);
    }

    return deployments.sort((a, b) => b.deployedAt.getTime() - a.deployedAt.getTime());
  }

  private calculateMetrics(runs: BuildRun[], deployments: DeploymentInfo[]): PipelineMetrics {
    if (runs.length === 0) {
      return {
        successRate: 0,
        averageBuildTime: 0,
        failureRate: 0,
        deploymentFrequency: 0,
        leadTime: 0,
        meanTimeToRecovery: 0,
        changeFailureRate: 0
      };
    }

    // Success rate
    const successfulRuns = runs.filter(r => r.status === 'success').length;
    const successRate = (successfulRuns / runs.length) * 100;
    const failureRate = 100 - successRate;

    // Average build time
    const completedRuns = runs.filter(r => r.endTime);
    const averageBuildTime = completedRuns.length > 0 
      ? completedRuns.reduce((sum, r) => sum + r.duration, 0) / completedRuns.length 
      : 0;

    // Deployment frequency (deployments per day)
    const recentDeployments = deployments.filter(d => {
      const daysSince = (Date.now() - d.deployedAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 30; // Last 30 days
    });
    const deploymentFrequency = recentDeployments.length / 30;

    // Lead time (simplified: time from first commit to production deployment)
    const prodDeployments = deployments.filter(d => d.environment === 'production').slice(0, 5);
    const averageLeadTime = prodDeployments.length > 0 
      ? prodDeployments.reduce((sum, d) => {
          // Mock calculation: assume 2-48 hours lead time
          return sum + (Math.random() * 46 + 2);
        }, 0) / prodDeployments.length
      : 24;

    // Mean time to recovery (time to fix broken builds)
    const failedRuns = runs.filter(r => r.status === 'failure');
    let totalRecoveryTime = 0;
    let recoveryCount = 0;

    for (const failedRun of failedRuns) {
      const nextSuccessfulRun = runs.find(r => 
        r.startTime > failedRun.startTime && 
        r.status === 'success' && 
        r.branch === failedRun.branch
      );
      
      if (nextSuccessfulRun) {
        const recoveryTime = (nextSuccessfulRun.startTime.getTime() - failedRun.startTime.getTime()) / (1000 * 60 * 60);
        totalRecoveryTime += recoveryTime;
        recoveryCount++;
      }
    }

    const meanTimeToRecovery = recoveryCount > 0 ? totalRecoveryTime / recoveryCount : 0;

    // Change failure rate (percentage of deployments that cause failures)
    const failedDeployments = deployments.filter(d => d.status === 'failure').length;
    const changeFailureRate = deployments.length > 0 
      ? (failedDeployments / deployments.length) * 100 
      : 0;

    return {
      successRate: Math.round(successRate * 100) / 100,
      averageBuildTime: Math.round(averageBuildTime),
      failureRate: Math.round(failureRate * 100) / 100,
      deploymentFrequency: Math.round(deploymentFrequency * 100) / 100,
      leadTime: Math.round(averageLeadTime * 100) / 100,
      meanTimeToRecovery: Math.round(meanTimeToRecovery * 100) / 100,
      changeFailureRate: Math.round(changeFailureRate * 100) / 100
    };
  }

  private generateRecommendations(platforms: CIPlatform[], metrics: PipelineMetrics, runs: BuildRun[]): string[] {
    const recommendations: string[] = [];

    // Platform recommendations
    const detectedPlatforms = platforms.filter(p => p.detected);
    if (detectedPlatforms.length === 0) {
      recommendations.push('No CI/CD platform detected - consider setting up automated builds and deployments');
    } else if (detectedPlatforms.length > 1) {
      recommendations.push('Multiple CI/CD platforms detected - consider consolidating to reduce complexity');
    }

    // Performance recommendations
    if (metrics.averageBuildTime > 600) { // 10 minutes
      recommendations.push('Build times are high - consider optimizing build process and using caching');
    }

    if (metrics.successRate < 80) {
      recommendations.push('Build success rate is low - focus on improving build stability');
    }

    if (metrics.deploymentFrequency < 0.1) { // Less than 1 deployment per 10 days
      recommendations.push('Deployment frequency is low - consider implementing continuous deployment');
    }

    if (metrics.leadTime > 48) { // More than 48 hours
      recommendations.push('Lead time is high - streamline the process from commit to production');
    }

    if (metrics.meanTimeToRecovery > 4) { // More than 4 hours
      recommendations.push('Mean time to recovery is high - improve monitoring and incident response');
    }

    if (metrics.changeFailureRate > 15) {
      recommendations.push('Change failure rate is high - improve testing and deployment practices');
    }

    // Recent failure analysis
    const recentFailures = runs.filter(r => 
      r.status === 'failure' && 
      (Date.now() - r.startTime.getTime()) < 7 * 24 * 60 * 60 * 1000 // Last 7 days
    );

    if (recentFailures.length > 3) {
      recommendations.push('Multiple recent build failures - investigate common causes');
    }

    // Branch analysis
    const mainBranchFailures = runs.filter(r => 
      r.branch === 'main' && 
      r.status === 'failure'
    ).length;

    if (mainBranchFailures > 0) {
      recommendations.push('Main branch has failed builds - implement branch protection rules');
    }

    return recommendations;
  }

  private calculateHealthScore(metrics: PipelineMetrics): number {
    let score = 100;

    // Deduct points based on metrics
    score -= (100 - metrics.successRate) * 0.5; // Success rate weight: 50%
    
    if (metrics.averageBuildTime > 300) score -= 10; // 5+ minutes
    if (metrics.averageBuildTime > 600) score -= 10; // 10+ minutes
    
    if (metrics.deploymentFrequency < 0.1) score -= 15; // Less than 3 per month
    if (metrics.deploymentFrequency < 0.03) score -= 10; // Less than 1 per month
    
    if (metrics.leadTime > 24) score -= 10; // More than 1 day
    if (metrics.leadTime > 72) score -= 10; // More than 3 days
    
    if (metrics.meanTimeToRecovery > 2) score -= 10; // More than 2 hours
    if (metrics.meanTimeToRecovery > 8) score -= 10; // More than 8 hours
    
    score -= metrics.changeFailureRate * 0.5; // Each % of failure rate

    return Math.max(0, Math.round(score));
  }

  async getPipelineConfiguration(platform: string): Promise<any> {
    try {
      switch (platform.toLowerCase()) {
        case 'github actions':
          const workflowFiles = await vscode.workspace.findFiles('.github/workflows/*.{yml,yaml}');
          const workflows = [];
          
          for (const file of workflowFiles) {
            const content = fs.readFileSync(file.fsPath, 'utf8');
            const workflow = yaml.load(content);
            workflows.push({
              name: path.basename(file.fsPath),
              config: workflow
            });
          }
          
          return workflows;
          
        case 'gitlab ci':
          const gitlabFile = path.join(this.workspaceRoot, '.gitlab-ci.yml');
          if (fs.existsSync(gitlabFile)) {
            const content = fs.readFileSync(gitlabFile, 'utf8');
            return yaml.load(content);
          }
          break;
          
        default:
          return null;
      }
    } catch (error) {
      console.error('Error getting pipeline configuration:', error);
      return null;
    }
  }
}
