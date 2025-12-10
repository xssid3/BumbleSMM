import { useState, useMemo } from 'react';
import { useCategories, useServices, useService } from '@/hooks/useServices';
import { usePlaceOrder } from '@/hooks/useOrders';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Search, ShoppingCart, Zap, Tag, Info, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NewOrder() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState(1000);
  const [searchQuery, setSearchQuery] = useState('');
  const [extraInputs, setExtraInputs] = useState<Record<string, string>>({});

  const { data: categories = [] } = useCategories();
  const { data: services = [] } = useServices(selectedCategory || undefined);
  const { data: selectedService } = useService(selectedServiceId || 0);
  const { data: profile } = useProfile();
  const placeOrder = usePlaceOrder();

  const filteredServices = useMemo(() => {
    if (!searchQuery) return services;
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [services, searchQuery]);

  const calculateCost = () => {
    if (!selectedService) return 0;
    if (selectedService.type === 'smm' && selectedService.price_per_1000) {
      return (Number(selectedService.price_per_1000) / 1000) * quantity;
    }
    return Number(selectedService.fixed_price || 0);
  };

  const cost = calculateCost();
  const balance = Number(profile?.balance || 0);
  const hasEnoughBalance = balance >= cost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId || !selectedService) return;

    const inputData: Record<string, unknown> = { ...extraInputs };

    await placeOrder.mutateAsync({
      serviceId: selectedServiceId,
      link: link || undefined,
      quantity: selectedService.type === 'smm' ? quantity : 1,
      inputData: Object.keys(inputData).length > 0 ? inputData : undefined,
    });

    // Reset form
    setLink('');
    setQuantity(1000);
    setExtraInputs({});
    setSelectedServiceId(null);
  };

  const inputSchema = selectedService?.input_schema || [];

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">New Order</h1>
        <p className="text-muted-foreground mt-1">
          Select a service and place your order
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Service Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Categories */}
          <Card className="glass-panel border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium transition-all duration-200',
                    selectedCategory === null
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  )}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      'px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2',
                      selectedCategory === cat.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    )}
                  >
                    <span>{cat.icon}</span>
                    {cat.name}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Services List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredServices.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No services found</p>
              </div>
            ) : (
              filteredServices.map((service) => (
                <Card
                  key={service.id}
                  onClick={() => setSelectedServiceId(service.id)}
                  className={cn(
                    'cursor-pointer transition-all duration-200 hover:border-primary/50',
                    selectedServiceId === service.id
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'glass-panel border-border/50'
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{service.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {service.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {service.type === 'smm' ? 'SMM' : 'Digital'}
                          </Badge>
                          {service.type === 'smm' && (
                            <span className="text-xs text-muted-foreground">
                              {service.min_quantity} - {service.max_quantity}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-primary">
                          {service.type === 'smm'
                            ? `$${Number(service.price_per_1000).toFixed(2)}`
                            : `$${Number(service.fixed_price).toFixed(2)}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {service.type === 'smm' ? '/1000' : 'fixed'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Order Form */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <Card className="glass-panel-strong border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Order Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedService ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Info className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>Select a service to continue</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Selected Service</p>
                      <p className="font-semibold">{selectedService.name}</p>
                    </div>

                    {/* Dynamic Input Fields based on input_schema */}
                    {inputSchema.includes('link') && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Link / URL
                        </label>
                        <Input
                          placeholder="https://..."
                          value={link}
                          onChange={(e) => setLink(e.target.value)}
                          required
                        />
                      </div>
                    )}

                    {inputSchema.includes('quantity') && selectedService.type === 'smm' && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Quantity: {quantity.toLocaleString()}
                        </label>
                        <Slider
                          value={[quantity]}
                          onValueChange={([val]) => setQuantity(val)}
                          min={selectedService.min_quantity || 100}
                          max={selectedService.max_quantity || 100000}
                          step={100}
                          className="my-4"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Min: {selectedService.min_quantity}</span>
                          <span>Max: {selectedService.max_quantity}</span>
                        </div>
                      </div>
                    )}

                    {inputSchema.includes('comments') && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Comments (one per line)
                        </label>
                        <Textarea
                          placeholder="Enter comments..."
                          value={extraInputs.comments || ''}
                          onChange={(e) =>
                            setExtraInputs({ ...extraInputs, comments: e.target.value })
                          }
                          rows={4}
                        />
                      </div>
                    )}

                    {inputSchema.includes('username_only') && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Username
                        </label>
                        <Input
                          placeholder="@username"
                          value={extraInputs.username || ''}
                          onChange={(e) =>
                            setExtraInputs({ ...extraInputs, username: e.target.value })
                          }
                          required
                        />
                      </div>
                    )}

                    {/* Cost Summary */}
                    <div className="pt-4 border-t border-border space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Your Balance</span>
                        <span className={hasEnoughBalance ? 'text-success' : 'text-destructive'}>
                          ${balance.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total Cost</span>
                        <span className="text-primary">${cost.toFixed(2)}</span>
                      </div>
                    </div>

                    {!hasEnoughBalance && (
                      <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Insufficient balance. Please add funds.</span>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      variant="glow"
                      size="lg"
                      disabled={!hasEnoughBalance || placeOrder.isPending}
                    >
                      {placeOrder.isPending ? 'Processing...' : 'Place Order'}
                      <ShoppingCart className="w-4 h-4" />
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
