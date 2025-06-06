// =====================================================
// PHP/CONTROLLERS/METRICASCONTROLLER.PHP - Controlador Métricas
// =====================================================

class MetricasController {
    private $metricasModel;
    private $clienteModel;
    private $csvHandler;
    
    public function __construct() {
        $this->metricasModel = new Metricas();
        $this->clienteModel = new Cliente();
        $this->csvHandler = new CSVHandler();
    }
    
    // Obtener métricas
    public function index($clienteId = null) {
        try {
            if ($clienteId) {
                $metricas = $this->metricasModel->getByCliente($clienteId);
            } else {
                $metricas = $this->metricasModel->getAll([], 'fecha_subida DESC');
            }
            
            // Agregar información del cliente
            foreach ($metricas as &$metrica) {
                $cliente = $this->clienteModel->getById($metrica['cliente_id']);
                $metrica['cliente_nombre'] = $cliente['nombre'] ?? '';
            }
            
            return ResponseHelper::success($metricas, 'Métricas obtenidas exitosamente');
            
        } catch (Exception $e) {
            logError($e->getMessage());
            return ResponseHelper::error('Error al obtener métricas', 500);
        }
    }
    
    // Obtener métrica específica
    public function show($id) {
        try {
            $metrica = $this->metricasModel->getById($id);
            
            if (!$metrica) {
                return ResponseHelper::error('Métrica no encontrada', 404);
            }
            
            // Agregar información del cliente
            $cliente = $this->clienteModel->getById($metrica['cliente_id']);
            $metrica['cliente_nombre'] = $cliente['nombre'] ?? '';
            $metrica['cliente_empresa'] = $cliente['empresa'] ?? '';
            
            return ResponseHelper::success($metrica, 'Métrica obtenida exitosamente');
            
        } catch (Exception $e) {
            logError($e->getMessage());
            return ResponseHelper::error('Error al obtener métrica', 500);
        }
    }
    
    // Subir archivo CSV y crear métrica
    public function uploadCSV($data, $file) {
        try {
            // Validar datos básicos
            $errors = $this->metricasModel->validate($data);
            if (!empty($errors)) {
                return ResponseHelper::error('Datos inválidos', 400, $errors);
            }
            
            // Verificar que el cliente existe
            $cliente = $this->clienteModel->getById($data['cliente_id']);
            if (!$cliente) {
                return ResponseHelper::error('Cliente no encontrado', 400);
            }
            
            // Procesar archivo CSV
            $archivoInfo = $this->csvHandler->processUpload($file, $data['cliente_id']);
            
            if (!$archivoInfo['success']) {
                return ResponseHelper::error($archivoInfo['message'], 400);
            }
            
            // Crear registro de métrica
            $metricaData = array_merge($data, [
                'archivo_csv' => $archivoInfo['filename'],
                'nombre_archivo' => $archivoInfo['original_name'],
                'tamano_archivo' => $archivoInfo['size'],
                'datos_procesados' => json_encode($archivoInfo['data']),
                'estado_procesamiento' => 'procesando'
            ]);
            
            $metricaId = $this->metricasModel->create($metricaData);
            
            // Procesar métricas automáticamente
            $this->metricasModel->calcularMetricas($metricaId);
            
            $metrica = $this->metricasModel->getById($metricaId);
            
            return ResponseHelper::success($metrica, 'Archivo procesado exitosamente', 201);
            
        } catch (Exception $e) {
            logError($e->getMessage());
            return ResponseHelper::error('Error al procesar archivo: ' . $e->getMessage(), 500);
        }
    }
    
    // Actualizar métrica
    public function update($id, $data) {
        try {
            $metrica = $this->metricasModel->getById($id);
            if (!$metrica) {
                return ResponseHelper::error('Métrica no encontrada', 404);
            }
            
            $success = $this->metricasModel->update($id, $data);
            
            if ($success) {
                $metricaActualizada = $this->metricasModel->getById($id);
                return ResponseHelper::success($metricaActualizada, 'Métrica actualizada exitosamente');
            } else {
                return ResponseHelper::error('Error al actualizar métrica', 500);
            }
            
        } catch (Exception $e) {
            logError($e->getMessage());
            return ResponseHelper::error('Error al actualizar métrica', 500);
        }
    }
    
    // Eliminar métrica
    public function destroy($id) {
        try {
            $metrica = $this->metricasModel->getById($id);
            if (!$metrica) {
                return ResponseHelper::error('Métrica no encontrada', 404);
            }
            
            // Eliminar archivo físico si existe
            if ($metrica['archivo_csv']) {
                $rutaArchivo = CSV_DIR . $metrica['archivo_csv'];
                if (file_exists($rutaArchivo)) {
                    unlink($rutaArchivo);
                }
            }
            
            $success = $this->metricasModel->delete($id);
            
            if ($success) {
                return ResponseHelper::success(null, 'Métrica eliminada exitosamente');
            } else {
                return ResponseHelper::error('Error al eliminar métrica', 500);
            }
            
        } catch (Exception $e) {
            logError($e->getMessage());
            return ResponseHelper::error('Error al eliminar métrica', 500);
        }
    }
    
    // Obtener resumen de métricas por cliente
    public function getResumen($clienteId) {
        try {
            $cliente = $this->clienteModel->getById($clienteId);
            if (!$cliente) {
                return ResponseHelper::error('Cliente no encontrado', 404);
            }
            
            $resumen = $this->metricasModel->getResumenCliente($clienteId);
            
            return ResponseHelper::success($resumen, 'Resumen obtenido exitosamente');
            
        } catch (Exception $e) {
            logError($e->getMessage());
            return ResponseHelper::error('Error al obtener resumen', 500);
        }
    }
    
    // Recalcular métricas
    public function recalcular($id) {
        try {
            $metrica = $this->metricasModel->getById($id);
            if (!$metrica) {
                return ResponseHelper::error('Métrica no encontrada', 404);
            }
            
            $success = $this->metricasModel->calcularMetricas($id);
            
            if ($success) {
                $metricaActualizada = $this->metricasModel->getById($id);
                return ResponseHelper::success($metricaActualizada, 'Métricas recalculadas exitosamente');
            } else {
                return ResponseHelper::error('Error al recalcular métricas', 500);
            }
            
        } catch (Exception $e) {
            logError($e->getMessage());
            return ResponseHelper::error('Error al recalcular métricas: ' . $e->getMessage(), 500);
        }
    }
}