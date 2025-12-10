import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Service {
  id: number;
  category_id: number | null;
  name: string;
  type: 'smm' | 'digital_product';
  price_per_1000: number | null;
  fixed_price: number | null;
  min_quantity: number;
  max_quantity: number;
  input_schema: string[];
  description: string | null;
  thumbnail_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data || [];
    },
  });
}

export function useServices(categoryId?: number) {
  return useQuery({
    queryKey: ['services', categoryId],
    queryFn: async (): Promise<Service[]> => {
      let query = supabase
        .from('services')
        .select('*, category:categories(*)')
        .eq('is_active', true);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query.order('name');

      if (error) throw error;
      return (data || []).map(service => ({
        ...service,
        input_schema: service.input_schema as string[],
      }));
    },
  });
}

export function useService(serviceId: number) {
  return useQuery({
    queryKey: ['service', serviceId],
    queryFn: async (): Promise<Service | null> => {
      const { data, error } = await supabase
        .from('services')
        .select('*, category:categories(*)')
        .eq('id', serviceId)
        .maybeSingle();

      if (error) throw error;
      return data ? {
        ...data,
        input_schema: data.input_schema as string[],
      } : null;
    },
    enabled: !!serviceId,
  });
}

interface CreateServiceData {
  name: string;
  type: 'smm' | 'digital_product';
  category_id: number | null;
  price_per_1000?: number | null;
  fixed_price?: number | null;
  min_quantity?: number;
  max_quantity?: number;
  input_schema?: string[];
  description?: string;
}

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateServiceData) => {
      const { data: service, error } = await supabase
        .from('services')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return service;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
}
