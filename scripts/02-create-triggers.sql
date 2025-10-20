-- Function to update product stock on entry
CREATE OR REPLACE FUNCTION update_stock_on_entry()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET current_stock = current_stock + NEW.quantity,
      updated_at = NOW()
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update product stock on exit
CREATE OR REPLACE FUNCTION update_stock_on_exit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.movement_type = 'delivered' THEN
    UPDATE products
    SET current_stock = current_stock - NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.product_id;
  ELSIF NEW.movement_type = 'returned' THEN
    UPDATE products
    SET current_stock = current_stock + NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_stock_on_entry ON stock_entries;
CREATE TRIGGER trigger_update_stock_on_entry
AFTER INSERT ON stock_entries
FOR EACH ROW
EXECUTE FUNCTION update_stock_on_entry();

DROP TRIGGER IF EXISTS trigger_update_stock_on_exit ON stock_exits;
CREATE TRIGGER trigger_update_stock_on_exit
AFTER INSERT ON stock_exits
FOR EACH ROW
EXECUTE FUNCTION update_stock_on_exit();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update triggers for timestamp
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
