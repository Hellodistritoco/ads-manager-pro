// =====================================================
// PHP/MODELS/CLIENTE.PHP - Modelo Cliente
// =====================================================

class Cliente extends BaseModel {
    protected $table = 'clientes';
    protected $fillable = [
        'nombre', 'empresa', 'email', 'telefono', 'segmento',
        'objetivo_principal', 'presupuesto_mensual', 'industria', 
        'tamano_empresa', 'activo'
    ];
    
    // Obtener clientes activos
    public function getActivos() {
        return $this->getAll(['activo' => 1], 'nombre ASC');
    }
    
    // Obtener cliente por email
    public function getByEmail($email) {
        $sql = "SELECT * FROM {$this->table} WHERE email = :email";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['email' => $email]);
        
        return $stmt->fetch();
    }
    
    // Obtener clientes por segmento
    public function getBySegmento($segmento) {
        return $this->getAll(['segmento' => $segmento]);
    }
    
    // Obtener estadísticas del cliente
    public function getEstadisticas($clienteId) {
        $sql = "
            SELECT 
                c.id,
                c.nombre,
                c.empresa,
                COUNT(DISTINCT e.id) as total_estrategias,
                COUNT(DISTINCT m.id) as total_reportes,
                COUNT(DISTINCT o.id) as total_optimizaciones,
                COALESCE(SUM(m.inversion_total), 0) as inversion_total,
                COALESCE(SUM(m.ingresos_total), 0) as ingresos_total,
                COALESCE(AVG(m.roas), 0) as roas_promedio
            FROM clientes c
            LEFT JOIN estrategias e ON c.id = e.cliente_id
            LEFT JOIN metricas m ON c.id = m.cliente_id
            LEFT JOIN optimizaciones o ON c.id = o.cliente_id
            WHERE c.id = :cliente_id
            GROUP BY c.id
        ";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['cliente_id' => $clienteId]);
        
        return $stmt->fetch();
    }
    
    // Validar datos del cliente
    public function validate($data) {
        $errors = [];
        
        if (empty($data['nombre'])) {
            $errors[] = 'El nombre es requerido';
        }
        
        if (empty($data['email'])) {
            $errors[] = 'El email es requerido';
        } elseif (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'El email no es válido';
        }
        
        if (!empty($data['email'])) {
            $existing = $this->getByEmail($data['email']);
            if ($existing && $existing['id'] != ($data['id'] ?? null)) {
                $errors[] = 'El email ya está registrado';
            }
        }
        
        return $errors;
    }
    
    // Desactivar cliente
    public function desactivar($id) {
        return $this->update($id, ['activo' => 0]);
    }
    
    // Activar cliente
    public function activar($id) {
        return $this->update($id, ['activo' => 1]);
    }
}
