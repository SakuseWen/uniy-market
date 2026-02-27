// Internationalization Module
const I18n = {
    translations: {
        en: {
            nav: {
                postProduct: 'Post Product',
                profile: 'Profile',
                myProducts: 'My Products',
                transactions: 'Transactions',
                admin: 'Admin Panel',
                logout: 'Logout',
                login: 'Login with Google'
            },
            filters: {
                title: 'Filters',
                category: 'Category',
                condition: 'Condition',
                priceRange: 'Price Range',
                location: 'Location',
                sortBy: 'Sort By',
                apply: 'Apply Filters',
                clear: 'Clear Filters'
            },
            home: {
                title: 'Available Products',
                noProducts: 'No products found'
            },
            postProduct: {
                title: 'Post a Product',
                titleLabel: 'Title',
                descriptionLabel: 'Description',
                priceLabel: 'Price',
                categoryLabel: 'Category',
                conditionLabel: 'Condition',
                locationLabel: 'Location',
                imagesLabel: 'Images (Max 5)',
                submit: 'Post Product'
            },
            common: {
                back: 'Back',
                cancel: 'Cancel',
                loading: 'Loading...',
                save: 'Save',
                delete: 'Delete',
                edit: 'Edit',
                close: 'Close'
            }
        },
        th: {
            nav: {
                postProduct: 'โพสต์สินค้า',
                profile: 'โปรไฟล์',
                myProducts: 'สินค้าของฉัน',
                transactions: 'ประวัติการทำธุรกรรม',
                admin: 'แผงควบคุมผู้ดูแล',
                logout: 'ออกจากระบบ',
                login: 'เข้าสู่ระบบด้วย Google'
            },
            filters: {
                title: 'ตัวกรอง',
                category: 'หมวดหมู่',
                condition: 'สภาพ',
                priceRange: 'ช่วงราคา',
                location: 'สถานที่',
                sortBy: 'เรียงตาม',
                apply: 'ใช้ตัวกรอง',
                clear: 'ล้างตัวกรอง'
            },
            home: {
                title: 'สินค้าที่มีจำหน่าย',
                noProducts: 'ไม่พบสินค้า'
            },
            postProduct: {
                title: 'โพสต์สินค้า',
                titleLabel: 'ชื่อสินค้า',
                descriptionLabel: 'รายละเอียด',
                priceLabel: 'ราคา',
                categoryLabel: 'หมวดหมู่',
                conditionLabel: 'สภาพ',
                locationLabel: 'สถานที่',
                imagesLabel: 'รูปภาพ (สูงสุด 5 รูป)',
                submit: 'โพสต์สินค้า'
            },
            common: {
                back: 'กลับ',
                cancel: 'ยกเลิก',
                loading: 'กำลังโหลด...',
                save: 'บันทึก',
                delete: 'ลบ',
                edit: 'แก้ไข',
                close: 'ปิด'
            }
        },
        zh: {
            nav: {
                postProduct: '发布商品',
                profile: '个人资料',
                myProducts: '我的商品',
                transactions: '交易记录',
                admin: '管理面板',
                logout: '退出登录',
                login: '使用 Google 登录'
            },
            filters: {
                title: '筛选',
                category: '类别',
                condition: '状况',
                priceRange: '价格范围',
                location: '位置',
                sortBy: '排序方式',
                apply: '应用筛选',
                clear: '清除筛选'
            },
            home: {
                title: '可用商品',
                noProducts: '未找到商品'
            },
            postProduct: {
                title: '发布商品',
                titleLabel: '标题',
                descriptionLabel: '描述',
                priceLabel: '价格',
                categoryLabel: '类别',
                conditionLabel: '状况',
                locationLabel: '位置',
                imagesLabel: '图片（最多5张）',
                submit: '发布商品'
            },
            common: {
                back: '返回',
                cancel: '取消',
                loading: '加载中...',
                save: '保存',
                delete: '删除',
                edit: '编辑',
                close: '关闭'
            }
        }
    },

    init() {
        this.setLanguage(window.STATE.currentLanguage);
        this.setupLanguageSelector();
    },

    setLanguage(lang) {
        window.STATE.currentLanguage = lang;
        localStorage.setItem('language', lang);
        document.documentElement.lang = lang;
        
        // Update language selector
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.value = lang;
        }
        
        // Update all translatable elements
        this.updateTranslations();
        
        // Update user preference if logged in
        if (window.STATE.currentUser) {
            API.language.setPreference(lang).catch(console.error);
        }
    },

    updateTranslations() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.get(key);
            if (translation) {
                element.textContent = translation;
            }
        });
    },

    get(key) {
        const keys = key.split('.');
        let value = this.translations[window.STATE.currentLanguage];
        
        for (const k of keys) {
            if (value && value[k]) {
                value = value[k];
            } else {
                return key; // Return key if translation not found
            }
        }
        
        return value;
    },

    setupLanguageSelector() {
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                this.setLanguage(e.target.value);
            });
        }
    }
};
