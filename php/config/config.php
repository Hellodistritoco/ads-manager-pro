<?php
// =====================================================
// PHP/CONFIG/DATABASE.PHP - Configuración Base de Datos
// =====================================================

class Database {
    private $host = 'server71.web-hosting.com';
    private $db_name = 'hellfhpr_ads_manager_pro';
    private $username = 'hellfhpr_adsmamagerpro';
    private $password = '=Rr3v)G^2a12Ad';
    private $conn = null;
    
    // Configuración para diferentes entornos
    private $environments = [
        'development' => [
            'host' => 'localhost',
            'db_name' => 'ads_manager_pro3',
            'username' => 'root',
            'password' => ''
        ],
        'production' => [
            'host' => 'server71.web-hosting.com',
            'db_name' => 'hellfhpr_ads_manager_pro',
            'username' => 'hellfhpr_adsmamagerpro',
            'password' => '=Rr3v)G^2a12Ad'
        ]
    ];
    
    public function __construct() {
        $this->loadEnvironmentConfig();
    }
    
    private function loadEnvironmentConfig() {
        $env = $_ENV['APP_ENV'] ?? 'development';
        
        if (isset($this->environments[$env])) {
            $config = $this->environments[$env];
            $this->host = $config['host'];
            $this->db_name = $config['db_name'];
            $this->username = $config['username'];
            $this->password = $config['password'];
        }
    }
    
    public function getConnection() {
        if ($this->conn === null) {
            try {
                $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4";
                
                $options = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
                ];
                
                $this->conn = new PDO($dsn, $this->username, $this->password, $options);
                
            } catch(PDOException $e) {
                error_log("Connection Error: " . $e->getMessage());
                throw new Exception("Database connection failed");
            }
        }
        
        return $this->conn;
    }
    
    public function closeConnection() {
        $this->conn = null;
    }
    
    // Método para ejecutar transacciones
    public function executeTransaction($callback) {
        $this->conn->beginTransaction();
        
        try {
            $result = $callback($this->conn);
            $this->conn->commit();
            return $result;
        } catch (Exception $e) {
            $this->conn->rollback();
            throw $e;
        }
    }
    
    // Método para obtener el último ID insertado
    public function getLastInsertId() {
        return $this->conn->lastInsertId();
    }
    
    // Método para verificar conexión
    public function isConnected() {
        try {
            return $this->conn && $this->conn->query('SELECT 1')->fetchColumn() === '1';
        } catch (Exception $e) {
            return false;
        }
    }
}

// =====================================================
// PHP/CONFIG/CONFIG.PHP - Configuración General
// =====================================================

// Configuración de errores
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Configuración de zona horaria
date_default_timezone_set('America/Bogota');

// Configuración de la aplicación
define('APP_NAME', 'ADS Manager Pro 3');
define('APP_VERSION', '3.0.0');
define('APP_URL', 'https://hellodistrito.com/ads-manager/');

// Configuración de archivos
define('UPLOAD_DIR', __DIR__ . '/../../uploads/');
define('CSV_DIR', UPLOAD_DIR . 'csv/');
define('MAX_FILE_SIZE', 10 * 1024 * 1024); // 10MB
define('ALLOWED_EXTENSIONS', ['csv', 'xlsx']);

// Configuración de seguridad
define('CSRF_TOKEN_NAME', 'csrf_token');
define('SESSION_LIFETIME', 3600); // 1 hora

// Configuración de API
define('API_VERSION', 'v1');
define('API_BASE_URL', APP_URL . '/api/' . API_VERSION);

// Headers de seguridad
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// Configuración de CORS
$allowed_origins = [
    'http://localhost',
    'http://localhost:3000',
    'http://127.0.0.1',
    APP_URL
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Función para crear directorios si no existen
function createDirectoriesIfNotExist() {
    $directories = [
        UPLOAD_DIR,
        CSV_DIR
    ];
    
    foreach ($directories as $dir) {
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
    }
}

// Crear directorios necesarios
createDirectoriesIfNotExist();

// Función para logging
function logError($message, $file = null, $line = null) {
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[$timestamp] $message";
    
    if ($file && $line) {
        $logMessage .= " in $file on line $line";
    }
    
    error_log($logMessage, 3, __DIR__ . '/../../logs/error.log');
}

// Función para debugging (solo en desarrollo)
function debug($data, $die = false) {
    if ($_ENV['APP_ENV'] === 'development') {
        echo '<pre>';
        var_dump($data);
        echo '</pre>';
        
        if ($die) {
            die();
        }
    }
}

// =====================================================
// PHP/CONFIG/CORS.PHP - Configuración CORS Avanzada
// =====================================================

class CorsHandler {
    private $allowedOrigins;
    private $allowedMethods;
    private $allowedHeaders;
    private $allowCredentials;
    private $maxAge;
    
    public function __construct($config = []) {
        $this->allowedOrigins = $config['origins'] ?? ['*'];
        $this->allowedMethods = $config['methods'] ?? ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
        $this->allowedHeaders = $config['headers'] ?? ['Content-Type', 'Authorization', 'X-Requested-With'];
        $this->allowCredentials = $config['credentials'] ?? true;
        $this->maxAge = $config['maxAge'] ?? 86400; // 24 horas
    }
    
    public function handle() {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        
        // Verificar origen permitido
        if ($this->isOriginAllowed($origin)) {
            header('Access-Control-Allow-Origin: ' . $origin);
        }
        
        // Configurar headers CORS
        header('Access-Control-Allow-Methods: ' . implode(', ', $this->allowedMethods));
        header('Access-Control-Allow-Headers: ' . implode(', ', $this->allowedHeaders));
        header('Access-Control-Max-Age: ' . $this->maxAge);
        
        if ($this->allowCredentials) {
            header('Access-Control-Allow-Credentials: true');
        }
        
        // Manejar preflight request
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit();
        }
    }
    
    private function isOriginAllowed($origin) {
        if (in_array('*', $this->allowedOrigins)) {
            return true;
        }
        
        return in_array($origin, $this->allowedOrigins);
    }
}

// Inicializar CORS
$corsConfig = [
    'origins' => [
        'http://localhost',
        'http://localhost:3000',
        'http://127.0.0.1',
        APP_URL
    ],
    'methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    'headers' => ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
    'credentials' => true,
    'maxAge' => 86400
];

$corsHandler = new CorsHandler($corsConfig);
$corsHandler->handle();