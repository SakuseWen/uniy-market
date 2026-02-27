import { DatabaseManager } from '../config/database';
import { UniversityEmailService } from '../services/UniversityEmailService';

const sampleUniversityDomains = [
  // Thailand Universities
  { domain: 'student.chula.ac.th', universityName: 'Chulalongkorn University', country: 'Thailand' },
  { domain: 'ku.th', universityName: 'Kasetsart University', country: 'Thailand' },
  { domain: 'mahidol.ac.th', universityName: 'Mahidol University', country: 'Thailand' },
  { domain: 'tu.ac.th', universityName: 'Thammasat University', country: 'Thailand' },
  { domain: 'kmitl.ac.th', universityName: 'King Mongkut\'s Institute of Technology Ladkrabang', country: 'Thailand' },
  { domain: 'kmutt.ac.th', universityName: 'King Mongkut\'s University of Technology Thonburi', country: 'Thailand' },
  { domain: 'cmu.ac.th', universityName: 'Chiang Mai University', country: 'Thailand' },
  { domain: 'psu.ac.th', universityName: 'Prince of Songkla University', country: 'Thailand' },
  { domain: 'su.ac.th', universityName: 'Silpakorn University', country: 'Thailand' },
  { domain: 'buu.ac.th', universityName: 'Burapha University', country: 'Thailand' },

  // International Universities (for testing)
  { domain: 'stanford.edu', universityName: 'Stanford University', country: 'United States' },
  { domain: 'mit.edu', universityName: 'Massachusetts Institute of Technology', country: 'United States' },
  { domain: 'harvard.edu', universityName: 'Harvard University', country: 'United States' },
  { domain: 'berkeley.edu', universityName: 'University of California, Berkeley', country: 'United States' },
  { domain: 'ox.ac.uk', universityName: 'University of Oxford', country: 'United Kingdom' },
  { domain: 'cam.ac.uk', universityName: 'University of Cambridge', country: 'United Kingdom' },
  { domain: 'imperial.ac.uk', universityName: 'Imperial College London', country: 'United Kingdom' },
  { domain: 'utoronto.ca', universityName: 'University of Toronto', country: 'Canada' },
  { domain: 'ubc.ca', universityName: 'University of British Columbia', country: 'Canada' },
  { domain: 'nus.edu.sg', universityName: 'National University of Singapore', country: 'Singapore' },
  { domain: 'ntu.edu.sg', universityName: 'Nanyang Technological University', country: 'Singapore' },
  { domain: 'u-tokyo.ac.jp', universityName: 'University of Tokyo', country: 'Japan' },
  { domain: 'kyoto-u.ac.jp', universityName: 'Kyoto University', country: 'Japan' },
  { domain: 'snu.ac.kr', universityName: 'Seoul National University', country: 'South Korea' },
  { domain: 'kaist.ac.kr', universityName: 'Korea Advanced Institute of Science and Technology', country: 'South Korea' },

  // Chinese Universities
  { domain: 'pku.edu.cn', universityName: 'Peking University', country: 'China' },
  { domain: 'tsinghua.edu.cn', universityName: 'Tsinghua University', country: 'China' },
  { domain: 'fudan.edu.cn', universityName: 'Fudan University', country: 'China' },
  { domain: 'sjtu.edu.cn', universityName: 'Shanghai Jiao Tong University', country: 'China' },

  // Australian Universities
  { domain: 'unimelb.edu.au', universityName: 'University of Melbourne', country: 'Australia' },
  { domain: 'sydney.edu.au', universityName: 'University of Sydney', country: 'Australia' },
  { domain: 'unsw.edu.au', universityName: 'University of New South Wales', country: 'Australia' },
];

async function seedUniversityDomains(): Promise<void> {
  try {
    console.log('🌱 Starting university domains seeding...');

    // Initialize database
    const dbManager = DatabaseManager.getInstance();
    await dbManager.initialize();

    const universityEmailService = new UniversityEmailService();

    // Check if domains already exist
    const existingDomains = await universityEmailService.getAllDomains(1, 1000, false);
    
    if (existingDomains.total > 0) {
      console.log(`📊 Found ${existingDomains.total} existing domains.`);
      console.log('🔄 Proceeding with bulk import (will skip duplicates)...');
    }

    // Bulk import domains
    const result = await universityEmailService.bulkImportDomains(sampleUniversityDomains);

    console.log('✅ University domains seeding completed!');
    console.log(`📈 Results: ${result.imported} imported, ${result.failed} failed`);

    if (result.errors.length > 0) {
      console.log('❌ Errors:');
      result.errors.forEach(error => console.log(`   - ${error}`));
    }

    // Display statistics
    const stats = await universityEmailService.getDomainStats();
    console.log('\n📊 Domain Statistics:');
    console.log(`   Total domains: ${stats.totalDomains}`);
    console.log(`   Active domains: ${stats.activeDomains}`);
    console.log(`   Countries: ${stats.countriesCount}`);
    console.log('\n🏆 Top countries:');
    stats.topCountries.slice(0, 5).forEach(country => {
      console.log(`   ${country.country}: ${country.count} domains`);
    });

  } catch (error) {
    console.error('❌ Error seeding university domains:', error);
    process.exit(1);
  }
}

// Run the seeding function if this script is executed directly
if (require.main === module) {
  seedUniversityDomains()
    .then(() => {
      console.log('🎉 Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

export { seedUniversityDomains };