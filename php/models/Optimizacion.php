// =====================================================
// PHP/MODELS/OPTIMIZACION.PHP - Modelo Optimización
// =====================================================

class Optimizacion extends BaseModel {
    protected $table = 'optimizaciones';
    protected $fillable = [
        'cliente_id', 'estrategia_id', 'metrica_id', 'titulo', 'que_funciono',
        'que_no_funciono', 'mejoras_propuestas', 'acciones_implementadas',
        'impacto_esperado', 'prioridad', 'estado', 'fecha_implementacion',
        'resultados_obtenidos'
    ];
    
    // Obtener optimizaciones por cliente
    public function getByCliente($clienteId) {
        return $this->getAll(['cliente_id' => $clienteId], 'fecha_analisis DESC');
    }
    
    // Obtener optimizaciones por estrategia
    public function getByEstrategia($estrategiaId) {
        return $this->getAll(['estrategia_id' => $estrategiaId], 'fecha_analisis DESC');
    }
    
    // Obtener optimizaciones por estado
    public function getByEstado($estado) {
        return $this->getAll(['estado' => $estado], 'prioridad DESC, fecha_analisis DESC');
    }
    
    // Obtener optimizaciones con información relacionada
    public function getConRelaciones($optimizacionId) {
        $sql = "
            SELECT 
                o.*,
                c.nombre as cliente_nombre,
                c.empresa as cliente_empresa,
                e.nombre_estrategia,
                m.periodo as metrica_periodo
            FROM optimizaciones o
            INNER JOIN clientes c ON o.cliente_id = c.id
            LEFT JOIN estrategias e ON o.estrategia_id = e.id
            LEFT JOIN metricas m ON o.metrica_id = m.id
            WHERE o.id = :optimizacion_id
        ";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['optimizacion_id' => $optimizacionId]);
        
        return $stmt->fetch();
    }
    
    // Obtener estadísticas de optimizaciones
    public function getEstadisticas($clienteId = null) {
        $sql = "
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN estado = 'propuesta' THEN 1 ELSE 0 END) as propuestas,
                SUM(CASE WHEN estado = 'en_progreso' THEN 1 ELSE 0 END) as en_progreso,
                SUM(CASE WHEN estado = 'implementada' THEN 1 ELSE 0 END) as implementadas,
                SUM(CASE WHEN estado = 'descartada' THEN 1 ELSE 0 END) as descartadas,
                SUM(CASE WHEN prioridad = 'critica' THEN 1 ELSE 0 END) as criticas,
                SUM(CASE WHEN prioridad = 'alta' THEN 1 ELSE 0 END) as altas
            FROM {$this->table}
        ";
        
        $params = [];
        
        if ($clienteId) {
            $sql .= " WHERE cliente_id = :cliente_id";
            $params['cliente_id'] = $clienteId;
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetch();
    }
    
    // Validar datos de optimización
    public function validate($data) {
        $errors = [];
        
        if (empty($data['cliente_id'])) {
            $errors[] = 'El cliente es requerido';
        }
        
        if (empty($data['titulo'])) {
            $errors[] = 'El título es requerido';
        }
        
        if (empty($data['mejoras_propuestas'])) {
            $errors[] = 'Las mejoras propuestas son requeridas';
        }
        
        $prioridadesValidas = ['baja', 'media', 'alta', 'critica'];
        if (!empty($data['prioridad']) && !in_array($data['prioridad'], $prioridadesValidas)) {
            $errors[] = 'Prioridad no válida';
        }
        
        $estadosValidos = ['propuesta', 'en_progreso', 'implementada', 'descartada'];
        if (!empty($data['estado']) && !in_array($data['estado'], $estadosValidos)) {
            $errors[] = 'Estado no válido';
        }
        
        return $errors;
    }
    
    // Cambiar estado de optimización
    public function cambiarEstado($id, $nuevoEstado) {
        $estadosValidos = ['propuesta', 'en_progreso', 'implementada', 'descartada'];
        
        if (!in_array($nuevoEstado, $estadosValidos)) {
            throw new Exception('Estado no válido');
        }
        
        $updateData = ['estado' => $nuevoEstado];
        
        // Si se implementa, agregar fecha
        if ($nuevoEstado === 'implementada') {
            $updateData['fecha_implementacion'] = date('Y-m-d');
        }
        
        return $this->update($id, $updateData);
    }
    
    // Marcar como implementada con resultados
    public function implementar($id, $resultados) {
        $updateData = [
            'estado' => 'implementada',
            'fecha_implementacion' => date('Y-m-d'),
            'resultados_obtenidos' => $resultados
        ];
        
        return $this->update($id, $updateData);
    }
}