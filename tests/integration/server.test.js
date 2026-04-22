"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = require("../../src/index");
describe('Server Integration Tests', () => {
    describe('Health Check', () => {
        it('should return 200 and health status', async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .get('/health')
                .expect(200);
            expect(response.body).toMatchObject({
                status: 'OK',
                service: 'Uniy Market API',
            });
            expect(response.body.timestamp).toBeDefined();
        });
    });
    describe('API Endpoint', () => {
        it('should return API information', async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .get('/api')
                .expect(200);
            expect(response.body).toMatchObject({
                message: 'Uniy Market API',
                version: '1.0.0',
                endpoints: {
                    health: '/health',
                    api: '/api',
                },
            });
        });
    });
    describe('404 Handler', () => {
        it('should return 404 for non-existent routes', async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .get('/non-existent-route')
                .expect(404);
            expect(response.body).toMatchObject({
                success: false,
                error: {
                    message: 'Route /non-existent-route not found',
                    method: 'GET',
                    path: '/non-existent-route',
                },
            });
            expect(response.body.timestamp).toBeDefined();
        });
    });
});
