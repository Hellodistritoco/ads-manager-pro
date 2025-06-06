// Add strategies
        if (this.dashboardData?.estrategias_activas) {
            this.dashboardData.estrategias_activas.slice(0, 3).forEach(est => {
                activities.push({
                    type: 'strategy',
                    title: est.nombre_estrategia,
                    client: est.cliente_nombre,
                    date: est.fecha_creacion,
                    icon: 'lightbulb',
                    color: 'primary'
                });
            });
        }

        // Sort by date
        activities.sort((a, b) => new Date(b.date) - new Date(a.date));

        container.innerHTML = activities.slice(0, 8).map(activity => `
            <div class="activity-item">
                <div class="activity-icon bg-${activity.color}">
                    <i class="bi bi-${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-meta">
                        <span class="text-muted">${activity.client}</span>
                        <span class="text-muted ms-2">${this.formatDate(activity.date)}</span>
                        ${activity.priority ? `<span class="badge bg-${activity.priority === 'critica' ? 'danger' : 'warning'} ms-2">${activity.priority}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderPerformanceMetrics() {
        if (!this.dashboardData?.rendimiento_general) return;

        const rendimiento = this.dashboardData.rendimiento_general;
        
        // Update performance indicators
        const indicators = [
            { id: 'inversionIndicator', value: rendimiento.inversion_total, format: 'currency' },
            { id: 'ingresosIndicator', value: rendimiento.ingresos_total, format: 'currency' },
            { id: 'roasIndicator', value: rendimiento.roas_promedio, format: 'roas' },
            { id: 'ctrIndicator', value: rendimiento.ctr_promedio, format: 'percentage' },
            { id: 'conversionesIndicator', value: rendimiento.conversiones_total, format: 'number' }
        ];

        indicators.forEach(indicator => {
            const element = document.getElementById(indicator.id);
            if (element) {
                const valueElement = element.querySelector('.metric-value');
                if (valueElement) {
                    switch (indicator.format) {
                        case 'currency':
                            valueElement.textContent = this.formatCurrency(indicator.value);
                            break;
                        case 'roas':
                            valueElement.textContent = this.formatNumber(indicator.value, 2) + 'x';
                            break;
                        case 'percentage':
                            valueElement.textContent = this.formatNumber(indicator.value, 2) + '%';
                            break;
                        default:
                            valueElement.textContent = this.formatNumber(indicator.value);
                    }
                }
            }
        });
    }

    // ==================== CLIENT REPORT RENDERING ====================
    
    renderClienteReport() {
        if (!this.reporteActual) return;

        const cliente = this.reporteActual.cliente;
        const estadisticas = this.reporteActual.estadisticas;
        const estrategias = this.reporteActual.estrategias || [];
        const optimizaciones = this.reporteActual.optimizaciones || [];

        // Update report header
        this.updateReportHeader(cliente);
        
        // Render client overview
        this.renderClientOverview(cliente, estadisticas);
        
        // Render strategies section
        this.renderClientStrategies(estrategias);
        
        // Render metrics summary
        this.renderClientMetrics(this.reporteActual.metricas_resumen);
        
        // Render optimizations
        this.renderClientOptimizations(optimizaciones);
        
        // Update client-specific charts
        this.updateClientCharts();

        // Show report container
        if (this.reportContainer) {
            this.reportContainer.style.display = 'block';
        }
    }

    updateReportHeader(cliente) {
        document.getElementById('reportClienteName').textContent = cliente.nombre;
        document.getElementById('reportClienteEmpresa').textContent = cliente.empresa || 'Sin empresa';
        document.getElementById('reportGeneratedDate').textContent = new Date().toLocaleDateString('es-ES');
    }

    renderClientOverview(cliente, estadisticas) {
        const container = document.getElementById('clientOverviewContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <div class="info-card">
                        <h6>Información del Cliente</h6>
                        <p><strong>Email:</strong> ${cliente.email}</p>
                        <p><strong>Teléfono:</strong> ${cliente.telefono || 'N/A'}</p>
                        <p><strong>Segmento:</strong> ${cliente.segmento || 'N/A'}</p>
                        <p><strong>Industria:</strong> ${cliente.industria || 'N/A'}</p>
                        <p><strong>Presupuesto Mensual:</strong> ${this.formatCurrency(cliente.presupuesto_mensual || 0)}</p>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="info-card">
                        <h6>Estadísticas Generales</h6>
                        <p><strong>Total Estrategias:</strong> ${estadisticas?.total_estrategias || 0}</p>
                        <p><strong>Total Reportes:</strong> ${estadisticas?.total_reportes || 0}</p>
                        <p><strong>Total Optimizaciones:</strong> ${estadisticas?.total_optimizaciones || 0}</p>
                        <p><strong>Inversión Total:</strong> ${this.formatCurrency(estadisticas?.inversion_total || 0)}</p>
                        <p><strong>Ingresos Total:</strong> ${this.formatCurrency(estadisticas?.ingresos_total || 0)}</p>
                        <p><strong>ROAS Promedio:</strong> ${this.formatNumber(estadisticas?.roas_promedio || 0, 2)}x</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderClientStrategies(estrategias) {
        const container = document.getElementById('clientStrategiesContainer');
        if (!container) return;

        if (estrategias.length === 0) {
            container.innerHTML = '<p class="text-muted">No hay estrategias registradas para este cliente.</p>';
            return;
        }

        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Estrategia</th>
                            <th>Presupuesto</th>
                            <th>Estado</th>
                            <th>Fecha Inicio</th>
                            <th>Rendimiento</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${estrategias.map(estrategia => `
                            <tr>
                                <td>
                                    <div>
                                        <strong>${estrategia.nombre_estrategia}</strong>
                                        <br>
                                        <small class="text-muted">${this.truncateText(estrategia.objetivos || '', 50)}</small>
                                    </div>
                                </td>
                                <td>${this.formatCurrency(estrategia.presupuesto || 0)}</td>
                                <td>${this.getStatusBadge(estrategia.estado)}</td>
                                <td>${this.formatDate(estrategia.fecha_inicio)}</td>
                                <td>
                                    <div class="performance-indicator">
                                        ${estrategia.rendimiento ? 
                                            `<span class="${this.getRoasColor(estrategia.rendimiento.roas_promedio)}">${this.formatNumber(estrategia.rendimiento.roas_promedio, 2)}x ROAS</span>` 
                                            : '<span class="text-muted">Sin datos</span>'
                                        }
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderClientMetrics(metricas) {
        const container = document.getElementById('clientMetricsContainer');
        if (!container || !metricas) return;

        container.innerHTML = `
            <div class="row">
                <div class="col-md-3">
                    <div class="metric-card">
                        <div class="metric-value">${this.formatCurrency(metricas.inversion_total || 0)}</div>
                        <div class="metric-label">Inversión Total</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="metric-card">
                        <div class="metric-value">${this.formatCurrency(metricas.ingresos_total || 0)}</div>
                        <div class="metric-label">Ingresos Total</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="metric-card">
                        <div class="metric-value">${this.formatNumber(metricas.roas_promedio || 0, 2)}x</div>
                        <div class="metric-label">ROAS Promedio</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="metric-card">
                        <div class="metric-value">${this.formatNumber(metricas.ctr_promedio || 0, 2)}%</div>
                        <div class="metric-label">CTR Promedio</div>
                    </div>
                </div>
            </div>
            <div class="row mt-3">
                <div class="col-md-4">
                    <div class="metric-card">
                        <div class="metric-value">${this.formatNumber(metricas.total_impresiones || 0)}</div>
                        <div class="metric-label">Total Impresiones</div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="metric-card">
                        <div class="metric-value">${this.formatNumber(metricas.total_clicks || 0)}</div>
                        <div class="metric-label">Total Clicks</div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="metric-card">
                        <div class="metric-value">${this.formatNumber(metricas.total_conversiones || 0)}</div>
                        <div class="metric-label">Total Conversiones</div>
                    </div>
                </div>
            </div>
        `;
    }

    renderClientOptimizations(optimizaciones) {
        const container = document.getElementById('clientOptimizationsContainer');
        if (!container) return;

        if (optimizaciones.length === 0) {
            container.innerHTML = '<p class="text-muted">No hay optimizaciones registradas para este cliente.</p>';
            return;
        }

        // Group optimizations by status
        const grouped = {
            propuesta: optimizaciones.filter(o => o.estado === 'propuesta'),
            en_progreso: optimizaciones.filter(o => o.estado === 'en_progreso'),
            implementada: optimizaciones.filter(o => o.estado === 'implementada')
        };

        container.innerHTML = `
            <div class="row">
                <div class="col-md-4">
                    <div class="optimization-group">
                        <h6 class="text-primary">Propuestas (${grouped.propuesta.length})</h6>
                        ${grouped.propuesta.slice(0, 5).map(opt => `
                            <div class="optimization-item">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div>
                                        <strong>${opt.titulo}</strong>
                                        <div class="small text-muted">${this.truncateText(opt.mejoras_propuestas || '', 60)}</div>
                                    </div>
                                    ${this.getPriorityBadge(opt.prioridad)}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="optimization-group">
                        <h6 class="text-warning">En Progreso (${grouped.en_progreso.length})</h6>
                        ${grouped.en_progreso.slice(0, 5).map(opt => `
                            <div class="optimization-item">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div>
                                        <strong>${opt.titulo}</strong>
                                        <div class="small text-muted">${this.truncateText(opt.acciones_implementadas || '', 60)}</div>
                                    </div>
                                    ${this.getPriorityBadge(opt.prioridad)}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="optimization-group">
                        <h6 class="text-success">Implementadas (${grouped.implementada.length})</h6>
                        ${grouped.implementada.slice(0, 5).map(opt => `
                            <div class="optimization-item">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div>
                                        <strong>${opt.titulo}</strong>
                                        <div class="small text-muted">${this.truncateText(opt.resultados_obtenidos || '', 60)}</div>
                                    </div>
                                    <small class="text-muted">${this.formatDate(opt.fecha_implementacion)}</small>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // ==================== CHARTS MANAGEMENT ====================
    
    initializeCharts() {
        this.initRevenueChart();
        this.initPerformanceChart();
        this.initClientDistributionChart();
        this.initTrendChart();
    }

    initRevenueChart() {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;

        this.charts.revenue = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Ingresos',
                    data: [],
                    borderColor: 'rgba(5, 150, 105, 1)',
                    backgroundColor: 'rgba(5, 150, 105, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Inversión',
                    data: [],
                    borderColor: 'rgba(220, 38, 38, 1)',
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '// =====================================================
// JS/MODULES/RESULTADOS.JS - Módulo de Gestión de Resultados y Reportes
// =====================================================

class ResultadosModule {
    constructor() {
        this.dashboardData = null;
        this.clientes = [];
        this.reporteActual = null;
        this.charts = {};
        this.currentPeriod = 'month';
        this.selectedCliente = null;
        
        // Referencias DOM
        this.clienteFilter = document.getElementById('clienteFilter');
        this.periodFilter = document.getElementById('periodFilter');
        this.reportContainer = document.getElementById('reportContainer');
        
        this.init();
    }

    // ==================== INICIALIZACIÓN ====================
    
    async init() {
        try {
            await this.loadClientes();
            await this.loadDashboardData();
            this.setupEventListeners();
            this.initializeCharts();
            this.renderDashboard();
            this.setupAutoRefresh();
        } catch (error) {
            console.error('Error inicializando módulo de resultados:', error);
            this.showError('Error al cargar el módulo');
        }
    }

    setupEventListeners() {
        // Filters
        if (this.clienteFilter) {
            this.clienteFilter.addEventListener('change', (e) => {
                this.filterByCliente(e.target.value);
            });
        }

        if (this.periodFilter) {
            this.periodFilter.addEventListener('change', (e) => {
                this.changePeriod(e.target.value);
            });
        }

        // Export buttons
        document.querySelectorAll('[data-export]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.exportReport(e.target.dataset.export);
            });
        });

        // Chart type toggles
        document.querySelectorAll('[data-chart-type]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchChartType(e.target.dataset.chartType);
            });
        });

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }

        // Print button
        const printBtn = document.getElementById('printBtn');
        if (printBtn) {
            printBtn.addEventListener('click', () => this.printReport());
        }
    }

    setupAutoRefresh() {
        // Auto-refresh every 5 minutes
        setInterval(() => {
            this.refreshData(false); // Silent refresh
        }, 300000);
    }

    // ==================== DATA LOADING ====================
    
    async loadClientes() {
        try {
            const response = await api.getClientes();
            if (response.success) {
                this.clientes = response.data;
                this.populateClienteFilter();
            }
        } catch (error) {
            console.error('Error cargando clientes:', error);
        }
    }

    async loadDashboardData() {
        try {
            this.showLoading('Cargando datos del dashboard...');
            
            const response = await api.getDashboard();
            
            if (response.success) {
                this.dashboardData = response.data;
                this.updateDashboardStats();
                this.updateChartsData();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error cargando dashboard:', error);
            this.showError('Error al cargar los datos del dashboard');
        } finally {
            this.hideLoading();
        }
    }

    async loadClienteReport(clienteId) {
        try {
            this.showLoading('Generando reporte del cliente...');
            
            const response = await api.getReporteCliente(clienteId);
            
            if (response.success) {
                this.reporteActual = response.data;
                this.renderClienteReport();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error cargando reporte cliente:', error);
            this.showError('Error al cargar el reporte del cliente');
        } finally {
            this.hideLoading();
        }
    }

    // ==================== DASHBOARD RENDERING ====================
    
    renderDashboard() {
        this.renderOverviewCards();
        this.renderTopClientsTable();
        this.renderRecentActivity();
        this.renderPerformanceMetrics();
    }

    renderOverviewCards() {
        if (!this.dashboardData?.totales) return;

        const totales = this.dashboardData.totales;
        const rendimiento = this.dashboardData.rendimiento_general || {};

        // Update overview cards
        this.updateCard('clientesActivos', totales.clientes_activos || 0, 'clientes');
        this.updateCard('estrategiasActivas', totales.estrategias_activas || 0, 'estrategias');
        this.updateCard('inversionTotal', rendimiento.inversion_total || 0, 'currency');
        this.updateCard('roasPromedio', rendimiento.roas_promedio || 0, 'roas');
        this.updateCard('totalReportes', totales.total_reportes || 0, 'reportes');
        this.updateCard('optimizacionesPendientes', totales.optimizaciones_pendientes || 0, 'optimizaciones');
    }

    updateCard(cardId, value, type) {
        const cardElement = document.getElementById(cardId);
        if (!cardElement) return;

        const valueElement = cardElement.querySelector('.card-value');
        const changeElement = cardElement.querySelector('.card-change');

        if (valueElement) {
            switch (type) {
                case 'currency':
                    valueElement.textContent = this.formatCurrency(value);
                    break;
                case 'roas':
                    valueElement.textContent = this.formatNumber(value, 2) + 'x';
                    break;
                case 'percentage':
                    valueElement.textContent = this.formatNumber(value, 1) + '%';
                    break;
                default:
                    valueElement.textContent = this.formatNumber(value);
            }
        }

        // Simulate change calculation (in real implementation, compare with previous period)
        if (changeElement) {
            const change = Math.random() * 20 - 10; // Random for demo
            const isPositive = change > 0;
            
            changeElement.innerHTML = `
                <i class="bi bi-arrow-${isPositive ? 'up' : 'down'}"></i>
                ${Math.abs(change).toFixed(1)}% vs período anterior
            `;
            changeElement.className = `card-change ${isPositive ? 'positive' : 'negative'}`;
        }
    }

    renderTopClientsTable() {
        const tbody = document.getElementById('topClientsTableBody');
        if (!tbody || !this.dashboardData?.top_clientes) return;

        const topClientes = this.dashboardData.top_clientes.slice(0, 10);

        tbody.innerHTML = topClientes.map((cliente, index) => `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="ranking-badge">${index + 1}</div>
                        <div class="ms-2">
                            <div class="fw-bold">${cliente.nombre}</div>
                            <small class="text-muted">${cliente.empresa || ''}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="fw-bold text-success">${this.formatCurrency(cliente.ingresos_total || 0)}</span>
                </td>
                <td>
                    <span class="fw-bold ${this.getRoasColor(cliente.roas_promedio || 0)}">
                        ${this.formatNumber(cliente.roas_promedio || 0, 2)}x
                    </span>
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="resultadosModule.viewClienteReport(${cliente.id})">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="resultadosModule.exportClienteReport(${cliente.id})">
                            <i class="bi bi-download"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderRecentActivity() {
        const container = document.getElementById('recentActivityList');
        if (!container) return;

        // Combine different types of activities
        const activities = [];

        // Add optimizations
        if (this.dashboardData?.optimizaciones_pendientes) {
            this.dashboardData.optimizaciones_pendientes.slice(0, 5).forEach(opt => {
                activities.push({
                    type: 'optimization',
                    title: opt.titulo,
                    client: opt.cliente_nombre,
                    date: opt.fecha_analisis,
                    priority: opt.prioridad,
                    icon: 'gear',
                    color: 'warning'
                });
            });
        }

        // Add strategies + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    initPerformanceChart() {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) return;

        this.charts.performance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['ROAS', 'CTR', 'CPC', 'CPM'],
                datasets: [{
                    label: 'Rendimiento Actual',
                    data: [],
                    backgroundColor: [
                        'rgba(37, 99, 235, 0.8)',
                        'rgba(5, 150, 105, 0.8)',
                        'rgba(217, 119, 6, 0.8)',
                        'rgba(220, 38, 38, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    initClientDistributionChart() {
        const ctx = document.getElementById('clientDistributionChart');
        if (!ctx) return;

        this.charts.clientDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed',
                        '#0891b2', '#be123c', '#065f46', '#7c2d12'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    initTrendChart() {
        const ctx = document.getElementById('trendChart');
        if (!ctx) return;

        this.charts.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'ROAS Promedio',
                    data: [],
                    borderColor: 'rgba(37, 99, 235, 1)',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y'
                }, {
                    label: 'Inversión Total',
                    data: [],
                    borderColor: 'rgba(220, 38, 38, 1)',
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'ROAS'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Inversión ($)'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                        ticks: {
                            callback: function(value) {
                                return '// =====================================================
// JS/MODULES/RESULTADOS.JS - Módulo de Gestión de Resultados y Reportes
// =====================================================

class ResultadosModule {
    constructor() {
        this.dashboardData = null;
        this.clientes = [];
        this.reporteActual = null;
        this.charts = {};
        this.currentPeriod = 'month';
        this.selectedCliente = null;
        
        // Referencias DOM
        this.clienteFilter = document.getElementById('clienteFilter');
        this.periodFilter = document.getElementById('periodFilter');
        this.reportContainer = document.getElementById('reportContainer');
        
        this.init();
    }

    // ==================== INICIALIZACIÓN ====================
    
    async init() {
        try {
            await this.loadClientes();
            await this.loadDashboardData();
            this.setupEventListeners();
            this.initializeCharts();
            this.renderDashboard();
            this.setupAutoRefresh();
        } catch (error) {
            console.error('Error inicializando módulo de resultados:', error);
            this.showError('Error al cargar el módulo');
        }
    }

    setupEventListeners() {
        // Filters
        if (this.clienteFilter) {
            this.clienteFilter.addEventListener('change', (e) => {
                this.filterByCliente(e.target.value);
            });
        }

        if (this.periodFilter) {
            this.periodFilter.addEventListener('change', (e) => {
                this.changePeriod(e.target.value);
            });
        }

        // Export buttons
        document.querySelectorAll('[data-export]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.exportReport(e.target.dataset.export);
            });
        });

        // Chart type toggles
        document.querySelectorAll('[data-chart-type]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchChartType(e.target.dataset.chartType);
            });
        });

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }

        // Print button
        const printBtn = document.getElementById('printBtn');
        if (printBtn) {
            printBtn.addEventListener('click', () => this.printReport());
        }
    }

    setupAutoRefresh() {
        // Auto-refresh every 5 minutes
        setInterval(() => {
            this.refreshData(false); // Silent refresh
        }, 300000);
    }

    // ==================== DATA LOADING ====================
    
    async loadClientes() {
        try {
            const response = await api.getClientes();
            if (response.success) {
                this.clientes = response.data;
                this.populateClienteFilter();
            }
        } catch (error) {
            console.error('Error cargando clientes:', error);
        }
    }

    async loadDashboardData() {
        try {
            this.showLoading('Cargando datos del dashboard...');
            
            const response = await api.getDashboard();
            
            if (response.success) {
                this.dashboardData = response.data;
                this.updateDashboardStats();
                this.updateChartsData();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error cargando dashboard:', error);
            this.showError('Error al cargar los datos del dashboard');
        } finally {
            this.hideLoading();
        }
    }

    async loadClienteReport(clienteId) {
        try {
            this.showLoading('Generando reporte del cliente...');
            
            const response = await api.getReporteCliente(clienteId);
            
            if (response.success) {
                this.reporteActual = response.data;
                this.renderClienteReport();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error cargando reporte cliente:', error);
            this.showError('Error al cargar el reporte del cliente');
        } finally {
            this.hideLoading();
        }
    }

    // ==================== DASHBOARD RENDERING ====================
    
    renderDashboard() {
        this.renderOverviewCards();
        this.renderTopClientsTable();
        this.renderRecentActivity();
        this.renderPerformanceMetrics();
    }

    renderOverviewCards() {
        if (!this.dashboardData?.totales) return;

        const totales = this.dashboardData.totales;
        const rendimiento = this.dashboardData.rendimiento_general || {};

        // Update overview cards
        this.updateCard('clientesActivos', totales.clientes_activos || 0, 'clientes');
        this.updateCard('estrategiasActivas', totales.estrategias_activas || 0, 'estrategias');
        this.updateCard('inversionTotal', rendimiento.inversion_total || 0, 'currency');
        this.updateCard('roasPromedio', rendimiento.roas_promedio || 0, 'roas');
        this.updateCard('totalReportes', totales.total_reportes || 0, 'reportes');
        this.updateCard('optimizacionesPendientes', totales.optimizaciones_pendientes || 0, 'optimizaciones');
    }

    updateCard(cardId, value, type) {
        const cardElement = document.getElementById(cardId);
        if (!cardElement) return;

        const valueElement = cardElement.querySelector('.card-value');
        const changeElement = cardElement.querySelector('.card-change');

        if (valueElement) {
            switch (type) {
                case 'currency':
                    valueElement.textContent = this.formatCurrency(value);
                    break;
                case 'roas':
                    valueElement.textContent = this.formatNumber(value, 2) + 'x';
                    break;
                case 'percentage':
                    valueElement.textContent = this.formatNumber(value, 1) + '%';
                    break;
                default:
                    valueElement.textContent = this.formatNumber(value);
            }
        }

        // Simulate change calculation (in real implementation, compare with previous period)
        if (changeElement) {
            const change = Math.random() * 20 - 10; // Random for demo
            const isPositive = change > 0;
            
            changeElement.innerHTML = `
                <i class="bi bi-arrow-${isPositive ? 'up' : 'down'}"></i>
                ${Math.abs(change).toFixed(1)}% vs período anterior
            `;
            changeElement.className = `card-change ${isPositive ? 'positive' : 'negative'}`;
        }
    }

    renderTopClientsTable() {
        const tbody = document.getElementById('topClientsTableBody');
        if (!tbody || !this.dashboardData?.top_clientes) return;

        const topClientes = this.dashboardData.top_clientes.slice(0, 10);

        tbody.innerHTML = topClientes.map((cliente, index) => `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="ranking-badge">${index + 1}</div>
                        <div class="ms-2">
                            <div class="fw-bold">${cliente.nombre}</div>
                            <small class="text-muted">${cliente.empresa || ''}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="fw-bold text-success">${this.formatCurrency(cliente.ingresos_total || 0)}</span>
                </td>
                <td>
                    <span class="fw-bold ${this.getRoasColor(cliente.roas_promedio || 0)}">
                        ${this.formatNumber(cliente.roas_promedio || 0, 2)}x
                    </span>
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="resultadosModule.viewClienteReport(${cliente.id})">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="resultadosModule.exportClienteReport(${cliente.id})">
                            <i class="bi bi-download"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderRecentActivity() {
        const container = document.getElementById('recentActivityList');
        if (!container) return;

        // Combine different types of activities
        const activities = [];

        // Add optimizations
        if (this.dashboardData?.optimizaciones_pendientes) {
            this.dashboardData.optimizaciones_pendientes.slice(0, 5).forEach(opt => {
                activities.push({
                    type: 'optimization',
                    title: opt.titulo,
                    client: opt.cliente_nombre,
                    date: opt.fecha_analisis,
                    priority: opt.prioridad,
                    icon: 'gear',
                    color: 'warning'
                });
            });
        }

        // Add strategies + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    updateChartsData() {
        if (!this.dashboardData) return;

        this.updateRevenueChart();
        this.updatePerformanceChart();
        this.updateClientDistributionChart();
        this.updateTrendChart();
    }

    updateRevenueChart() {
        if (!this.charts.revenue || !this.dashboardData.tendencias) return;

        const tendencias = this.dashboardData.tendencias;
        const labels = tendencias.map(t => t.mes);
        const ingresos = tendencias.map(t => parseFloat(t.ingresos) || 0);
        const inversion = tendencias.map(t => parseFloat(t.inversion) || 0);

        this.charts.revenue.data.labels = labels;
        this.charts.revenue.data.datasets[0].data = ingresos;
        this.charts.revenue.data.datasets[1].data = inversion;
        this.charts.revenue.update();
    }

    updatePerformanceChart() {
        if (!this.charts.performance || !this.dashboardData.rendimiento_general) return;

        const rendimiento = this.dashboardData.rendimiento_general;
        
        this.charts.performance.data.datasets[0].data = [
            rendimiento.roas_promedio || 0,
            rendimiento.ctr_promedio || 0,
            rendimiento.cpc_promedio || 0,
            rendimiento.cpm_promedio || 0
        ];
        this.charts.performance.update();
    }

    updateClientDistributionChart() {
        if (!this.charts.clientDistribution || !this.dashboardData.top_clientes) return;

        const topClientes = this.dashboardData.top_clientes.slice(0, 8);
        const labels = topClientes.map(c => c.nombre);
        const data = topClientes.map(c => parseFloat(c.ingresos_total) || 0);

        this.charts.clientDistribution.data.labels = labels;
        this.charts.clientDistribution.data.datasets[0].data = data;
        this.charts.clientDistribution.update();
    }

    updateTrendChart() {
        if (!this.charts.trend || !this.dashboardData.tendencias) return;

        const tendencias = this.dashboardData.tendencias;
        const labels = tendencias.map(t => t.mes);
        const roas = tendencias.map(t => parseFloat(t.roas_promedio) || 0);
        const inversion = tendencias.map(t => parseFloat(t.inversion) || 0);

        this.charts.trend.data.labels = labels;
        this.charts.trend.data.datasets[0].data = roas;
        this.charts.trend.data.datasets[1].data = inversion;
        this.charts.trend.update();
    }

    updateClientCharts() {
        if (!this.reporteActual?.tendencias_cliente) return;

        // Update charts with client-specific data
        const tendencias = this.reporteActual.tendencias_cliente;
        
        if (this.charts.revenue) {
            const labels = tendencias.map(t => t.mes);
            const ingresos = tendencias.map(t => parseFloat(t.ingresos) || 0);
            const inversion = tendencias.map(t => parseFloat(t.inversion) || 0);

            this.charts.revenue.data.labels = labels;
            this.charts.revenue.data.datasets[0].data = ingresos;
            this.charts.revenue.data.datasets[1].data = inversion;
            this.charts.revenue.update();
        }
    }

    // ==================== FILTERING & ACTIONS ====================
    
    populateClienteFilter() {
        if (!this.clienteFilter) return;

        this.clienteFilter.innerHTML = '<option value="">Todos los clientes</option>';
        
        this.clientes.forEach(cliente => {
            if (cliente.activo) {
                const option = document.createElement('option');
                option.value = cliente.id;
                option.textContent = `${cliente.nombre} - ${cliente.empresa || 'Sin empresa'}`;
                this.clienteFilter.appendChild(option);
            }
        });
    }

    async filterByCliente(clienteId) {
        this.selectedCliente = clienteId;
        
        if (clienteId) {
            await this.loadClienteReport(clienteId);
        } else {
            // Show general dashboard
            if (this.reportContainer) {
                this.reportContainer.style.display = 'none';
            }
            await this.loadDashboardData();
        }
    }

    async changePeriod(period) {
        this.currentPeriod = period;
        
        if (this.selectedCliente) {
            await this.loadClienteReport(this.selectedCliente);
        } else {
            await this.loadDashboardData();
        }
    }

    async refreshData(showMessage = true) {
        try {
            if (showMessage) {
                this.showLoading('Actualizando datos...');
            }
            
            if (this.selectedCliente) {
                await this.loadClienteReport(this.selectedCliente);
            } else {
                await this.loadDashboardData();
            }
            
            if (showMessage) {
                this.showSuccess('Datos actualizados exitosamente');
            }
        } catch (error) {
            console.error('Error refreshing data:', error);
            if (showMessage) {
                this.showError('Error al actualizar los datos');
            }
        } finally {
            if (showMessage) {
                this.hideLoading();
            }
        }
    }

    // ==================== EXPORT & PRINT ====================
    
    async exportReport(format) {
        try {
            switch (format) {
                case 'pdf':
                    await this.exportToPDF();
                    break;
                case 'excel':
                    await this.exportToExcel();
                    break;
                case 'csv':
                    await this.exportToCSV();
                    break;
                default:
                    this.showError('Formato de exportación no válido');
            }
        } catch (error) {
            console.error('Error exporting report:', error);
            this.showError('Error al exportar el reporte');
        }
    }

    async exportToPDF() {
        // Use browser's print functionality to generate PDF
        const originalTitle = document.title;
        document.title = this.selectedCliente ? 
            `Reporte_${this.reporteActual?.cliente?.nombre}_${new Date().toISOString().split('T')[0]}` :
            `Dashboard_General_${new Date().toISOString().split('T')[0]}`;
        
        window.print();
        
        setTimeout(() => {
            document.title = originalTitle;
        }, 1000);
    }

    async exportToExcel() {
        const data = this.prepareExportData();
        const csvContent = this.generateCSV(data);
        this.downloadFile(csvContent, 'reporte.csv', 'text/csv');
    }

    async exportToCSV() {
        const data = this.prepareExportData();
        const csvContent = this.generateCSV(data);
        this.downloadFile(csvContent, 'reporte.csv', 'text/csv');
    }

    async exportClienteReport(clienteId) {
        try {
            await this.loadClienteReport(clienteId);
            await this.exportToPDF();
        } catch (error) {
            console.error('Error exporting client report:', error);
            this.showError('Error al exportar el reporte del cliente');
        }
    }

    printReport() {
        window.print();
    }

    prepareExportData() {
        if (this.selectedCliente && this.reporteActual) {
            return this.prepareClientExportData();
        } else {
            return this.prepareDashboardExportData();
        }
    }

    prepareClientExportData() {
        const cliente = this.reporteActual.cliente;
        const estadisticas = this.reporteActual.estadisticas;
        
        return [
            ['Tipo', 'Descripción', 'Valor'],
            ['Cliente', 'Nombre', cliente.nombre],
            ['Cliente', 'Empresa', cliente.empresa || ''],
            ['Cliente', 'Email', cliente.email],
            ['Cliente', 'Segmento', cliente.segmento || ''],
            ['Estadística', 'Total Estrategias', estadisticas?.total_estrategias || 0],
            ['Estadística', 'Inversión Total', estadisticas?.inversion_total || 0],
            ['Estadística', 'Ingresos Total', estadisticas?.ingresos_total || 0],
            ['Estadística', 'ROAS Promedio', estadisticas?.roas_promedio || 0]
        ];
    }

    prepareDashboardExportData() {
        const totales = this.dashboardData?.totales || {};
        const rendimiento = this.dashboardData?.rendimiento_general || {};
        
        return [
            ['Métrica', 'Valor'],
            ['Clientes Activos', totales.clientes_activos || 0],
            ['Estrategias Activas', totales.estrategias_activas || 0],
            ['Total Reportes', totales.total_reportes || 0],
            ['Inversión Total', rendimiento.inversion_total || 0],
            ['Ingresos Total', rendimiento.ingresos_total || 0],
            ['ROAS Promedio', rendimiento.roas_promedio || 0],
            ['CTR Promedio', rendimiento.ctr_promedio || 0]
        ];
    }

    generateCSV(data) {
        return data.map(row => 
            row.map(field => `"${field}"`).join(',')
        ).join('\n');
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    // ==================== UTILITY FUNCTIONS ====================
    
    async viewClienteReport(clienteId) {
        // Update filter and load report
        if (this.clienteFilter) {
            this.clienteFilter.value = clienteId;
        }
        await this.filterByCliente(clienteId);
    }

    switchChartType(chartType) {
        // Implementation for switching chart types
        console.log('Switching to chart type:', chartType);
    }

    getStatusBadge(status) {
        const badges = {
            'activa': '<span class="badge bg-success">Activa</span>',
            'pausada': '<span class="badge bg-warning">Pausada</span>',
            'finalizada': '<span class="badge bg-secondary">Finalizada</span>',
            'planificada': '<span class="badge bg-info">Planificada</span>'
        };
        return badges[status] || '<span class="badge bg-secondary">N/A</span>';
    }

    getPriorityBadge(priority) {
        const badges = {
            'critica': '<span class="badge bg-danger">Crítica</span>',
            'alta': '<span class="badge bg-warning">Alta</span>',
            'media': '<span class="badge bg-info">Media</span>',
            'baja': '<span class="badge bg-secondary">Baja</span>'
        };
        return badges[priority] || '<span class="badge bg-secondary">N/A</span>';
    }

    getRoasColor(roas) {
        if (roas >= 4) return 'text-success';
        if (roas >= 2) return 'text-primary';
        if (roas >= 1) return 'text-warning';
        return 'text-danger';
    }

    truncateText(text, length) {
        return text && text.length > length ? text.substring(0, length) + '...' : text;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('es-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
        }).format(amount || 0);
    }

    formatNumber(number, decimals = 0) {
        return new Intl.NumberFormat('es-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(number || 0);
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    updateDashboardStats() {
        // Update last update time
        const lastUpdateElement = document.getElementById('lastUpdate');
        if (lastUpdateElement) {
            lastUpdateElement.textContent = new Date().toLocaleTimeString('es-ES');
        }
    }

    showLoading(message = 'Cargando...') {
        Swal.fire({
            title: message,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
    }

    hideLoading() {
        Swal.close();
    }

    showSuccess(message) {
        Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: message,
            timer: 2000,
            showConfirmButton: false
        });
    }

    showError(message) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message
        });
    }
}

// ==================== INITIALIZATION ====================

// Initialize module when DOM is ready
let resultadosModule;

document.addEventListener('DOMContentLoaded', function() {
    resultadosModule = new ResultadosModule();
});

// Global functions for HTML onclick events
window.resultadosModule = {
    viewClienteReport: (clienteId) => resultadosModule?.viewClienteReport(clienteId),
    exportClienteReport: (clienteId) => resultadosModule?.exportClienteReport(clienteId),
    exportReport: (format) => resultadosModule?.exportReport(format),
    refreshData: () => resultadosModule?.refreshData(),
    printReport: () => resultadosModule?.printReport(),
    switchChartType: (chartType) => resultadosModule?.switchChartType(chartType),
    changePeriod: (period) => resultadosModule?.changePeriod(period)
};// =====================================================
// JS/MODULES/RESULTADOS.JS - Módulo de Gestión de Resultados y Reportes
// =====================================================

class ResultadosModule {
    constructor() {
        this.dashboardData = null;
        this.clientes = [];
        this.reporteActual = null;
        this.charts = {};
        this.currentPeriod = 'month';
        this.selectedCliente = null;
        
        // Referencias DOM
        this.clienteFilter = document.getElementById('clienteFilter');
        this.periodFilter = document.getElementById('periodFilter');
        this.reportContainer = document.getElementById('reportContainer');
        
        this.init();
    }

    // ==================== INICIALIZACIÓN ====================
    
    async init() {
        try {
            await this.loadClientes();
            await this.loadDashboardData();
            this.setupEventListeners();
            this.initializeCharts();
            this.renderDashboard();
            this.setupAutoRefresh();
        } catch (error) {
            console.error('Error inicializando módulo de resultados:', error);
            this.showError('Error al cargar el módulo');
        }
    }

    setupEventListeners() {
        // Filters
        if (this.clienteFilter) {
            this.clienteFilter.addEventListener('change', (e) => {
                this.filterByCliente(e.target.value);
            });
        }

        if (this.periodFilter) {
            this.periodFilter.addEventListener('change', (e) => {
                this.changePeriod(e.target.value);
            });
        }

        // Export buttons
        document.querySelectorAll('[data-export]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.exportReport(e.target.dataset.export);
            });
        });

        // Chart type toggles
        document.querySelectorAll('[data-chart-type]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchChartType(e.target.dataset.chartType);
            });
        });

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }

        // Print button
        const printBtn = document.getElementById('printBtn');
        if (printBtn) {
            printBtn.addEventListener('click', () => this.printReport());
        }
    }

    setupAutoRefresh() {
        // Auto-refresh every 5 minutes
        setInterval(() => {
            this.refreshData(false); // Silent refresh
        }, 300000);
    }

    // ==================== DATA LOADING ====================
    
    async loadClientes() {
        try {
            const response = await api.getClientes();
            if (response.success) {
                this.clientes = response.data;
                this.populateClienteFilter();
            }
        } catch (error) {
            console.error('Error cargando clientes:', error);
        }
    }

    async loadDashboardData() {
        try {
            this.showLoading('Cargando datos del dashboard...');
            
            const response = await api.getDashboard();
            
            if (response.success) {
                this.dashboardData = response.data;
                this.updateDashboardStats();
                this.updateChartsData();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error cargando dashboard:', error);
            this.showError('Error al cargar los datos del dashboard');
        } finally {
            this.hideLoading();
        }
    }

    async loadClienteReport(clienteId) {
        try {
            this.showLoading('Generando reporte del cliente...');
            
            const response = await api.getReporteCliente(clienteId);
            
            if (response.success) {
                this.reporteActual = response.data;
                this.renderClienteReport();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error cargando reporte cliente:', error);
            this.showError('Error al cargar el reporte del cliente');
        } finally {
            this.hideLoading();
        }
    }

    // ==================== DASHBOARD RENDERING ====================
    
    renderDashboard() {
        this.renderOverviewCards();
        this.renderTopClientsTable();
        this.renderRecentActivity();
        this.renderPerformanceMetrics();
    }

    renderOverviewCards() {
        if (!this.dashboardData?.totales) return;

        const totales = this.dashboardData.totales;
        const rendimiento = this.dashboardData.rendimiento_general || {};

        // Update overview cards
        this.updateCard('clientesActivos', totales.clientes_activos || 0, 'clientes');
        this.updateCard('estrategiasActivas', totales.estrategias_activas || 0, 'estrategias');
        this.updateCard('inversionTotal', rendimiento.inversion_total || 0, 'currency');
        this.updateCard('roasPromedio', rendimiento.roas_promedio || 0, 'roas');
        this.updateCard('totalReportes', totales.total_reportes || 0, 'reportes');
        this.updateCard('optimizacionesPendientes', totales.optimizaciones_pendientes || 0, 'optimizaciones');
    }

    updateCard(cardId, value, type) {
        const cardElement = document.getElementById(cardId);
        if (!cardElement) return;

        const valueElement = cardElement.querySelector('.card-value');
        const changeElement = cardElement.querySelector('.card-change');

        if (valueElement) {
            switch (type) {
                case 'currency':
                    valueElement.textContent = this.formatCurrency(value);
                    break;
                case 'roas':
                    valueElement.textContent = this.formatNumber(value, 2) + 'x';
                    break;
                case 'percentage':
                    valueElement.textContent = this.formatNumber(value, 1) + '%';
                    break;
                default:
                    valueElement.textContent = this.formatNumber(value);
            }
        }

        // Simulate change calculation (in real implementation, compare with previous period)
        if (changeElement) {
            const change = Math.random() * 20 - 10; // Random for demo
            const isPositive = change > 0;
            
            changeElement.innerHTML = `
                <i class="bi bi-arrow-${isPositive ? 'up' : 'down'}"></i>
                ${Math.abs(change).toFixed(1)}% vs período anterior
            `;
            changeElement.className = `card-change ${isPositive ? 'positive' : 'negative'}`;
        }
    }

    renderTopClientsTable() {
        const tbody = document.getElementById('topClientsTableBody');
        if (!tbody || !this.dashboardData?.top_clientes) return;

        const topClientes = this.dashboardData.top_clientes.slice(0, 10);

        tbody.innerHTML = topClientes.map((cliente, index) => `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="ranking-badge">${index + 1}</div>
                        <div class="ms-2">
                            <div class="fw-bold">${cliente.nombre}</div>
                            <small class="text-muted">${cliente.empresa || ''}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="fw-bold text-success">${this.formatCurrency(cliente.ingresos_total || 0)}</span>
                </td>
                <td>
                    <span class="fw-bold ${this.getRoasColor(cliente.roas_promedio || 0)}">
                        ${this.formatNumber(cliente.roas_promedio || 0, 2)}x
                    </span>
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="resultadosModule.viewClienteReport(${cliente.id})">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="resultadosModule.exportClienteReport(${cliente.id})">
                            <i class="bi bi-download"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderRecentActivity() {
        const container = document.getElementById('recentActivityList');
        if (!container) return;

        // Combine different types of activities
        const activities = [];

        // Add optimizations
        if (this.dashboardData?.optimizaciones_pendientes) {
            this.dashboardData.optimizaciones_pendientes.slice(0, 5).forEach(opt => {
                activities.push({
                    type: 'optimization',
                    title: opt.titulo,
                    client: opt.cliente_nombre,
                    date: opt.fecha_analisis,
                    priority: opt.prioridad,
                    icon: 'gear',
                    color: 'warning'
                });
            });
        }

        // Add strategies