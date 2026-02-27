// Products Module
const Products = {
    currentFilters: {
        search: '',
        category: '',
        condition: '',
        minPrice: null,
        maxPrice: null,
        location: '',
        sortBy: 'date_desc'
    },
    
    currentPagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0
    },
    
    products: [],
    currentProduct: null,

    async init() {
        this.setupEventListeners();
        await this.loadProducts();
    },

    setupEventListeners() {
        // Search
        const searchBtn = document.getElementById('searchBtn');
        const searchInput = document.getElementById('searchInput');
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.handleSearch());
        }
        
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleSearch();
            });
        }

        // Filters
        const applyFiltersBtn = document.getElementById('applyFiltersBtn');
        const clearFiltersBtn = document.getElementById('clearFiltersBtn');
        
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => this.applyFilters());
        }
        
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }

        // Post product
        const postProductBtn = document.getElementById('postProductBtn');
        const postProductForm = document.getElementById('postProductForm');
        const cancelPostBtn = document.getElementById('cancelPostBtn');
        const productImages = document.getElementById('productImages');
        
        if (postProductBtn) {
            postProductBtn.addEventListener('click', () => {
                if (Auth.requireAuth()) {
                    UI.navigateTo('postProduct');
                }
            });
        }
        
        if (postProductForm) {
            postProductForm.addEventListener('submit', (e) => this.handlePostProduct(e));
        }
        
        if (cancelPostBtn) {
            cancelPostBtn.addEventListener('click', () => {
                UI.navigateTo('home');
                postProductForm.reset();
                document.getElementById('imagePreview').innerHTML = '';
            });
        }
        
        if (productImages) {
            productImages.addEventListener('change', (e) => this.handleImagePreview(e));
        }

        // Back to home
        const backToHomeBtn = document.getElementById('backToHomeBtn');
        if (backToHomeBtn) {
            backToHomeBtn.addEventListener('click', () => UI.navigateTo('home'));
        }

        // Pagination
        const prevPage = document.getElementById('prevPage');
        const nextPage = document.getElementById('nextPage');
        
        if (prevPage) {
            prevPage.addEventListener('click', () => this.changePage(-1));
        }
        
        if (nextPage) {
            nextPage.addEventListener('click', () => this.changePage(1));
        }
    },

    async loadProducts() {
        try {
            console.log('🔍 [Products] Starting loadProducts()');
            console.log('🔍 [Products] Auth status:', window.authManager?.isAuthenticated);
            console.log('🔍 [Products] Current user:', window.authManager?.getCurrentUser());
            
            this.showLoading();
            
            const params = new URLSearchParams();
            params.append('page', this.currentPagination.currentPage);
            params.append('limit', window.APP_CONFIG?.PRODUCTS_PER_PAGE || 12);
            
            console.log('🔍 [Products] Request params:', params.toString());
            
            // Add filters
            Object.keys(this.currentFilters).forEach(key => {
                if (this.currentFilters[key] && this.currentFilters[key] !== '') {
                    params.append(key, this.currentFilters[key]);
                }
            });
            
            const apiUrl = window.getApiUrl(`/api/products?${params.toString()}`);
            console.log('🔍 [Products] API URL:', apiUrl);
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(window.authManager.getAuthHeader() ? {
                        'Authorization': window.authManager.getAuthHeader()
                    } : {})
                },
                credentials: 'include'
            });
            
            console.log('🔍 [Products] Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('🔍 [Products] Response data:', data);
            
            if (data.success) {
                this.products = data.products || [];
                console.log('✅ [Products] Loaded', this.products.length, 'products');
                
                this.currentPagination = {
                    currentPage: data.page || 1,
                    totalPages: data.totalPages || 1,
                    totalItems: data.total || 0
                };
                
                console.log('🔍 [Products] Pagination:', this.currentPagination);
                console.log('🔍 [Products] Calling renderProducts()');
                
                this.renderProducts();
                this.updatePagination();
                
                console.log('✅ [Products] Products rendered successfully');
            } else {
                throw new Error(data.message || 'Failed to load products');
            }
        } catch (error) {
            window.logError('Failed to load products:', error);
            this.showError('Failed to load products. Please try again.');
        } finally {
            this.hideLoading();
        }
    },

    renderProducts() {
        console.log('🔍 [Products] renderProducts() called with', this.products.length, 'products');
        
        const grid = document.getElementById('productsGrid');
        const noProducts = document.getElementById('noProducts');
        const productCount = document.getElementById('productCount');
        
        console.log('🔍 [Products] DOM elements:', {
            grid: !!grid,
            noProducts: !!noProducts,
            productCount: !!productCount
        });
        
        if (!grid) {
            console.error('❌ [Products] productsGrid element not found!');
            return;
        }
        
        grid.innerHTML = '';
        
        if (this.products.length === 0) {
            if (noProducts) noProducts.style.display = 'block';
            if (productCount) productCount.textContent = '0 products';
            return;
        }
        
        if (noProducts) noProducts.style.display = 'none';
        if (productCount) {
            productCount.textContent = `${this.currentPagination.totalItems} product${this.currentPagination.totalItems !== 1 ? 's' : ''}`;
        }
        
        this.products.forEach(product => {
            const card = this.createProductCard(product);
            grid.appendChild(card);
        });
    },

    createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => this.viewProduct(product.listingID);
        
        const images = product.images ? JSON.parse(product.images) : [];
        const imageUrl = images.length > 0 ? images[0] : 'https://via.placeholder.com/300x200/e9ecef/6c757d?text=No+Image';
        
        card.innerHTML = `
            <img src="${imageUrl}" alt="${this.escapeHtml(product.title)}" class="product-image" onerror="this.src='https://via.placeholder.com/300x200/e9ecef/6c757d?text=No+Image'">
            <div class="product-info">
                <h3 class="product-title">${this.escapeHtml(product.title)}</h3>
                <div class="product-price">$${parseFloat(product.price).toFixed(2)}</div>
                <div class="product-meta">
                    <span class="product-condition">${this.escapeHtml(product.condition)}</span>
                    <span class="product-category">${this.escapeHtml(product.category)}</span>
                </div>
                <div class="product-location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${this.escapeHtml(product.location)}
                </div>
                <div class="product-date">
                    ${this.formatRelativeTime(product.created_at)}
                </div>
            </div>
        `;
        
        return card;
    },

    async viewProduct(productId) {
        try {
            UI.showLoading();
            const response = await API.products.getById(productId);
            this.currentProduct = response.data.product;
            this.renderProductDetail();
            UI.navigateTo('productDetail');
        } catch (error) {
            console.error('Failed to load product:', error);
            UI.showToast('Failed to load product details', 'error');
        } finally {
            UI.hideLoading();
        }
    },

    renderProductDetail() {
        const container = document.getElementById('productDetailContent');
        if (!container || !this.currentProduct) return;
        
        const product = this.currentProduct;
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        const isOwner = currentUser && currentUser.userID === product.sellerID;
        
        const images = product.images && product.images.length > 0 
            ? product.images 
            : ['/public/images/placeholder.png'];
        
        container.innerHTML = `
            <div class="product-detail">
                <div class="product-images">
                    <img src="${images[0]}" alt="${UI.escapeHtml(product.title)}" class="main-image" id="mainImage">
                    ${images.length > 1 ? `
                        <div class="thumbnail-images">
                            ${images.map((img, index) => `
                                <img src="${img}" 
                                     alt="Thumbnail ${index + 1}" 
                                     class="thumbnail ${index === 0 ? 'active' : ''}"
                                     onclick="Products.changeMainImage('${img}', this)">
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                
                <div class="product-details">
                    <div class="product-header">
                        <h1>${UI.escapeHtml(product.title)}</h1>
                        <div class="product-price-large">${UI.formatPrice(product.price)}</div>
                    </div>
                    
                    <div class="product-badges">
                        <span class="badge-item"><i class="fas fa-tag"></i> ${UI.escapeHtml(product.category)}</span>
                        <span class="badge-item"><i class="fas fa-check-circle"></i> ${UI.escapeHtml(product.condition)}</span>
                        <span class="badge-item"><i class="fas fa-map-marker-alt"></i> ${UI.escapeHtml(product.location)}</span>
                        <span class="badge-item"><i class="fas fa-clock"></i> ${UI.formatRelativeTime(product.created_at)}</span>
                    </div>
                    
                    <div class="product-description">
                        <h3>Description</h3>
                        <p>${UI.escapeHtml(product.description)}</p>
                    </div>
                    
                    ${product.seller ? `
                        <div class="seller-info">
                            <h3>Seller Information</h3>
                            <div class="seller-profile">
                                <img src="${product.seller.profile_picture || '/public/images/default-avatar.png'}" 
                                     alt="${UI.escapeHtml(product.seller.name)}" 
                                     class="seller-avatar-large">
                                <div>
                                    <h4>${UI.escapeHtml(product.seller.name)}</h4>
                                    <p>${UI.escapeHtml(product.seller.email)}</p>
                                </div>
                            </div>
                            ${product.seller.reputation_score !== undefined ? `
                                <div class="seller-stats">
                                    <div class="stat-item">
                                        <div class="stat-value">${product.seller.reputation_score.toFixed(1)}</div>
                                        <div class="stat-label">Rating</div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-value">${product.seller.total_reviews || 0}</div>
                                        <div class="stat-label">Reviews</div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-value">${product.seller.completed_transactions || 0}</div>
                                        <div class="stat-label">Deals</div>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                    
                    <div class="product-actions">
                        ${!isOwner && currentUser ? `
                            <button class="btn btn-primary" onclick="Products.contactSeller(${product.listingID}, ${product.sellerID})">
                                <i class="fas fa-comments"></i> Contact Seller
                            </button>
                            <button class="btn btn-secondary" onclick="Products.toggleFavorite(${product.listingID})">
                                <i class="fas fa-heart"></i> Add to Favorites
                            </button>
                        ` : ''}
                        ${isOwner ? `
                            <button class="btn btn-primary" onclick="Products.editProduct(${product.listingID})">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            ${product.status === 'available' ? `
                                <button class="btn btn-secondary" onclick="Products.markAsSold(${product.listingID})">
                                    <i class="fas fa-check"></i> Mark as Sold
                                </button>
                            ` : ''}
                            <button class="btn btn-secondary" onclick="Products.deleteProduct(${product.listingID})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    changeMainImage(src, thumbnail) {
        const mainImage = document.getElementById('mainImage');
        if (mainImage) {
            mainImage.src = src;
        }
        
        // Update active thumbnail
        document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
        if (thumbnail) {
            thumbnail.classList.add('active');
        }
    },

    async contactSeller(productId, sellerId) {
        if (!Auth.requireAuth()) return;
        
        try {
            const response = await API.chats.create(productId, sellerId);
            UI.showToast('Chat created successfully', 'success');
            // Navigate to chat page
            Chat.openChat(response.chat.id);
        } catch (error) {
            console.error('Failed to create chat:', error);
            UI.showToast('Failed to create chat', 'error');
        }
    },

    async toggleFavorite(productId) {
        if (!Auth.requireAuth()) return;
        
        try {
            await API.favorites.add(productId);
            UI.showToast('Added to favorites', 'success');
        } catch (error) {
            console.error('Failed to add favorite:', error);
            UI.showToast('Failed to add to favorites', 'error');
        }
    },

    async markAsSold(productId) {
        if (!confirm('Mark this product as sold?')) return;
        
        try {
            await API.products.markAsSold(productId);
            UI.showToast('Product marked as sold', 'success');
            await this.viewProduct(productId);
        } catch (error) {
            console.error('Failed to mark as sold:', error);
            UI.showToast('Failed to mark as sold', 'error');
        }
    },

    async deleteProduct(productId) {
        if (!confirm('Are you sure you want to delete this product?')) return;
        
        try {
            await API.products.delete(productId);
            UI.showToast('Product deleted successfully', 'success');
            UI.navigateTo('home');
            await this.loadProducts();
        } catch (error) {
            console.error('Failed to delete product:', error);
            UI.showToast('Failed to delete product', 'error');
        }
    },

    handleImagePreview(event) {
        const files = Array.from(event.target.files);
        const preview = document.getElementById('imagePreview');
        preview.innerHTML = '';
        
        if (files.length > CONFIG.MAX_IMAGES) {
            UI.showToast(`Maximum ${CONFIG.MAX_IMAGES} images allowed`, 'warning');
            event.target.value = '';
            return;
        }
        
        files.forEach((file, index) => {
            if (!CONFIG.SUPPORTED_IMAGE_TYPES.includes(file.type)) {
                UI.showToast('Invalid image type', 'error');
                return;
            }
            
            if (file.size > CONFIG.MAX_IMAGE_SIZE) {
                UI.showToast('Image size too large (max 5MB)', 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const div = document.createElement('div');
                div.className = 'preview-item';
                div.innerHTML = `
                    <img src="${e.target.result}" class="preview-image" alt="Preview ${index + 1}">
                    <button type="button" class="preview-remove" onclick="Products.removeImage(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                preview.appendChild(div);
            };
            reader.readAsDataURL(file);
        });
    },

    removeImage(index) {
        const input = document.getElementById('productImages');
        const dt = new DataTransfer();
        const files = Array.from(input.files);
        
        files.forEach((file, i) => {
            if (i !== index) dt.items.add(file);
        });
        
        input.files = dt.files;
        this.handleImagePreview({ target: input });
    },

    async handlePostProduct(event) {
        event.preventDefault();
        
        if (!Auth.requireAuth()) return;
        
        try {
            const formData = new FormData();
            formData.append('title', document.getElementById('productTitle').value);
            formData.append('description', document.getElementById('productDescription').value);
            formData.append('price', document.getElementById('productPrice').value);
            formData.append('categoryID', document.getElementById('productCategory').value);
            formData.append('stock', '1'); // Default stock to 1
            formData.append('condition', document.getElementById('productCondition').value);
            formData.append('location', document.getElementById('productLocation').value);
            
            const images = document.getElementById('productImages').files;
            for (let i = 0; i < images.length; i++) {
                formData.append('images', images[i]);
            }
            
            await API.products.create(formData);
            UI.showToast('Product posted successfully', 'success');
            
            // Reset form and navigate
            event.target.reset();
            document.getElementById('imagePreview').innerHTML = '';
            UI.navigateTo('home');
            await this.loadProducts();
        } catch (error) {
            console.error('Failed to post product:', error);
            UI.showToast(error.message || 'Failed to post product', 'error');
        }
    },

    handleSearch() {
        this.currentFilters.search = document.getElementById('searchInput').value;
        this.currentPagination.currentPage = 1;
        this.loadProducts();
    },

    applyFilters() {
        this.currentFilters = {
            search: document.getElementById('searchInput').value,
            category: document.getElementById('categoryFilter').value,
            condition: document.getElementById('conditionFilter').value,
            minPrice: document.getElementById('minPrice').value || null,
            maxPrice: document.getElementById('maxPrice').value || null,
            location: document.getElementById('locationFilter').value,
            sortBy: document.getElementById('sortFilter').value
        };
        this.currentPagination.currentPage = 1;
        this.loadProducts();
    },

    clearFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('conditionFilter').value = '';
        document.getElementById('minPrice').value = '';
        document.getElementById('maxPrice').value = '';
        document.getElementById('locationFilter').value = '';
        document.getElementById('sortFilter').value = 'date_desc';
        
        this.currentFilters = {
            search: '',
            category: '',
            condition: '',
            minPrice: null,
            maxPrice: null,
            location: '',
            sortBy: 'date_desc'
        };
        this.currentPagination.currentPage = 1;
        this.loadProducts();
    },

    changePage(direction) {
        const newPage = this.currentPagination.currentPage + direction;
        if (newPage >= 1 && newPage <= this.currentPagination.totalPages) {
            this.currentPagination.currentPage = newPage;
            this.loadProducts();
        }
    },

    updatePagination() {
        const pagination = document.getElementById('pagination');
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        const pageInfo = document.getElementById('pageInfo');
        
        if (!pagination) return;
        
        if (this.currentPagination.totalPages > 1) {
            pagination.style.display = 'flex';
            if (prevBtn) prevBtn.disabled = this.currentPagination.currentPage === 1;
            if (nextBtn) nextBtn.disabled = this.currentPagination.currentPage === this.currentPagination.totalPages;
            if (pageInfo) pageInfo.textContent = `Page ${this.currentPagination.currentPage} of ${this.currentPagination.totalPages}`;
        } else {
            pagination.style.display = 'none';
        }
    },

    // Utility methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        
        return date.toLocaleDateString();
    },

    showLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) spinner.style.display = 'block';
    },

    hideLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) spinner.style.display = 'none';
    },

    showError(message) {
        if (window.UI && window.UI.showToast) {
            window.UI.showToast(message, 'error');
        } else {
            alert(message);
        }
    },

    // Search and filter methods
    search(query) {
        this.currentFilters.search = query;
        this.currentPagination.currentPage = 1;
        this.loadProducts();
    },

    filterByUser(userId) {
        this.currentFilters.sellerId = userId;
        this.currentPagination.currentPage = 1;
        this.loadProducts();
    },

    showFavorites(favorites) {
        this.products = favorites.map(f => f.product);
        this.renderProducts();
    },

    // Note: viewProduct, contactSeller, and toggleFavorite are implemented above
};

// Export Products for global access
window.Products = Products;