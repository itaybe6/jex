-- Create a function to handle product and specs insertion in a single transaction
CREATE OR REPLACE FUNCTION create_product_with_specs(
  product_data JSON,
  specs_data JSON
)
RETURNS JSON AS $$
DECLARE
  new_product products%ROWTYPE;
BEGIN
  -- Start transaction
  BEGIN
    -- Insert the product first
    INSERT INTO products (
      title,
      description,
      price,
      category,
      user_id
    )
    SELECT
      (product_data->>'title')::TEXT,
      (product_data->>'description')::TEXT,
      (product_data->>'price')::NUMERIC,
      (product_data->>'category')::TEXT,
      (product_data->>'user_id')::UUID
    RETURNING * INTO new_product;

    -- If this is a gem product, insert gem specs
    IF (product_data->>'category') = 'Gems' AND specs_data IS NOT NULL THEN
      INSERT INTO gem_specs (
        product_id,
        type,
        origin,
        weight,
        shape,
        clarity,
        transparency,
        has_certification,
        certification,
        dimensions
      ) VALUES (
        new_product.id,
        (specs_data->>'type')::TEXT,
        (specs_data->>'origin')::TEXT,
        (specs_data->>'weight')::TEXT,
        (specs_data->>'shape')::TEXT,
        (specs_data->>'clarity')::TEXT,
        (specs_data->>'transparency')::BOOLEAN,
        (specs_data->>'has_certification')::BOOLEAN,
        (specs_data->>'certification')::TEXT,
        (specs_data->>'dimensions')::TEXT
      );
    END IF;

    -- Return the created product
    RETURN row_to_json(new_product);
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback transaction on error
      RAISE EXCEPTION 'Failed to create product: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 