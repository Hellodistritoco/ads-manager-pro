// =====================================================
// PHP/MODELS/METRICAS.PHP - Modelo Métricas
// =====================================================

class Metricas extends BaseModel {
    protected $table = 'metricas';
    protected $fillable = [
        'cliente_id', 'estrategia_id', 'periodo', 'fecha_inicio', 'fecha_fin',
        'archivo_csv', 'nombre_archivo', 'tamano_archivo', 'datos_procesados',
        'metricas_calculadas', 'total_impresiones', 'total_clicks', 'total_conversiones',
        'inversion_total', 'ingresos_total', 'roas', 'cpm', 'cpc', 'ctr', 'estado_procesamiento'
    ];
    
    // Obtener métricas por cliente
    public function getByCliente($clienteId, $limit = null) {
        return $this->getAll(['cliente_id' => $clienteId], 'fecha_subida DESC', $limit);
    }
    
    // Obtener métricas por estrategia
    public function getByEstrategia($estrategiaId) {
        return $this->getAll(['estrategia_id' => $estrategiaId], 'fecha_inicio DESC');
    }
    
    // Obtener métricas por período
    public function getByPeriodo($fechaInicio, $fechaFin, $clienteId = null) {
        $sql = "
            SELECT * FROM {$this->table} 
            WHERE fecha_inicio >= :fecha_inicio 
            AND fecha_fin <= :fecha_fin
        ";
        
        $params = [
            'fecha_inicio' => $fechaInicio,
            'fecha_fin' => $fechaFin
        ];
        
        if ($clienteId) {
            $sql .= " AND cliente_id = :cliente_id";
            $params['cliente_id'] = $clienteId;
        }
        
        $sql .= " ORDER BY fecha_inicio DESC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetchAll();
    }
    
    // Calcular métricas automáticamente
    public function calcularMetricas($metricaId) {
        $metrica = $this->getById($metricaId);
        if (!$metrica) {
            throw new Exception('Métrica no encontrada');
        }
        
        $datos = json_decode($metrica['datos_procesados'], true);
        if (!$datos) {
            throw new Exception('No hay datos procesados');
        }
        
        $totales = [
            'impresiones' => 0,
            'clicks' => 0,
            'conversiones' => 0,
            'inversion' => 0,
            'ingresos' => 0
        ];
        
        foreach ($datos as $fila) {
            $totales['impresiones'] += $fila['impresiones'] ?? 0;
            $totales['clicks'] += $fila['clicks'] ?? 0;
            $totales['conversiones'] += $fila['conversiones'] ?? 0;
            $totales['inversion'] += $fila['costo'] ?? 0;
            $totales['ingresos'] += $fila['ingresos'] ?? 0;
        }
        
        // Calcular métricas derivadas
        $ctr = $totales['impresiones'] > 0 ? ($totales['clicks'] / $totales['impresiones']) * 100 : 0;
        $cpm = $totales['impresiones'] > 0 ? ($totales['inversion'] / $totales['impresiones']) * 1000 : 0;
        $cpc = $totales['clicks'] > 0 ? $totales['inversion'] / $totales['clicks'] : 0;
        $roas = $totales['inversion'] > 0 ? $totales['ingresos'] / $totales['inversion'] : 0;
        
        $metricasCalculadas = [
            'ctr' => round($ctr, 4),
            'cpm' => round($cpm, 4),
            'cpc' => round($cpc, 4),
            'roas' => round($roas, 4),
            'conversion_rate' => $totales['clicks'] > 0 ? round(($totales['conversiones'] / $totales['clicks']) * 100, 4) : 0
        ];
        
        // Actualizar registro
        $updateData = [
            'total_impresiones' => $totales['impresiones'],
            'total_clicks' => $totales['clicks'],
            'total_conversiones' => $totales['conversiones'],
            'inversion_total' => $totales['inversion'],
            'ingresos_total' => $totales['ingresos'],
            'roas' => $metricasCalculadas['roas'],
            'cpm' => $metricasCalculadas['cpm'],
            'cpc' => $metricasCalculadas['cpc'],
            'ctr' => $metricasCalculadas['ctr'],
            'metricas_calculadas' => json_encode($metricasCalculadas),
            'estado_procesamiento' => 'completado'
        ];
        
        return $this->update($metricaId, $updateData);
    }
    
    // Obtener resumen de métricas por cliente
    public function getResumenCliente($clienteId) {
        $sql = "
            SELECT 
                COUNT(*) as total_reportes,
                SUM(total_impresiones) as total_impresiones,
                SUM(total_clicks) as total_clicks,
                SUM(total_conversiones) as total_conversiones,
                SUM(inversion_total) as inversion_total,
                SUM(ingresos_total) as ingresos_total,
                AVG(roas) as roas_promedio,
                AVG(ctr) as ctr_promedio,
                AVG(cpm) as cpm_promedio,
                AVG(cpc) as cpc_promedio
            FROM {$this->table}
            WHERE cliente_id = :cliente_id 
            AND estado_procesamiento = 'completado'
        ";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['cliente_id' => $clienteId]);
        
        return $stmt->fetch();
    }
    
    // Validar datos de métrica
    public function validate($data) {
        $errors = [];
        
        if (empty($data['cliente_id'])) {
            $errors[] = 'El cliente es requerido';
        }
        
        if (empty($data['fecha_inicio'])) {
            $errors[] = 'La fecha de inicio es requerida';
        }
        
        if (empty($data['fecha_fin'])) {
            $errors[] = 'La fecha de fin es requerida';
        }
        
        if (!empty($data['fecha_inicio']) && !empty($data['fecha_fin'])) {
            if (strtotime($data['fecha_inicio']) > strtotime($data['fecha_fin'])) {
                $errors[] = 'La fecha de inicio debe ser anterior a la fecha de fin';
            }
        }
        
        return $errors;
    }
}