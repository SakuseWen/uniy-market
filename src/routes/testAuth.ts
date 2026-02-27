/**
 * Test Authentication Routes
 * 测试认证路由 - 仅用于开发和测试
 * 
 * This provides a simple way to test login functionality without Google OAuth setup
 * 这提供了一种无需Google OAuth设置即可测试登录功能的简单方法
 */

import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { DatabaseManager } from '../config/database';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-development';

// 获取所有测试用户
router.get('/test-users', async (req: Request, res: Response) => {
    try {
        const db = DatabaseManager.getInstance().getDatabase();
        
        // Use the async/await API from sqlite library
        const users = await db.all('SELECT * FROM users ORDER BY id');
        
        const testUsers = users.map((user: any) => ({
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            role: user.role,
            university_verified: user.university_verified,
            buyer_rating: user.buyer_rating,
            seller_rating: user.seller_rating,
            total_transactions: user.total_transactions
        }));

        res.json({
            success: true,
            users: testUsers
        });
    } catch (error) {
        console.error('Error fetching test users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch test users'
        });
    }
});

// 测试登录 - 直接选择用户登录
router.post('/test-login', async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        const db = DatabaseManager.getInstance().getDatabase();
        
        // Use the async/await API from sqlite library
        const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // 创建JWT token
        const token = jwt.sign(
            {
                id: user.id,
                userID: `USER-${user.id}`, // Add userID for compatibility with ProductModel
                email: user.email,
                role: user.role,
                isVerified: user.university_verified ? true : false
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // 设置cookie
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar: user.avatar,
                role: user.role,
                university_verified: user.university_verified,
                buyer_rating: user.buyer_rating,
                seller_rating: user.seller_rating,
                total_transactions: user.total_transactions
            },
            token
        });
    } catch (error) {
        console.error('Error in test login:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
});

// 测试登出
router.post('/test-logout', (req: Request, res: Response) => {
    res.clearCookie('auth_token');
    res.json({
        success: true,
        message: 'Logout successful'
    });
});

// 获取当前用户信息
router.get('/me', async (req: Request, res: Response) => {
    try {
        const token = req.cookies.auth_token || req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        
        const db = DatabaseManager.getInstance().getDatabase();
        
        // Use the async/await API from sqlite library
        const user = await db.get('SELECT * FROM users WHERE id = ?', [decoded.id]);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar: user.avatar,
                role: user.role,
                university_verified: user.university_verified,
                buyer_rating: user.buyer_rating,
                seller_rating: user.seller_rating,
                total_transactions: user.total_transactions
            }
        });
    } catch (error) {
        console.error('Error getting user info:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
});

export default router;