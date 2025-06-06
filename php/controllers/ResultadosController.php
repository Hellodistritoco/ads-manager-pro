// =====================================================
// PHP/CONTROLLERS/RESULTADOSCONTROLLER.PHP - Controlador Dashboard Resultados
// =====================================================

class ResultadosController {
    private $clienteModel;
    private $estrategiaModel;
    private $metricasModel;
    private $optimizacionModel;
    
    public function __construct() {
        $this->clienteModel = new Cliente();
        $this->estrategiaModel = new Estrategia();
        $this->metricasModel = new Metricas();
        $this->optimizacionModel = new Optimizacion();
    }
    
    // Dashboard general
    public function dashboard() {
        try {
            $dashboard = [
                'totales' => $this->getTotales(),
                'rendimiento_general' => $this->getRendimientoGeneral(),
                'top_clientes' => $this->getTopClientes(),
                'estrategias_activas' => $this->getEstrategiasActivas(),
                'optimizaciones_pendientes' => $this->getOptimizacionesPendientes(),
                'tendencias' => $this->getTendencias()
            ];
            
            return ResponseHelper::success($dashboard, 'Dashboard obtenido exitosamente');
            
        } catch (Exception $e) {
            logError($e->getMessage());
            return ResponseHelper::error('Error al obtener dashboard', 500);
        }
    }
    
    // Reporte completo de cliente
    public function reporteCliente($clienteId) {
        try {
            $cliente = $this->clienteModel->getById($clienteId);
            if (!$cliente) {
                return ResponseHelper::error('Cliente no encontrado', 404);
            }
            
            $reporte = [
                'cliente' => $cliente,
                'estadisticas' => $this->clienteModel->getEstadisticas($clienteId),
                'estrategias' => $this->estrategiaModel->getByCliente($clienteId),
                'metricas_resumen' => $this->metricasModel->getResumenCliente($clienteId),
                'optimizaciones' => $this->optimizacionModel->getByCliente($clienteId),
                'tendencias_cliente' => $this->getTendenciasCliente($clienteId)
            ];
            
            return ResponseHelper::success($reporte, 'Reporte de cliente obtenido exitosamente');
            
        } catch (Exception $e) {
            logError($e->getMessage());
            return ResponseHelper::error('Error al obtener reporte de cliente', 500);
        }
    }
    
    // Métodos privados para obtener datos del dashboard
    private function getTotales() {
        return [
            'clientes_activos' => $this->clienteModel->count(['activo' => 1]),
            'total_estrategias' => $this->estrategiaModel->count(),
            'estrategias_activas' => $this->estrategiaModel->count(['estado' => 'activa']),
            'total_reportes' => $this->metricasModel->count(['estado_procesamiento' => 'completado']),
            'optimizaciones_pendientes' => $this->optimizacionModel->count(['estado' => 'propuesta'])
        ];
    }
    
    private function getRendimientoGeneral() {
        $sql = "
            SELECT 
                SUM(inversion_total) as inversion_total,
                SUM(ingresos_total) as ingresos_total,
                AVG(roas) as roas_promedio,
                AVG(ctr) as ctr_promedio,
                SUM(total_conversiones) as conversiones_total
            FROM metricas 
            WHERE estado_procesamiento = 'completado'
        ";
        
        $stmt = $this->metricasModel->db->prepare($sql);
        $stmt->execute();
        
        return $stmt->fetch();
    }
    
    private function getTopClientes($limit = 5) {
        $sql = "
            SELECT 
                c.id,
                c.nombre,
                c.empresa,
                SUM(m.ingresos_total) as ingresos_total,
                AVG(m.roas) as roas_promedio
            FROM clientes c
            LEFT JOIN metricas m ON c.id = m.cliente_id
            WHERE c.activo = 1 AND m.estado_procesamiento = 'completado'
            GROUP BY c.id
            ORDER BY ingresos_total DESC
            LIMIT :limit
        ";
        
        $stmt = $this->clienteModel->db->prepare($sql);
        $stmt->execute(['limit' => $limit]);
        
        return $stmt->fetchAll();
    }
    
    private function getEstrategiasActivas($limit = 5) {
        return $this->estrategiaModel->getAll(['estado' => 'activa'], 'fecha_creacion DESC', $limit);
    }
    
    private function getOptimizacionesPendientes($limit = 5) {
        return $this->optimizacionModel->getAll(['estado' => 'propuesta'], 'prioridad DESC, fecha_analisis DESC', $limit);
    }
    
    private function getTendencias() {
        // Obtener métricas de los últimos 6 meses agrupadas por mes
        $sql = "
            SELECT 
                DATE_FORMAT(fecha_inicio, '%Y-%m') as mes,
                SUM(inversion_total) as inversion,
                SUM(ingresos_total) as ingresos,
                AVG(roas) as roas_promedio
            FROM metricas 
            WHERE fecha_inicio >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            AND estado_procesamiento = 'completado'
            GROUP BY DATE_FORMAT(fecha_inicio, '%Y-%m')
            ORDER BY mes ASC
        ";
        
        $stmt = $this->metricasModel->db->prepare($sql);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }
    
    private function getTendenciasCliente($clienteId) {
        $sql = "
            SELECT 
                DATE_FORMAT(fecha_inicio, '%Y-%m') as mes,
                SUM(inversion_total) as inversion,
                SUM(ingresos_total) as ingresos,
                AVG(roas) as roas_promedio
            FROM metricas 
            WHERE cliente_id = :cliente_id
            AND fecha_inicio >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            AND estado_procesamiento = 'completado'
            GROUP BY DATE_FORMAT(fecha_inicio, '%Y-%m')
            ORDER BY mes ASC
        ";
        
        $stmt = $this->metricasModel->db->prepare($sql);
        $stmt->execute(['cliente_id' => $clienteId]);
        
        return $stmt->fetchAll();
    }
}