-- Create transactions table for user-to-user sales
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  buyer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  price numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, completed, canceled
  confirmed_at timestamptz,
  canceled_at timestamptz
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Allow both seller and buyer to view their transactions
CREATE POLICY "Users can view their transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

-- Allow seller to create a transaction
CREATE POLICY "Seller can create transaction"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

-- Allow buyer to update status to completed/canceled
CREATE POLICY "Buyer can update their transaction status"
  ON transactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = buyer_id)
  WITH CHECK (auth.uid() = buyer_id); 