/**
 * Lazy Loading Utility
 * Implements lazy loading for images and components
 */

class LazyLoader {
    constructor() {
        this.imageObserver = null;
        this.componentObserver = null;
        this.setupImageLazyLoading();
        this.setupComponentLazyLoading();
    }

    /**
     * Setup lazy loading for images
     */
    setupImageLazyLoading() {
        // Check if IntersectionObserver is supported
        if (!('IntersectionObserver' in window)) {
            console.warn('IntersectionObserver not supported, loading all images immediately');
            this.loadAllImages();
            return;
        }

        // Create observer for images
        this.imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    this.imageObserver.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '50px', // Start loading 50px before entering viewport
            threshold: 0.01
        });

        // Observe all lazy images
        this.observeImages();
    }

    /**
     * Setup lazy loading for components
     */
    setupComponentLazyLoading() {
        if (!('IntersectionObserver' in window)) {
            return;
        }

        this.componentObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadComponent(entry.target);
                    this.componentObserver.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '100px',
            threshold: 0.01
        });

        // Observe all lazy components
        this.observeComponents();
    }

    /**
     * Observe all images with data-src attribute
     */
    observeImages() {
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            this.imageObserver.observe(img);
        });
    }

    /**
     * Observe all components with data-lazy attribute
     */
    observeComponents() {
        const lazyComponents = document.querySelectorAll('[data-lazy]');
        lazyComponents.forEach(component => {
            this.componentObserver.observe(component);
        });
    }

    /**
     * Load a single image
     */
    loadImage(img) {
        const src = img.getAttribute('data-src');
        const srcset = img.getAttribute('data-srcset');
        
        if (!src) return;

        // Create a new image to preload
        const tempImg = new Image();
        
        tempImg.onload = () => {
            img.src = src;
            if (srcset) {
                img.srcset = srcset;
            }
            img.classList.add('loaded');
            img.removeAttribute('data-src');
            img.removeAttribute('data-srcset');
        };

        tempImg.onerror = () => {
            console.error('Failed to load image:', src);
            img.classList.add('error');
        };

        tempImg.src = src;
    }

    /**
     * Load all images immediately (fallback)
     */
    loadAllImages() {
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => this.loadImage(img));
    }

    /**
     * Load a component
     */
    loadComponent(component) {
        const loadFunction = component.getAttribute('data-lazy');
        
        if (loadFunction && typeof window[loadFunction] === 'function') {
            window[loadFunction](component);
        }
        
        component.classList.add('loaded');
        component.removeAttribute('data-lazy');
    }

    /**
     * Add new images to observer
     */
    observeNewImages() {
        if (this.imageObserver) {
            this.observeImages();
        } else {
            this.loadAllImages();
        }
    }

    /**
     * Add new components to observer
     */
    observeNewComponents() {
        if (this.componentObserver) {
            this.observeComponents();
        }
    }

    /**
     * Create lazy image element
     */
    static createLazyImage(src, alt = '', className = '') {
        const img = document.createElement('img');
        img.setAttribute('data-src', src);
        img.alt = alt;
        img.className = className + ' lazy';
        
        // Add placeholder
        img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';
        
        return img;
    }

    /**
     * Create responsive lazy image with srcset
     */
    static createResponsiveLazyImage(srcset, src, alt = '', className = '') {
        const img = LazyLoader.createLazyImage(src, alt, className);
        img.setAttribute('data-srcset', srcset);
        return img;
    }

    /**
     * Preload critical images
     */
    static preloadImages(urls) {
        urls.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = url;
            document.head.appendChild(link);
        });
    }

    /**
     * Prefetch images for next page
     */
    static prefetchImages(urls) {
        urls.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.as = 'image';
            link.href = url;
            document.head.appendChild(link);
        });
    }
}

// Initialize lazy loader
window.lazyLoader = new LazyLoader();

// Reinitialize on dynamic content load
document.addEventListener('contentLoaded', () => {
    if (window.lazyLoader) {
        window.lazyLoader.observeNewImages();
        window.lazyLoader.observeNewComponents();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LazyLoader;
}
