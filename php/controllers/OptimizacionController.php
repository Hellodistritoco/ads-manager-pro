// =====================================================
// PHP/CONTROLLERS/OPTIMIZACIONCONTROLLER.PHP - Controlador Optimización
// =====================================================

class OptimizacionController {
    private $optimizacionModel;
    private $clienteModel;
    private $estrategiaModel;
    
    public function __construct() {
        $this->optimizacionModel = new Optimizacion();
        $this->clienteModel = new Cliente();
        $this->estrategiaModel = new Estrategia();
    }
    
    // Obtener optimizaciones
    public function index($clienteId = null) {
        try {
            if ($clienteId) {
                $optimizaciones = $this->optimizacionModel->getByCliente($clienteId);
            } else {
                $optimizaciones = $this->optimizacionModel->getAll([], 'fecha_analisis DESC');
            }
            
            // Agregar información relacionada
            foreach ($optimizaciones as &$optimizacion) {
                $cliente = $this->clienteModel->getById($optimizacion['cliente_id']);
                $optimizacion['cliente_nombre'] = $cliente['nombre'] ?? '';
                
                if ($optimizacion['estrategia_id']) {
                    $estrategia = $this->estrategiaModel->getById($optimizacion['estrategia_id']);
                    $optimizacion['estrategia_nombre'] = $estrategia['nombre_estrategia'] ?? '';
                }
            }
            
            return ResponseHelper::success($optimizaciones, 'Optimizaciones obtenidas exitosamente');
            
        } catch (Exception $e) {
            logError($e->getMessage());
            return ResponseHelper::error('Error al obtener optimizaciones', 500);
        }
    }
    
    // Obtener optimización específica
    public function show($id) {
        try {
            $optimizacion = $this->optimizacionModel->getConRelaciones($id);
            
            if (!$optimizacion) {
                return ResponseHelper::error('Optimización no encontrada', 404);
            }
            
            return ResponseHelper::success($optimizacion, 'Optimización obtenida exitosamente');
            
        } catch (Exception $e) {
            logError($e->getMessage());
            return ResponseHelper::error('Error al obtener optimización', 500);
        }
    }
    
    // Crear nueva optimización
    public function store($data) {
        try {
            // Validar datos
            $errors = $this->optimizacionModel->validate($data);
            if (!empty($errors)) {
                return ResponseHelper::error('Datos inválidos', 400, $errors);
            }
            
            // Verificar que el cliente existe
            $cliente = $this->clienteModel->getById($data['cliente_id']);
            if (!$cliente) {
                return ResponseHelper::error('Cliente no encontrado', 400);
            }
            
            // Crear optimización
            $optimizacionId = $this->optimizacionModel->create($data);
            $optimizacion = $this->optimizacionModel->getConRelaciones($optimizacionId);
            
            return ResponseHelper::success($optimizacion, 'Optimización creada exitosamente', 201);
            
        } catch (Exception $e) {
            logError($e->getMessage());
            return ResponseHelper::error('Error al crear optimización', 500);
        }
    }
    
    // Actualizar optimización
    public function update($id, $data) {
        try {
            $optimizacion = $this->optimizacionModel->getById($id);
            if (!$optimizacion) {
                return ResponseHelper::error('Optimización no encontrada', 404);
            }
            
            // Validar datos
            $errors = $this->optimizacionModel->validate($data);
            if (!empty($errors)) {
                return ResponseHelper::error('Datos inválidos', 400, $errors);
            }
            
            $success = $this->optimizacionModel->update($id, $data);
            
            if ($success) {
                $optimizacionActualizada = $this->optimizacionModel->getConRelaciones($id);
                return ResponseHelper::success($optimizacionActualizada, 'Optimización actualizada exitosamente');
            } else {
                return ResponseHelper::error('Error al actualizar optimización', 500);
            }
            
        } catch (Exception $e) {
            logError($e->getMessage());
            return ResponseHelper::error('Error al actualizar optimización', 500);
        }
    }
    
    // Eliminar optimización
    public function destroy($id) {
        try {
            $optimizacion = $this->optimizacionModel->getById($id);
            if (!$optimizacion) {
                return ResponseHelper::error('Optimización no encontrada', 404);
            }
            
            $success = $this->optimizacionModel->delete($id);
            
            if ($success) {
                return ResponseHelper::success(null, 'Optimización eliminada exitosamente');
            } else {
                return ResponseHelper::error('Error al eliminar optimización', 500);
            }
            
        } catch (Exception $e) {
            logError($e->getMessage());
            return ResponseHelper::error('Error al eliminar optimización', 500);
        }
    }
    
    // Cambiar estado de optimización
    public function cambiarEstado($id, $nuevoEstado) {
        try {
            $optimizacion = $this->optimizacionModel->getById($id);
            if (!$optimizacion) {
                return ResponseHelper::error('Optimización no encontrada', 404);
            }
            
            $success = $this->optimizacionModel->cambiarEstado($id, $nuevoEstado);
            
            if ($success) {
                $optimizacionActualizada = $this->optimizacionModel->getById($id);
                return ResponseHelper::success($optimizacionActualizada, 'Estado actualizado exitosamente');
            } else {
                return ResponseHelper::error('Error al cambiar estado', 500);
            }
            
        } catch (Exception $e) {
            logError($e->getMessage());
            return ResponseHelper::error('Error al cambiar estado: ' . $e->getMessage(), 500);
        }
    }
    
    // Implementar optimización con resultados
    public function implementar($id, $resultados) {
        try {
            $optimizacion = $this->optimizacionModel->getById($id);
            if (!$optimizacion) {
                return ResponseHelper::error('Optimización no encontrada', 404);
            }
            
            if (empty($resultados)) {
                return ResponseHelper::error('Los resultados son requeridos', 400);
            }
            
            $success = $this->optimizacionModel->implementar($id, $resultados);
            
            if ($success) {
                $optimizacionActualizada = $this->optimizacionModel->getConRelaciones($id);
                return ResponseHelper::success($optimizacionActualizada, 'Optimización implementada exitosamente');
            } else {
                return ResponseHelper::error('Error al implementar optimización', 500);
            }
            
        } catch (Exception $e) {
            logError($e->getMessage());
            return ResponseHelper::error('Error al implementar optimización', 500);
        }
    }
    
    // Obtener estadísticas de optimizaciones
    public function getEstadisticas($clienteId = null) {
        try {
            if ($clienteId) {
                $cliente = $this->clienteModel->getById($clienteId);
                if (!$cliente) {
                    return ResponseHelper::error('Cliente no encontrado', 404);
                }
            }
            
            $estadisticas = $this->optimizacionModel->getEstadisticas($clienteId);
            
            return ResponseHelper::success($estadisticas, 'Estadísticas obtenidas exitosamente');
            
        } catch (Exception $e) {
            logError($e->getMessage());
            return ResponseHelper::error('Error al obtener estadísticas', 500);
        }
    }
    
    // Obtener optimizaciones por estado
    public function getByEstado($estado) {
        try {
            $optimizaciones = $this->optimizacionModel->getByEstado($estado);
            
            // Agregar información del cliente
            foreach ($optimizaciones as &$optimizacion) {
                $cliente = $this->clienteModel->getById($optimizacion['cliente_id']);
                $optimizacion['cliente_nombre'] = $cliente['nombre'] ?? '';
            }
            
            return ResponseHelper::success($optimizaciones, 'Optimizaciones por estado obtenidas');
            
        } catch (Exception $e) {
            logError($e->getMessage());
            return ResponseHelper::error('Error al obtener optimizaciones por estado', 500);
        }
    }
}