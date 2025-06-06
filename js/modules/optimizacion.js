// =====================================================
// JS/MODULES/OPTIMIZACION.JS - Módulo de Gestión de Optimizaciones
// =====================================================

class OptimizacionModule {
    constructor() {
        this.optimizaciones = [];
        this.clientes = [];
        this.estrategias = [];
        this.metricas = [];
        this.currentOptimizacion = null;
        this.editingOptimizacionId = null;
        
        // Referencias DOM
        this.table = null;
        this.form = document.getElementById('optimizacionForm');
        this.modal = document.getElementById('optimizacionModal');
        this.searchInput = document.getElementById('searchInput');
        
        this.init();
    }

    // ==================== INICIALIZACIÓN ====================
    
    async init() {
        try {
            await this.loadClientes();
            await this.loadEstrategias();
            await this.loadMetricas();
            await this.loadOptimizaciones();
            this.setupEventListeners();
            this.initializeTable();
            this.updateStats();
            this.initializeKanban();
        } catch (error) {
            console.error('Error inicializando módulo de optimización:', error);
            this.showError('Error al cargar el módulo');
        }
    }

    setupEventListeners() {
        // Form submission
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveOptimizacion();
            });
        }

        // Search functionality
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.filterOptimizaciones(e.target.value);
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

        document.querySelectorAll('[data-filter-priority]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterByPriority(e.target.dataset.filterPriority);
            });
        });

        // View toggle
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchView(e.target.dataset.view);
            });
        });

        // Cliente filter
        const clienteFilter = document.getElementById('clienteFilter');
        if (clienteFilter) {
            clienteFilter.addEventListener('change', (e) => {
                this.filterByCliente(e.target.value);
            });
        }

        // Auto-save functionality for forms
        this.setupAutoSave();
    }

    setupAutoSave() {
        if (!this.form) return;
        
        const inputs = this.form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.saveFormDraft();
            });
        });
    }

    // ==================== DATA LOADING ====================
    
    async loadClientes() {
        try {
            const response = await api.getClientes();
            if (response.success) {
                this.clientes = response.data;
                this.populateClienteSelects();
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
                this.populateEstrategiaSelects();
            }
        } catch (error) {
            console.error('Error cargando estrategias:', error);
        }
    }

    async loadMetricas() {
        try {
            const response = await api.getMetricas();
            if (response.success) {
                this.metricas = response.data;
                this.populateMetricaSelects();
            }
        } catch (error) {
            console.error('Error cargando métricas:', error);
        }
    }

    async loadOptimizaciones() {
        try {
            this.showTableLoading(true);
            
            const clienteId = this.getClienteIdFromURL();
            const response = await api.getOptimizaciones(clienteId);
            
            if (response.success) {
                this.optimizaciones = response.data;
                this.renderTable();
                this.renderKanban();
                this.updateStats();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error cargando optimizaciones:', error);
            this.showError('Error al cargar optimizaciones');
            this.renderEmptyState();
        } finally {
            this.showTableLoading(false);
        }
    }

    // ==================== TABLE MANAGEMENT ====================
    
    initializeTable() {
        if ($.fn.DataTable.isDataTable('#optimizacionesTable')) {
            $('#optimizacionesTable').DataTable().destroy();
        }

        this.table = $('#optimizacionesTable').DataTable({
            pageLength: 10,
            responsive: true,
            language: {
                url: '//cdn.datatables.net/plug-ins/1.10.21/i18n/Spanish.json'
            },
            columnDefs: [
                { orderable: false, targets: [-1] }
            ],
            order: [[4, 'desc'], [3, 'desc']] // Order by priority and date
        });
    }

    renderTable() {
        const tbody = document.getElementById('optimizacionesTableBody');
        
        if (!tbody) return;
        
        if (this.optimizaciones.length === 0) {
            this.renderEmptyState();
            return;
        }

        tbody.innerHTML = this.optimizaciones.map(optimizacion => `
            <tr>
                <td>
                    <div class="optimizacion-info">
                        <div class="optimizacion-icon ${this.getPriorityIconColor(optimizacion.prioridad)}">
                            <i class="bi bi-lightbulb"></i>
                        </div>
                        <div class="optimizacion-details">
                            <h6 class="mb-1">${optimizacion.titulo}</h6>
                            <small class="text-muted">${this.truncateText(optimizacion.que_funciono || '', 50)}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="client-info">
                        <strong>${optimizacion.cliente_nombre || 'N/A'}</strong>
                        <br>
                        <small class="text-muted">${optimizacion.estrategia_nombre || 'Sin estrategia'}</small>
                    </div>
                </td>
                <td>${this.getPriorityBadge(optimizacion.prioridad)}</td>
                <td>${this.getStatusBadge(optimizacion.estado)}</td>
                <td>${this.formatDate(optimizacion.fecha_analisis)}</td>
                <td>
                    <div class="progress" style="height: 8px;">
                        <div class="progress-bar ${this.getProgressColor(optimizacion.estado)}" 
                             style="width: ${this.getProgressPercentage(optimizacion.estado)}%"></div>
                    </div>
                    <small class="text-muted">${this.getProgressLabel(optimizacion.estado)}</small>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline-info" onclick="optimizacionModule.viewOptimizacion(${optimizacion.id})" title="Ver detalles">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-primary" onclick="optimizacionModule.editOptimizacion(${optimizacion.id})" title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning" onclick="optimizacionModule.changeStatus(${optimizacion.id})" title="Cambiar estado">
                            <i class="bi bi-arrow-repeat"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="optimizacionModule.implement(${optimizacion.id})" title="Implementar" ${optimizacion.estado !== 'propuesta' ? 'disabled' : ''}>
                            <i class="bi bi-check-circle"></i>
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
        const tbody = document.getElementById('optimizacionesTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <i class="bi bi-gear"></i>
                        <h5>No hay optimizaciones registradas</h5>
                        <p>Comienza creando insights y optimizaciones para mejorar el rendimiento de tus campañas</p>
                        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#optimizacionModal">
                            <i class="bi bi-plus-circle"></i> Crear Primera Optimización
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    // ==================== KANBAN VIEW ====================
    
    initializeKanban() {
        this.renderKanban();
        this.setupKanbanDragAndDrop();
    }

    renderKanban() {
        const kanbanContainer = document.getElementById('kanbanBoard');
        if (!kanbanContainer) return;

        const estados = ['propuesta', 'en_progreso', 'implementada', 'descartada'];
        const estadoLabels = {
            'propuesta': 'Propuestas',
            'en_progreso': 'En Progreso',
            'implementada': 'Implementadas',
            'descartada': 'Descartadas'
        };

        kanbanContainer.innerHTML = estados.map(estado => {
            const optimizacionesEstado = this.optimizaciones.filter(o => o.estado === estado);
            
            return `
                <div class="kanban-column" data-status="${estado}">
                    <div class="kanban-header">
                        <h6>${estadoLabels[estado]}</h6>
                        <span class="badge bg-secondary">${optimizacionesEstado.length}</span>
                    </div>
                    <div class="kanban-body" data-status="${estado}">
                        ${optimizacionesEstado.map(opt => this.renderKanbanCard(opt)).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderKanbanCard(optimizacion) {
        return `
            <div class="kanban-card" data-id="${optimizacion.id}" draggable="true">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <small class="text-muted">${optimizacion.cliente_nombre}</small>
                    ${this.getPriorityBadge(optimizacion.prioridad)}
                </div>
                <div class="card-body">
                    <h6 class="card-title">${optimizacion.titulo}</h6>
                    <p class="card-text">${this.truncateText(optimizacion.mejoras_propuestas || '', 100)}</p>
                </div>
                <div class="card-footer">
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">${this.formatDate(optimizacion.fecha_analisis)}</small>
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-outline-primary" onclick="optimizacionModule.viewOptimizacion(${optimizacion.id})">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-warning" onclick="optimizacionModule.editOptimizacion(${optimizacion.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupKanbanDragAndDrop() {
        const cards = document.querySelectorAll('.kanban-card');
        const columns = document.querySelectorAll('.kanban-body');

        cards.forEach(card => {
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', card.dataset.id);
                card.classList.add('dragging');
            });

            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });
        });

        columns.forEach(column => {
            column.addEventListener('dragover', (e) => {
                e.preventDefault();
                column.classList.add('drag-over');
            });

            column.addEventListener('dragleave', () => {
                column.classList.remove('drag-over');
            });

            column.addEventListener('drop', async (e) => {
                e.preventDefault();
                column.classList.remove('drag-over');
                
                const cardId = e.dataTransfer.getData('text/plain');
                const newStatus = column.dataset.status;
                
                await this.changeStatusDrag(cardId, newStatus);
            });
        });
    }

    // ==================== CRUD OPERATIONS ====================
    
    async saveOptimizacion() {
        try {
            // Validate form
            const validation = this.validateForm();
            if (!validation.isValid) {
                this.showError('Por favor, completa todos los campos requeridos');
                return;
            }

            // Prepare data
            const formData = new FormData(this.form);
            const optimizacionData = this.prepareOptimizacionData(formData);

            // Show loading
            this.showSaveLoading(true);

            // API call
            let result;
            if (this.editingOptimizacionId) {
                result = await api.updateOptimizacion(this.editingOptimizacionId, optimizacionData);
            } else {
                result = await api.createOptimizacion(optimizacionData);
            }

            if (result.success) {
                this.showSuccess(this.editingOptimizacionId ? 'Optimización actualizada' : 'Optimización creada');
                bootstrap.Modal.getInstance(this.modal).hide();
                await this.loadOptimizaciones();
                this.clearFormDraft();
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            console.error('Error guardando optimización:', error);
            this.showError(error.message || 'Error al guardar la optimización');
        } finally {
            this.showSaveLoading(false);
        }
    }

    async viewOptimizacion(id) {
        try {
            const result = await api.getOptimizacion(id);
            
            if (result.success) {
                const optimizacion = result.data;
                this.showOptimizacionDetails(optimizacion);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error viewing optimización:', error);
            this.showError('Error al cargar los detalles');
        }
    }

    async editOptimizacion(id) {
        try {
            const result = await api.getOptimizacion(id);
            
            if (result.success) {
                const optimizacion = result.data;
                this.populateForm(optimizacion);
                this.editingOptimizacionId = id;
                
                document.getElementById('optimizacionModalTitle').textContent = 'Editar Optimización';
                new bootstrap.Modal(this.modal).show();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error editing optimización:', error);
            this.showError('Error al cargar la optimización');
        }
    }

    async changeStatus(id) {
        try {
            const optimizacion = this.optimizaciones.find(o => o.id === id);
            if (!optimizacion) return;

            const statusOptions = [
                { value: 'propuesta', label: 'Propuesta' },
                { value: 'en_progreso', label: 'En Progreso' },
                { value: 'implementada', label: 'Implementada' },
                { value: 'descartada', label: 'Descartada' }
            ];

            const { value: newStatus } = await Swal.fire({
                title: 'Cambiar Estado',
                text: `Estado actual: ${this.getStatusLabel(optimizacion.estado)}`,
                input: 'select',
                inputOptions: statusOptions.reduce((obj, opt) => {
                    obj[opt.value] = opt.label;
                    return obj;
                }, {}),
                inputValue: optimizacion.estado,
                showCancelButton: true,
                confirmButtonText: 'Cambiar Estado',
                cancelButtonText: 'Cancelar'
            });

            if (newStatus) {
                await this.updateOptimizacionStatus(id, newStatus);
            }
        } catch (error) {
            console.error('Error changing status:', error);
            this.showError('Error al cambiar el estado');
        }
    }

    async changeStatusDrag(id, newStatus) {
        try {
            await this.updateOptimizacionStatus(id, newStatus);
            this.showSuccess('Estado actualizado exitosamente');
        } catch (error) {
            console.error('Error in drag status change:', error);
            this.showError('Error al cambiar el estado');
            await this.loadOptimizaciones(); // Reload to reset positions
        }
    }

    async updateOptimizacionStatus(id, newStatus) {
        const result = await api.cambiarEstadoOptimizacion(id, newStatus);
        
        if (result.success) {
            await this.loadOptimizaciones();
        } else {
            throw new Error(result.message);
        }
    }

    async implement(id) {
        try {
            const optimizacion = this.optimizaciones.find(o => o.id === id);
            if (!optimizacion || optimizacion.estado !== 'propuesta') return;

            const { value: resultados } = await Swal.fire({
                title: 'Implementar Optimización',
                html: `
                    <div class="text-start">
                        <p><strong>Optimización:</strong> ${optimizacion.titulo}</p>
                        <p><strong>Mejoras propuestas:</strong></p>
                        <p class="text-muted">${optimizacion.mejoras_propuestas}</p>
                        <hr>
                        <label for="resultados" class="form-label">Resultados obtenidos:</label>
                        <textarea id="resultados" class="form-control" rows="4" placeholder="Describe los resultados obtenidos tras implementar esta optimización..."></textarea>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Implementar',
                cancelButtonText: 'Cancelar',
                preConfirm: () => {
                    const resultados = document.getElementById('resultados').value;
                    if (!resultados.trim()) {
                        Swal.showValidationMessage('Por favor describe los resultados obtenidos');
                        return false;
                    }
                    return resultados;
                }
            });

            if (resultados) {
                const result = await api.implementarOptimizacion(id, resultados);
                
                if (result.success) {
                    this.showSuccess('Optimización implementada exitosamente');
                    await this.loadOptimizaciones();
                } else {
                    throw new Error(result.message);
                }
            }
        } catch (error) {
            console.error('Error implementing optimización:', error);
            this.showError('Error al implementar la optimización');
        }
    }

    // ==================== FORM MANAGEMENT ====================
    
    validateForm() {
        const requiredFields = ['cliente_id', 'titulo', 'mejoras_propuestas'];
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

        return { isValid, errors };
    }

    prepareOptimizacionData(formData) {
        const data = {};
        
        // Basic fields
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }

        // Set default values
        if (!data.prioridad) data.prioridad = 'media';
        if (!data.estado) data.estado = 'propuesta';
        if (!data.fecha_analisis) data.fecha_analisis = new Date().toISOString().split('T')[0];

        return data;
    }

    populateForm(optimizacion) {
        // Clear form first
        this.resetForm();

        // Populate basic fields
        Object.keys(optimizacion).forEach(key => {
            const input = this.form.querySelector(`[name="${key}"]`);
            if (input && optimizacion[key] !== null) {
                input.value = optimizacion[key];
            }
        });

        // Handle date fields
        if (optimizacion.fecha_analisis) {
            const fechaInput = this.form.querySelector('[name="fecha_analisis"]');
            if (fechaInput) {
                fechaInput.value = optimizacion.fecha_analisis.split(' ')[0];
            }
        }

        if (optimizacion.fecha_implementacion) {
            const fechaImplInput = this.form.querySelector('[name="fecha_implementacion"]');
            if (fechaImplInput) {
                fechaImplInput.value = optimizacion.fecha_implementacion.split(' ')[0];
            }
        }

        // Update estrategia select based on cliente
        if (optimizacion.cliente_id) {
            this.updateEstrategiasByCliente(optimizacion.cliente_id, optimizacion.estrategia_id);
        }
    }

    resetForm() {
        if (this.form) {
            this.form.reset();
            this.editingOptimizacionId = null;
            
            // Clear validation errors
            this.form.querySelectorAll('.is-invalid').forEach(field => {
                field.classList.remove('is-invalid');
            });
        }
        
        document.getElementById('optimizacionModalTitle').textContent = 'Nueva Optimización';
    }

    saveFormDraft() {
        if (!this.form) return;
        
        const formData = new FormData(this.form);
        const draft = {};
        
        for (let [key, value] of formData.entries()) {
            draft[key] = value;
        }
        
        localStorage.setItem('optimizacion_draft', JSON.stringify(draft));
    }

    loadFormDraft() {
        const draft = localStorage.getItem('optimizacion_draft');
        if (!draft) return;
        
        try {
            const data = JSON.parse(draft);
            Object.keys(data).forEach(key => {
                const input = this.form.querySelector(`[name="${key}"]`);
                if (input) {
                    input.value = data[key];
                }
            });
        } catch (error) {
            console.error('Error loading form draft:', error);
        }
    }

    clearFormDraft() {
        localStorage.removeItem('optimizacion_draft');
    }

    // ==================== UI HELPERS ====================
    
    populateClienteSelects() {
        const selects = document.querySelectorAll('select[name="cliente_id"]');
        
        selects.forEach(select => {
            select.innerHTML = '<option value="">Seleccionar cliente</option>';
            
            this.clientes.forEach(cliente => {
                if (cliente.activo) {
                    const option = document.createElement('option');
                    option.value = cliente.id;
                    option.textContent = `${cliente.nombre} - ${cliente.empresa || 'Sin empresa'}`;
                    select.appendChild(option);
                }
            });
        });

        // Setup change handler for estrategia filtering
        const clienteSelect = this.form?.querySelector('[name="cliente_id"]');
        if (clienteSelect) {
            clienteSelect.addEventListener('change', (e) => {
                this.updateEstrategiasByCliente(e.target.value);
            });
        }

        // Pre-select client if URL parameter exists
        const clienteId = this.getClienteIdFromURL();
        if (clienteId && clienteSelect) {
            clienteSelect.value = clienteId;
            this.updateEstrategiasByCliente(clienteId);
        }
    }

    populateEstrategiaSelects() {
        // This will be called by updateEstrategiasByCliente when needed
    }

    updateEstrategiasByCliente(clienteId, selectedEstrategiaId = null) {
        const estrategiaSelect = this.form?.querySelector('[name="estrategia_id"]');
        if (!estrategiaSelect) return;

        estrategiaSelect.innerHTML = '<option value="">Seleccionar estrategia (opcional)</option>';

        if (clienteId) {
            const estrategiasCliente = this.estrategias.filter(e => e.cliente_id == clienteId);
            
            estrategiasCliente.forEach(estrategia => {
                const option = document.createElement('option');
                option.value = estrategia.id;
                option.textContent = estrategia.nombre_estrategia;
                estrategiaSelect.appendChild(option);
            });

            if (selectedEstrategiaId) {
                estrategiaSelect.value = selectedEstrategiaId;
            }
        }
    }

    populateMetricaSelects() {
        const selects = document.querySelectorAll('select[name="metrica_id"]');
        
        selects.forEach(select => {
            select.innerHTML = '<option value="">Seleccionar métrica (opcional)</option>';
            
            this.metricas.forEach(metrica => {
                const option = document.createElement('option');
                option.value = metrica.id;
                option.textContent = `${metrica.cliente_nombre} - ${metrica.periodo}`;
                select.appendChild(option);
            });
        });
    }

    showOptimizacionDetails(optimizacion) {
        Swal.fire({
            title: optimizacion.titulo,
            html: `
                <div class="text-start">
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Información General</h6>
                            <p><strong>Cliente:</strong> ${optimizacion.cliente_nombre}</p>
                            <p><strong>Estrategia:</strong> ${optimizacion.estrategia_nombre || 'N/A'}</p>
                            <p><strong>Prioridad:</strong> ${this.getPriorityBadge(optimizacion.prioridad)}</p>
                            <p><strong>Estado:</strong> ${this.getStatusBadge(optimizacion.estado)}</p>
                        </div>
                        <div class="col-md-6">
                            <h6>Fechas</h6>
                            <p><strong>Análisis:</strong> ${this.formatDate(optimizacion.fecha_analisis)}</p>
                            <p><strong>Implementación:</strong> ${this.formatDate(optimizacion.fecha_implementacion) || 'No implementada'}</p>
                        </div>
                    </div>
                    <hr>
                    <h6>¿Qué funcionó?</h6>
                    <p>${optimizacion.que_funciono || 'No especificado'}</p>
                    
                    <h6>¿Qué no funcionó?</h6>
                    <p>${optimizacion.que_no_funciono || 'No especificado'}</p>
                    
                    <h6>Mejoras Propuestas</h6>
                    <p>${optimizacion.mejoras_propuestas}</p>
                    
                    ${optimizacion.acciones_implementadas ? `
                        <h6>Acciones Implementadas</h6>
                        <p>${optimizacion.acciones_implementadas}</p>
                    ` : ''}
                    
                    ${optimizacion.impacto_esperado ? `
                        <h6>Impacto Esperado</h6>
                        <p>${optimizacion.impacto_esperado}</p>
                    ` : ''}
                    
                    ${optimizacion.resultados_obtenidos ? `
                        <h6>Resultados Obtenidos</h6>
                        <p class="alert alert-success">${optimizacion.resultados_obtenidos}</p>
                    ` : ''}
                </div>
            `,
            width: 800,
            showConfirmButton: false,
            showCloseButton: true,
            footer: `
                <button class="btn btn-primary me-2" onclick="optimizacionModule.editOptimizacion(${optimizacion.id}); Swal.close();">
                    <i class="bi bi-pencil"></i> Editar
                </button>
                ${optimizacion.estado === 'propuesta' ? `
                    <button class="btn btn-success" onclick="optimizacionModule.implement(${optimizacion.id}); Swal.close();">
                        <i class="bi bi-check-circle"></i> Implementar
                    </button>
                ` : ''}
            `
        });
    }

    // ==================== VIEW MANAGEMENT ====================
    
    switchView(view) {
        const tableView = document.getElementById('tableView');
        const kanbanView = document.getElementById('kanbanView');
        const viewButtons = document.querySelectorAll('[data-view]');

        // Update button states
        viewButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        // Show/hide views
        if (view === 'table') {
            tableView.style.display = 'block';
            kanbanView.style.display = 'none';
        } else {
            tableView.style.display = 'none';
            kanbanView.style.display = 'block';
            this.renderKanban();
        }
    }

    // ==================== FILTERING & SEARCH ====================
    
    filterOptimizaciones(searchTerm) {
        if (!this.table) return;
        
        this.table.search(searchTerm).draw();
    }

    filterByStatus(status) {
        if (!this.table) return;
        
        if (status === 'all') {
            this.table.column(3).search('').draw();
        } else {
            this.table.column(3).search(status).draw();
        }
        
        // Update active filter button
        document.querySelectorAll('[data-filter-status]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter-status="${status}"]`)?.classList.add('active');
    }

    filterByPriority(priority) {
        if (!this.table) return;
        
        if (priority === 'all') {
            this.table.column(2).search('').draw();
        } else {
            this.table.column(2).search(priority).draw();
        }
        
        // Update active filter button
        document.querySelectorAll('[data-filter-priority]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter-priority="${priority}"]`)?.classList.add('active');
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

    // ==================== STATISTICS & ANALYTICS ====================
    
    updateStats() {
        const total = this.optimizaciones.length;
        const propuestas = this.optimizaciones.filter(o => o.estado === 'propuesta').length;
        const enProgreso = this.optimizaciones.filter(o => o.estado === 'en_progreso').length;
        const implementadas = this.optimizaciones.filter(o => o.estado === 'implementada').length;
        const criticas = this.optimizaciones.filter(o => o.prioridad === 'critica').length;
        
        document.getElementById('totalOptimizacionesCount').textContent = total;
        document.getElementById('propuestasCount').textContent = propuestas;
        document.getElementById('enProgresoCount').textContent = enProgreso;
        document.getElementById('implementadasCount').textContent = implementadas;
        document.getElementById('criticasCount').textContent = criticas;

        // Update progress indicators
        this.updateProgressIndicators();
    }

    updateProgressIndicators() {
        const total = this.optimizaciones.length;
        if (total === 0) return;

        const implementadas = this.optimizaciones.filter(o => o.estado === 'implementada').length;
        const implementationRate = (implementadas / total) * 100;

        const progressBar = document.getElementById('implementationProgress');
        if (progressBar) {
            progressBar.style.width = `${implementationRate}%`;
            progressBar.textContent = `${Math.round(implementationRate)}%`;
        }
    }

    generateReport() {
        const report = {
            resumen: {
                total: this.optimizaciones.length,
                propuestas: this.optimizaciones.filter(o => o.estado === 'propuesta').length,
                implementadas: this.optimizaciones.filter(o => o.estado === 'implementada').length,
                tasa_implementacion: this.optimizaciones.length > 0 ? 
                    (this.optimizaciones.filter(o => o.estado === 'implementada').length / this.optimizaciones.length) * 100 : 0
            },
            por_prioridad: {
                critica: this.optimizaciones.filter(o => o.prioridad === 'critica').length,
                alta: this.optimizaciones.filter(o => o.prioridad === 'alta').length,
                media: this.optimizaciones.filter(o => o.prioridad === 'media').length,
                baja: this.optimizaciones.filter(o => o.prioridad === 'baja').length
            },
            por_cliente: this.getOptimizacionesByCliente()
        };

        return report;
    }

    getOptimizacionesByCliente() {
        const byCliente = {};
        
        this.optimizaciones.forEach(opt => {
            const clienteNombre = opt.cliente_nombre || 'Sin cliente';
            if (!byCliente[clienteNombre]) {
                byCliente[clienteNombre] = {
                    total: 0,
                    implementadas: 0,
                    propuestas: 0
                };
            }
            
            byCliente[clienteNombre].total++;
            if (opt.estado === 'implementada') {
                byCliente[clienteNombre].implementadas++;
            } else if (opt.estado === 'propuesta') {
                byCliente[clienteNombre].propuestas++;
            }
        });

        return byCliente;
    }

    // ==================== UTILITY FUNCTIONS ====================
    
    getClienteIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('cliente');
    }

    getStatusBadge(status) {
        const badges = {
            'propuesta': '<span class="badge bg-primary">Propuesta</span>',
            'en_progreso': '<span class="badge bg-warning">En Progreso</span>',
            'implementada': '<span class="badge bg-success">Implementada</span>',
            'descartada': '<span class="badge bg-secondary">Descartada</span>'
        };
        return badges[status] || '<span class="badge bg-secondary">N/A</span>';
    }

    getStatusLabel(status) {
        const labels = {
            'propuesta': 'Propuesta',
            'en_progreso': 'En Progreso',
            'implementada': 'Implementada',
            'descartada': 'Descartada'
        };
        return labels[status] || 'N/A';
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

    getPriorityIconColor(priority) {
        const colors = {
            'critica': 'text-danger',
            'alta': 'text-warning',
            'media': 'text-info',
            'baja': 'text-secondary'
        };
        return colors[priority] || 'text-secondary';
    }

    getProgressPercentage(status) {
        const percentages = {
            'propuesta': 25,
            'en_progreso': 50,
            'implementada': 100,
            'descartada': 0
        };
        return percentages[status] || 0;
    }

    getProgressColor(status) {
        const colors = {
            'propuesta': 'bg-primary',
            'en_progreso': 'bg-warning',
            'implementada': 'bg-success',
            'descartada': 'bg-secondary'
        };
        return colors[status] || 'bg-secondary';
    }

    getProgressLabel(status) {
        const labels = {
            'propuesta': 'Propuesta',
            'en_progreso': 'En progreso',
            'implementada': 'Completada',
            'descartada': 'Descartada'
        };
        return labels[status] || 'N/A';
    }

    truncateText(text, length) {
        return text && text.length > length ? text.substring(0, length) + '...' : text;
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
                saveBtn.innerHTML = '<i class="bi bi-check-circle"></i> Guardar Optimización';
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
let optimizacionModule;

document.addEventListener('DOMContentLoaded', function() {
    optimizacionModule = new OptimizacionModule();
});

// Global functions for HTML onclick events
window.optimizacionModule = {
    saveOptimizacion: () => optimizacionModule?.saveOptimizacion(),
    viewOptimizacion: (id) => optimizacionModule?.viewOptimizacion(id),
    editOptimizacion: (id) => optimizacionModule?.editOptimizacion(id),
    changeStatus: (id) => optimizacionModule?.changeStatus(id),
    implement: (id) => optimizacionModule?.implement(id),
    refreshOptimizaciones: () => optimizacionModule?.loadOptimizaciones(),
    switchView: (view) => optimizacionModule?.switchView(view)
};