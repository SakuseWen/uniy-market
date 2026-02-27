import { BaseModel } from '../models/BaseModel';

export interface UniversityDomain {
  id: number;
  domain: string;
  universityName: string;
  country: string;
  isActive: boolean;
  createdAt: string;
}

export interface EmailVerificationResult {
  isValid: boolean;
  domain: string;
  universityName?: string;
  country?: string;
  message: string;
}

export class UniversityEmailService extends BaseModel {
  /**
   * Validate if an email domain is from a whitelisted university
   */
  public async validateEmailDomain(email: string): Promise<EmailVerificationResult> {
    const domain = this.extractDomain(email);
    
    if (!domain) {
      return {
        isValid: false,
        domain: '',
        message: 'Invalid email format'
      };
    }

    const universityInfo = await this.getUniversityByDomain(domain);
    
    if (!universityInfo) {
      return {
        isValid: false,
        domain,
        message: 'Email domain is not from a recognized university'
      };
    }

    if (!universityInfo.isActive) {
      return {
        isValid: false,
        domain,
        universityName: universityInfo.universityName,
        country: universityInfo.country,
        message: 'University domain is currently inactive'
      };
    }

    return {
      isValid: true,
      domain,
      universityName: universityInfo.universityName,
      country: universityInfo.country,
      message: 'Valid university email domain'
    };
  }

  /**
   * Get university information by domain
   */
  public async getUniversityByDomain(domain: string): Promise<UniversityDomain | null> {
    return await this.queryOne(
      'SELECT * FROM UniversityWhitelist WHERE domain = ?',
      [domain.toLowerCase()]
    );
  }

  public async addUniversityDomain(
    domain: string,
    universityName: string,
    country: string
  ): Promise<UniversityDomain> {
    const now = new Date().toISOString();
    
    const result = await this.execute(
      `INSERT INTO UniversityWhitelist (domain, universityName, country, isActive, createdAt)
       VALUES (?, ?, ?, ?, ?)`,
      [domain.toLowerCase(), universityName, country, 1, now] // Remove updatedAt
    );

    if (result.changes === 0) {
      throw new Error('Failed to add university domain');
    }

    const newDomain = await this.getUniversityByDomain(domain);
    if (!newDomain) {
      throw new Error('Failed to retrieve created university domain');
    }

    return newDomain;
  }

  public async updateDomainStatus(domain: string, isActive: boolean): Promise<UniversityDomain> {
    const result = await this.execute(
      'UPDATE UniversityWhitelist SET isActive = ? WHERE domain = ?',
      [isActive ? 1 : 0, domain.toLowerCase()] // Remove updatedAt
    );

    if (result.changes === 0) {
      throw new Error('University domain not found');
    }

    const updatedDomain = await this.getUniversityByDomain(domain);
    if (!updatedDomain) {
      throw new Error('Failed to retrieve updated university domain');
    }

    return updatedDomain;
  }

  /**
   * Remove university domain from whitelist
   */
  public async removeDomain(domain: string): Promise<boolean> {
    const result = await this.execute(
      'DELETE FROM UniversityWhitelist WHERE domain = ?',
      [domain.toLowerCase()]
    );

    return result.changes > 0;
  }

  public async getAllDomains(
    page: number = 1,
    limit: number = 50,
    activeOnly: boolean = true
  ): Promise<{ domains: UniversityDomain[], total: number }> {
    const offset = (page - 1) * limit;
    let whereClause = '';
    const params: any[] = [];

    if (activeOnly) {
      whereClause = 'WHERE isActive = ?';
      params.push(1); // Use 1 instead of true for SQLite
    }

    const domains = await this.query(
      `SELECT * FROM UniversityWhitelist ${whereClause} 
       ORDER BY universityName ASC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const totalResult = await this.queryOne(
      `SELECT COUNT(*) as count FROM UniversityWhitelist ${whereClause}`,
      params
    );

    return {
      domains,
      total: totalResult?.count || 0
    };
  }

  public async searchDomains(
    searchTerm: string,
    activeOnly: boolean = true
  ): Promise<UniversityDomain[]> {
    let whereClause = 'WHERE (domain LIKE ? OR universityName LIKE ?)';
    const params: any[] = [`%${searchTerm.toLowerCase()}%`, `%${searchTerm}%`];

    if (activeOnly) {
      whereClause += ' AND isActive = ?';
      params.push(1); // Use 1 instead of true for SQLite
    }

    return await this.query(
      `SELECT * FROM UniversityWhitelist ${whereClause} 
       ORDER BY universityName ASC LIMIT 20`,
      params
    );
  }

  /**
   * Get domains by country
   */
  public async getDomainsByCountry(
    country: string,
    activeOnly: boolean = true
  ): Promise<UniversityDomain[]> {
    let whereClause = 'WHERE country = ?';
    const params: any[] = [country];

    if (activeOnly) {
      whereClause += ' AND isActive = ?';
      params.push(1); // Use 1 instead of true for SQLite
    }

    return await this.query(
      `SELECT * FROM UniversityWhitelist ${whereClause} 
       ORDER BY universityName ASC`,
      params
    );
  }

  /**
   * Bulk import university domains
   */
  public async bulkImportDomains(
    domains: Array<{
      domain: string;
      universityName: string;
      country: string;
    }>
  ): Promise<{ imported: number; failed: number; errors: string[] }> {
    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    await this.withTransaction(async () => {
      for (const domainData of domains) {
        try {
          await this.addUniversityDomain(
            domainData.domain,
            domainData.universityName,
            domainData.country
          );
          imported++;
        } catch (error) {
          failed++;
          errors.push(`Failed to import ${domainData.domain}: ${error}`);
        }
      }
    });

    return { imported, failed, errors };
  }

  /**
   * Extract domain from email address
   */
  private extractDomain(email: string): string | null {
    const emailRegex = /^[^\s@]+@([^\s@]+\.[^\s@]+)$/;
    const match = email.match(emailRegex);
    return match && match[1] ? match[1].toLowerCase() : null;
  }

  /**
   * Validate email format
   */
  public isValidEmailFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get statistics about university domains
   */
  public async getDomainStats(): Promise<{
    totalDomains: number;
    activeDomains: number;
    inactiveDomains: number;
    countriesCount: number;
    topCountries: Array<{ country: string; count: number }>;
  }> {
    const totalResult = await this.queryOne(
      'SELECT COUNT(*) as count FROM UniversityWhitelist'
    );

    const activeResult = await this.queryOne(
      'SELECT COUNT(*) as count FROM UniversityWhitelist WHERE isActive = ?',
      [1]
    );

    const inactiveResult = await this.queryOne(
      'SELECT COUNT(*) as count FROM UniversityWhitelist WHERE isActive = ?',
      [0]
    );

    const countriesResult = await this.queryOne(
      'SELECT COUNT(DISTINCT country) as count FROM UniversityWhitelist WHERE isActive = ?',
      [1]
    );

    const topCountries = await this.query(
      `SELECT country, COUNT(*) as count 
       FROM UniversityWhitelist 
       WHERE isActive = ? 
       GROUP BY country 
       ORDER BY count DESC 
       LIMIT 10`,
      [1]
    );

    return {
      totalDomains: totalResult?.count || 0,
      activeDomains: activeResult?.count || 0,
      inactiveDomains: inactiveResult?.count || 0,
      countriesCount: countriesResult?.count || 0,
      topCountries: topCountries || []
    };
  }
}