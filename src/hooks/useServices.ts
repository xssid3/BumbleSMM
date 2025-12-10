import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockDB as supabase } from '@/services/mock-db';

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

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, slug: customSlug, icon }: { name: string; slug?: string; icon?: string }) => {
      const slug = customSlug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const { data: category, error } = await supabase
        .from('categories')
        .insert({
          name,
          slug,
          icon, // Use provided icon
          sort_order: 99,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
