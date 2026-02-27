#!/usr/bin/env ts-node

/**
 * Test Data Seeding Script for Uniy Market
 * 为 Uniy Market 创建测试数据的脚本
 * 
 * This script creates:
 * - Test users (including admin)
 * - Sample products
 * - Chat conversations
 * - Reviews and ratings
 * - Transactions
 * - University domains
 */

import { Database } from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs';

const DB_PATH = path.join(__dirname, '../../data/unity_market.db');

// 确保数据目录存在
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// 测试用户数据
const testUsers = [
    {
        id: 1,
        google_id: 'admin_test_123',
        email: 'admin@university.edu',
        name: 'Admin User',
        avatar: 'https://via.placeholder.com/150/007bff/ffffff?text=AD',
        role: 'admin',
        university_verified: 1,
        buyer_rating: 5.0,
        seller_rating: 5.0,
        total_transactions: 50,
        created_at: new Date('2024-01-01').toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 2,
        google_id: 'user_test_456',
        email: 'john.doe@university.edu',
        name: 'John Doe',
        avatar: 'https://via.placeholder.com/150/28a745/ffffff?text=JD',
        role: 'user',
        university_verified: 1,
        buyer_rating: 4.8,
        seller_rating: 4.9,
        total_transactions: 25,
        created_at: new Date('2024-01-15').toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 3,
        google_id: 'user_test_789',
        email: 'jane.smith@university.edu',
        name: 'Jane Smith',
        avatar: 'https://via.placeholder.com/150/dc3545/ffffff?text=JS',
        role: 'user',
        university_verified: 1,
        buyer_rating: 4.7,
        seller_rating: 4.6,
        total_transactions: 18,
        created_at: new Date('2024-02-01').toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 4,
        google_id: 'user_test_101',
        email: 'mike.wilson@university.edu',
        name: 'Mike Wilson',
        avatar: 'https://via.placeholder.com/150/ffc107/000000?text=MW',
        role: 'user',
        university_verified: 1,
        buyer_rating: 4.5,
        seller_rating: 4.8,
        total_transactions: 12,
        created_at: new Date('2024-02-15').toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 5,
        google_id: 'user_test_202',
        email: 'sarah.johnson@university.edu',
        name: 'Sarah Johnson',
        avatar: 'https://via.placeholder.com/150/17a2b8/ffffff?text=SJ',
        role: 'user',
        university_verified: 1,
        buyer_rating: 4.9,
        seller_rating: 4.7,
        total_transactions: 8,
        created_at: new Date('2024-03-01').toISOString(),
        updated_at: new Date().toISOString()
    }
];

// 测试商品数据
const testProducts = [
    {
        id: 1,
        seller_id: 2,
        title: 'MacBook Pro 13" 2022 - Excellent Condition',
        description: 'Barely used MacBook Pro with M2 chip. Perfect for students! Includes original charger and box. No scratches or dents.',
        price: 1200.00,
        category: 'electronics',
        condition: 'like_new',
        location: 'Campus Library Area',
        images: JSON.stringify(['https://via.placeholder.com/400x300/007bff/ffffff?text=MacBook+Pro']),
        status: 'available',
        created_at: new Date('2024-03-10').toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 2,
        seller_id: 3,
        title: 'Calculus Textbook - 8th Edition',
        description: 'Stewart Calculus textbook in great condition. All pages intact, minimal highlighting. Perfect for MATH 101.',
        price: 85.00,
        category: 'books',
        condition: 'good',
        location: 'Mathematics Building',
        images: JSON.stringify(['https://via.placeholder.com/400x300/28a745/ffffff?text=Calculus+Book']),
        status: 'available',
        created_at: new Date('2024-03-12').toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 3,
        seller_id: 4,
        title: 'IKEA Study Desk - White',
        description: 'Compact study desk perfect for dorm rooms. Easy to assemble and disassemble. Some minor wear but very functional.',
        price: 45.00,
        category: 'furniture',
        condition: 'fair',
        location: 'Student Housing Block A',
        images: JSON.stringify(['https://via.placeholder.com/400x300/ffc107/000000?text=Study+Desk']),
        status: 'available',
        created_at: new Date('2024-03-14').toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 4,
        seller_id: 5,
        title: 'Nike Running Shoes - Size 9',
        description: 'Comfortable Nike Air Max running shoes. Worn only a few times. Great for jogging around campus!',
        price: 65.00,
        category: 'clothing',
        condition: 'like_new',
        location: 'Sports Complex',
        images: JSON.stringify(['https://via.placeholder.com/400x300/dc3545/ffffff?text=Nike+Shoes']),
        status: 'available',
        created_at: new Date('2024-03-16').toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 5,
        seller_id: 2,
        title: 'Guitar - Acoustic Yamaha FG800',
        description: 'Beautiful acoustic guitar perfect for beginners or intermediate players. Comes with a carrying case and picks.',
        price: 180.00,
        category: 'other',
        condition: 'good',
        location: 'Music Department',
        images: JSON.stringify(['https://via.placeholder.com/400x300/6f42c1/ffffff?text=Acoustic+Guitar']),
        status: 'available',
        created_at: new Date('2024-03-18').toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 6,
        seller_id: 3,
        title: 'iPad Air 2020 - 64GB WiFi',
        description: 'iPad Air in excellent condition. Perfect for note-taking and digital art. Includes Apple Pencil (1st gen).',
        price: 450.00,
        category: 'electronics',
        condition: 'like_new',
        location: 'Art Building',
        images: JSON.stringify(['https://via.placeholder.com/400x300/17a2b8/ffffff?text=iPad+Air']),
        status: 'available',
        created_at: new Date('2024-03-20').toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 7,
        seller_id: 4,
        title: 'Chemistry Lab Coat - Size M',
        description: 'Standard white lab coat required for chemistry classes. Barely used, very clean.',
        price: 25.00,
        category: 'clothing',
        condition: 'like_new',
        location: 'Chemistry Building',
        images: JSON.stringify(['https://via.placeholder.com/400x300/6c757d/ffffff?text=Lab+Coat']),
        status: 'available',
        created_at: new Date('2024-03-22').toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 8,
        seller_id: 5,
        title: 'Mini Fridge - Perfect for Dorms',
        description: 'Compact refrigerator ideal for dorm rooms. Energy efficient and quiet. Great for keeping drinks and snacks cold.',
        price: 120.00,
        category: 'furniture',
        condition: 'good',
        location: 'Student Housing Block B',
        images: JSON.stringify(['https://via.placeholder.com/400x300/20c997/ffffff?text=Mini+Fridge']),
        status: 'sold',
        created_at: new Date('2024-03-05').toISOString(),
        updated_at: new Date('2024-03-25').toISOString()
    }
];

// 大学域名数据
const universityDomains = [
    'university.edu',
    'college.edu',
    'institute.edu',
    'tech.edu',
    'state.edu',
    'community.edu'
];

// 聊天数据
const testChats = [
    {
        id: 1,
        product_id: 1,
        buyer_id: 3,
        seller_id: 2,
        created_at: new Date('2024-03-15').toISOString(),
        updated_at: new Date('2024-03-15').toISOString()
    },
    {
        id: 2,
        product_id: 2,
        buyer_id: 4,
        seller_id: 3,
        created_at: new Date('2024-03-16').toISOString(),
        updated_at: new Date('2024-03-16').toISOString()
    }
];

// 消息数据
const testMessages = [
    {
        id: 1,
        chat_id: 1,
        sender_id: 3,
        content: 'Hi! Is the MacBook still available?',
        message_type: 'text',
        created_at: new Date('2024-03-15T10:00:00').toISOString()
    },
    {
        id: 2,
        chat_id: 1,
        sender_id: 2,
        content: 'Yes, it is! Would you like to meet up to see it?',
        message_type: 'text',
        created_at: new Date('2024-03-15T10:05:00').toISOString()
    },
    {
        id: 3,
        chat_id: 1,
        sender_id: 3,
        content: 'That would be great! How about tomorrow at the library?',
        message_type: 'text',
        created_at: new Date('2024-03-15T10:10:00').toISOString()
    },
    {
        id: 4,
        chat_id: 2,
        sender_id: 4,
        content: 'Is this textbook for MATH 101?',
        message_type: 'text',
        created_at: new Date('2024-03-16T14:00:00').toISOString()
    },
    {
        id: 5,
        chat_id: 2,
        sender_id: 3,
        content: 'Yes, exactly! It covers all the topics for the course.',
        message_type: 'text',
        created_at: new Date('2024-03-16T14:05:00').toISOString()
    }
];

// 评价数据
const testReviews = [
    {
        id: 1,
        reviewer_id: 3,
        reviewed_id: 2,
        product_id: 1,
        rating: 5,
        comment: 'Excellent seller! MacBook was exactly as described.',
        review_type: 'seller',
        created_at: new Date('2024-03-20').toISOString()
    },
    {
        id: 2,
        reviewer_id: 2,
        reviewed_id: 3,
        product_id: 1,
        rating: 5,
        comment: 'Great buyer! Quick payment and easy communication.',
        review_type: 'buyer',
        created_at: new Date('2024-03-20').toISOString()
    }
];

// 交易数据
const testDeals = [
    {
        id: 1,
        product_id: 8,
        buyer_id: 2,
        seller_id: 5,
        agreed_price: 120.00,
        status: 'completed',
        created_at: new Date('2024-03-24').toISOString(),
        updated_at: new Date('2024-03-25').toISOString()
    }
];

// 收藏数据
const testFavorites = [
    {
        id: 1,
        user_id: 2,
        product_id: 6,
        created_at: new Date('2024-03-21').toISOString()
    },
    {
        id: 2,
        user_id: 3,
        product_id: 5,
        created_at: new Date('2024-03-22').toISOString()
    },
    {
        id: 3,
        user_id: 4,
        product_id: 1,
        created_at: new Date('2024-03-23').toISOString()
    }
];

async function createTables(): Promise<void> {
    return new Promise((resolve, reject) => {
        const createTablesSQL = `
        -- Users table
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            google_id TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            avatar TEXT,
            role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
            university_verified BOOLEAN DEFAULT FALSE,
            buyer_rating REAL DEFAULT 0.0,
            seller_rating REAL DEFAULT 0.0,
            total_transactions INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Products table
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            seller_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            category TEXT NOT NULL CHECK (category IN ('electronics', 'books', 'furniture', 'clothing', 'sports', 'other')),
            condition TEXT NOT NULL CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
            location TEXT NOT NULL,
            images TEXT, -- JSON array of image URLs
            status TEXT DEFAULT 'available' CHECK (status IN ('available', 'sold', 'reserved')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (seller_id) REFERENCES users (id) ON DELETE CASCADE
        );

        -- University domains table
        CREATE TABLE IF NOT EXISTS university_domains (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            domain TEXT UNIQUE NOT NULL,
            university_name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Chats table
        CREATE TABLE IF NOT EXISTS chats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            buyer_id INTEGER NOT NULL,
            seller_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
            FOREIGN KEY (buyer_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (seller_id) REFERENCES users (id) ON DELETE CASCADE,
            UNIQUE(product_id, buyer_id)
        );

        -- Messages table
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chat_id INTEGER NOT NULL,
            sender_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image')),
            translated_content TEXT,
            is_read BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE,
            FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE
        );

        -- Reviews table
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reviewer_id INTEGER NOT NULL,
            reviewed_id INTEGER NOT NULL,
            product_id INTEGER,
            rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
            comment TEXT,
            review_type TEXT NOT NULL CHECK (review_type IN ('buyer', 'seller')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (reviewer_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (reviewed_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE SET NULL
        );

        -- Deals table
        CREATE TABLE IF NOT EXISTS deals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            buyer_id INTEGER NOT NULL,
            seller_id INTEGER NOT NULL,
            agreed_price DECIMAL(10,2) NOT NULL,
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
            FOREIGN KEY (buyer_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (seller_id) REFERENCES users (id) ON DELETE CASCADE
        );

        -- Favorites table
        CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
            UNIQUE(user_id, product_id)
        );

        -- Reports table
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reporter_id INTEGER NOT NULL,
            reported_user_id INTEGER,
            reported_product_id INTEGER,
            reported_message_id INTEGER,
            reason TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (reporter_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (reported_user_id) REFERENCES users (id) ON DELETE SET NULL,
            FOREIGN KEY (reported_product_id) REFERENCES products (id) ON DELETE SET NULL,
            FOREIGN KEY (reported_message_id) REFERENCES messages (id) ON DELETE SET NULL
        );

        -- Audit logs table
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT NOT NULL,
            resource_type TEXT NOT NULL,
            resource_id INTEGER,
            details TEXT,
            ip_address TEXT,
            user_agent TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
        CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
        CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
        CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
        CREATE INDEX IF NOT EXISTS idx_chats_product_id ON chats(product_id);
        CREATE INDEX IF NOT EXISTS idx_chats_buyer_id ON chats(buyer_id);
        CREATE INDEX IF NOT EXISTS idx_chats_seller_id ON chats(seller_id);
        CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
        CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
        CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_id ON reviews(reviewed_id);
        CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
        CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON favorites(product_id);
        `;

        db.exec(createTablesSQL, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

async function insertTestData(): Promise<void> {
    return new Promise((resolve) => {
        db.serialize(() => {
            // Insert users
            const userStmt = db.prepare(`
                INSERT OR REPLACE INTO users (id, google_id, email, name, avatar, role, university_verified, buyer_rating, seller_rating, total_transactions, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            testUsers.forEach(user => {
                userStmt.run([
                    user.id, user.google_id, user.email, user.name, user.avatar,
                    user.role, user.university_verified, user.buyer_rating,
                    user.seller_rating, user.total_transactions, user.created_at, user.updated_at
                ]);
            });
            userStmt.finalize();

            // Insert university domains
            const domainStmt = db.prepare(`
                INSERT OR REPLACE INTO university_domains (domain, university_name)
                VALUES (?, ?)
            `);

            universityDomains.forEach(domain => {
                domainStmt.run([domain, `University of ${domain.split('.')[0]}`]);
            });
            domainStmt.finalize();

            // Insert products
            const productStmt = db.prepare(`
                INSERT OR REPLACE INTO products (id, seller_id, title, description, price, category, condition, location, images, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            testProducts.forEach(product => {
                productStmt.run([
                    product.id, product.seller_id, product.title, product.description,
                    product.price, product.category, product.condition, product.location,
                    product.images, product.status, product.created_at, product.updated_at
                ]);
            });
            productStmt.finalize();

            // Insert chats
            const chatStmt = db.prepare(`
                INSERT OR REPLACE INTO chats (id, product_id, buyer_id, seller_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
            `);

            testChats.forEach(chat => {
                chatStmt.run([
                    chat.id, chat.product_id, chat.buyer_id, chat.seller_id,
                    chat.created_at, chat.updated_at
                ]);
            });
            chatStmt.finalize();

            // Insert messages
            const messageStmt = db.prepare(`
                INSERT OR REPLACE INTO messages (id, chat_id, sender_id, content, message_type, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            `);

            testMessages.forEach(message => {
                messageStmt.run([
                    message.id, message.chat_id, message.sender_id,
                    message.content, message.message_type, message.created_at
                ]);
            });
            messageStmt.finalize();

            // Insert reviews
            const reviewStmt = db.prepare(`
                INSERT OR REPLACE INTO reviews (id, reviewer_id, reviewed_id, product_id, rating, comment, review_type, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);

            testReviews.forEach(review => {
                reviewStmt.run([
                    review.id, review.reviewer_id, review.reviewed_id, review.product_id,
                    review.rating, review.comment, review.review_type, review.created_at
                ]);
            });
            reviewStmt.finalize();

            // Insert deals
            const dealStmt = db.prepare(`
                INSERT OR REPLACE INTO deals (id, product_id, buyer_id, seller_id, agreed_price, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);

            testDeals.forEach(deal => {
                dealStmt.run([
                    deal.id, deal.product_id, deal.buyer_id, deal.seller_id,
                    deal.agreed_price, deal.status, deal.created_at, deal.updated_at
                ]);
            });
            dealStmt.finalize();

            // Insert favorites
            const favoriteStmt = db.prepare(`
                INSERT OR REPLACE INTO favorites (id, user_id, product_id, created_at)
                VALUES (?, ?, ?, ?)
            `);

            testFavorites.forEach(favorite => {
                favoriteStmt.run([
                    favorite.id, favorite.user_id, favorite.product_id, favorite.created_at
                ]);
            });
            favoriteStmt.finalize();

            resolve();
        });
    });
}

async function main() {
    try {
        console.log('🚀 Starting test data seeding...');
        
        console.log('📋 Creating database tables...');
        await createTables();
        
        console.log('📝 Inserting test data...');
        await insertTestData();
        
        console.log('✅ Test data seeding completed successfully!');
        console.log('\n📊 Test Data Summary:');
        console.log(`👥 Users: ${testUsers.length} (including 1 admin)`);
        console.log(`📦 Products: ${testProducts.length} (7 available, 1 sold)`);
        console.log(`🏫 University Domains: ${universityDomains.length}`);
        console.log(`💬 Chat Conversations: ${testChats.length}`);
        console.log(`📨 Messages: ${testMessages.length}`);
        console.log(`⭐ Reviews: ${testReviews.length}`);
        console.log(`🤝 Deals: ${testDeals.length}`);
        console.log(`❤️ Favorites: ${testFavorites.length}`);
        
        console.log('\n🔑 Test Accounts:');
        console.log('Admin: admin@university.edu (Admin User)');
        console.log('User 1: john.doe@university.edu (John Doe)');
        console.log('User 2: jane.smith@university.edu (Jane Smith)');
        console.log('User 3: mike.wilson@university.edu (Mike Wilson)');
        console.log('User 4: sarah.johnson@university.edu (Sarah Johnson)');
        
        console.log('\n🌐 You can now test the website with these accounts!');
        console.log('Note: For Google OAuth testing, you may need to configure the OAuth settings.');
        
    } catch (error) {
        console.error('❌ Error seeding test data:', error);
        process.exit(1);
    } finally {
        db.close();
    }
}

// Run the script
if (require.main === module) {
    main();
}

export { main as seedTestData };