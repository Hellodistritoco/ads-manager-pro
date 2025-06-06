// =====================================================
// JS/MODULES/ESTRATEGIA.JS - Módulo de Gestión de Estrategias
// =====================================================

class EstrategiaModule {
    constructor() {
        this.estrategias = [];
        this.clientes = [];
        this.currentEstrategia = null;
        this.editingEstrategiaId = null;
        
        // Referencias DOM
        this.table = null;
        this.form = document.getElementById('estrategiaForm');
        this.modal = document.getElementById('estrategiaModal');
        this.searchInput = document.getElementById('searchInput');
        
        this.init();
    }

    // ==================== INICIALIZACIÓN ====================
    
    async init() {
        try {
            await this.loadClientes();
            await this.loadEstrategias();
            this.setupEventListeners();
            this.initializeTable();
            this.updateStats();
        } catch (error) {
            console.error('Error inicializando módulo de estrategias:', error);
            this.showError('Error al cargar el módulo');
        }
    }

    setupEventListeners() {
        // Form submission
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveEstrategia();
            });
        }

        // Search functionality
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.filterEstrategias(e.target.value);
            });
        }

        // Modal events
        if (this.modal) {
            this.modal.addEventListener('hidden.bs.modal', () => {
                this.resetForm();
            });
        }

        // Filter buttons
        document.querySelectorAll('[data-filter-status]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterByStatus(e.target.dataset.filterStatus);
            });
        });

        // Export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportEstrategias());
        }
    }

    // ==================== DATA LOADING ====================
    
    async loadClientes() {
        try {
            const response = await api.getClientes();
            if (response.success) {
                this.clientes = response.data;
                this.populateClienteSelect();
            }
        } catch (error) {
            console.error('Error cargando clientes:', error);
        }
    }

    async loadEstrategias() {
        try {
            this.showTableLoading(true);
            
            const clienteId = this.getClienteIdFromURL();
            const response = await api.getEstrategias(clienteId);
            
            if (response.success) {
                this.estrategias = response.data;
                this.renderTable();
                this.updateStats();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error cargando estrategias:', error);
            this.showError('Error al cargar estrategias');
            this.renderEmptyState();
        } finally {
            this.showTableLoading(false);
        }
    }

    // ==================== TABLE MANAGEMENT ====================
    
    initializeTable() {
        if ($.fn.DataTable.isDataTable('#estrategiasTable')) {
            $('#estrategiasTable').DataTable().destroy();
        }

        this.table = $('#estrategiasTable').DataTable({
            pageLength: 10,
            responsive: true,
            language: {
                url: '//cdn.datatables.net/plug-ins/1.10.21/i18n/Spanish.json'
            },
            columnDefs: [
                { orderable: false, targets: [-1] } // Disable sorting for actions column
            ],
            order: [[5, 'desc']] // Order by creation date
        });
    }

    renderTable() {
        const tbody = document.getElementById('estrategiasTableBody');
        
        if (!tbody) return;
        
        if (this.estrategias.length === 0) {
            this.renderEmptyState();
            return;
        }

        tbody.innerHTML = this.estrategias.map(estrategia => `
            <tr>
                <td>
                    <div class="estrategia-info">
                        <div class="estrategia-icon">
                            <i class="bi bi-lightbulb"></i>
                        </div>
                        <div class="estrategia-details">
                            <h6 class="mb-1">${estrategia.nombre_estrategia}</h6>
                            <small class="text-muted">${this.truncateText(estrategia.descripcion || '', 50)}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="client-info">
                        <strong>${estrategia.cliente_nombre || 'N/A'}</strong>
                        <br>
                        <small class="text-muted">${estrategia.cliente_empresa || ''}</small>
                    </div>
                </td>
                <td>${this.formatCurrency(estrategia.presupuesto || 0)}</td>
                <td>
                    <div class="platform-tags">
                        ${this.renderPlatformTags(estrategia.plataformas)}
                    </div>
                </td>
                <td>${this.getStatusBadge(estrategia.estado)}</td>
                <td>${this.formatDate(estrategia.fecha_creacion)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline-info" onclick="estrategiaModule.viewEstrategia(${estrategia.id})" title="Ver detalles">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-primary" onclick="estrategiaModule.editEstrategia(${estrategia.id})" title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning" onclick="estrategiaModule.changeStatus(${estrategia.id})" title="Cambiar estado">
                            <i class="bi bi-arrow-repeat"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="estrategiaModule.viewPerformance(${estrategia.id})" title="Ver rendimiento">
                            <i class="bi bi-graph-up"></i>
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
        const tbody = document.getElementById('estrategiasTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <i class="bi bi-lightbulb"></i>
                        <h5>No hay estrategias registradas</h5>
                        <p>Comienza creando tu primera estrategia publicitaria para gestionar campañas</p>
                        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#estrategiaModal">
                            <i class="bi bi-plus-circle"></i> Crear Primera Estrategia
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    // ==================== CRUD OPERATIONS ====================
    
    async saveEstrategia() {
        try {
            // Validate form
            const validation = this.validateForm();
            if (!validation.isValid) {
                this.showError('Por favor, completa todos los campos requeridos');
                return;
            }

            // Prepare data
            const formData = new FormData(this.form);
            const estrategiaData = this.prepareEstrategiaData(formData);

            // Show loading
            this.showSaveLoading(true);

            // API call
            let result;
            if (this.editingEstrategiaId) {
                result = await api.updateEstrategia(this.editingEstrategiaId, estrategiaData);
            } else {
                result = await api.createEstrategia(estrategiaData);
            }

            if (result.success) {
                this.showSuccess(this.editingEstrategiaId ? 'Estrategia actualizada' : 'Estrategia creada');
                bootstrap.Modal.getInstance(this.modal).hide();
                await this.loadEstrategias();
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            console.error('Error guardando estrategia:', error);
            this.showError(error.message || 'Error al guardar la estrategia');
        } finally {
            this.showSaveLoading(false);
        }
    }

    async viewEstrategia(id) {
        try {
            const result = await api.getEstrategia(id);
            
            if (result.success) {
                const estrategia = result.data;
                this.showEstrategiaDetails(estrategia);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error viewing estrategia:', error);
            this.showError('Error al cargar los detalles');
        }
    }

    async editEstrategia(id) {
        try {
            const result = await api.getEstrategia(id);
            
            if (result.success) {
                const estrategia = result.data;
                this.populateForm(estrategia);
                this.editingEstrategiaId = id;
                
                document.getElementById('estrategiaModalTitle').textContent = 'Editar Estrategia';
                new bootstrap.Modal(this.modal).show();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error editing estrategia:', error);
            this.showError('Error al cargar la estrategia');
        }
    }

    async changeStatus(id) {
        try {
            const estrategia = this.estrategias.find(e => e.id === id);
            if (!estrategia) return;

            const statusOptions = [
                { value: 'planificada', label: 'Planificada' },
                { value: 'activa', label: 'Activa' },
                { value: 'pausada', label: 'Pausada' },
                { value: 'finalizada', label: 'Finalizada' }
            ];

            const { value: newStatus } = await Swal.fire({
                title: 'Cambiar Estado',
                text: `Estado actual: ${this.getStatusLabel(estrategia.estado)}`,
                input: 'select',
                inputOptions: statusOptions.reduce((obj, opt) => {
                    obj[opt.value] = opt.label;
                    return obj;
                }, {}),
                inputValue: estrategia.estado,
                showCancelButton: true,
                confirmButtonText: 'Cambiar Estado',
                cancelButtonText: 'Cancelar'
            });

            if (newStatus) {
                const result = await api.cambiarEstadoEstrategia(id, newStatus);
                
                if (result.success) {
                    this.showSuccess('Estado actualizado exitosamente');
                    await this.loadEstrategias();
                } else {
                    throw new Error(result.message);
                }
            }
        } catch (error) {
            console.error('Error changing status:', error);
            this.showError('Error al cambiar el estado');
        }
    }

    async viewPerformance(id) {
        try {
            const result = await api.getEstrategia(id);
            
            if (result.success) {
                const estrategia = result.data;
                this.showPerformanceModal(estrategia);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error viewing performance:', error);
            this.showError('Error al cargar el rendimiento');
        }
    }

    // ==================== FORM MANAGEMENT ====================
    
    validateForm() {
        const requiredFields = ['cliente_id', 'nombre_estrategia', 'objetivos', 'presupuesto', 'fecha_inicio'];
        let isValid = true;
        const errors = [];

        requiredFields.forEach(field => {
            const input = this.form.querySelector(`[name="${field}"]`);
            if (!input || !input.value.trim()) {
                isValid = false;
                errors.push(`${field} es requerido`);
                if (input) input.classList.add('is-invalid');
            } else {
                if (input) input.classList.remove('is-invalid');
            }
        });

        // Validate budget
        const presupuesto = this.form.querySelector('[name="presupuesto"]');
        if (presupuesto && parseFloat(presupuesto.value) <= 0) {
            isValid = false;
            errors.push('El presupuesto debe ser mayor a 0');
            presupuesto.classList.add('is-invalid');
        }

        // Validate date range
        const fechaInicio = this.form.querySelector('[name="fecha_inicio"]');
        const fechaFin = this.form.querySelector('[name="fecha_fin"]');
        
        if (fechaInicio && fechaFin && fechaInicio.value && fechaFin.value) {
            if (new Date(fechaInicio.value) >= new Date(fechaFin.value)) {
                isValid = false;
                errors.push('La fecha de fin debe ser posterior a la fecha de inicio');
                fechaFin.classList.add('is-invalid');
            }
        }

        return { isValid, errors };
    }

    prepareEstrategiaData(formData) {
        const data = {};
        
        // Basic fields
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }

        // Handle arrays (KPIs and platforms)
        const kpis = [];
        const platforms = [];
        
        // Get selected KPIs
        document.querySelectorAll('input[name="kpis[]"]:checked').forEach(input => {
            kpis.push(input.value);
        });
        
        // Get selected platforms
        document.querySelectorAll('input[name="plataformas[]"]:checked').forEach(input => {
            platforms.push(input.value);
        });

        data.kpis_principales = kpis;
        data.plataformas = platforms;

        // Convert numeric fields
        if (data.presupuesto) {
            data.presupuesto = parseFloat(data.presupuesto);
        }

        return data;
    }

    populateForm(estrategia) {
        // Clear form first
        this.resetForm();

        // Populate basic fields
        Object.keys(estrategia).forEach(key => {
            const input = this.form.querySelector(`[name="${key}"]`);
            if (input && estrategia[key] !== null) {
                input.value = estrategia[key];
            }
        });

        // Handle JSON fields
        if (estrategia.kpis_principales) {
            const kpis = typeof estrategia.kpis_principales === 'string' 
                ? JSON.parse(estrategia.kpis_principales) 
                : estrategia.kpis_principales;
            
            kpis.forEach(kpi => {
                const checkbox = this.form.querySelector(`input[name="kpis[]"][value="${kpi}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }

        if (estrategia.plataformas) {
            const platforms = typeof estrategia.plataformas === 'string' 
                ? JSON.parse(estrategia.plataformas) 
                : estrategia.plataformas;
            
            platforms.forEach(platform => {
                const checkbox = this.form.querySelector(`input[name="plataformas[]"][value="${platform}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
    }

    resetForm() {
        if (this.form) {
            this.form.reset();
            this.editingEstrategiaId = null;
            
            // Clear validation errors
            this.form.querySelectorAll('.is-invalid').forEach(field => {
                field.classList.remove('is-invalid');
            });
        }
        
        document.getElementById('estrategiaModalTitle').textContent = 'Nueva Estrategia';
    }

    // ==================== UI HELPERS ====================
    
    populateClienteSelect() {
        const select = this.form?.querySelector('[name="cliente_id"]');
        if (!select) return;

        select.innerHTML = '<option value="">Seleccionar cliente</option>';
        
        this.clientes.forEach(cliente => {
            if (cliente.activo) {
                const option = document.createElement('option');
                option.value = cliente.id;
                option.textContent = `${cliente.nombre} - ${cliente.empresa || 'Sin empresa'}`;
                select.appendChild(option);
            }
        });

        // Pre-select client if URL parameter exists
        const clienteId = this.getClienteIdFromURL();
        if (clienteId) {
            select.value = clienteId;
        }
    }

    showEstrategiaDetails(estrategia) {
        const kpis = estrategia.kpis_principales 
            ? (typeof estrategia.kpis_principales === 'string' 
                ? JSON.parse(estrategia.kpis_principales) 
                : estrategia.kpis_principales)
            : [];

        const platforms = estrategia.plataformas 
            ? (typeof estrategia.plataformas === 'string' 
                ? JSON.parse(estrategia.plataformas) 
                : estrategia.plataformas)
            : [];

        Swal.fire({
            title: estrategia.nombre_estrategia,
            html: `
                <div class="text-start">
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Información General</h6>
                            <p><strong>Cliente:</strong> ${estrategia.cliente_nombre}</p>
                            <p><strong>Presupuesto:</strong> ${this.formatCurrency(estrategia.presupuesto)}</p>
                            <p><strong>Estado:</strong> ${this.getStatusBadge(estrategia.estado)}</p>
                            <p><strong>Tipo:</strong> ${estrategia.tipo_campana || 'N/A'}</p>
                        </div>
                        <div class="col-md-6">
                            <h6>Fechas</h6>
                            <p><strong>Inicio:</strong> ${this.formatDate(estrategia.fecha_inicio)}</p>
                            <p><strong>Fin:</strong> ${this.formatDate(estrategia.fecha_fin) || 'No definida'}</p>
                            <p><strong>Creada:</strong> ${this.formatDate(estrategia.fecha_creacion)}</p>
                        </div>
                    </div>
                    <hr>
                    <h6>Objetivos</h6>
                    <p>${estrategia.objetivos}</p>
                    <h6>KPIs Principales</h6>
                    <p>${kpis.join(', ') || 'No definidos'}</p>
                    <h6>Plataformas</h6>
                    <p>${platforms.join(', ') || 'No definidas'}</p>
                    ${estrategia.audiencia_objetivo ? `<h6>Audiencia Objetivo</h6><p>${estrategia.audiencia_objetivo}</p>` : ''}
                </div>
            `,
            width: 800,
            showConfirmButton: false,
            showCloseButton: true,
            footer: `
                <button class="btn btn-primary me-2" onclick="estrategiaModule.editEstrategia(${estrategia.id}); Swal.close();">
                    <i class="bi bi-pencil"></i> Editar
                </button>
                <a href="metricas.html?estrategia=${estrategia.id}" class="btn btn-outline-primary">
                    <i class="bi bi-bar-chart"></i> Ver Métricas
                </a>
            `
        });
    }

    showPerformanceModal(estrategia) {
        const rendimiento = estrategia.rendimiento || {};
        
        Swal.fire({
            title: `Rendimiento - ${estrategia.nombre_estrategia}`,
            html: `
                <div class="text-start">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="card mb-3">
                                <div class="card-body text-center">
                                    <h5 class="text-primary">${this.formatCurrency(rendimiento.inversion_real || 0)}</h5>
                                    <small>Inversión Real</small>
                                    <div class="text-muted">vs ${this.formatCurrency(estrategia.presupuesto || 0)} planificado</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card mb-3">
                                <div class="card-body text-center">
                                    <h5 class="text-success">${this.formatCurrency(rendimiento.ingresos_generados || 0)}</h5>
                                    <small>Ingresos Generados</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card mb-3">
                                <div class="card-body text-center">
                                    <h5 class="text-warning">${this.formatNumber(rendimiento.roas_promedio || 0, 2)}x</h5>
                                    <small>ROAS Promedio</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card mb-3">
                                <div class="card-body text-center">
                                    <h5 class="text-info">${this.formatNumber(rendimiento.ctr_promedio || 0, 2)}%</h5>
                                    <small>CTR Promedio</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    <hr>
                    <p><strong>Total de reportes:</strong> ${rendimiento.total_reportes || 0}</p>
                    <p><strong>Optimizaciones:</strong> ${rendimiento.total_optimizaciones || 0}</p>
                </div>
            `,
            width: 600,
            showConfirmButton: false,
            showCloseButton: true
        });
    }

    // ==================== FILTERING & SEARCH ====================
    
    filterEstrategias(searchTerm) {
        if (!this.table) return;
        
        this.table.search(searchTerm).draw();
    }

    filterByStatus(status) {
        if (!this.table) return;
        
        if (status === 'all') {
            this.table.column(4).search('').draw();
        } else {
            this.table.column(4).search(status).draw();
        }
        
        // Update active filter button
        document.querySelectorAll('[data-filter-status]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter-status="${status}"]`)?.classList.add('active');
    }

    // ==================== EXPORT FUNCTIONALITY ====================
    
    async exportEstrategias() {
        try {
            const csvContent = this.generateCSV();
            this.downloadCSV(csvContent, 'estrategias.csv');
            this.showSuccess('Estrategias exportadas exitosamente');
        } catch (error) {
            console.error('Error exporting:', error);
            this.showError('Error al exportar estrategias');
        }
    }

    generateCSV() {
        const headers = [
            'ID', 'Nombre', 'Cliente', 'Presupuesto', 'Estado', 
            'Fecha Inicio', 'Fecha Fin', 'Tipo Campaña'
        ];
        
        const rows = this.estrategias.map(estrategia => [
            estrategia.id,
            estrategia.nombre_estrategia,
            estrategia.cliente_nombre,
            estrategia.presupuesto,
            estrategia.estado,
            estrategia.fecha_inicio,
            estrategia.fecha_fin || '',
            estrategia.tipo_campana || ''
        ]);
        
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

    // ==================== UTILITY FUNCTIONS ====================
    
    updateStats() {
        const total = this.estrategias.length;
        const activas = this.estrategias.filter(e => e.estado === 'activa').length;
        const presupuestoTotal = this.estrategias.reduce((sum, e) => sum + (parseFloat(e.presupuesto) || 0), 0);
        
        document.getElementById('totalEstrategiasCount').textContent = total;
        document.getElementById('estrategiasActivasCount').textContent = activas;
        document.getElementById('presupuestoTotalCount').textContent = this.formatCurrency(presupuestoTotal);
    }

    getClienteIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('cliente');
    }

    getStatusBadge(status) {
        const badges = {
            'planificada': '<span class="badge bg-secondary">Planificada</span>',
            'activa': '<span class="badge bg-success">Activa</span>',
            'pausada': '<span class="badge bg-warning">Pausada</span>',
            'finalizada': '<span class="badge bg-dark">Finalizada</span>'
        };
        return badges[status] || '<span class="badge bg-secondary">N/A</span>';
    }

    getStatusLabel(status) {
        const labels = {
            'planificada': 'Planificada',
            'activa': 'Activa',
            'pausada': 'Pausada',
            'finalizada': 'Finalizada'
        };
        return labels[status] || 'N/A';
    }

    renderPlatformTags(platforms) {
        if (!platforms) return '<span class="text-muted">N/A</span>';
        
        const platformArray = typeof platforms === 'string' ? JSON.parse(platforms) : platforms;
        return platformArray.slice(0, 2).map(platform => 
            `<span class="badge bg-primary me-1">${platform}</span>`
        ).join('') + (platformArray.length > 2 ? `<span class="text-muted">+${platformArray.length - 2}</span>` : '');
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

    showTableLoading(show) {
        const loading = document.getElementById('tableLoading');
        if (loading) {
            loading.classList.toggle('d-none', !show);
        }
    }

    showSaveLoading(show) {
        const saveBtn = this.form?.querySelector('button[type="submit"]');
        if (saveBtn) {
            if (show) {
                saveBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Guardando...';
                saveBtn.disabled = true;
            } else {
                saveBtn.innerHTML = '<i class="bi bi-check-circle"></i> Guardar Estrategia';
                saveBtn.disabled = false;
            }
        }
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
let estrategiaModule;

document.addEventListener('DOMContentLoaded', function() {
    estrategiaModule = new EstrategiaModule();
});

// Global functions for HTML onclick events
window.estrategiaModule = {
    saveEstrategia: () => estrategiaModule?.saveEstrategia(),
    viewEstrategia: (id) => estrategiaModule?.viewEstrategia(id),
    editEstrategia: (id) => estrategiaModule?.editEstrategia(id),
    changeStatus: (id) => estrategiaModule?.changeStatus(id),
    viewPerformance: (id) => estrategiaModule?.viewPerformance(id),
    refreshEstrategias: () => estrategiaModule?.loadEstrategias(),
    exportEstrategias: () => estrategiaModule?.exportEstrategias()
};