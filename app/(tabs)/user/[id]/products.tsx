const fetchProducts = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        profiles!products_user_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'available')
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) throw error;
  } catch (error) {
    console.error('Error fetching products:', error);
  }
}; 