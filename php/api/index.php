// =====================================================
// API/INDEX.PHP - Router Principal de la API
// =====================================================

<?php
// Incluir configuración y dependencias
require_once '../php/config/config.php';
require_once '../php/config/database.php';
require_once '../php/config/cors.php';

// Incluir modelos
require_once '../php/models/Database.php';
require_once '../php/models/Cliente.php';
require_once '../php/models/Estrategia.php';
require_once '../php/models/Metricas.php';
require_once '../php/models/Optimizacion.php';

// Incluir controladores
require_once '../php/controllers/ClienteController.php';
require_once '../php/controllers/EstrategiaController.php';
require_once '../php/controllers/MetricasController.php';
require_once '../php/controllers/OptimizacionController.php';
require_once '../php/controllers/ResultadosController.php';

// Incluir utilidades
require_once '../php/utils/ResponseHelper.php';
require_once '../php/utils/Validator.php';
require_once '../php/utils/CSVHandler.php';

// Router principal
class APIRouter {
    private $method;
    private $endpoint;
    private $params;
    
    public function __construct() {
        $this->method = $_SERVER['REQUEST_METHOD'];
        $this->parseRequest();
    }
    
    private function parseRequest() {
        $request = $_SERVER['REQUEST_URI'];
        $path = parse_url($request, PHP_URL_PATH);
        $path = trim($path, '/');
        
        // Remover prefijo 'api' si existe
        if (strpos($path, 'api/') === 0) {
            $path = substr($path, 4);
        }
        
        $segments = explode('/', $path);
        $this->endpoint = $segments[0] ?? '';
        $this->params = array_slice($segments, 1);
    }
    
    public function route() {
        try {
            switch ($this->endpoint) {
                case 'clientes':
                    $this->handleClientes();
                    break;
                    
                case 'estrategias':
                    $this->handleEstrategias();
                    break;
                    
                case 'metricas':
                    $this->handleMetricas();
                    break;
                    
                case 'optimizacion':
                    $this->handleOptimizacion();
                    break;
                    
                case 'resultados':
                    $this->handleResultados();
                    break;
                    
                case 'dashboard':
                    $this->handleDashboard();
                    break;
                    
                default:
                    ResponseHelper::notFound('Endpoint no encontrado');
                    break;
            }
        } catch (Exception $e) {
            logError('Error en router: ' . $e->getMessage());
            ResponseHelper::serverError('Error interno del servidor');
        }
    }
    
    private function handleClientes() {
        $controller = new ClienteController();
        $id = $this->params[0] ?? null;
        $action = $this->params[1] ?? null;
        
        switch ($this->method) {
            case 'GET':
                if ($id && $action === 'estadisticas') {
                    $controller->show($id);
                } elseif ($id) {
                    $controller->show($id);
                } else {
                    $controller->index();
                }
                break;
                
            case 'POST':
                if ($action === 'search') {
                    $data = $this->getRequestData();
                    $controller->search($data['term'] ?? '');
                } else {
                    $data = $this->getRequestData();
                    $controller->store($data);
                }
                break;
                
            case 'PUT':
                if ($id) {
                    $data = $this->getRequestData();
                    $controller->update($id, $data);
                } else {
                    ResponseHelper::error('ID requerido para actualización', 400);
                }
                break;
                
            case 'DELETE':
                if ($id) {
                    $controller->destroy($id);
                } else {
                    ResponseHelper::error('ID requerido para eliminación', 400);
                }
                break;
                
            default:
                ResponseHelper::error('Método no permitido', 405);
                break;
        }
    }
    
    private function handleEstrategias() {
        $controller = new EstrategiaController();
        $id = $this->params[0] ?? null;
        $action = $this->params[1] ?? null;
        
        switch ($this->method) {
            case 'GET':
                if ($id && $action === 'rendimiento') {
                    $controller->show($id);
                } elseif ($id) {
                    $controller->show($id);
                } else {
                    $clienteId = $_GET['cliente_id'] ?? null;
                    $controller->index($clienteId);
                }
                break;
                
            case 'POST':
                if ($action === 'cambiar-estado') {
                    $data = $this->getRequestData();
                    $controller->cambiarEstado($id, $data['estado']);
                } else {
                    $data = $this->getRequestData();
                    $controller->store($data);
                }
                break;
                
            case 'PUT':
                if ($id) {
                    $data = $this->getRequestData();
                    $controller->update($id, $data);
                } else {
                    ResponseHelper::error('ID requerido para actualización', 400);
                }
                break;
                
            case 'DELETE':
                if ($id) {
                    $controller->destroy($id);
                } else {
                    ResponseHelper::error('ID requerido para eliminación', 400);
                }
                break;
                
            default:
                ResponseHelper::error('Método no permitido', 405);
                break;
        }
    }
    
    private function handleMetricas() {
        $controller = new MetricasController();
        $id = $this->params[0] ?? null;
        $action = $this->params[1] ?? null;
        
        switch ($this->method) {
            case 'GET':
                if ($id && $action === 'resumen') {
                    $controller->getResumen($id);
                } elseif ($id) {
                    $controller->show($id);
                } else {
                    $clienteId = $_GET['cliente_id'] ?? null;
                    $controller->index($clienteId);
                }
                break;
                
            case 'POST':
                if ($action === 'upload') {
                    $data = $this->getRequestData();
                    $file = $_FILES['csv_file'] ?? null;
                    $controller->uploadCSV($data, $file);
                } elseif ($action === 'recalcular') {
                    $controller->recalcular($id);
                } else {
                    $data = $this->getRequestData();
                    $controller->store($data);
                }
                break;
                
            case 'PUT':
                if ($id) {
                    $data = $this->getRequestData();
                    $controller->update($id, $data);
                } else {
                    ResponseHelper::error('ID requerido para actualización', 400);
                }
                break;
                
            case 'DELETE':
                if ($id) {
                    $controller->destroy($id);
                } else {
                    ResponseHelper::error('ID requerido para eliminación', 400);
                }
                break;
                
            default:
                ResponseHelper::error('Método no permitido', 405);
                break;
        }
    }
    
    private function handleOptimizacion() {
        $controller = new OptimizacionController();
        $id = $this->params[0] ?? null;
        $action = $this->params[1] ?? null;
        
        switch ($this->method) {
            case 'GET':
                if ($action === 'estadisticas') {
                    $clienteId = $_GET['cliente_id'] ?? null;
                    $controller->getEstadisticas($clienteId);
                } elseif ($action === 'estado') {
                    $estado = $_GET['estado'] ?? '';
                    $controller->getByEstado($estado);
                } elseif ($id) {
                    $controller->show($id);
                } else {
                    $clienteId = $_GET['cliente_id'] ?? null;
                    $controller->index($clienteId);
                }
                break;
                
            case 'POST':
                if ($action === 'implementar') {
                    $data = $this->getRequestData();
                    $controller->implementar($id, $data['resultados']);
                } elseif ($action === 'cambiar-estado') {
                    $data = $this->getRequestData();
                    $controller->cambiarEstado($id, $data['estado']);
                } else {
                    $data = $this->getRequestData();
                    $controller->store($data);
                }
                break;
                
            case 'PUT':
                if ($id) {
                    $data = $this->getRequestData();
                    $controller->update($id, $data);
                } else {
                    ResponseHelper::error('ID requerido para actualización', 400);
                }
                break;
                
            case 'DELETE':
                if ($id) {
                    $controller->destroy($id);
                } else {
                    ResponseHelper::error('ID requerido para eliminación', 400);
                }
                break;
                
            default:
                ResponseHelper::error('Método no permitido', 405);
                break;
        }
    }
    
    private function handleResultados() {
        $controller = new ResultadosController();
        $action = $this->params[0] ?? null;
        $id = $this->params[1] ?? null;
        
        switch ($this->method) {
            case 'GET':
                if ($action === 'cliente' && $id) {
                    $controller->reporteCliente($id);
                } else {
                    ResponseHelper::error('Acción no válida', 400);
                }
                break;
                
            default:
                ResponseHelper::error('Método no permitido', 405);
                break;
        }
    }
    
    private function handleDashboard() {
        $controller = new ResultadosController();
        
        switch ($this->method) {
            case 'GET':
                $controller->dashboard();
                break;
                
            default:
                ResponseHelper::error('Método no permitido', 405);
                break;
        }
    }
    
    private function getRequestData() {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        
        if (strpos($contentType, 'application/json') !== false) {
            $input = file_get_contents('php://input');
            return json_decode($input, true) ?? [];
        } else {
            return $_POST;
        }
    }
}

// Inicializar y ejecutar router
$router = new APIRouter();
$router->route();