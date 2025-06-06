// =====================================================
// PHP/MODELS/ESTRATEGIA.PHP - Modelo Estrategia
// =====================================================

class Estrategia extends BaseModel {
    protected $table = 'estrategias';
    protected $fillable = [
        'cliente_id', 'nombre_estrategia', 'descripcion', 'objetivos',
        'kpis_principales', 'presupuesto', 'fecha_inicio', 'fecha_fin',
        'plataformas', 'tipo_campana', 'audiencia_objetivo', 'estado'
    ];
    
    // Obtener estrategias por cliente
    public function getByCliente($clienteId) {
        return $this->getAll(['cliente_id' => $clienteId], 'fecha_creacion DESC');
    }
    
    // Obtener estrategias activas
    public function getActivas() {
        return $this->getAll(['estado' => 'activa'], 'fecha_inicio DESC');
    }
    
    // Obtener estrategia con datos del cliente
    public function getConCliente($estrategiaId) {
        $sql = "
            SELECT 
                e.*,
                c.nombre as cliente_nombre,
                c.empresa as cliente_empresa,
                c.email as cliente_email
            FROM estrategias e
            INNER JOIN clientes c ON e.cliente_id = c.id
            WHERE e.id = :estrategia_id
        ";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['estrategia_id' => $estrategiaId]);
        
        return $stmt->fetch();
    }
    
    // Obtener rendimiento de estrategia
    public function getRendimiento($estrategiaId) {
        $sql = "
            SELECT 
                e.id,
                e.nombre_estrategia,
                e.presupuesto as presupuesto_planificado,
                COALESCE(SUM(m.inversion_total), 0) as inversion_real,
                COALESCE(SUM(m.ingresos_total), 0) as ingresos_generados,
                COALESCE(AVG(m.roas), 0) as roas_promedio,
                COALESCE(AVG(m.ctr), 0) as ctr_promedio,
                COUNT(m.id) as total_reportes,
                COUNT(o.id) as total_optimizaciones
            FROM estrategias e
            LEFT JOIN metricas m ON e.id = m.estrategia_id
            LEFT JOIN optimizaciones o ON e.id = o.estrategia_id
            WHERE e.id = :estrategia_id
            GROUP BY e.id
        ";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['estrategia_id' => $estrategiaId]);
        
        return $stmt->fetch();
    }
    
    // Validar datos de estrategia
    public function validate($data) {
        $errors = [];
        
        if (empty($data['cliente_id'])) {
            $errors[] = 'El cliente es requerido';
        }
        
        if (empty($data['nombre_estrategia'])) {
            $errors[] = 'El nombre de la estrategia es requerido';
        }
        
        if (empty($data['objetivos'])) {
            $errors[] = 'Los objetivos son requeridos';
        }
        
        if (empty($data['presupuesto']) || $data['presupuesto'] <= 0) {
            $errors[] = 'El presupuesto debe ser mayor a 0';
        }
        
        if (empty($data['fecha_inicio'])) {
            $errors[] = 'La fecha de inicio es requerida';
        }
        
        return $errors;
    }
    
    // Cambiar estado de estrategia
    public function cambiarEstado($id, $nuevoEstado) {
        $estadosValidos = ['planificada', 'activa', 'pausada', 'finalizada'];
        
        if (!in_array($nuevoEstado, $estadosValidos)) {
            throw new Exception('Estado no válido');
        }
        
        return $this->update($id, ['estado' => $nuevoEstado]);
    }
}