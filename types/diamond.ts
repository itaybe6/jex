export type DiamondRequest = {
  id: string;
  user_id: string;
  category: string;
  details: any;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
}; 