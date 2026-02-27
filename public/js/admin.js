// Admin Module
const Admin = {
    currentTab: 'dashboard',
    stats: null,
    reports: [],
    auditLogs: [],

    async init() {
        console.log('Admin module initialized');
    },

    async loadDashboard() {
        if (!window.STATE.currentUser || window.STATE.currentUser.role !== 'admin') {
            UI.showToast('Access denied. Admin privileges required.', 'error');
            return;
        }

        try {
            UI.showLoading();
            
            // Load admin stats
            const statsResponse = await API.admin.getStats();
            this.stats = statsResponse.stats;
            
            // Load reports
            const reportsResponse = await API.admin.getReports({ status: 'pending' });
            this.reports = reportsResponse.reports || [];
            
            this.renderDashboard();
            UI.navigateTo('admin');
        } catch (error) {
            console.error('Failed to load admin dashboard:', error);
            UI.showToast('Failed to load admin dashboard', 'error');
        } finally {
            UI.hideLoading();
        }
    },

    renderDashboard() {
        const adminContent = document.getElementById('adminContent');
        if (!adminContent) return;

        adminContent.innerHTML = `
            <div class="admin-container">
                <div class="admin-header">
                    <h1><i class="fas fa-shield-alt"></i> Admin Dashboard</h1>
                    <p>System management and moderation tools</p>
                </div>

                <div class="admin-tabs">
                    <button class="tab-btn ${this.currentTab === 'dashboard' ? 'active' : ''}" 
                            onclick="Admin.switchTab('dashboard')">
                        <i class="fas fa-chart-line"></i> Dashboard
                    </button>
                    <button class="tab-btn ${this.currentTab === 'reports' ? 'active' : ''}" 
                            onclick="Admin.switchTab('reports')">
                        <i class="fas fa-flag"></i> Reports (${this.reports.length})
                    </button>
                    <button class="tab-btn ${this.currentTab === 'users' ? 'active' : ''}" 
                            onclick="Admin.switchTab('users')">
                        <i class="fas fa-users"></i> Users
                    </button>
                    <button class="tab-btn ${this.currentTab === 'content' ? 'active' : ''}" 
                            onclick="Admin.switchTab('content')">
                        <i class="fas fa-shield-alt"></i> Content Moderation
                    </button>
                    <button class="tab-btn ${this.currentTab === 'audit' ? 'active' : ''}" 
                            onclick="Admin.switchTab('audit')">
                        <i class="fas fa-history"></i> Audit Logs
                    </button>
                </div>

                <div class="admin-content">
                    <div id="dashboardTab" class="tab-content ${this.currentTab === 'dashboard' ? 'active' : ''}">
                        ${this.renderDashboardTab()}
                    </div>
                    <div id="reportsTab" class="tab-content ${this.currentTab === 'reports' ? 'active' : ''}">
                        ${this.renderReportsTab()}
                    </div>
                    <div id="usersTab" class="tab-content ${this.currentTab === 'users' ? 'active' : ''}">
                        ${this.renderUsersTab()}
                    </div>
                    <div id="contentTab" class="tab-content ${this.currentTab === 'content' ? 'active' : ''}">
                        ${this.renderContentTab()}
                    </div>
                    <div id="auditTab" class="tab-content ${this.currentTab === 'audit' ? 'active' : ''}">
                        ${this.renderAuditTab()}
                    </div>
                </div>
            </div>
        `;
    },

    renderDashboardTab() {
        if (!this.stats) {
            return '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>';
        }

        return `
            <div class="dashboard-grid">
                <div class="stat-card-large">
                    <div class="stat-icon-large"><i class="fas fa-users"></i></div>
                    <div class="stat-value-large">${this.stats.totalUsers || 0}</div>
                    <div class="stat-label-large">Total Users</div>
                    <div class="stat-change positive">+${this.stats.newUsersToday || 0} today</div>
                </div>

                <div class="stat-card-large">
                    <div class="stat-icon-large"><i class="fas fa-box"></i></div>
                    <div class="stat-value-large">${this.stats.totalProducts || 0}</div>
                    <div class="stat-label-large">Total Products</div>
                    <div class="stat-change positive">+${this.stats.newProductsToday || 0} today</div>
                </div>

                <div class="stat-card-large">
                    <div class="stat-icon-large"><i class="fas fa-handshake"></i></div>
                    <div class="stat-value-large">${this.stats.totalDeals || 0}</div>
                    <div class="stat-label-large">Total Deals</div>
                    <div class="stat-change positive">+${this.stats.newDealsToday || 0} today</div>
                </div>

                <div class="stat-card-large">
                    <div class="stat-icon-large"><i class="fas fa-flag"></i></div>
                    <div class="stat-value-large">${this.stats.pendingReports || 0}</div>
                    <div class="stat-label-large">Pending Reports</div>
                    <div class="stat-change ${this.stats.pendingReports > 0 ? 'negative' : ''}">
                        Requires attention
                    </div>
                </div>

                <div class="admin-card full-width">
                    <h3><i class="fas fa-chart-bar"></i> System Activity</h3>
                    <div class="activity-stats">
                        <div class="activity-item">
                            <span class="activity-label">Active Users (24h)</span>
                            <span class="activity-value">${this.stats.activeUsers24h || 0}</span>
                        </div>
                        <div class="activity-item">
                            <span class="activity-label">Messages Sent (24h)</span>
                            <span class="activity-value">${this.stats.messagesSent24h || 0}</span>
                        </div>
                        <div class="activity-item">
                            <span class="activity-label">Products Listed (7d)</span>
                            <span class="activity-value">${this.stats.productsListed7d || 0}</span>
                        </div>
                        <div class="activity-item">
                            <span class="activity-label">Deals Completed (7d)</span>
                            <span class="activity-value">${this.stats.dealsCompleted7d || 0}</span>
                        </div>
                    </div>
                </div>

                <div class="admin-card full-width">
                    <h3><i class="fas fa-exclamation-triangle"></i> Recent Alerts</h3>
                    <div class="alerts-list">
                        ${this.stats.recentAlerts && this.stats.recentAlerts.length > 0 ? 
                            this.stats.recentAlerts.map(alert => `
                                <div class="alert-item alert-${alert.severity}">
                                    <i class="fas fa-${alert.icon || 'info-circle'}"></i>
                                    <span>${UI.escapeHtml(alert.message)}</span>
                                    <span class="alert-time">${UI.formatRelativeTime(alert.timestamp)}</span>
                                </div>
                            `).join('') : 
                            '<p class="text-muted">No recent alerts</p>'
                        }
                    </div>
                </div>
            </div>
        `;
    },

    renderReportsTab() {
        return `
            <div class="reports-container">
                <div class="reports-header">
                    <h2>Content Reports</h2>
                    <div class="reports-filters">
                        <select id="reportStatusFilter" class="filter-select" onchange="Admin.filterReports()">
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="resolved">Resolved</option>
                            <option value="dismissed">Dismissed</option>
                            <option value="all">All</option>
                        </select>
                        <select id="reportTypeFilter" class="filter-select" onchange="Admin.filterReports()">
                            <option value="all">All Types</option>
                            <option value="product">Product</option>
                            <option value="user">User</option>
                            <option value="message">Message</option>
                        </select>
                    </div>
                </div>

                <div class="reports-list" id="reportsList">
                    ${this.reports.length === 0 ? `
                        <div class="empty-state">
                            <i class="fas fa-check-circle"></i>
                            <p>No pending reports</p>
                        </div>
                    ` : this.reports.map(report => this.renderReportCard(report)).join('')}
                </div>
            </div>
        `;
    },

    renderReportCard(report) {
        return `
            <div class="report-card">
                <div class="report-header">
                    <div class="report-info">
                        <span class="report-type">${report.report_type}</span>
                        <span class="report-category">${report.category}</span>
                        <span class="report-status status-${report.status}">${report.status}</span>
                    </div>
                    <span class="report-date">${UI.formatRelativeTime(report.created_at)}</span>
                </div>

                <div class="report-content">
                    <p class="report-reason"><strong>Reason:</strong> ${UI.escapeHtml(report.reason)}</p>
                    ${report.description ? `<p class="report-description">${UI.escapeHtml(report.description)}</p>` : ''}
                    
                    <div class="report-details">
                        <div class="report-detail-item">
                            <span class="detail-label">Reporter:</span>
                            <span class="detail-value">${UI.escapeHtml(report.reporter_name)}</span>
                        </div>
                        <div class="report-detail-item">
                            <span class="detail-label">Reported Item:</span>
                            <span class="detail-value">${report.reported_item_title || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                ${report.status === 'pending' ? `
                    <div class="report-actions">
                        <button class="btn btn-sm btn-success" onclick="Admin.resolveReport(${report.id}, 'resolved')">
                            <i class="fas fa-check"></i> Resolve
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="Admin.resolveReport(${report.id}, 'reviewed')">
                            <i class="fas fa-eye"></i> Mark Reviewed
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="Admin.resolveReport(${report.id}, 'dismissed')">
                            <i class="fas fa-times"></i> Dismiss
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="Admin.takeAction(${report.id})">
                            <i class="fas fa-ban"></i> Take Action
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    },

    renderUsersTab() {
        return `
            <div class="users-container">
                <div class="users-header">
                    <h2>User Management</h2>
                    <div class="users-search">
                        <input type="text" id="userSearchInput" placeholder="Search users..." class="search-input">
                        <button class="btn btn-primary" onclick="Admin.searchUsers()">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                </div>

                <div class="users-list" id="usersList">
                    <p class="text-muted">Search for users to manage</p>
                </div>
            </div>
        `;
    },

    renderContentTab() {
        return `
            <div class="content-moderation-container">
                <div class="moderation-header">
                    <h2>Content Moderation</h2>
                    <p>Review and moderate flagged content</p>
                </div>

                <div class="moderation-stats">
                    <div class="mod-stat-card">
                        <i class="fas fa-flag"></i>
                        <div class="mod-stat-value">${this.stats?.flaggedProducts || 0}</div>
                        <div class="mod-stat-label">Flagged Products</div>
                    </div>
                    <div class="mod-stat-card">
                        <i class="fas fa-comment-slash"></i>
                        <div class="mod-stat-value">${this.stats?.flaggedMessages || 0}</div>
                        <div class="mod-stat-label">Flagged Messages</div>
                    </div>
                    <div class="mod-stat-card">
                        <i class="fas fa-user-slash"></i>
                        <div class="mod-stat-value">${this.stats?.suspendedUsers || 0}</div>
                        <div class="mod-stat-label">Suspended Users</div>
                    </div>
                </div>

                <div class="moderation-tools">
                    <div class="tool-card">
                        <h3><i class="fas fa-filter"></i> Content Filters</h3>
                        <p>Manage sensitive word filters and content moderation rules</p>
                        <button class="btn btn-primary" onclick="Admin.manageFilters()">
                            <i class="fas fa-cog"></i> Manage Filters
                        </button>
                    </div>

                    <div class="tool-card">
                        <h3><i class="fas fa-robot"></i> Auto-Moderation</h3>
                        <p>Configure automatic content moderation settings</p>
                        <button class="btn btn-primary" onclick="Admin.configureAutoMod()">
                            <i class="fas fa-cog"></i> Configure
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    renderAuditTab() {
        return `
            <div class="audit-container">
                <div class="audit-header">
                    <h2>Audit Logs</h2>
                    <div class="audit-filters">
                        <select id="auditActionFilter" class="filter-select" onchange="Admin.filterAuditLogs()">
                            <option value="all">All Actions</option>
                            <option value="user_action">User Actions</option>
                            <option value="admin_action">Admin Actions</option>
                            <option value="system_action">System Actions</option>
                        </select>
                        <button class="btn btn-primary" onclick="Admin.loadAuditLogs()">
                            <i class="fas fa-sync"></i> Refresh
                        </button>
                    </div>
                </div>

                <div class="audit-logs-list" id="auditLogsList">
                    <p class="text-muted">Click refresh to load audit logs</p>
                </div>
            </div>
        `;
    },

    switchTab(tab) {
        this.currentTab = tab;
        
        // Update tab buttons
        document.querySelectorAll('.admin-tabs .tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.closest('.tab-btn').classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.admin-content .tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tab}Tab`).classList.add('active');

        // Load data for specific tabs
        if (tab === 'audit' && this.auditLogs.length === 0) {
            // Audit logs will be loaded on demand
        }
    },

    async filterReports() {
        const status = document.getElementById('reportStatusFilter').value;
        const type = document.getElementById('reportTypeFilter').value;

        try {
            const params = {};
            if (status !== 'all') params.status = status;
            if (type !== 'all') params.type = type;

            const response = await API.admin.getReports(params);
            this.reports = response.reports || [];
            
            // Re-render reports list
            const reportsList = document.getElementById('reportsList');
            if (reportsList) {
                reportsList.innerHTML = this.reports.length === 0 ? `
                    <div class="empty-state">
                        <i class="fas fa-check-circle"></i>
                        <p>No reports found</p>
                    </div>
                ` : this.reports.map(report => this.renderReportCard(report)).join('');
            }
        } catch (error) {
            console.error('Failed to filter reports:', error);
            UI.showToast('Failed to filter reports', 'error');
        }
    },

    async resolveReport(reportId, status) {
        try {
            await API.admin.updateReport(reportId, { status });
            UI.showToast(`Report ${status}`, 'success');
            
            // Reload reports
            await this.filterReports();
        } catch (error) {
            console.error('Failed to update report:', error);
            UI.showToast('Failed to update report', 'error');
        }
    },

    async takeAction(reportId) {
        const action = prompt('Enter action to take (ban_user, remove_content, warn_user):');
        if (!action) return;

        try {
            await API.admin.updateReport(reportId, { 
                status: 'resolved',
                action: action
            });
            UI.showToast('Action taken successfully', 'success');
            
            // Reload reports
            await this.filterReports();
        } catch (error) {
            console.error('Failed to take action:', error);
            UI.showToast('Failed to take action', 'error');
        }
    },

    async searchUsers() {
        const query = document.getElementById('userSearchInput').value;
        if (!query) {
            UI.showToast('Please enter a search query', 'warning');
            return;
        }

        UI.showToast('User search feature coming soon', 'info');
    },

    async loadAuditLogs() {
        try {
            UI.showLoading();
            const response = await API.admin.getAuditLogs({ limit: 50 });
            this.auditLogs = response.logs || [];
            
            const auditLogsList = document.getElementById('auditLogsList');
            if (auditLogsList) {
                auditLogsList.innerHTML = this.auditLogs.length === 0 ? `
                    <div class="empty-state">
                        <i class="fas fa-history"></i>
                        <p>No audit logs found</p>
                    </div>
                ` : this.auditLogs.map(log => `
                    <div class="audit-log-item">
                        <div class="audit-log-header">
                            <span class="audit-action">${UI.escapeHtml(log.action)}</span>
                            <span class="audit-time">${UI.formatRelativeTime(log.timestamp)}</span>
                        </div>
                        <div class="audit-log-details">
                            <span class="audit-user">${UI.escapeHtml(log.user_name || 'System')}</span>
                            ${log.details ? `<span class="audit-details">${UI.escapeHtml(log.details)}</span>` : ''}
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Failed to load audit logs:', error);
            UI.showToast('Failed to load audit logs', 'error');
        } finally {
            UI.hideLoading();
        }
    },

    manageFilters() {
        UI.showToast('Content filter management coming soon', 'info');
    },

    configureAutoMod() {
        UI.showToast('Auto-moderation configuration coming soon', 'info');
    }
};
