import { View, Text, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type AvatarGroupProps = {
  userId: string;
};

export function AvatarGroup({ userId }: AvatarGroupProps) {
  const [soldCount, setSoldCount] = useState(0);

  useEffect(() => {
    fetchSoldCount();
  }, [userId]);

  const fetchSoldCount = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('sold_count')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (data) {
        setSoldCount(data.sold_count || 0);
      }
    } catch (error) {
      console.error('Error fetching sold count:', error);
    }
  };

  const getSoldText = (count: number) => {
    if (count === 0) return 'טרם בוצעו עסקאות';
    if (count === 1) return 'בוצעה עסקה אחת';
    if (count < 10) return `בוצעו ${count} עסקאות`;
    if (count < 50) return `בוצעו למעלה מ-${Math.floor(count/10)*10} עסקאות`;
    if (count < 100) return 'בוצעו למעלה מ-50 עסקאות';
    return 'בוצעו למעלה מ-100 עסקאות';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {getSoldText(soldCount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 6,
    marginBottom: 12,
  },
  text: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Heebo-Regular',
  },
});