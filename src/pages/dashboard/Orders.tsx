import { useOrders } from '@/hooks/useOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, History, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function Orders() {
  const { data: orders = [], isLoading } = useOrders();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = orders.filter(
    (order) =>
      order.service?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.link?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(order.id).includes(searchQuery)
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-warning/20 text-warning border-warning/30',
      processing: 'bg-primary/20 text-primary border-primary/30',
      completed: 'bg-success/20 text-success border-success/30',
      canceled: 'bg-destructive/20 text-destructive border-destructive/30',
      refunded: 'bg-muted text-muted-foreground border-muted-foreground/30',
    };

    return (
      <Badge variant="outline" className={cn('capitalize', variants[status] || '')}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <History className="w-8 h-8 text-primary" />
            Order History
          </h1>
          <p className="text-muted-foreground mt-1">
            Track and manage all your orders
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card className="glass-panel border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-muted-foreground mt-4">Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{searchQuery ? 'No orders match your search' : 'No orders yet'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-muted-foreground">ID</TableHead>
                    <TableHead className="text-muted-foreground">Service</TableHead>
                    <TableHead className="text-muted-foreground">Link</TableHead>
                    <TableHead className="text-muted-foreground">Quantity</TableHead>
                    <TableHead className="text-muted-foreground">Cost</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id} className="border-border/50">
                      <TableCell className="font-mono text-sm">#{order.id}</TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {order.service?.name || 'Unknown'}
                      </TableCell>
                      <TableCell className="max-w-[150px]">
                        {order.link ? (
                          <a
                            href={order.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1 truncate"
                          >
                            <span className="truncate">{order.link}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{order.quantity?.toLocaleString() || 1}</TableCell>
                      <TableCell className="font-medium">
                        ${Number(order.total_cost).toFixed(2)}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(order.created_at), 'MMM d, yyyy HH:mm')}
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
