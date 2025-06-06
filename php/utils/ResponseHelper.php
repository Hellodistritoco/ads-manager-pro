<?php
// =====================================================
// PHP/UTILS/RESPONSEHELPER.PHP - Helper para Respuestas API
// =====================================================

class ResponseHelper {
    
    // Respuesta exitosa
    public static function success($data = null, $message = 'Success', $statusCode = 200) {
        $response = [
            'success' => true,
            'message' => $message,
            'data' => $data,
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        if ($data !== null && is_array($data)) {
            $response['count'] = count($data);
        }
        
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
        return $response;
    }
    
    // Respuesta de error
    public static function error($message = 'Error', $statusCode = 400, $errors = null) {
        $response = [
            'success' => false,
            'message' => $message,
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        if ($errors !== null) {
            $response['errors'] = $errors;
        }
        
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
        return $response;
    }
    
    // Respuesta paginada
    public static function paginated($data, $total, $page, $perPage, $message = 'Success') {
        $totalPages = ceil($total / $perPage);
        
        $response = [
            'success' => true,
            'message' => $message,
            'data' => $data,
            'pagination' => [
                'current_page' => (int)$page,
                'per_page' => (int)$perPage,
                'total' => (int)$total,
                'total_pages' => (int)$totalPages,
                'has_next' => $page < $totalPages,
                'has_previous' => $page > 1
            ],
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        header('Content-Type: application/json');
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
        return $response;
    }
    
    // Respuesta de validación
    public static function validation($errors) {
        return self::error('Errores de validación', 422, $errors);
    }
    
    // Respuesta no autorizada
    public static function unauthorized($message = 'No autorizado') {
        return self::error($message, 401);
    }
    
    // Respuesta no encontrado
    public static function notFound($message = 'Recurso no encontrado') {
        return self::error($message, 404);
    }
    
    // Respuesta de servidor
    public static function serverError($message = 'Error interno del servidor') {
        return self::error($message, 500);
    }
}