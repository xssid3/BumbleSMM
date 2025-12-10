import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockDB as supabase } from '@/services/mock-db';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface Order {
  id: number;
  user_id: string;
  service_id: number | null;
  link: string | null;
  quantity: number | null;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'canceled' | 'refunded';
  input_data: Json | null;
  start_count: number | null;
  remains: number | null;
  created_at: string;
  updated_at: string;
  service?: {
    id: number;
    name: string;
    type: string;
  } | null;
}

export function useOrders() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async (): Promise<Order[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('orders')
        .select('*, service:services(id, name, type)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Order[];
    },
    enabled: !!user,
  });
}

interface PlaceOrderData {
  serviceId: number;
  link?: string;
  quantity?: number;
  inputData?: Record<string, unknown>;
}

export function usePlaceOrder() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ serviceId, link, quantity, inputData }: PlaceOrderData) => {
      if (!user) throw new Error('You must be logged in to place an order');

      // 1. Fetch service details
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single();

      if (serviceError) throw serviceError;
      if (!service) throw new Error('Service not found');

      // 2. Fetch user balance
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile) throw new Error('Profile not found');

      // 3. Calculate cost
      let totalCost: number;
      if (service.type === 'smm') {
        if (!quantity || !service.price_per_1000) {
          throw new Error('Quantity is required for SMM services');
        }
        totalCost = (Number(service.price_per_1000) / 1000) * quantity;
      } else {
        if (!service.fixed_price) {
          throw new Error('Fixed price not set for this product');
        }
        totalCost = Number(service.fixed_price);
      }

      // 4. Check balance
      const currentBalance = Number(profile.balance);
      if (currentBalance < totalCost) {
        throw new Error(`Insufficient balance. You need $${totalCost.toFixed(2)} but have $${currentBalance.toFixed(2)}`);
      }

      // 5. Deduct balance
      const newBalance = currentBalance - totalCost;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 6. Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          service_id: serviceId,
          link: link || null,
          quantity: quantity || 1,
          amount: totalCost,
          status: 'pending' as const,
          input_data: (inputData as Json) || null,
        })
        .select()
        .single();

      if (orderError) {
        // Rollback balance if order fails
        await supabase
          .from('profiles')
          .update({ balance: currentBalance })
          .eq('id', user.id);
        throw orderError;
      }

      // 7. Create transaction record
      await supabase.from('transactions').insert({
        user_id: user.id,
        amount: -totalCost,
        type: 'order_spend' as const,
        description: `Order #${order.id} - ${service.name}`,
        order_id: order.id,
      });

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Order placed successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
