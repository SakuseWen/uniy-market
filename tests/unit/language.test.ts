import request from 'supertest';
import { app } from '../../src/index';
import { DatabaseManager } from '../../src/config/database';
import { UserModel } from '../../src/models/UserModel';
import { AuthService } from '../../src/services/AuthService';
import LocalizationService from '../../src/services/LocalizationService';

describe('Language Switching / 语言切换', () => {
  let dbManager: DatabaseManager;
  let userModel: UserModel;
  let authService: AuthService;
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {
    dbManager = DatabaseManager.getInstance();
    await dbManager.initialize();
    userModel = new UserModel();
    authService = new AuthService();

    // Create a test user
    testUser = await userModel.createUser({
      email: 'test@university.edu',
      name: 'Test User',
      isVerified: true,
      preferredLanguage: 'en',
      isAdmin: false,
      status: 'active'
    });

    // Create auth token
    const session = await authService.createSession(testUser);
    authToken = session.token;
  });

  afterAll(async () => {
    // Clean up test data
    if (testUser) {
      await userModel.deleteUser(testUser.userID);
    }
    await dbManager.close();
  });

  describe('GET /api/language/supported', () => {
    it('should return list of supported languages', async () => {
      const response = await request(app)
        .get('/api/language/supported')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.languages).toBeDefined();
      expect(response.body.data.languages.length).toBeGreaterThan(0);
      
      const languageCodes = response.body.data.languages.map((l: any) => l.code);
      expect(languageCodes).toContain('en');
      expect(languageCodes).toContain('th');
      expect(languageCodes).toContain('zh');
    });
  });

  describe('GET /api/language/locales/:lang', () => {
    it('should return English locale data', async () => {
      const response = await request(app)
        .get('/api/language/locales/en')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.language).toBe('en');
      expect(response.body.data.translations).toBeDefined();
      expect(response.body.data.translations.common).toBeDefined();
      expect(response.body.data.translations.common.welcome).toBe('Welcome');
    });

    it('should return Thai locale data', async () => {
      const response = await request(app)
        .get('/api/language/locales/th')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.language).toBe('th');
      expect(response.body.data.translations).toBeDefined();
      expect(response.body.data.translations.common).toBeDefined();
      expect(response.body.data.translations.common.welcome).toBe('ยินดีต้อนรับ');
    });

    it('should return Chinese locale data', async () => {
      const response = await request(app)
        .get('/api/language/locales/zh')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.language).toBe('zh');
      expect(response.body.data.translations).toBeDefined();
      expect(response.body.data.translations.common).toBeDefined();
      expect(response.body.data.translations.common.welcome).toBe('欢迎');
    });

    it('should return 400 for invalid language code', async () => {
      const response = await request(app)
        .get('/api/language/locales/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/language/string/:key', () => {
    it('should return localized string for English', async () => {
      const response = await request(app)
        .get('/api/language/string/common.welcome')
        .query({ lang: 'en' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.key).toBe('common.welcome');
      expect(response.body.data.language).toBe('en');
      expect(response.body.data.value).toBe('Welcome');
    });

    it('should return localized string for Thai', async () => {
      const response = await request(app)
        .get('/api/language/string/common.login')
        .query({ lang: 'th' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.value).toBe('เข้าสู่ระบบ');
    });

    it('should return localized string for Chinese', async () => {
      const response = await request(app)
        .get('/api/language/string/product.title')
        .query({ lang: 'zh' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.value).toBe('标题');
    });

    it('should default to English if no language specified', async () => {
      const response = await request(app)
        .get('/api/language/string/common.welcome')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.language).toBe('en');
      expect(response.body.data.value).toBe('Welcome');
    });
  });

  describe('PUT /api/language/preference', () => {
    it('should update user language preference to Thai', async () => {
      const response = await request(app)
        .put('/api/language/preference')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ language: 'th' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.preferredLanguage).toBe('th');
      expect(response.body.data.message).toBeDefined();
    });

    it('should update user language preference to Chinese', async () => {
      const response = await request(app)
        .put('/api/language/preference')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ language: 'zh' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.preferredLanguage).toBe('zh');
    });

    it('should update user language preference back to English', async () => {
      const response = await request(app)
        .put('/api/language/preference')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ language: 'en' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.preferredLanguage).toBe('en');
    });

    it('should return 400 for invalid language code', async () => {
      const response = await request(app)
        .put('/api/language/preference')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ language: 'fr' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put('/api/language/preference')
        .send({ language: 'th' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/language/preference', () => {
    it('should return current user language preference', async () => {
      const response = await request(app)
        .get('/api/language/preference')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.language).toBeDefined();
      expect(['en', 'th', 'zh']).toContain(response.body.data.language);
      expect(response.body.data.languageName).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/language/preference')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('LocalizationService', () => {
    it('should get string from English locale', () => {
      const str = LocalizationService.getString('en', 'common.welcome');
      expect(str).toBe('Welcome');
    });

    it('should get string from Thai locale', () => {
      const str = LocalizationService.getString('th', 'common.welcome');
      expect(str).toBe('ยินดีต้อนรับ');
    });

    it('should get string from Chinese locale', () => {
      const str = LocalizationService.getString('zh', 'common.welcome');
      expect(str).toBe('欢迎');
    });

    it('should return fallback for missing key', () => {
      const str = LocalizationService.getString('en', 'nonexistent.key', 'Fallback');
      expect(str).toBe('Fallback');
    });

    it('should return key if no fallback provided', () => {
      const str = LocalizationService.getString('en', 'nonexistent.key');
      expect(str).toBe('nonexistent.key');
    });

    it('should get entire section', () => {
      const section = LocalizationService.getSection('en', 'common');
      expect(section).toBeDefined();
      expect(section?.['welcome']).toBe('Welcome');
      expect(section?.['login']).toBe('Login');
    });

    it('should check if language is supported', () => {
      expect(LocalizationService.isLanguageSupported('en')).toBe(true);
      expect(LocalizationService.isLanguageSupported('th')).toBe(true);
      expect(LocalizationService.isLanguageSupported('zh')).toBe(true);
      expect(LocalizationService.isLanguageSupported('fr')).toBe(false);
    });

    it('should get list of supported languages', () => {
      const languages = LocalizationService.getSupportedLanguages();
      expect(languages).toContain('en');
      expect(languages).toContain('th');
      expect(languages).toContain('zh');
    });
  });

  describe('Real-time Language Switching', () => {
    it('should immediately reflect language change in user profile', async () => {
      // Change to Thai
      await request(app)
        .put('/api/language/preference')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ language: 'th' })
        .expect(200);

      // Verify change in profile
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(profileResponse.body.data.user.preferredLanguage).toBe('th');

      // Change back to English
      await request(app)
        .put('/api/language/preference')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ language: 'en' })
        .expect(200);
    });

    it('should support multiple language switches in sequence', async () => {
      const languages = ['en', 'th', 'zh', 'en'];

      for (const lang of languages) {
        const response = await request(app)
          .put('/api/language/preference')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ language: lang })
          .expect(200);

        expect(response.body.data.user.preferredLanguage).toBe(lang);
      }
    });
  });

  describe('Localization Coverage', () => {
    const sections = ['common', 'navigation', 'auth', 'product', 'search', 'chat', 'profile', 'language', 'errors'];
    const languages: Array<'en' | 'th' | 'zh'> = ['en', 'th', 'zh'];

    languages.forEach(lang => {
      it(`should have all required sections for ${lang}`, () => {
        const localeData = LocalizationService.getAllStrings(lang);
        expect(localeData).toBeDefined();

        sections.forEach(section => {
          expect(localeData?.[section]).toBeDefined();
        });
      });
    });

    it('should have consistent keys across all languages', () => {
      const enData = LocalizationService.getAllStrings('en');
      const thData = LocalizationService.getAllStrings('th');
      const zhData = LocalizationService.getAllStrings('zh');

      expect(enData).toBeDefined();
      expect(thData).toBeDefined();
      expect(zhData).toBeDefined();

      // Check that all languages have the same top-level keys
      const enKeys = Object.keys(enData || {}).sort();
      const thKeys = Object.keys(thData || {}).sort();
      const zhKeys = Object.keys(zhData || {}).sort();

      expect(thKeys).toEqual(enKeys);
      expect(zhKeys).toEqual(enKeys);
    });
  });
});
