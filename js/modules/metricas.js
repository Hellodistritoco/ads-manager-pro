// =====================================================
// JS/MODULES/METRICAS.JS - Módulo de Gestión de Métricas
// =====================================================

class MetricasModule {
    constructor() {
        this.metricas = [];
        this.clientes = [];
        this.estrategias = [];
        this.currentMetrica = null;
        this.charts = {};
        
        // Referencias DOM
        this.table = null;
        this.uploadForm = document.getElementById('uploadForm');
        this.fileInput = document.getElementById('csvFile');
        this.searchInput = document.getElementById('searchInput');
        
        this.init();
    }

    // ==================== INICIALIZACIÓN ====================
    
    async init() {
        try {
            await this.loadClientes();
            await this.loadEstrategias();
            await this.loadMetricas();
            this.setupEventListeners();
            this.initializeTable();
            this.initializeCharts();
            this.updateStats();
        } catch (error) {
            console.error('Error inicializando módulo de métricas:', error);
            this.showError('Error al cargar el módulo');
        }
    }

    setupEventListeners() {
        // File upload
        if (this.uploadForm) {
            this.uploadForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.uploadCSV();
            });
        }

        // File input change
        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => {
                this.validateFile(e.target.files[0]);
            });
        }

        // Search functionality
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.filterMetricas(e.target.value);
            });
        }

        // Filter buttons
        document.querySelectorAll('[data-filter-period]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterByPeriod(e.target.dataset.filterPeriod);
            });
        });

        // Client filter
        const clienteFilter = document.getElementById('clienteFilter');
        if (clienteFilter) {
            clienteFilter.addEventListener('change', (e) => {
                this.filterByCliente(e.target.value);
            });
        }

        // Drag and drop
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        const dropZone = document.getElementById('dropZone');
        if (!dropZone) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('highlight'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('highlight'), false);
        });

        dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFile(files[0]);
            }
        }, false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
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

    async loadEstrategias() {
        try {
            const response = await api.getEstrategias();
            if (response.success) {
                this.estrategias = response.data;
            }
        } catch (error) {
            console.error('Error cargando estrategias:', error);
        }
    }

    async loadMetricas() {
        try {
            this.showTableLoading(true);
            
            const clienteId = this.getClienteIdFromURL();
            const response = await api.getMetricas(clienteId);
            
            if (response.success) {
                this.metricas = response.data;
                this.renderTable();
                this.updateStats();
                this.updateCharts();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error cargando métricas:', error);
            this.showError('Error al cargar métricas');
            this.renderEmptyState();
        } finally {
            this.showTableLoading(false);
        }
    }

    // ==================== FILE UPLOAD ====================
    
    handleFile(file) {
        if (this.validateFile(file)) {
            this.fileInput.files = this.createFileList(file);
            this.showFilePreview(file);
        }
    }

    validateFile(file) {
        if (!file) return false;

        const allowedTypes = ['text/csv', 'application/vnd.ms-excel'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv')) {
            this.showError('Solo se permiten archivos CSV');
            return false;
        }

        if (file.size > maxSize) {
            this.showError('El archivo no puede ser mayor a 10MB');
            return false;
        }

        return true;
    }

    showFilePreview(file) {
        const preview = document.getElementById('filePreview');
        if (!preview) return;

        preview.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-file-earmark-text"></i>
                <strong>${file.name}</strong> (${this.formatFileSize(file.size)})
                <button type="button" class="btn-close float-end" onclick="metricasModule.clearFile()"></button>
            </div>
        `;
        preview.classList.remove('d-none');
    }

    clearFile() {
        this.fileInput.value = '';
        const preview = document.getElementById('filePreview');
        if (preview) {
            preview.classList.add('d-none');
            preview.innerHTML = '';
        }
    }

    async uploadCSV() {
        try {
            const file = this.fileInput.files[0];
            if (!file) {
                this.showError('Por favor selecciona un archivo');
                return;
            }

            const clienteId = document.getElementById('clienteIdUpload')?.value;
            const estrategiaId = document.getElementById('estrategiaIdUpload')?.value;
            const periodo = document.getElementById('periodoUpload')?.value;
            const fechaInicio = document.getElementById('fechaInicioUpload')?.value;
            const fechaFin = document.getElementById('fechaFinUpload')?.value;

            if (!clienteId || !periodo || !fechaInicio || !fechaFin) {
                this.showError('Por favor completa todos los campos requeridos');
                return;
            }

            this.showUploadLoading(true);

            const formData = new FormData();
            formData.append('csv_file', file);
            formData.append('cliente_id', clienteId);
            formData.append('estrategia_id', estrategiaId || '');
            formData.append('periodo', periodo);
            formData.append('fecha_inicio', fechaInicio);
            formData.append('fecha_fin', fechaFin);

            const result = await api.uploadMetricasCSV(formData);

            if (result.success) {
                this.showSuccess('Archivo procesado exitosamente');
                this.clearUploadForm();
                await this.loadMetricas();
                
                // Close modal if exists
                const modal = bootstrap.Modal.getInstance(document.getElementById('uploadModal'));
                if (modal) modal.hide();
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            console.error('Error uploading CSV:', error);
            this.showError(error.message || 'Error al procesar el archivo');
        } finally {
            this.showUploadLoading(false);
        }
    }

    clearUploadForm() {
        if (this.uploadForm) {
            this.uploadForm.reset();
            this.clearFile();
        }
    }

    // ==================== TABLE MANAGEMENT ====================
    
    initializeTable() {
        if ($.fn.DataTable.isDataTable('#metricasTable')) {
            $('#metricasTable').DataTable().destroy();
        }

        this.table = $('#metricasTable').DataTable({
            pageLength: 10,
            responsive: true,
            language: {
                url: '//cdn.datatables.net/plug-ins/1.10.21/i18n/Spanish.json'
            },
            columnDefs: [
                { orderable: false, targets: [-1] }
            ],
            order: [[5, 'desc']] // Order by upload date
        });
    }

    renderTable() {
        const tbody = document.getElementById('metricasTableBody');
        
        if (!tbody) return;
        
        if (this.metricas.length === 0) {
            this.renderEmptyState();
            return;
        }

        tbody.innerHTML = this.metricas.map(metrica => `
            <tr>
                <td>
                    <div class="metrica-info">
                        <div class="metrica-icon">
                            <i class="bi bi-file-earmark-text"></i>
                        </div>
                        <div class="metrica-details">
                            <h6 class="mb-1">${metrica.nombre_archivo || 'Archivo CSV'}</h6>
                            <small class="text-muted">${metrica.periodo} - ${this.formatFileSize(metrica.tamano_archivo)}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="client-info">
                        <strong>${metrica.cliente_nombre || 'N/A'}</strong>
                    </div>
                </td>
                <td>
                    <span class="fw-bold text-primary">${this.formatCurrency(metrica.inversion_total || 0)}</span>
                </td>
                <td>
                    <span class="fw-bold text-success">${this.formatCurrency(metrica.ingresos_total || 0)}</span>
                </td>
                <td>
                    <span class="fw-bold ${this.getRoasColor(metrica.roas || 0)}">${this.formatNumber(metrica.roas || 0, 2)}x</span>
                </td>
                <td>${this.formatDate(metrica.fecha_subida)}</td>
                <td>${this.getStatusBadge(metrica.estado_procesamiento)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline-info" onclick="metricasModule.viewMetrica(${metrica.id})" title="Ver detalles">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-primary" onclick="metricasModule.viewCharts(${metrica.id})" title="Ver gráficos">
                            <i class="bi bi-bar-chart"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning" onclick="metricasModule.recalculate(${metrica.id})" title="Recalcular">
                            <i class="bi bi-arrow-clockwise"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="metricasModule.downloadReport(${metrica.id})" title="Descargar reporte">
                            <i class="bi bi-download"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        if (this.table) {
            this.table.clear().rows.add($(tbody).find('tr')).draw();
        }
    }

    renderEmptyState() {
        const tbody = document.getElementById('metricasTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        <i class="bi bi-file-earmark-plus"></i>
                        <h5>No hay métricas cargadas</h5>
                        <p>Sube tu primer archivo CSV para analizar el rendimiento de tus campañas</p>
                        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#uploadModal">
                            <i class="bi bi-upload"></i> Subir Primer Archivo
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    // ==================== CRUD OPERATIONS ====================
    
    async viewMetrica(id) {
        try {
            const result = await api.getMetrica(id);
            
            if (result.success) {
                const metrica = result.data;
                this.showMetricaDetails(metrica);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error viewing metrica:', error);
            this.showError('Error al cargar los detalles');
        }
    }

    async viewCharts(id) {
        try {
            const result = await api.getMetrica(id);
            
            if (result.success) {
                const metrica = result.data;
                this.showChartsModal(metrica);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error viewing charts:', error);
            this.showError('Error al cargar los gráficos');
        }
    }

    async recalculate(id) {
        try {
            const result = await Swal.fire({
                title: '¿Recalcular métricas?',
                text: 'Esto volverá a procesar los datos del archivo CSV',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Sí, recalcular',
                cancelButtonText: 'Cancelar'
            });

            if (result.isConfirmed) {
                this.showLoading('Recalculando métricas...');
                
                const recalcResult = await api.recalcularMetricas(id);
                
                if (recalcResult.success) {
                    this.showSuccess('Métricas recalculadas exitosamente');
                    await this.loadMetricas();
                } else {
                    throw new Error(recalcResult.message);
                }
            }
        } catch (error) {
            console.error('Error recalculating:', error);
            this.showError('Error al recalcular métricas');
        } finally {
            this.hideLoading();
        }
    }

    async downloadReport(id) {
        try {
            const metrica = this.metricas.find(m => m.id === id);
            if (!metrica) return;

            const reportData = this.generateReportData(metrica);
            this.downloadCSV(reportData, `reporte_metricas_${metrica.periodo}.csv`);
            this.showSuccess('Reporte descargado exitosamente');
        } catch (error) {
            console.error('Error downloading report:', error);
            this.showError('Error al descargar el reporte');
        }
    }

    // ==================== CHARTS ====================
    
    initializeCharts() {
        this.initPerformanceChart();
        this.initTrendChart();
        this.initMetricsComparisonChart();
    }

    initPerformanceChart() {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) return;

        this.charts.performance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'ROAS',
                    data: [],
                    backgroundColor: 'rgba(37, 99, 235, 0.8)',
                    borderColor: 'rgba(37, 99, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'ROAS'
                        }
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
                    label: 'Inversión',
                    data: [],
                    borderColor: 'rgba(220, 38, 38, 1)',
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Ingresos',
                    data: [],
                    borderColor: 'rgba(5, 150, 105, 1)',
                    backgroundColor: 'rgba(5, 150, 105, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    initMetricsComparisonChart() {
        const ctx = document.getElementById('metricsComparisonChart');
        if (!ctx) return;

        this.charts.comparison = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['ROAS', 'CTR', 'CPC', 'CPM', 'Conversiones'],
                datasets: [{
                    label: 'Rendimiento Actual',
                    data: [],
                    backgroundColor: 'rgba(37, 99, 235, 0.2)',
                    borderColor: 'rgba(37, 99, 235, 1)',
                    pointBackgroundColor: 'rgba(37, 99, 235, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(37, 99, 235, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                elements: {
                    line: {
                        borderWidth: 3
                    }
                }
            }
        });
    }

    updateCharts() {
        this.updatePerformanceChart();
        this.updateTrendChart();
        this.updateMetricsComparisonChart();
    }

    updatePerformanceChart() {
        if (!this.charts.performance) return;

        const data = this.metricas.slice(0, 10).map(m => ({
            label: m.periodo,
            roas: m.roas || 0
        }));

        this.charts.performance.data.labels = data.map(d => d.label);
        this.charts.performance.data.datasets[0].data = data.map(d => d.roas);
        this.charts.performance.update();
    }

    updateTrendChart() {
        if (!this.charts.trend) return;

        const sortedData = [...this.metricas]
            .sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio))
            .slice(-12);

        this.charts.trend.data.labels = sortedData.map(m => this.formatDate(m.fecha_inicio));
        this.charts.trend.data.datasets[0].data = sortedData.map(m => m.inversion_total || 0);
        this.charts.trend.data.datasets[1].data = sortedData.map(m => m.ingresos_total || 0);
        this.charts.trend.update();
    }

    updateMetricsComparisonChart() {
        if (!this.charts.comparison) return;

        if (this.metricas.length > 0) {
            const avgMetrics = this.calculateAverageMetrics();
            
            this.charts.comparison.data.datasets[0].data = [
                avgMetrics.roas,
                avgMetrics.ctr,
                avgMetrics.cpc,
                avgMetrics.cpm,
                avgMetrics.conversiones
            ];
            this.charts.comparison.update();
        }
    }

    // ==================== UI HELPERS ====================
    
    populateClienteFilter() {
        const select = document.getElementById('clienteFilter');
        if (!select) return;

        select.innerHTML = '<option value="">Todos los clientes</option>';
        
        this.clientes.forEach(cliente => {
            if (cliente.activo) {
                const option = document.createElement('option');
                option.value = cliente.id;
                option.textContent = `${cliente.nombre} - ${cliente.empresa || 'Sin empresa'}`;
                select.appendChild(option);
            }
        });
    }

    showMetricaDetails(metrica) {
        const metricas = metrica.metricas_calculadas ? JSON.parse(metrica.metricas_calculadas) : {};
        
        Swal.fire({
            title: `Métricas - ${metrica.periodo}`,
            html: `
                <div class="text-start">
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Información General</h6>
                            <p><strong>Cliente:</strong> ${metrica.cliente_nombre}</p>
                            <p><strong>Archivo:</strong> ${metrica.nombre_archivo}</p>
                            <p><strong>Período:</strong> ${metrica.periodo}</p>
                            <p><strong>Fechas:</strong> ${this.formatDate(metrica.fecha_inicio)} - ${this.formatDate(metrica.fecha_fin)}</p>
                        </div>
                        <div class="col-md-6">
                            <h6>Totales</h6>
                            <p><strong>Impresiones:</strong> ${this.formatNumber(metrica.total_impresiones || 0)}</p>
                            <p><strong>Clicks:</strong> ${this.formatNumber(metrica.total_clicks || 0)}</p>
                            <p><strong>Conversiones:</strong> ${this.formatNumber(metrica.total_conversiones || 0)}</p>
                        </div>
                    </div>
                    <hr>
                    <div class="row">
                        <div class="col-md-3">
                            <div class="text-center">
                                <h5 class="text-primary">${this.formatCurrency(metrica.inversion_total || 0)}</h5>
                                <small>Inversión Total</small>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="text-center">
                                <h5 class="text-success">${this.formatCurrency(metrica.ingresos_total || 0)}</h5>
                                <small>Ingresos Total</small>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="text-center">
                                <h5 class="text-warning">${this.formatNumber(metrica.roas || 0, 2)}x</h5>
                                <small>ROAS</small>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="text-center">
                                <h5 class="text-info">${this.formatNumber(metrica.ctr || 0, 2)}%</h5>
                                <small>CTR</small>
                            </div>
                        </div>
                    </div>
                    <hr>
                    <h6>Métricas Adicionales</h6>
                    <p><strong>CPC:</strong> ${this.formatCurrency(metrica.cpc || 0)}</p>
                    <p><strong>CPM:</strong> ${this.formatCurrency(metrica.cpm || 0)}</p>
                    <p><strong>Tasa de Conversión:</strong> ${this.formatNumber(metricas.conversion_rate || 0, 2)}%</p>
                </div>
            `,
            width: 800,
            showConfirmButton: false,
            showCloseButton: true,
            footer: `
                <button class="btn btn-primary me-2" onclick="metricasModule.viewCharts(${metrica.id}); Swal.close();">
                    <i class="bi bi-bar-chart"></i> Ver Gráficos
                </button>
                <button class="btn btn-outline-primary" onclick="metricasModule.downloadReport(${metrica.id}); Swal.close();">
                    <i class="bi bi-download"></i> Descargar Reporte
                </button>
            `
        });
    }

    showChartsModal(metrica) {
        const datos = metrica.datos_procesados ? JSON.parse(metrica.datos_procesados) : [];
        
        Swal.fire({
            title: `Análisis Gráfico - ${metrica.periodo}`,
            html: `
                <div class="text-start">
                    <div style="height: 300px; margin-bottom: 20px;">
                        <canvas id="modalChart"></canvas>
                    </div>
                    <div class="row">
                        <div class="col-md-4">
                            <div class="text-center">
                                <h6 class="text-primary">${this.formatNumber(metrica.total_impresiones || 0)}</h6>
                                <small>Impresiones</small>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="text-center">
                                <h6 class="text-success">${this.formatNumber(metrica.total_clicks || 0)}</h6>
                                <small>Clicks</small>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="text-center">
                                <h6 class="text-warning">${this.formatNumber(metrica.total_conversiones || 0)}</h6>
                                <small>Conversiones</small>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            width: 900,
            showConfirmButton: false,
            showCloseButton: true,
            didOpen: () => {
                this.createModalChart(datos);
            }
        });
    }

    createModalChart(datos) {
        const ctx = document.getElementById('modalChart');
        if (!ctx || !datos.length) return;

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: datos.slice(0, 30).map((_, i) => `Día ${i + 1}`),
                datasets: [{
                    label: 'Impresiones',
                    data: datos.slice(0, 30).map(d => d.impresiones || 0),
                    borderColor: 'rgba(37, 99, 235, 1)',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    yAxisID: 'y'
                }, {
                    label: 'Clicks',
                    data: datos.slice(0, 30).map(d => d.clicks || 0),
                    borderColor: 'rgba(5, 150, 105, 1)',
                    backgroundColor: 'rgba(5, 150, 105, 0.1)',
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
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });
    }

    // ==================== FILTERING & SEARCH ====================
    
    filterMetricas(searchTerm) {
        if (!this.table) return;
        
        this.table.search(searchTerm).draw();
    }

    filterByPeriod(period) {
        if (!this.table) return;
        
        if (period === 'all') {
            this.table.column(0).search('').draw();
        } else {
            this.table.column(0).search(period).draw();
        }
    }

    filterByCliente(clienteId) {
        if (!this.table) return;
        
        if (!clienteId) {
            this.table.column(1).search('').draw();
        } else {
            const cliente = this.clientes.find(c => c.id == clienteId);
            if (cliente) {
                this.table.column(1).search(cliente.nombre).draw();
            }
        }
    }

    // ==================== UTILITY FUNCTIONS ====================
    
    updateStats() {
        const total = this.metricas.length;
        const inversionTotal = this.metricas.reduce((sum, m) => sum + (parseFloat(m.inversion_total) || 0), 0);
        const ingresosTotal = this.metricas.reduce((sum, m) => sum + (parseFloat(m.ingresos_total) || 0), 0);
        const roasPromedio = total > 0 ? 
            this.metricas.reduce((sum, m) => sum + (parseFloat(m.roas) || 0), 0) / total : 0;
        
        document.getElementById('totalReportesCount').textContent = total;
        document.getElementById('inversionTotalCount').textContent = this.formatCurrency(inversionTotal);
        document.getElementById('ingresosTotalCount').textContent = this.formatCurrency(ingresosTotal);
        document.getElementById('roasPromedioCount').textContent = this.formatNumber(roasPromedio, 2) + 'x';
    }

    calculateAverageMetrics() {
        if (this.metricas.length === 0) {
            return { roas: 0, ctr: 0, cpc: 0, cpm: 0, conversiones: 0 };
        }

        const totals = this.metricas.reduce((acc, m) => {
            acc.roas += parseFloat(m.roas) || 0;
            acc.ctr += parseFloat(m.ctr) || 0;
            acc.cpc += parseFloat(m.cpc) || 0;
            acc.cpm += parseFloat(m.cpm) || 0;
            acc.conversiones += parseFloat(m.total_conversiones) || 0;
            return acc;
        }, { roas: 0, ctr: 0, cpc: 0, cpm: 0, conversiones: 0 });

        const count = this.metricas.length;
        return {
            roas: totals.roas / count,
            ctr: totals.ctr / count,
            cpc: totals.cpc / count,
            cpm: totals.cpm / count,
            conversiones: totals.conversiones / count
        };
    }

    generateReportData(metrica) {
        const headers = [
            'Métrica', 'Valor', 'Fecha Inicio', 'Fecha Fin', 'Cliente'
        ];
        
        const rows = [
            ['Inversión Total', this.formatCurrency(metrica.inversion_total), metrica.fecha_inicio, metrica.fecha_fin, metrica.cliente_nombre],
            ['Ingresos Total', this.formatCurrency(metrica.ingresos_total), metrica.fecha_inicio, metrica.fecha_fin, metrica.cliente_nombre],
            ['ROAS', this.formatNumber(metrica.roas, 2), metrica.fecha_inicio, metrica.fecha_fin, metrica.cliente_nombre],
            ['CTR', this.formatNumber(metrica.ctr, 2) + '%', metrica.fecha_inicio, metrica.fecha_fin, metrica.cliente_nombre],
            ['CPC', this.formatCurrency(metrica.cpc), metrica.fecha_inicio, metrica.fecha_fin, metrica.cliente_nombre],
            ['CPM', this.formatCurrency(metrica.cpm), metrica.fecha_inicio, metrica.fecha_fin, metrica.cliente_nombre],
            ['Total Impresiones', this.formatNumber(metrica.total_impresiones), metrica.fecha_inicio, metrica.fecha_fin, metrica.cliente_nombre],
            ['Total Clicks', this.formatNumber(metrica.total_clicks), metrica.fecha_inicio, metrica.fecha_fin, metrica.cliente_nombre],
            ['Total Conversiones', this.formatNumber(metrica.total_conversiones), metrica.fecha_inicio, metrica.fecha_fin, metrica.cliente_nombre]
        ];
        
        return [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
    }

    downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    createFileList(file) {
        const dt = new DataTransfer();
        dt.items.add(file);
        return dt.files;
    }

    getClienteIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('cliente');
    }

    getStatusBadge(status) {
        const badges = {
            'procesando': '<span class="badge bg-warning">Procesando</span>',
            'completado': '<span class="badge bg-success">Completado</span>',
            'error': '<span class="badge bg-danger">Error</span>',
            'pendiente': '<span class="badge bg-secondary">Pendiente</span>'
        };
        return badges[status] || '<span class="badge bg-secondary">N/A</span>';
    }

    getRoasColor(roas) {
        if (roas >= 4) return 'text-success';
        if (roas >= 2) return 'text-primary';
        if (roas >= 1) return 'text-warning';
        return 'text-danger';
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

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showTableLoading(show) {
        const loading = document.getElementById('tableLoading');
        if (loading) {
            loading.classList.toggle('d-none', !show);
        }
    }

    showUploadLoading(show) {
        const uploadBtn = this.uploadForm?.querySelector('button[type="submit"]');
        if (uploadBtn) {
            if (show) {
                uploadBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Procesando...';
                uploadBtn.disabled = true;
            } else {
                uploadBtn.innerHTML = '<i class="bi bi-upload"></i> Subir Archivo';
                uploadBtn.disabled = false;
            }
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
let metricasModule;

document.addEventListener('DOMContentLoaded', function() {
    metricasModule = new MetricasModule();
});

// Global functions for HTML onclick events
window.metricasModule = {
    uploadCSV: () => metricasModule?.uploadCSV(),
    viewMetrica: (id) => metricasModule?.viewMetrica(id),
    viewCharts: (id) => metricasModule?.viewCharts(id),
    recalculate: (id) => metricasModule?.recalculate(id),
    downloadReport: (id) => metricasModule?.downloadReport(id),
    clearFile: () => metricasModule?.clearFile(),
    refreshMetricas: () => metricasModule?.loadMetricas()
};