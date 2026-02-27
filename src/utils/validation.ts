import { ValidationError } from 'express-validator';

export const formatValidationErrors = (errors: ValidationError[]): string[] => {
  return errors.map(error => {
    if (error.type === 'field') {
      return `${error.path}: ${error.msg}`;
    }
    return error.msg;
  });
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPrice = (price: number): boolean => {
  return price >= 0.01 && price <= 999999.99 && !isNaN(price) && isFinite(price);
};

export const isValidLanguage = (
  language: string
): language is 'en' | 'th' | 'zh' => {
  return ['en', 'th', 'zh'].includes(language);
};

export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};
