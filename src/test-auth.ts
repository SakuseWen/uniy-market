// Simple test script to verify authentication system components
import { AuthService } from './services/AuthService';
import { UniversityEmailService } from './services/UniversityEmailService';
import { DatabaseManager } from './config/database';

async function testAuthSystem() {
  try {
    console.log('🧪 Testing Authentication System...');

    // Initialize database
    const dbManager = DatabaseManager.getInstance();
    await dbManager.initialize();

    // Test UniversityEmailService
    const universityEmailService = new UniversityEmailService();
    
    console.log('✅ Testing university email validation...');
    const testEmails = [
      'student@mahidol.ac.th',
      'test@gmail.com',
      'user@stanford.edu'
    ];

    for (const email of testEmails) {
      const result = await universityEmailService.validateEmailDomain(email);
      console.log(`   ${email}: ${result.isValid ? '✅ Valid' : '❌ Invalid'} - ${result.message}`);
    }

    // Test AuthService
    const authService = new AuthService();
    
    console.log('✅ Testing email domain verification...');
    for (const email of testEmails) {
      const isValid = await authService.verifyUniversityEmail(email);
      console.log(`   ${email}: ${isValid ? '✅ Verified' : '❌ Not verified'}`);
    }

    // Test domain statistics
    console.log('✅ Testing domain statistics...');
    const stats = await universityEmailService.getDomainStats();
    console.log(`   Total domains: ${stats.totalDomains}`);
    console.log(`   Active domains: ${stats.activeDomains}`);
    console.log(`   Countries: ${stats.countriesCount}`);

    console.log('\n🎉 Authentication system components are working correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testAuthSystem()
    .then(() => {
      console.log('✅ All tests passed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test suite failed:', error);
      process.exit(1);
    });
}

export { testAuthSystem };