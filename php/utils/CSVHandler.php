// =====================================================
// PHP/UTILS/CSVHANDLER.PHP - Manejador de Archivos CSV
// =====================================================

class CSVHandler {
    private $allowedExtensions = ['csv'];
    private $maxFileSize = 10485760; // 10MB
    private $uploadDir;
    
    public function __construct() {
        $this->uploadDir = CSV_DIR;
        $this->ensureDirectoryExists();
    }
    
    private function ensureDirectoryExists() {
        if (!is_dir($this->uploadDir)) {
            mkdir($this->uploadDir, 0755, true);
        }
    }
    
    // Procesar upload de archivo CSV
    public function processUpload($file, $clienteId) {
        try {
            // Validar archivo
            $validation = $this->validateFile($file);
            if (!$validation['valid']) {
                return ['success' => false, 'message' => $validation['message']];
            }
            
            // Generar nombre único
            $fileName = $this->generateUniqueFileName($file['name'], $clienteId);
            $filePath = $this->uploadDir . $fileName;
            
            // Mover archivo
            if (!move_uploaded_file($file['tmp_name'], $filePath)) {
                return ['success' => false, 'message' => 'Error al guardar archivo'];
            }
            
            // Procesar contenido CSV
            $csvData = $this->parseCSV($filePath);
            if (!$csvData['success']) {
                unlink($filePath); // Eliminar archivo si no se puede procesar
                return $csvData;
            }
            
            return [
                'success' => true,
                'filename' => $fileName,
                'original_name' => $file['name'],
                'size' => $file['size'],
                'path' => $filePath,
                'data' => $csvData['data'],
                'headers' => $csvData['headers'],
                'row_count' => $csvData['row_count']
            ];
            
        } catch (Exception $e) {
            logError('Error en processUpload: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Error al procesar archivo'];
        }
    }
    
    // Validar archivo
    private function validateFile($file) {
        if ($file['error'] !== UPLOAD_ERR_OK) {
            return ['valid' => false, 'message' => 'Error al subir archivo'];
        }
        
        if ($file['size'] > $this->maxFileSize) {
            return ['valid' => false, 'message' => 'Archivo demasiado grande (máximo 10MB)'];
        }
        
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($extension, $this->allowedExtensions)) {
            return ['valid' => false, 'message' => 'Tipo de archivo no permitido (solo CSV)'];
        }
        
        return ['valid' => true, 'message' => 'Archivo válido'];
    }
    
    // Generar nombre único para el archivo
    private function generateUniqueFileName($originalName, $clienteId) {
        $extension = pathinfo($originalName, PATHINFO_EXTENSION);
        $timestamp = date('Y-m-d_H-i-s');
        $random = substr(md5(uniqid()), 0, 8);
        
        return "cliente_{$clienteId}_{$timestamp}_{$random}.{$extension}";
    }
    
    // Parsear archivo CSV
    private function parseCSV($filePath) {
        try {
            if (!file_exists($filePath)) {
                return ['success' => false, 'message' => 'Archivo no encontrado'];
            }
            
            $data = [];
            $headers = [];
            $rowCount = 0;
            
            if (($handle = fopen($filePath, 'r')) !== FALSE) {
                // Leer headers
                if (($headerRow = fgetcsv($handle, 1000, ',')) !== FALSE) {
                    $headers = array_map('trim', $headerRow);
                    $headers = array_map(function($header) {
                        return $this->normalizeHeader($header);
                    }, $headers);
                }
                
                // Leer datos
                while (($row = fgetcsv($handle, 1000, ',')) !== FALSE) {
                    if (count($row) === count($headers)) {
                        $rowData = array_combine($headers, $row);
                        $rowData = $this->processRowData($rowData);
                        $data[] = $rowData;
                        $rowCount++;
                    }
                }
                
                fclose($handle);
            }
            
            if (empty($data)) {
                return ['success' => false, 'message' => 'No se encontraron datos válidos en el archivo'];
            }
            
            return [
                'success' => true,
                'data' => $data,
                'headers' => $headers,
                'row_count' => $rowCount
            ];
            
        } catch (Exception $e) {
            logError('Error al parsear CSV: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Error al procesar archivo CSV'];
        }
    }
    
    // Normalizar headers del CSV
    private function normalizeHeader($header) {
        $header = trim(strtolower($header));
        
        // Mapeo de headers comunes
        $headerMap = [
            'impressions' => 'impresiones',
            'clicks' => 'clicks',
            'conversions' => 'conversiones',
            'cost' => 'costo',
            'spend' => 'costo',
            'revenue' => 'ingresos',
            'sales' => 'ingresos',
            'ctr' => 'ctr',
            'cpm' => 'cpm',
            'cpc' => 'cpc',
            'roas' => 'roas',
            'date' => 'fecha',
            'campaign' => 'campana',
            'ad_set' => 'conjunto_anuncios',
            'ad' => 'anuncio'
        ];
        
        return $headerMap[$header] ?? $header;
    }
    
    // Procesar datos de cada fila
    private function processRowData($rowData) {
        $processed = [];
        
        foreach ($rowData as $key => $value) {
            $value = trim($value);
            
            // Convertir valores numéricos
            if (in_array($key, ['impresiones', 'clicks', 'conversiones'])) {
                $processed[$key] = (int)$value;
            } elseif (in_array($key, ['costo', 'ingresos', 'ctr', 'cpm', 'cpc', 'roas'])) {
                $processed[$key] = (float)$value;
            } elseif ($key === 'fecha') {
                $processed[$key] = $this->normalizeDate($value);
            } else {
                $processed[$key] = $value;
            }
        }
        
        return $processed;
    }
    
    // Normalizar formato de fecha
    private function normalizeDate($dateString) {
        $formats = ['Y-m-d', 'd/m/Y', 'm/d/Y', 'd-m-Y', 'm-d-Y'];
        
        foreach ($formats as $format) {
            $date = DateTime::createFromFormat($format, $dateString);
            if ($date) {
                return $date->format('Y-m-d');
            }
        }
        
        return $dateString;
    }
    
    // Eliminar archivo
    public function deleteFile($fileName) {
        $filePath = $this->uploadDir . $fileName;
        
        if (file_exists($filePath)) {
            return unlink($filePath);
        }
        
        return true;
    }
    
    // Obtener información del archivo
    public function getFileInfo($fileName) {
        $filePath = $this->uploadDir . $fileName;
        
        if (!file_exists($filePath)) {
            return null;
        }
        
        return [
            'name' => $fileName,
            'size' => filesize($filePath),
            'modified' => filemtime($filePath),
            'path' => $filePath
        ];
    }
}