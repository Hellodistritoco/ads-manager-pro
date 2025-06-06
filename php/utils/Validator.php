// =====================================================
// PHP/UTILS/VALIDATOR.PHP - Validador de Datos
// =====================================================

class Validator {
    
    // Validar email
    public static function email($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }
    
    // Validar teléfono
    public static function phone($phone) {
        return preg_match('/^[\+]?[0-9\s\-\(\)]{10,20}$/', $phone);
    }
    
    // Validar fecha
    public static function date($date, $format = 'Y-m-d') {
        $d = DateTime::createFromFormat($format, $date);
        return $d && $d->format($format) === $date;
    }
    
    // Validar número positivo
    public static function positiveNumber($number) {
        return is_numeric($number) && $number > 0;
    }
    
    // Validar longitud de string
    public static function stringLength($string, $min = null, $max = null) {
        $length = strlen($string);
        
        if ($min !== null && $length < $min) {
            return false;
        }
        
        if ($max !== null && $length > $max) {
            return false;
        }
        
        return true;
    }
    
    // Validar archivo
    public static function file($file, $allowedTypes = [], $maxSize = null) {
        if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
            return ['valid' => false, 'message' => 'Archivo no válido'];
        }
        
        if ($file['error'] !== UPLOAD_ERR_OK) {
            return ['valid' => false, 'message' => 'Error al subir archivo'];
        }
        
        if (!empty($allowedTypes)) {
            $fileType = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            if (!in_array($fileType, $allowedTypes)) {
                return ['valid' => false, 'message' => 'Tipo de archivo no permitido'];
            }
        }
        
        if ($maxSize !== null && $file['size'] > $maxSize) {
            return ['valid' => false, 'message' => 'Archivo demasiado grande'];
        }
        
        return ['valid' => true, 'message' => 'Archivo válido'];
    }
    
    // Sanitizar string
    public static function sanitizeString($string) {
        return htmlspecialchars(trim($string), ENT_QUOTES, 'UTF-8');
    }
    
    // Validar JSON
    public static function json($string) {
        json_decode($string);
        return json_last_error() === JSON_ERROR_NONE;
    }
    
    // Validar rango de fecha
    public static function dateRange($startDate, $endDate) {
        if (!self::date($startDate) || !self::date($endDate)) {
            return false;
        }
        
        return strtotime($startDate) <= strtotime($endDate);
    }
}
