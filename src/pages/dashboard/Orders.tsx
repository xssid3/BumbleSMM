import { useOrders } from '@/hooks/useOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, History, ExternalLink, Eye, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function Orders() {
  const { data: orders = [], isLoading } = useOrders();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

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
                        ${Number(order.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(order.created_at), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)}>
                          <Eye className="w-4 h-4 mr-1" /> View
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

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="glass-panel-strong max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order #{selectedOrder?.id}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground block">Service</span>
                <span className="font-medium">{selectedOrder?.service?.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Status</span>
                {selectedOrder && getStatusBadge(selectedOrder.status)}
              </div>
              <div>
                <span className="text-muted-foreground block">Link</span>
                <a href={selectedOrder?.link} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate block">
                  {selectedOrder?.link}
                </a>
              </div>
              <div>
                <span className="text-muted-foreground block">Quantity</span>
                <span>{selectedOrder?.quantity}</span>
              </div>
            </div>

            {selectedOrder?.status === 'completed' && selectedOrder.fulfillment_data && (
              <div className="mt-6 border-t pt-4">
                <h3 className="font-semibold mb-3">Order Completion Details</h3>

                {selectedOrder.fulfillment_data.text && (
                  <div className="mb-4">
                    <span className="text-sm text-muted-foreground block mb-1">Message</span>
                    <div
                      className="p-3 border rounded-md bg-secondary/20 prose prose-invert max-w-none text-sm"
                      dangerouslySetInnerHTML={{ __html: selectedOrder.fulfillment_data.text }}
                    />
                  </div>
                )}

                {selectedOrder.fulfillment_data.files && selectedOrder.fulfillment_data.files.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground block mb-1">Attached Files</span>
                    <div className="space-y-2">
                      {selectedOrder.fulfillment_data.files.map((file: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 p-2 border rounded-md bg-secondary/10">
                          <FileText className="w-4 h-4 text-primary" />
                          <a href={file.url} target="_blank" rel="noreferrer" className="text-sm hover:underline hover:text-primary">
                            {file.name}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedOrder?.status === 'completed' && !selectedOrder.fulfillment_data && (
              <div className="mt-6 border-t pt-4 text-center text-muted-foreground italic">
                Order marked as completed.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
