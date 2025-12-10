import { useQuery } from '@tanstack/react-query';
import { mockDB as supabase } from '@/services/mock-db';
import { useAuth } from '@/contexts/AuthContext';

export interface Transaction {
  id: number;
  user_id: string;
  amount: number;
  type: 'deposit' | 'refund' | 'order_spend';
  description: string | null;
  order_id: number | null;
  created_at: string;
}

export function useTransactions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async (): Promise<Transaction[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}
