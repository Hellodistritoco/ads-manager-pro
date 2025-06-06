// =====================================================
// PHP/CONTROLLERS/ESTRATEGIACONTROLLER.PHP - Controlador Estrategia
// =====================================================

class EstrategiaController {
    private $estrategiaModel;
    private $clienteModel;
    
    public function __construct() {
        $this->estrategiaModel = new Estrategia();
        $this->clienteModel = new Cliente();
    }
    
    // Obtener todas las estrategias
    public function index($clienteId = null) {
        try {
            if ($clienteId) {
                $estrategias = $this->estrategiaModel->getByCliente($clienteId);
            } else {
                $estrategias = $this->estrategiaModel->getAll([], 'fecha_creacion DESC');
            }
            
            // Agregar información del cliente a cada estrategia
            foreach ($estrategias as &$estrategia) {
                $cliente = $this->clienteModel->getById($estrategia['cliente_id']);
                $estrategia['cliente_nombre'] = $cliente['nombre'] ?? '';
                $estrategia['cliente_empresa'] = $cliente['empresa'] ?? '';
            }
            
            return ResponseHelper::success($estrategias, 'Estrategias obtenidas exitosamente');
            
        } catch (Exception $e) {
            logError($e->getMessage());
            return ResponseHelper::error('Error al obtener estrategias', 500);
        }
    }
    
    // Obtener estrategia específica
    public function show($id) {
        try {
            $estrategia = $this->estrategiaModel->getConCliente($id);
            
            if (!$estrategia) {
                return ResponseHelper::error('Estrategia no encontrada', 404);
            }
            
            // Obtener rendimiento
            $rendimiento = $this->estrategiaModel->getRendimiento($id);
            $estrategia['rendimiento'] = $rendimiento;
            
            return ResponseHelper::success($estrategia, 'Estrategia obtenida exitosamente');
            
        } catch (Exception $e) {
            logError($e->getMessage());
            return ResponseHelper::error('Error al obtener estrategia', 500);
        }
    }
    
    // Crear nueva estrategia
    public function store($data) {
        try {
            // Validar datos
            $errors = $this->estrategiaModel->validate($data);
            if (!empty($errors)) {
                return ResponseHelper::error('Datos inválidos', 400, $errors);
            }
            
            // Verificar que el cliente existe
            $cliente = $this->clienteModel->getById($data['cliente_id']);
            if (!$cliente) {
                return ResponseHelper::error('Cliente no encontrado', 400);
            }
            
            // Procesar datos JSON
            if (isset($data['kpis_principales']) && is_array($data['kpis_principales'])) {
                $data['kpis_principales'] = json_encode($data['kpis_principales']);
            }
            
            if (isset($data['plataformas']) && is_array($data['plataformas'])) {
                $data['plataformas'] = json_encode($data['plataformas']);
            }
            
            // Crear estrategia
            $estrategiaId = $this->estrategiaModel->create($data);
            $estrategia = $this->estrategiaModel->getConCliente($estrategiaId);
            
            return ResponseHelper::success($estrategia, 'Estrategia creada exitosamente', 201);
            
        } catch (Exception $e) {
            logError($e->getMessage());
            return ResponseHelper::error('Error al crear estrategia', 500);
        }
    }
    
    // Actualizar estrategia
    public function update($id, $data) {
        try {
            $estrategia = $this->estrategiaModel->getById($id);
            if (!$estrategia) {
                return ResponseHelper::error('Estrategia no encontrada', 404);
            }
            
            // Validar datos
            $errors = $this->estrategiaModel->validate($data);
            if (!empty($errors)) {
                return ResponseHelper::error('Datos inválidos', 400, $errors);
            }
            
            // Procesar datos JSON
            if (isset($data['kpis_principales']) && is_array($data['kpis_principales'])) {
                $data['kpis_principales'] = json_encode($data['kpis_principales']);
            }
            
            if (isset($data['plataformas']) && is_array($data['plataformas'])) {
                $data['plataformas'] = json_encode($data['plataformas']);
            }
            
            // Actualizar estrategia
            $success = $this->estrategiaModel->update($id, $data);
            
            if ($success) {
                $estrategiaActualizada = $this->estrategiaModel->getConCliente($id);
                return ResponseHelper::success($estrategiaActualizada, 'Estrategia actualizada exitosamente');
            } else {
                return ResponseHelper::error('Error al actualizar estrategia', 500);
            }
            
        } catch (Exception $e) {
            logError($e->getMessage());
            return ResponseHelper::error('Error al actualizar estrategia', 500);
        }
    }
    
    // Eliminar estrategia
    public function destroy($id) {
        try {
            $estrategia = $this->estrategiaModel->getById($id);
            if (!$estrategia) {
                return ResponseHelper::error('Estrategia no encontrada', 404);
            }
            
            $success = $this->estrategiaModel->delete($id);
            
            if ($success) {
                return ResponseHelper::success(null, 'Estrategia eliminada exitosamente');
            } else {
                return ResponseHelper::error('Error al eliminar estrategia', 500);
            }
            
        } catch (Exception $e) {
            logError($e->getMessage());
            return ResponseHelper::error('Error al eliminar estrategia', 500);
        }
    }
    
    // Cambiar estado de estrategia
    public function cambiarEstado($id, $nuevoEstado) {
        try {
            $estrategia = $this->estrategiaModel->getById($id);
            if (!$estrategia) {
                return ResponseHelper::error('Estrategia no encontrada', 404);
            }
            
            $success = $this->estrategiaModel->cambiarEstado($id, $nuevoEstado);
            
            if ($success) {
                $estrategiaActualizada = $this->estrategiaModel->getById($id);
                return ResponseHelper::success($estrategiaActualizada, 'Estado actualizado exitosamente');
            } else {
                return ResponseHelper::error('Error al cambiar estado', 500);
            }
            
        } catch (Exception $e) {
            logError($e->getMessage());
            return ResponseHelper::error('Error al cambiar estado: ' . $e->getMessage(), 500);
        }
    }
    
    // Obtener estrategias activas
    public function getActivas() {
        try {
            $estrategias = $this->estrategiaModel->getActivas();
            
            foreach ($estrategias as &$estrategia) {
                $cliente = $this->clienteModel->getById($estrategia['cliente_id']);
                $estrategia['cliente_nombre'] = $cliente['nombre'] ?? '';
            }
            
            return ResponseHelper::success($estrategias, 'Estrategias activas obtenidas');
            
        } catch (Exception $e) {
            logError($e->getMessage());
            return ResponseHelper::error('Error al obtener estrategias activas', 500);
        }
    }
}