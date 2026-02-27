// Profile Module
const Profile = {
    currentUserId: null,
    currentTab: 'overview',

    async init() {
        // Profile module initialized
        console.log('Profile module initialized');
    },

    async loadProfile(userId) {
        try {
            this.currentUserId = userId;
            UI.showLoading();
            
            // Load user data
            const userResponse = await API.reputation.get(userId);
            const user = userResponse.user;
            
            // Load user's products
            const productsResponse = await API.products.getAll({ sellerId: userId });
            const products = productsResponse.products || [];
            
            // Load user's deals
            const dealsResponse = await API.deals.getByUser(userId);
            const deals = dealsResponse.deals || [];
            
            // Load user's reviews
            const reviewsResponse = await API.reviews.getByUser(userId);
            const reviews = reviewsResponse.reviews || [];
            
            // Load favorites if viewing own profile
            let favorites = [];
            if (userId === window.STATE.currentUser?.id) {
                const favoritesResponse = await API.favorites.getAll();
                favorites = favoritesResponse.favorites || [];
            }
            
            this.renderProfile(user, products, deals, reviews, favorites);
            UI.navigateTo('profile');
        } catch (error) {
            console.error('Failed to load profile:', error);
            UI.showToast('Failed to load profile', 'error');
        } finally {
            UI.hideLoading();
        }
    },

    renderProfile(user, products, deals, reviews, favorites) {
        const profileContent = document.getElementById('profileContent');
        if (!profileContent) return;

        const isOwnProfile = user.id === window.STATE.currentUser?.id;

        profileContent.innerHTML = `
            <div class="profile-container">
                <div class="profile-header">
                    <div class="profile-avatar-section">
                        <img src="${user.profile_picture || '/public/images/default-avatar.png'}" 
                             alt="${UI.escapeHtml(user.name)}" 
                             class="profile-avatar-large">
                        <div class="profile-info">
                            <h1>${UI.escapeHtml(user.name)}</h1>
                            <p class="profile-email">${UI.escapeHtml(user.email)}</p>
                            ${user.phone ? `<p class="profile-phone"><i class="fas fa-phone"></i> ${UI.escapeHtml(user.phone)}</p>` : ''}
                            <div class="profile-badges">
                                ${user.is_verified ? '<span class="badge-verified"><i class="fas fa-check-circle"></i> Verified</span>' : ''}
                                ${user.role === 'admin' ? '<span class="badge-admin"><i class="fas fa-shield-alt"></i> Admin</span>' : ''}
                            </div>
                        </div>
                    </div>
                    
                    <div class="profile-stats">
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-star"></i></div>
                            <div class="stat-value">${user.reputation_score?.toFixed(1) || 'N/A'}</div>
                            <div class="stat-label">Overall Rating</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-shopping-bag"></i></div>
                            <div class="stat-value">${user.seller_rating?.toFixed(1) || 'N/A'}</div>
                            <div class="stat-label">Seller Rating</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-shopping-cart"></i></div>
                            <div class="stat-value">${user.buyer_rating?.toFixed(1) || 'N/A'}</div>
                            <div class="stat-label">Buyer Rating</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-handshake"></i></div>
                            <div class="stat-value">${user.completed_transactions || 0}</div>
                            <div class="stat-label">Completed Deals</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-comment"></i></div>
                            <div class="stat-value">${user.total_reviews || 0}</div>
                            <div class="stat-label">Reviews</div>
                        </div>
                    </div>
                </div>

                <div class="profile-tabs">
                    <button class="tab-btn ${this.currentTab === 'overview' ? 'active' : ''}" 
                            onclick="Profile.switchTab('overview')">
                        <i class="fas fa-th-large"></i> Overview
                    </button>
                    <button class="tab-btn ${this.currentTab === 'products' ? 'active' : ''}" 
                            onclick="Profile.switchTab('products')">
                        <i class="fas fa-box"></i> Products (${products.length})
                    </button>
                    <button class="tab-btn ${this.currentTab === 'transactions' ? 'active' : ''}" 
                            onclick="Profile.switchTab('transactions')">
                        <i class="fas fa-history"></i> Transactions (${deals.length})
                    </button>
                    <button class="tab-btn ${this.currentTab === 'reviews' ? 'active' : ''}" 
                            onclick="Profile.switchTab('reviews')">
                        <i class="fas fa-star"></i> Reviews (${reviews.length})
                    </button>
                    ${isOwnProfile ? `
                        <button class="tab-btn ${this.currentTab === 'favorites' ? 'active' : ''}" 
                                onclick="Profile.switchTab('favorites')">
                            <i class="fas fa-heart"></i> Favorites (${favorites.length})
                        </button>
                    ` : ''}
                </div>

                <div class="profile-content">
                    <div id="overviewTab" class="tab-content ${this.currentTab === 'overview' ? 'active' : ''}">
                        ${this.renderOverviewTab(user, products, deals, reviews)}
                    </div>
                    <div id="productsTab" class="tab-content ${this.currentTab === 'products' ? 'active' : ''}">
                        ${this.renderProductsTab(products)}
                    </div>
                    <div id="transactionsTab" class="tab-content ${this.currentTab === 'transactions' ? 'active' : ''}">
                        ${this.renderTransactionsTab(deals)}
                    </div>
                    <div id="reviewsTab" class="tab-content ${this.currentTab === 'reviews' ? 'active' : ''}">
                        ${this.renderReviewsTab(reviews, user)}
                    </div>
                    ${isOwnProfile ? `
                        <div id="favoritesTab" class="tab-content ${this.currentTab === 'favorites' ? 'active' : ''}">
                            ${this.renderFavoritesTab(favorites)}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    renderOverviewTab(user, products, deals, reviews) {
        const activeProducts = products.filter(p => p.status === 'available');
        const soldProducts = products.filter(p => p.status === 'sold');
        const recentReviews = reviews.slice(0, 5);

        return `
            <div class="overview-grid">
                <div class="overview-card">
                    <h3><i class="fas fa-box"></i> Product Summary</h3>
                    <div class="overview-stats">
                        <div class="overview-stat">
                            <span class="overview-label">Active Listings</span>
                            <span class="overview-value">${activeProducts.length}</span>
                        </div>
                        <div class="overview-stat">
                            <span class="overview-label">Sold Items</span>
                            <span class="overview-value">${soldProducts.length}</span>
                        </div>
                        <div class="overview-stat">
                            <span class="overview-label">Total Products</span>
                            <span class="overview-value">${products.length}</span>
                        </div>
                    </div>
                </div>

                <div class="overview-card">
                    <h3><i class="fas fa-chart-line"></i> Activity Summary</h3>
                    <div class="overview-stats">
                        <div class="overview-stat">
                            <span class="overview-label">Completed Deals</span>
                            <span class="overview-value">${user.completed_transactions || 0}</span>
                        </div>
                        <div class="overview-stat">
                            <span class="overview-label">Total Reviews</span>
                            <span class="overview-value">${user.total_reviews || 0}</span>
                        </div>
                        <div class="overview-stat">
                            <span class="overview-label">Member Since</span>
                            <span class="overview-value">${UI.formatDate(user.created_at)}</span>
                        </div>
                    </div>
                </div>

                ${recentReviews.length > 0 ? `
                    <div class="overview-card full-width">
                        <h3><i class="fas fa-star"></i> Recent Reviews</h3>
                        <div class="reviews-list">
                            ${recentReviews.map(review => `
                                <div class="review-item">
                                    <div class="review-header">
                                        <div class="review-rating">
                                            ${this.renderStars(review.rating)}
                                        </div>
                                        <span class="review-date">${UI.formatRelativeTime(review.created_at)}</span>
                                    </div>
                                    ${review.comment ? `<p class="review-comment">${UI.escapeHtml(review.comment)}</p>` : ''}
                                    <div class="review-meta">
                                        <span>By ${UI.escapeHtml(review.reviewer_name)}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    },

    renderProductsTab(products) {
        if (products.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <p>No products listed yet</p>
                </div>
            `;
        }

        return `
            <div class="products-grid">
                ${products.map(product => Products.createProductCard(product).outerHTML).join('')}
            </div>
        `;
    },

    renderTransactionsTab(deals) {
        if (deals.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>No transactions yet</p>
                </div>
            `;
        }

        return `
            <div class="transactions-list">
                ${deals.map(deal => `
                    <div class="transaction-card">
                        <div class="transaction-header">
                            <h4>${UI.escapeHtml(deal.product_title)}</h4>
                            <span class="transaction-status status-${deal.status}">${deal.status}</span>
                        </div>
                        <div class="transaction-details">
                            <div class="transaction-info">
                                <span class="transaction-label">Price:</span>
                                <span class="transaction-value">${UI.formatPrice(deal.price)}</span>
                            </div>
                            <div class="transaction-info">
                                <span class="transaction-label">Date:</span>
                                <span class="transaction-value">${UI.formatDate(deal.created_at)}</span>
                            </div>
                            <div class="transaction-info">
                                <span class="transaction-label">Role:</span>
                                <span class="transaction-value">${deal.buyer_id === window.STATE.currentUser?.id ? 'Buyer' : 'Seller'}</span>
                            </div>
                        </div>
                        ${deal.status === 'completed' && !deal.has_review ? `
                            <button class="btn btn-primary btn-sm" onclick="Profile.showReviewForm(${deal.id})">
                                <i class="fas fa-star"></i> Leave Review
                            </button>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderReviewsTab(reviews, user) {
        if (reviews.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-star"></i>
                    <p>No reviews yet</p>
                </div>
            `;
        }

        return `
            <div class="reviews-container">
                <div class="reviews-summary">
                    <div class="rating-overview">
                        <div class="rating-large">${user.reputation_score?.toFixed(1) || 'N/A'}</div>
                        <div class="rating-stars">${this.renderStars(user.reputation_score || 0)}</div>
                        <div class="rating-count">${reviews.length} review${reviews.length !== 1 ? 's' : ''}</div>
                    </div>
                </div>
                
                <div class="reviews-list">
                    ${reviews.map(review => `
                        <div class="review-card">
                            <div class="review-header">
                                <div class="reviewer-info">
                                    <img src="${review.reviewer_picture || '/public/images/default-avatar.png'}" 
                                         alt="${UI.escapeHtml(review.reviewer_name)}" 
                                         class="reviewer-avatar">
                                    <div>
                                        <h4>${UI.escapeHtml(review.reviewer_name)}</h4>
                                        <span class="review-date">${UI.formatRelativeTime(review.created_at)}</span>
                                    </div>
                                </div>
                                <div class="review-rating">
                                    ${this.renderStars(review.rating)}
                                </div>
                            </div>
                            ${review.comment ? `
                                <p class="review-comment">${UI.escapeHtml(review.comment)}</p>
                            ` : ''}
                            <div class="review-meta">
                                <span class="review-type">
                                    <i class="fas fa-${review.review_type === 'seller' ? 'shopping-bag' : 'shopping-cart'}"></i>
                                    ${review.review_type === 'seller' ? 'As Seller' : 'As Buyer'}
                                </span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    renderFavoritesTab(favorites) {
        if (favorites.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-heart"></i>
                    <p>No favorites yet</p>
                </div>
            `;
        }

        return `
            <div class="products-grid">
                ${favorites.map(fav => Products.createProductCard(fav.product).outerHTML).join('')}
            </div>
        `;
    },

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let stars = '';
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        return stars;
    },

    switchTab(tab) {
        this.currentTab = tab;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.closest('.tab-btn').classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tab}Tab`).classList.add('active');
    },

    showReviewForm(dealId) {
        const modalContent = `
            <h2>Leave a Review</h2>
            <form id="reviewForm" onsubmit="Profile.submitReview(event, ${dealId})">
                <div class="form-group">
                    <label>Rating *</label>
                    <div class="star-rating" id="starRating">
                        ${[1, 2, 3, 4, 5].map(i => `
                            <i class="far fa-star" data-rating="${i}" onclick="Profile.setRating(${i})"></i>
                        `).join('')}
                    </div>
                    <input type="hidden" id="ratingValue" required>
                </div>
                <div class="form-group">
                    <label>Comment (Optional)</label>
                    <textarea id="reviewComment" rows="4" class="form-textarea"></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="UI.hideModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Submit Review</button>
                </div>
            </form>
        `;
        
        UI.showModal(modalContent);
    },

    setRating(rating) {
        document.getElementById('ratingValue').value = rating;
        
        // Update star display
        document.querySelectorAll('#starRating i').forEach((star, index) => {
            if (index < rating) {
                star.className = 'fas fa-star';
            } else {
                star.className = 'far fa-star';
            }
        });
    },

    async submitReview(event, dealId) {
        event.preventDefault();
        
        const rating = parseInt(document.getElementById('ratingValue').value);
        const comment = document.getElementById('reviewComment').value;
        
        if (!rating) {
            UI.showToast('Please select a rating', 'warning');
            return;
        }
        
        try {
            await API.reviews.create({
                dealId,
                rating,
                comment
            });
            
            UI.showToast('Review submitted successfully', 'success');
            UI.hideModal();
            
            // Reload profile
            await this.loadProfile(this.currentUserId);
        } catch (error) {
            console.error('Failed to submit review:', error);
            UI.showToast('Failed to submit review', 'error');
        }
    }
};
