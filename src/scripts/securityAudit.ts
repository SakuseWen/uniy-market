/**
 * Security Audit Script
 * Performs security checks on the application
 */

import fs from 'fs/promises';
import path from 'path';

interface SecurityIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  recommendation: string;
}

class SecurityAuditor {
  private issues: SecurityIssue[] = [];

  /**
   * Run all security checks
   */
  async runAudit(): Promise<void> {
    console.log('🔒 Starting Security Audit...\n');

    await this.checkEnvironmentVariables();
    await this.checkDependencies();
    await this.checkFilePermissions();
    await this.checkSecurityHeaders();
    await this.checkInputValidation();
    await this.checkAuthentication();
    await this.checkRateLimiting();

    this.printReport();
  }

  /**
   * Check environment variables
   */
  private async checkEnvironmentVariables(): Promise<void> {
    console.log('Checking environment variables...');

    const requiredVars = [
      'JWT_SECRET',
      'SESSION_SECRET',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
    ];

    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        this.addIssue({
          severity: 'critical',
          category: 'Environment',
          description: `Missing required environment variable: ${varName}`,
          recommendation: `Set ${varName} in your .env file`,
        });
      } else if (varName.includes('SECRET')) {
        const value = process.env[varName] || '';
        if (value.length < 32) {
          this.addIssue({
            severity: 'high',
            category: 'Environment',
            description: `${varName} is too short (less than 32 characters)`,
            recommendation: `Use a longer, more secure secret for ${varName}`,
          });
        }
        if (value.includes('your-') || value.includes('change-this')) {
          this.addIssue({
            severity: 'critical',
            category: 'Environment',
            description: `${varName} appears to be using default value`,
            recommendation: `Change ${varName} to a unique, secure value`,
          });
        }
      }
    }

    // Check NODE_ENV
    if (process.env['NODE_ENV'] === 'production') {
      if (!process.env['HTTPS']) {
        this.addIssue({
          severity: 'high',
          category: 'Environment',
          description: 'HTTPS not enabled in production',
          recommendation: 'Enable HTTPS for production deployment',
        });
      }
    }
  }

  /**
   * Check dependencies for vulnerabilities
   */
  private async checkDependencies(): Promise<void> {
    console.log('Checking dependencies...');

    try {
      const packageJson = await fs.readFile(
        path.join(process.cwd(), 'package.json'),
        'utf-8'
      );
      const pkg = JSON.parse(packageJson);

      // Check for deprecated packages
      const deprecatedPackages = ['csurf', 'xss-clean'];
      for (const dep of deprecatedPackages) {
        if (pkg.dependencies?.[dep] || pkg.devDependencies?.[dep]) {
          this.addIssue({
            severity: 'medium',
            category: 'Dependencies',
            description: `Using deprecated package: ${dep}`,
            recommendation: `Consider replacing ${dep} with an alternative`,
          });
        }
      }
    } catch (error) {
      console.error('Failed to check dependencies:', error);
    }
  }

  /**
   * Check file permissions
   */
  private async checkFilePermissions(): Promise<void> {
    console.log('Checking file permissions...');

    const sensitiveFiles = ['.env', '.env.production', 'data/uniy_market.db'];

    for (const file of sensitiveFiles) {
      try {
        const filePath = path.join(process.cwd(), file);
        const stats = await fs.stat(filePath);
        const mode = stats.mode & parseInt('777', 8);

        // Check if file is world-readable
        if (mode & parseInt('004', 8)) {
          this.addIssue({
            severity: 'high',
            category: 'File Permissions',
            description: `${file} is world-readable`,
            recommendation: `Restrict permissions: chmod 600 ${file}`,
          });
        }
      } catch {
        // File doesn't exist, skip
      }
    }
  }

  /**
   * Check security headers implementation
   */
  private async checkSecurityHeaders(): Promise<void> {
    console.log('Checking security headers...');

    // Check if security middleware is imported
    try {
      const indexPath = path.join(process.cwd(), 'src', 'index.ts');
      const content = await fs.readFile(indexPath, 'utf-8');

      const requiredMiddleware = [
        'helmet',
        'securityHeaders',
        'sanitizeAll',
        'rateLimiter',
      ];

      for (const middleware of requiredMiddleware) {
        if (!content.includes(middleware)) {
          this.addIssue({
            severity: 'high',
            category: 'Security Headers',
            description: `Missing security middleware: ${middleware}`,
            recommendation: `Import and use ${middleware} middleware`,
          });
        }
      }
    } catch (error) {
      console.error('Failed to check security headers:', error);
    }
  }

  /**
   * Check input validation
   */
  private async checkInputValidation(): Promise<void> {
    console.log('Checking input validation...');

    // This is a simplified check - in production, you'd want more thorough analysis
    this.addIssue({
      severity: 'low',
      category: 'Input Validation',
      description: 'Manual review recommended for input validation',
      recommendation: 'Review all API endpoints for proper input validation',
    });
  }

  /**
   * Check authentication implementation
   */
  private async checkAuthentication(): Promise<void> {
    console.log('Checking authentication...');

    // Check if JWT is properly configured
    if (!process.env['JWT_SECRET']) {
      this.addIssue({
        severity: 'critical',
        category: 'Authentication',
        description: 'JWT_SECRET not configured',
        recommendation: 'Set a strong JWT_SECRET in environment variables',
      });
    }

    // Check session configuration
    if (!process.env['SESSION_SECRET']) {
      this.addIssue({
        severity: 'critical',
        category: 'Authentication',
        description: 'SESSION_SECRET not configured',
        recommendation: 'Set a strong SESSION_SECRET in environment variables',
      });
    }
  }

  /**
   * Check rate limiting
   */
  private async checkRateLimiting(): Promise<void> {
    console.log('Checking rate limiting...');

    try {
      const indexPath = path.join(process.cwd(), 'src', 'index.ts');
      const content = await fs.readFile(indexPath, 'utf-8');

      if (!content.includes('rateLimiter') && !content.includes('rateLimit')) {
        this.addIssue({
          severity: 'high',
          category: 'Rate Limiting',
          description: 'Rate limiting not implemented',
          recommendation: 'Implement rate limiting for all API endpoints',
        });
      }
    } catch (error) {
      console.error('Failed to check rate limiting:', error);
    }
  }

  /**
   * Add security issue
   */
  private addIssue(issue: SecurityIssue): void {
    this.issues.push(issue);
  }

  /**
   * Print audit report
   */
  private printReport(): void {
    console.log('\n' + '='.repeat(80));
    console.log('SECURITY AUDIT REPORT');
    console.log('='.repeat(80) + '\n');

    if (this.issues.length === 0) {
      console.log('✅ No security issues found!\n');
      return;
    }

    // Group by severity
    const bySeverity = {
      critical: this.issues.filter(i => i.severity === 'critical'),
      high: this.issues.filter(i => i.severity === 'high'),
      medium: this.issues.filter(i => i.severity === 'medium'),
      low: this.issues.filter(i => i.severity === 'low'),
    };

    console.log(`Total Issues: ${this.issues.length}\n`);
    console.log(`🔴 Critical: ${bySeverity.critical.length}`);
    console.log(`🟠 High: ${bySeverity.high.length}`);
    console.log(`🟡 Medium: ${bySeverity.medium.length}`);
    console.log(`🟢 Low: ${bySeverity.low.length}\n`);

    // Print issues by severity
    for (const [severity, issues] of Object.entries(bySeverity)) {
      if (issues.length === 0) continue;

      const icon = {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🟢',
      }[severity];

      console.log(`\n${icon} ${severity.toUpperCase()} SEVERITY ISSUES:\n`);

      issues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.category}] ${issue.description}`);
        console.log(`   Recommendation: ${issue.recommendation}\n`);
      });
    }

    console.log('='.repeat(80) + '\n');
  }
}

// Run audit if executed directly
if (require.main === module) {
  const auditor = new SecurityAuditor();
  auditor.runAudit().catch(console.error);
}

export { SecurityAuditor };
