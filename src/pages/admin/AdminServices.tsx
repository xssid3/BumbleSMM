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
import { Package, Search, Plus, Edit, DollarSign, Ban, CheckCircle, Trash2, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useCategories, useCreateCategory, useDeleteService, useDeleteCategory } from '@/hooks/useServices';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { PLATFORM_ICONS, PRESET_ICONS, PlatformType } from '@/components/icons/SocialIcons';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
    is_active: true,
  });

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySlug, setNewCategorySlug] = useState<PlatformType | ''>('');
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const createCategoryMutation = useCreateCategory();
  const deleteServiceMutation = useDeleteService();
  const deleteCategoryMutation = useDeleteCategory();

  const [availableSchemaOptions] = useState([
    { id: 'link', label: 'Link' },
    { id: 'quantity', label: 'Quantity' },
    { id: 'comments', label: 'Comments' },
    { id: 'username_only', label: 'Username Only' }
  ]);
  const [newCustomField, setNewCustomField] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: number, name: string } | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<{ id: number, name: string } | null>(null);

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;
    createCategoryMutation.mutate({
      name: newCategoryName,
      slug: newCategorySlug || undefined,
      icon: newCategorySlug ? (newCategorySlug.charAt(0).toUpperCase() + newCategorySlug.slice(1)) : undefined
    }, {
      onSuccess: () => {
        toast.success("Category created!");
        setNewCategoryName('');
        setNewCategorySlug('');
        setIsCategoryDialogOpen(false);
      }
    });
  };

  const handlePresetSelect = (platform: PlatformType) => {
    setNewCategoryName(platform.charAt(0).toUpperCase() + platform.slice(1));
    setNewCategorySlug(platform);
  };

  const handleAddCustomField = () => {
    if (!newCustomField.trim()) return;
    const currentSchema = JSON.parse(formData.input_schema || '[]');
    if (!currentSchema.includes(newCustomField)) {
      setFormData({
        ...formData,
        input_schema: JSON.stringify([...currentSchema, newCustomField])
      });
    }
    setNewCustomField('');
  };

  const toggleSchemaField = (fieldId: string) => {
    const currentSchema = JSON.parse(formData.input_schema || '[]');
    let newSchema;
    if (currentSchema.includes(fieldId)) {
      newSchema = currentSchema.filter((f: string) => f !== fieldId);
    } else {
      newSchema = [...currentSchema, fieldId];
    }
    setFormData({
      ...formData,
      input_schema: JSON.stringify(newSchema)
    });
  };

  const removeSchemaField = (fieldId: string) => {
    const currentSchema = JSON.parse(formData.input_schema || '[]');
    const newSchema = currentSchema.filter((f: string) => f !== fieldId);
    setFormData({
      ...formData,
      input_schema: JSON.stringify(newSchema)
    });
  };

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
      is_active: true,
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
        is_active: data.is_active,
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
      queryClient.invalidateQueries({ queryKey: ['service'] });
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
      is_active: service.is_active ?? true,
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

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
                  />
                  <Label htmlFor="is_active">Active</Label>
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
                    <label className="text-sm font-medium mb-2 block">
                      Category
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 ml-2 text-xs"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsCategoryDialogOpen(true);
                        }}
                      >
                        + New
                      </Button>
                    </label>
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
                            {cat.name}
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
                    Input Fields
                  </label>
                  <div className="space-y-3 p-3 border rounded-md">
                    <div className="grid grid-cols-2 gap-2">
                      {availableSchemaOptions.map((opt) => (
                        <div key={opt.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`schema-${opt.id}`}
                            checked={(JSON.parse(formData.input_schema || '[]')).includes(opt.id)}
                            onCheckedChange={() => toggleSchemaField(opt.id)}
                          />
                          <Label htmlFor={`schema-${opt.id}`}>{opt.label}</Label>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 items-center mt-2">
                      <Input
                        value={newCustomField}
                        onChange={(e) => setNewCustomField(e.target.value)}
                        placeholder="Add custom field..."
                        className="h-8"
                      />
                      <Button type="button" size="sm" onClick={handleAddCustomField} variant="secondary">Add</Button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {JSON.parse(formData.input_schema || '[]').map((field: string) => (
                        <Badge key={field} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
                          {field}
                          <X
                            className="w-3 h-3 cursor-pointer hover:text-destructive"
                            onClick={() => removeSchemaField(field)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
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

          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogContent className="glass-panel-strong">
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">

                {/* Popular Presets */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Quick Add</Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(PRESET_ICONS).map((key) => {
                      const Icon = PRESET_ICONS[key as PlatformType];
                      return (
                        <Button
                          key={key}
                          variant="outline"
                          size="sm"
                          onClick={() => handlePresetSelect(key as PlatformType)}
                          className={newCategorySlug === key ? 'border-primary bg-primary/10' : ''}
                        >
                          <Icon className="w-4 h-4 mr-2" />
                          <span className="capitalize">{key}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Category Name</label>
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="e.g., Best Sellers"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-medium block">Icon / Symbol</label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs p-3 glass-panel-strong">
                            <p>Choose an icon to represent this category. Generic icons (Star, Fire) are great for 'Popular' or 'Trending' categories.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <Select
                      value={newCategorySlug}
                      onValueChange={(val) => setNewCategorySlug(val as PlatformType)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select icon..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        <SelectItem value="_custom">Custom (No Icon)</SelectItem>
                        {Object.keys(PLATFORM_ICONS).map((key) => (
                          <SelectItem key={key} value={key} className="capitalize">
                            {key}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  className="w-full"
                  variant="glow"
                  onClick={handleCreateCategory}
                  disabled={!newCategoryName.trim()}
                >
                  Create Category
                </Button>
              </div>

              <div className="mt-6 border-t pt-4">
                <h4 className="text-sm font-medium mb-3">Existing Categories</h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {[...categories].sort((a, b) => b.id - a.id).map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-2 bg-secondary/50 rounded-md">
                      <span className="text-sm">{cat.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCategoryToDelete({ id: cat.id, name: cat.name });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

            </DialogContent>
          </Dialog>

          <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Category?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the category
                  "{categoryToDelete?.name}". Services in this category will be preserved but unlinked.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => {
                    if (categoryToDelete) {
                      deleteCategoryMutation.mutate(categoryToDelete.id, {
                        onSuccess: () => {
                          toast.success('Category deleted');
                          setCategoryToDelete(null);
                        }
                      });
                    }
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={!!serviceToDelete} onOpenChange={(open) => !open && setServiceToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Service?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the service
                  "{serviceToDelete?.name}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => {
                    if (serviceToDelete) {
                      deleteServiceMutation.mutate(serviceToDelete.id, {
                        onSuccess: () => {
                          toast.success('Service deleted');
                          setServiceToDelete(null);
                        }
                      });
                    }
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(service)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant={service.is_active ? "destructive" : "success"}
                            size="sm"
                            onClick={() => {
                              // Direct mutation for quick toggle
                              createServiceMutation.mutate({
                                ...formData,
                                name: service.name, // Minimum required fields to satisfy type, though strictly we might want a dedicated toggle mutation.
                                // Actually, we should probably just use the update logic from createServiceMutation but we need to populate generic fields.
                                // Better approach: Let's reuse handleEdit logic but immediately submit? No, that's messy.
                                // Cleaner: Create a dedicated toggle function or just use editingService logic?
                                // For now, let's use a quick mutation call.
                                ...service,
                                type: service.type,
                                category_id: service.category_id?.toString() || '',
                                price_per_1000: service.price_per_1000?.toString() || '',
                                fixed_price: service.fixed_price?.toString() || '',
                                min_quantity: service.min_quantity?.toString() || '100',
                                max_quantity: service.max_quantity?.toString() || '100000',
                                description: service.description || '',
                                input_schema: JSON.stringify(service.input_schema || []),
                                is_active: !service.is_active
                              } as any);
                              // The cast is ugly but efficient for this quick fix. ideally new mutation.
                              // Let's set editingService to this service so mutation knows it's an update
                              setEditingService(service);
                            }}
                          >
                            {service.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setServiceToDelete({ id: service.id, name: service.name });
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div >
  );
}
