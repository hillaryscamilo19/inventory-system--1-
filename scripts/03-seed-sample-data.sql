-- Insert sample employees
INSERT INTO employees (employee_code, full_name, area, position, email, phone) VALUES
('EMP001', 'Juan Pérez García', 'Producción', 'Operario', 'juan.perez@ssv.com', '555-0101'),
('EMP002', 'María López Rodríguez', 'Administración', 'Asistente', 'maria.lopez@ssv.com', '555-0102'),
('EMP003', 'Carlos Martínez Silva', 'Logística', 'Supervisor', 'carlos.martinez@ssv.com', '555-0103'),
('EMP004', 'Ana Fernández Torres', 'Producción', 'Operaria', 'ana.fernandez@ssv.com', '555-0104'),
('EMP005', 'Luis González Ramírez', 'Mantenimiento', 'Técnico', 'luis.gonzalez@ssv.com', '555-0105')
ON CONFLICT (employee_code) DO NOTHING;

-- Insert sample products (uniforms)
INSERT INTO products (code, name, category, subcategory, description, unit, current_stock, minimum_stock, unit_cost, location) VALUES
('UNI001', 'Camisa Polo Azul - Talla M', 'uniform', 'Camisas', 'Camisa polo azul marino con logo', 'unit', 45, 20, 25.00, 'Almacén A-1'),
('UNI002', 'Camisa Polo Azul - Talla L', 'uniform', 'Camisas', 'Camisa polo azul marino con logo', 'unit', 38, 20, 25.00, 'Almacén A-1'),
('UNI003', 'Pantalón Cargo Negro - Talla 32', 'uniform', 'Pantalones', 'Pantalón cargo negro resistente', 'unit', 52, 15, 35.00, 'Almacén A-2'),
('UNI004', 'Pantalón Cargo Negro - Talla 34', 'uniform', 'Pantalones', 'Pantalón cargo negro resistente', 'unit', 48, 15, 35.00, 'Almacén A-2'),
('UNI005', 'Zapatos de Seguridad - Talla 42', 'uniform', 'Calzado', 'Zapatos con punta de acero', 'unit', 28, 10, 65.00, 'Almacén A-3'),
('UNI006', 'Chaleco Reflectivo', 'uniform', 'Seguridad', 'Chaleco alta visibilidad', 'unit', 15, 25, 12.00, 'Almacén A-3'),
('UNI007', 'Gorra con Logo', 'uniform', 'Accesorios', 'Gorra ajustable con logo bordado', 'unit', 67, 30, 8.00, 'Almacén A-1')
ON CONFLICT (code) DO NOTHING;

-- Insert sample products (medications)
INSERT INTO products (code, name, category, subcategory, description, unit, current_stock, minimum_stock, unit_cost, location) VALUES
('MED001', 'Paracetamol 500mg', 'medication', 'Analgésicos', 'Caja con 20 tabletas', 'box', 85, 30, 3.50, 'Botiquín B-1'),
('MED002', 'Ibuprofeno 400mg', 'medication', 'Antiinflamatorios', 'Caja con 20 tabletas', 'box', 72, 30, 4.20, 'Botiquín B-1'),
('MED003', 'Alcohol en Gel 500ml', 'medication', 'Antisépticos', 'Botella dispensadora', 'bottle', 45, 40, 5.00, 'Botiquín B-2'),
('MED004', 'Vendas Elásticas 10cm', 'medication', 'Material de Curación', 'Rollo de 5 metros', 'unit', 38, 20, 2.80, 'Botiquín B-2'),
('MED005', 'Gasas Estériles 10x10cm', 'medication', 'Material de Curación', 'Paquete con 10 unidades', 'pack', 55, 25, 3.00, 'Botiquín B-2'),
('MED006', 'Termómetro Digital', 'medication', 'Equipos', 'Termómetro digital infrarrojo', 'unit', 8, 15, 25.00, 'Botiquín B-1'),
('MED007', 'Mascarillas KN95', 'medication', 'Protección', 'Caja con 50 unidades', 'box', 22, 40, 35.00, 'Botiquín B-3')
ON CONFLICT (code) DO NOTHING;

-- Insert sample admin user (password: admin123)
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@ssv.com', '$2a$10$rKZLvVZhQxVZqVZqVZqVZeO8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K', 'Administrador Sistema', 'admin')
ON CONFLICT (username) DO NOTHING;
