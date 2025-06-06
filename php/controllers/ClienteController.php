<?php
// =====================================================
// PHP/CONTROLLERS/CLIENTECONTROLLER.PHP - Controlador Cliente
// =====================================================

class ClienteController {
    private $clienteModel;
    
    public function __construct() {
        $this->clienteModel = new Cliente();
    }
    
    // Obtener todos los clientes
    public function index() {
        try {
            $clientes = $this->clienteModel->getActivos();
            
            return ResponseHelper::success($clientes, 'Clientes obtenidos exitosamente');
            
        } catch (Exception $e) {
            logError($e->getMessage());
            return ResponseHelper::error('Error al obtener clientes', 500);
        }
    }
    
    // Obtener cliente específico
    public function show($id) {
        try {
            $cliente = $this->clienteModel->getById($id);
            
            if (!$cliente) {
                return ResponseHelper::error('Cliente no encontrado', 404);
            }
            
            // Obtener estadísticas del cliente
            $estadisticas = $this->clienteModel->getEstadisticas($id);
            $cliente['estadisticas'] = $estadisticas;
            
            return ResponseHelper::success($cliente, 'Cliente obtenido exitosamente');
            
        } catch (Exception $e) {
            logError($e->getMessage());
            return ResponseHelper::error('Error al obtener cliente', 500);
        }
    }
    
    // Crear nuevo cliente
    public function store($data) {
        try {
            // Validar datos
            $errors = $this->clienteModel->validate($data);
            if (!empty($errors)) {
                return ResponseHelper::error('Datos inválidos', 400, $errors);
            }
            
            // Crear cliente
            $clienteId = $this->clienteModel->create($data);
            $cliente = $this->clienteModel->getById($clienteId);
            
            return ResponseHelper::success($cliente, 'Cliente creado exitosamente', 201);
            
        } catch (Exception $e) {
            logError($e->getMessage());
            return ResponseHelper::error('Error al crear cliente', 500);
        }
    }
    
    // Actualizar cliente
    public function update($id, $data) {
        try {
            // Verificar que el cliente existe
            $cliente = $this->clienteModel->getById($id);
            if (!$cliente) {
                return ResponseHelper::error('Cliente no encontrado', 404);
            }
            
            // Validar datos
            $data['id'] = $id; // Para validación de email único
            $errors = $this->clienteModel->validate($data);
            if (!empty($errors)) {
                return ResponseHelper::error('Datos inválidos', 400, $errors);
            }
            
            // Actualizar cliente
            $success = $this->clienteModel->update($id, $data);
            
            if ($success) {
                $clienteActualizado = $this->clienteModel->getById($id);
                return ResponseHelper::success($clienteActualizado, 'Cliente actualizado exitosamente');
            } else {
                return ResponseHelper::error('Error al actualizar cliente', 500);
            }
            
        } catch (Exception $e) {
            logError($e->getMessage());
            return ResponseHelper::error('Error al actualizar cliente', 500);
        }
    }
    
    // Eliminar cliente
    public function destroy($id) {
        try {
            $cliente = $this->clienteModel->getById($id);
            if (!$cliente) {
                return ResponseHelper::error('Cliente no encontrado', 404);
            }
            
            // Soft delete - desactivar en lugar de eliminar
            $success = $this->clienteModel->desactivar($id);
            
            if ($success) {
                return ResponseHelper::success(null, 'Cliente desactivado exitosamente');
            } else {
                return ResponseHelper::error('Error al desactivar cliente', 500);
            }
            
        } catch (Exception $e) {
            logError($e->getMessage());
            return ResponseHelper::error('Error al eliminar cliente', 500);
        }
    }
    
    // Buscar clientes
    public function search($searchTerm) {
        try {
            $campos = ['nombre', 'empresa', 'email', 'segmento'];
            $clientes = $this->clienteModel->search($searchTerm, $campos);
            
            return ResponseHelper::success($clientes, 'Búsqueda completada');
            
        } catch (Exception $e) {
            logError($e->getMessage());
            return ResponseHelper::error('Error en la búsqueda', 500);
        }
    }
    
    // Obtener clientes por segmento
    public function getBySegmento($segmento) {
        try {
            $clientes = $this->clienteModel->getBySegmento($segmento);
            
            return ResponseHelper::success($clientes, 'Clientes por segmento obtenidos');
            
        } catch (Exception $e) {
            logError($e->getMessage());
            return ResponseHelper::error('Error al obtener clientes por segmento', 500);
        }
    }
}