// =====================================================
// JS/UTILS/API.JS - Cliente HTTP para comunicación con API
// =====================================================

class APIClient {
    constructor(baseURL = '../api') {
        this.baseURL = baseURL;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    // Método base para realizar peticiones HTTP
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}/${endpoint.replace(/^\//, '')}`;
        
        const config = {
            headers: { ...this.defaultHeaders, ...options.headers },
            ...options
        };

        // Agregar token si existe
        const token = this.getAuthToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, config);
            
            // Log de la petición para debugging
            if (this.isDebugMode()) {
                console.log(`[API] ${config.method || 'GET'} ${url}`, {
                    request: config,
                    status: response.status
                });
            }
            
            // Manejar respuestas no JSON (ej: archivos)
            const contentType = response.headers.get('Content-Type') || '';
            if (!contentType.includes('application/json')) {
                if (response.ok) {
                    return response;
                } else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            }
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new APIError(data.message || 'Error en la petición', response.status, data);
            }
            
            return data;
            
        } catch (error) {
            if (error instanceof APIError) {
                throw error;
            }
            
            // Error de red o parsing
            console.error('[API] Network or parsing error:', error);
            throw new APIError('Error de conexión. Verifica tu conexión a internet.', 0, null);
        }
    }

    // Métodos HTTP básicos
    async get(endpoint, params = {}) {
        const query = new URLSearchParams(params).toString();
        const url = query ? `${endpoint}?${query}` : endpoint;
        
        return this.request(url, {
            method: 'GET'
        });
    }

    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    // Upload de archivos
    async upload(endpoint, formData) {
        const config = {
            method: 'POST',
            body: formData,
            headers: {} // No establecer Content-Type para FormData
        };

        // Remover Content-Type para que el navegador lo establezca automáticamente
        delete config.headers['Content-Type'];
        
        return this.request(endpoint, config);
    }

    // Métodos específicos de la API

    // ==================== CLIENTES ====================
    
    // Obtener todos los clientes
    async getClientes(params = {}) {
        return this.get('clientes', params);
    }

    // Obtener cliente específico
    async getCliente(id) {
        return this.get(`clientes/${id}`);
    }

    // Crear nuevo cliente
    async createCliente(clienteData) {
        return this.post('clientes', clienteData);
    }

    // Actualizar cliente
    async updateCliente(id, clienteData) {
        return this.put(`clientes/${id}`, clienteData);
    }

    // Eliminar/desactivar cliente
    async deleteCliente(id) {
        return this.delete(`clientes/${id}`);
    }

    // Buscar clientes
    async searchClientes(searchTerm) {
        return this.post('clientes/search', { term: searchTerm });
    }

    // ==================== ESTRATEGIAS ====================
    
    // Obtener estrategias
    async getEstrategias(clienteId = null) {
        const params = clienteId ? { cliente_id: clienteId } : {};
        return this.get('estrategias', params);
    }

    // Obtener estrategia específica
    async getEstrategia(id) {
        return this.get(`estrategias/${id}`);
    }

    // Crear estrategia
    async createEstrategia(estrategiaData) {
        return this.post('estrategias', estrategiaData);
    }

    // Actualizar estrategia
    async updateEstrategia(id, estrategiaData) {
        return this.put(`estrategias/${id}`, estrategiaData);
    }

    // Eliminar estrategia
    async deleteEstrategia(id) {
        return this.delete(`estrategias/${id}`);
    }

    // Cambiar estado de estrategia
    async cambiarEstadoEstrategia(id, nuevoEstado) {
        return this.post(`estrategias/${id}/cambiar-estado`, { estado: nuevoEstado });
    }

    // Obtener estrategias activas
    async getEstrategiasActivas() {
        return this.get('estrategias/activas');
    }

    // ==================== MÉTRICAS ====================
    
    // Obtener métricas
    async getMetricas(clienteId = null) {
        const params = clienteId ? { cliente_id: clienteId } : {};
        return this.get('metricas', params);
    }

    // Obtener métrica específica
    async getMetrica(id) {
        return this.get(`metricas/${id}`);
    }

    // Subir archivo CSV de métricas
    async uploadMetricasCSV(formData) {
        return this.upload('metricas/upload', formData);
    }

    // Actualizar métrica
    async updateMetrica(id, metricaData) {
        return this.put(`metricas/${id}`, metricaData);
    }

    // Eliminar métrica
    async deleteMetrica(id) {
        return this.delete(`metricas/${id}`);
    }

    // Recalcular métricas
    async recalcularMetricas(id) {
        return this.post(`metricas/${id}/recalcular`);
    }

    // Obtener resumen de métricas por cliente
    async getResumenMetricas(clienteId) {
        return this.get(`metricas/${clienteId}/resumen`);
    }

    // ==================== OPTIMIZACIÓN ====================
    
    // Obtener optimizaciones
    async getOptimizaciones(clienteId = null) {
        const params = clienteId ? { cliente_id: clienteId } : {};
        return this.get('optimizacion', params);
    }

    // Obtener optimización específica
    async getOptimizacion(id) {
        return this.get(`optimizacion/${id}`);
    }

    // Crear optimización
    async createOptimizacion(optimizacionData) {
        return this.post('optimizacion', optimizacionData);
    }

    // Actualizar optimización
    async updateOptimizacion(id, optimizacionData) {
        return this.put(`optimizacion/${id}`, optimizacionData);
    }

    // Eliminar optimización
    async deleteOptimizacion(id) {
        return this.delete(`optimizacion/${id}`);
    }

    // Cambiar estado de optimización
    async cambiarEstadoOptimizacion(id, nuevoEstado) {
        return this.post(`optimizacion/${id}/cambiar-estado`, { estado: nuevoEstado });
    }

    // Implementar optimización
    async implementarOptimizacion(id, resultados) {
        return this.post(`optimizacion/${id}/implementar`, { resultados });
    }

    // Obtener optimizaciones por estado
    async getOptimizacionesByEstado(estado) {
        return this.get('optimizacion/estado', { estado });
    }

    // Obtener estadísticas de optimizaciones
    async getEstadisticasOptimizacion(clienteId = null) {
        const params = clienteId ? { cliente_id: clienteId } : {};
        return this.get('optimizacion/estadisticas', params);
    }

    // ==================== DASHBOARD Y RESULTADOS ====================
    
    // Obtener datos del dashboard
    async getDashboard() {
        return this.get('dashboard');
    }

    // Obtener reporte completo de cliente
    async getReporteCliente(clienteId) {
        return this.get(`resultados/cliente/${clienteId}`);
    }

    // ==================== UTILIDADES ====================
    
    // Gestión de token de autenticación
    setAuthToken(token) {
        localStorage.setItem('ads_manager_token', token);
    }

    getAuthToken() {
        return localStorage.getItem('ads_manager_token');
    }

    removeAuthToken() {
        localStorage.removeItem('ads_manager_token');
    }

    // Modo debug
    isDebugMode() {
        return localStorage.getItem('ads_manager_debug') === 'true' || 
               new URLSearchParams(window.location.search).has('debug');
    }

    enableDebug() {
        localStorage.setItem('ads_manager_debug', 'true');
    }

    disableDebug() {
        localStorage.removeItem('ads_manager_debug');
    }

    // Manejo de errores con retry
    async requestWithRetry(endpoint, options = {}, maxRetries = 3) {
        let lastError;
        
        for (let i = 0; i <= maxRetries; i++) {
            try {
                return await this.request(endpoint, options);
            } catch (error) {
                lastError = error;
                
                // No reintentar en errores 4xx (client errors)
                if (error.status >= 400 && error.status < 500) {
                    throw error;
                }
                
                // Esperar antes del siguiente intento
                if (i < maxRetries) {
                    await this.delay(Math.pow(2, i) * 1000); // Backoff exponencial
                }
            }
        }
        
        throw lastError;
    }

    // Utility para delay
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Cache simple para peticiones GET
    cache = new Map();

    async getWithCache(endpoint, params = {}, cacheTime = 300000) { // 5 minutos por defecto
        const cacheKey = `${endpoint}_${JSON.stringify(params)}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < cacheTime) {
            return cached.data;
        }
        
        const data = await this.get(endpoint, params);
        this.cache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });
        
        return data;
    }

    // Limpiar cache
    clearCache() {
        this.cache.clear();
    }

    // Interceptor para respuestas
    onResponse(callback) {
        this.responseInterceptor = callback;
    }

    // Interceptor para errores
    onError(callback) {
        this.errorInterceptor = callback;
    }
}

// =====================================================
// Clase para errores específicos de la API
// =====================================================

class APIError extends Error {
    constructor(message, status, data) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
    }

    // Verificar si es un error específico
    isNetworkError() {
        return this.status === 0;
    }

    isServerError() {
        return this.status >= 500;
    }

    isClientError() {
        return this.status >= 400 && this.status < 500;
    }

    isValidationError() {
        return this.status === 422;
    }

    isUnauthorized() {
        return this.status === 401;
    }

    isForbidden() {
        return this.status === 403;
    }

    isNotFound() {
        return this.status === 404;
    }
}

// =====================================================
// Instancia global del cliente API
// =====================================================

// Crear instancia global
const api = new APIClient();

// Configurar interceptores globales
api.onError((error) => {
    // Log automático de errores
    console.error('[API Error]', error);
    
    // Manejar errores de autenticación
    if (error.isUnauthorized()) {
        // Redirigir al login o mostrar modal de autenticación
        api.removeAuthToken();
        window.location.href = '/login.html';
    }
});

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APIClient, APIError, api };
}

// Hacer disponible globalmente
window.APIClient = APIClient;
window.APIError = APIError;
window.api = api;