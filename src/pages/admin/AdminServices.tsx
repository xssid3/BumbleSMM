import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Package, Search, Plus, Edit, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useCategories } from '@/hooks/useServices';

interface Service {
  id: number;
  name: string;
  type: 'smm' | 'digital_product';
  category_id: number | null;
  price_per_1000: number | null;
  fixed_price: number | null;
  min_quantity: number | null;
  max_quantity: number | null;
  description: string | null;
  is_active: boolean | null;
  input_schema: string[] | null;
}

export default function AdminServices() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const queryClient = useQueryClient();

  const { data: categories = [] } = useCategories();

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['admin-services'],
    queryFn: async (): Promise<Service[]> => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name');

      if (error) throw error;
      return (data || []).map(s => ({
        ...s,
        input_schema: s.input_schema as string[] | null,
      }));
    },
  });

  const [formData, setFormData] = useState({
    name: '',
    type: 'smm' as 'smm' | 'digital_product',
    category_id: '',
    price_per_1000: '',
    fixed_price: '',
    min_quantity: '100',
    max_quantity: '100000',
    description: '',
    input_schema: '["link", "quantity"]',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'smm',
      category_id: '',
      price_per_1000: '',
      fixed_price: '',
      min_quantity: '100',
      max_quantity: '100000',
      description: '',
      input_schema: '["link", "quantity"]',
    });
    setEditingService(null);
  };

  const createServiceMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      let inputSchema: string[];
      try {
        inputSchema = JSON.parse(data.input_schema);
      } catch {
        inputSchema = ['link', 'quantity'];
      }

      const serviceData = {
        name: data.name,
        type: data.type,
        category_id: data.category_id ? Number(data.category_id) : null,
        price_per_1000: data.type === 'smm' ? Number(data.price_per_1000) : null,
        fixed_price: data.type === 'digital_product' ? Number(data.fixed_price) : null,
        min_quantity: Number(data.min_quantity),
        max_quantity: Number(data.max_quantity),
        description: data.description || null,
        input_schema: inputSchema,
      };

      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('services').insert(serviceData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success(editingService ? 'Service updated!' : 'Service created!');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      type: service.type,
      category_id: service.category_id?.toString() || '',
      price_per_1000: service.price_per_1000?.toString() || '',
      fixed_price: service.fixed_price?.toString() || '',
      min_quantity: service.min_quantity?.toString() || '100',
      max_quantity: service.max_quantity?.toString() || '100000',
      description: service.description || '',
      input_schema: JSON.stringify(service.input_schema || ['link', 'quantity']),
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Name is required');
      return;
    }
    createServiceMutation.mutate(formData);
  };

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Package className="w-8 h-8 text-accent" />
            Service Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage services
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button variant="glow">
                <Plus className="w-4 h-4" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-panel-strong max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingService ? 'Edit Service' : 'Create New Service'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Service name..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Type</label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: 'smm' | 'digital_product') =>
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="smm">SMM Service</SelectItem>
                        <SelectItem value="digital_product">Digital Product</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Category</label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.icon} {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.type === 'smm' ? (
                  <>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Price per 1000</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="number"
                          value={formData.price_per_1000}
                          onChange={(e) => setFormData({ ...formData, price_per_1000: e.target.value })}
                          className="pl-9"
                          placeholder="0.00"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Min Quantity</label>
                        <Input
                          type="number"
                          value={formData.min_quantity}
                          onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Max Quantity</label>
                        <Input
                          type="number"
                          value={formData.max_quantity}
                          onChange={(e) => setFormData({ ...formData, max_quantity: e.target.value })}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Fixed Price</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={formData.fixed_price}
                        onChange={(e) => setFormData({ ...formData, fixed_price: e.target.value })}
                        className="pl-9"
                        placeholder="0.00"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Service description..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Input Schema (JSON array)
                  </label>
                  <Input
                    value={formData.input_schema}
                    onChange={(e) => setFormData({ ...formData, input_schema: e.target.value })}
                    placeholder='["link", "quantity"]'
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Options: link, quantity, comments, username_only
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  variant="glow"
                  disabled={createServiceMutation.isPending}
                >
                  {createServiceMutation.isPending
                    ? 'Saving...'
                    : editingService
                    ? 'Update Service'
                    : 'Create Service'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="glass-panel border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-muted-foreground mt-4">Loading services...</p>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No services yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-muted-foreground">ID</TableHead>
                    <TableHead className="text-muted-foreground">Name</TableHead>
                    <TableHead className="text-muted-foreground">Type</TableHead>
                    <TableHead className="text-muted-foreground">Price</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service) => (
                    <TableRow key={service.id} className="border-border/50">
                      <TableCell className="font-mono">#{service.id}</TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {service.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {service.type === 'smm' ? 'SMM' : 'Digital'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">
                        {service.type === 'smm'
                          ? `$${Number(service.price_per_1000).toFixed(2)}/1k`
                          : `$${Number(service.fixed_price).toFixed(2)}`}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            service.is_active
                              ? 'bg-success/20 text-success border-success/30'
                              : 'bg-muted text-muted-foreground'
                          }
                        >
                          {service.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(service)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
