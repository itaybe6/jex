export type DiamondRequest = {
  id: string;
  user_id: string;
  cut: string;
  min_weight: number;
  max_weight: number;
  clarity: string;
  color: string;
  price: number | null;
  status: string;
  created_at: string;
  expires_at: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
}; 