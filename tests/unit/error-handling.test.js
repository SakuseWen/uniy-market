"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errorHandler_1 = require("../../src/middleware/errorHandler");
const validation_1 = require("../../src/middleware/validation");
describe('Error Handling System', () => {
    describe('AppError', () => {
        it('should create AppError with correct properties', () => {
            const error = new errorHandler_1.AppError('Test error', 400, 'TEST_ERROR', { detail: 'test' });
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(errorHandler_1.AppError);
            expect(error.message).toBe('Test error');
            expect(error.statusCode).toBe(400);
            expect(error.code).toBe('TEST_ERROR');
            expect(error.details).toEqual({ detail: 'test' });
            expect(error.isOperational).toBe(true);
            expect(error.stack).toBeDefined();
        });
        it('should have default status code 500', () => {
            const error = new errorHandler_1.AppError('Test error');
            expect(error.statusCode).toBe(500);
        });
    });
    describe('ValidationError', () => {
        it('should create ValidationError with status 400', () => {
            const error = new errorHandler_1.ValidationError('Invalid input', { field: 'email' });
            expect(error).toBeInstanceOf(errorHandler_1.AppError);
            expect(error.statusCode).toBe(400);
            expect(error.code).toBe('VALIDATION_ERROR');
            expect(error.message).toBe('Invalid input');
            expect(error.details).toEqual({ field: 'email' });
        });
    });
    describe('AuthenticationError', () => {
        it('should create AuthenticationError with status 401', () => {
            const error = new errorHandler_1.AuthenticationError();
            expect(error).toBeInstanceOf(errorHandler_1.AppError);
            expect(error.statusCode).toBe(401);
            expect(error.code).toBe('AUTHENTICATION_ERROR');
            expect(error.message).toBe('Authentication required');
        });
        it('should accept custom message', () => {
            const error = new errorHandler_1.AuthenticationError('Invalid credentials');
            expect(error.message).toBe('Invalid credentials');
        });
    });
    describe('AuthorizationError', () => {
        it('should create AuthorizationError with status 403', () => {
            const error = new errorHandler_1.AuthorizationError();
            expect(error).toBeInstanceOf(errorHandler_1.AppError);
            expect(error.statusCode).toBe(403);
            expect(error.code).toBe('AUTHORIZATION_ERROR');
            expect(error.message).toBe('Insufficient permissions');
        });
    });
    describe('NotFoundError', () => {
        it('should create NotFoundError with status 404', () => {
            const error = new errorHandler_1.NotFoundError('User');
            expect(error).toBeInstanceOf(errorHandler_1.AppError);
            expect(error.statusCode).toBe(404);
            expect(error.code).toBe('NOT_FOUND');
            expect(error.message).toBe('User not found');
        });
        it('should use default resource name', () => {
            const error = new errorHandler_1.NotFoundError();
            expect(error.message).toBe('Resource not found');
        });
    });
    describe('ConflictError', () => {
        it('should create ConflictError with status 409', () => {
            const error = new errorHandler_1.ConflictError('Email already exists', { email: 'test@test.com' });
            expect(error).toBeInstanceOf(errorHandler_1.AppError);
            expect(error.statusCode).toBe(409);
            expect(error.code).toBe('CONFLICT');
            expect(error.message).toBe('Email already exists');
            expect(error.details).toEqual({ email: 'test@test.com' });
        });
    });
    describe('Error factory functions', () => {
        it('should create error with createError', () => {
            const error = (0, errorHandler_1.createError)('Test', 400, 'TEST', { data: 'test' });
            expect(error).toBeInstanceOf(errorHandler_1.AppError);
            expect(error.statusCode).toBe(400);
            expect(error.code).toBe('TEST');
            expect(error.details).toEqual({ data: 'test' });
        });
        it('should create validation error with createValidationError', () => {
            const error = (0, errorHandler_1.createValidationError)('Invalid', { field: 'name' });
            expect(error).toBeInstanceOf(errorHandler_1.ValidationError);
            expect(error.statusCode).toBe(400);
            expect(error.details).toEqual({ field: 'name' });
        });
    });
    describe('Input Sanitization', () => {
        it('should sanitize script tags', () => {
            const input = '<script>alert("xss")</script>Hello';
            const sanitized = (0, validation_1.sanitizeString)(input);
            expect(sanitized).not.toContain('<script>');
            expect(sanitized).toBe('Hello');
        });
        it('should sanitize javascript protocol', () => {
            const input = 'javascript:alert("xss")';
            const sanitized = (0, validation_1.sanitizeString)(input);
            expect(sanitized).not.toContain('javascript:');
        });
        it('should sanitize event handlers', () => {
            const input = '<div onclick="alert()">Test</div>';
            const sanitized = (0, validation_1.sanitizeString)(input);
            expect(sanitized).not.toContain('onclick=');
        });
        it('should trim whitespace', () => {
            const input = '  Hello World  ';
            const sanitized = (0, validation_1.sanitizeString)(input);
            expect(sanitized).toBe('Hello World');
        });
        it('should handle non-string input', () => {
            const sanitized = (0, validation_1.sanitizeString)(123);
            expect(sanitized).toBe('');
        });
        it('should sanitize object recursively', () => {
            const input = {
                name: '<script>alert()</script>John',
                email: '  test@test.com  ',
                nested: {
                    value: 'javascript:alert()',
                },
                array: ['<script>test</script>', 'safe'],
            };
            const sanitized = (0, validation_1.sanitizeObject)(input);
            expect(sanitized.name).toBe('John');
            expect(sanitized.email).toBe('test@test.com');
            expect(sanitized.nested.value).not.toContain('javascript:');
            expect(sanitized.array[0]).not.toContain('<script>');
            expect(sanitized.array[1]).toBe('safe');
        });
        it('should handle null and undefined', () => {
            expect((0, validation_1.sanitizeObject)(null)).toBeNull();
            expect((0, validation_1.sanitizeObject)(undefined)).toBeUndefined();
        });
        it('should handle arrays', () => {
            const input = ['<script>test</script>', 'safe', { value: 'test' }];
            const sanitized = (0, validation_1.sanitizeObject)(input);
            expect(Array.isArray(sanitized)).toBe(true);
            expect(sanitized[0]).not.toContain('<script>');
            expect(sanitized[1]).toBe('safe');
            expect(sanitized[2].value).toBe('test');
        });
        it('should preserve non-string values', () => {
            const input = {
                number: 123,
                boolean: true,
                null: null,
                undefined: undefined,
            };
            const sanitized = (0, validation_1.sanitizeObject)(input);
            expect(sanitized.number).toBe(123);
            expect(sanitized.boolean).toBe(true);
            expect(sanitized.null).toBeNull();
            expect(sanitized.undefined).toBeUndefined();
        });
    });
    describe('Error Stack Traces', () => {
        it('should capture stack trace', () => {
            const error = new errorHandler_1.AppError('Test error');
            expect(error.stack).toBeDefined();
            expect(error.stack).toContain('Test error');
        });
        it('should have correct stack trace for ValidationError', () => {
            const error = new errorHandler_1.ValidationError('Test');
            expect(error.stack).toBeDefined();
            expect(error.stack).toContain('Test');
        });
    });
    describe('Error Inheritance', () => {
        it('should maintain instanceof relationships', () => {
            const validationError = new errorHandler_1.ValidationError('Test');
            const authError = new errorHandler_1.AuthenticationError();
            const notFoundError = new errorHandler_1.NotFoundError();
            expect(validationError instanceof errorHandler_1.AppError).toBe(true);
            expect(validationError instanceof Error).toBe(true);
            expect(authError instanceof errorHandler_1.AppError).toBe(true);
            expect(authError instanceof Error).toBe(true);
            expect(notFoundError instanceof errorHandler_1.AppError).toBe(true);
            expect(notFoundError instanceof Error).toBe(true);
        });
    });
});
