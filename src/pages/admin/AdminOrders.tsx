import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockDB as supabase } from '@/services/mock-db';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction
} from '@/components/ui/alert-dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ShoppingCart, Search, CheckCircle, FileText, Upload, X, Eye, Bold, Italic, Link as LinkIcon, List, Heading, Code, Image as ImageIcon, File as FileIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

interface Order {
    id: number;
    user_id: string;
    service_id: number;
    status: 'completed' | 'processing' | 'pending' | 'cancelled';
    amount: number;
    link: string;
    quantity: number;
    created_at: string;
    updated_at?: string;
    service?: { name: string };
    profile?: { email: string };
    fulfillment_data?: {
        text?: string;
        files?: { name: string; url: string }[];
    } | null;
}

const RichTextEditor = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    const insertFormat = (prefix: string, suffix: string = '') => {
        const textarea = document.getElementById('fulfillment-message') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const selection = text.substring(start, end);
        const after = text.substring(end);

        const newText = `${before}${prefix}${selection}${suffix}${after}`;
        onChange(newText);

        // Restore focus and selection
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + prefix.length, end + prefix.length);
        }, 0);
    };

    return (
        <div className="border rounded-md overflow-hidden bg-background">
            <div className="flex items-center gap-1 p-2 border-b bg-muted/40">
                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => insertFormat('**', '**')} title="Bold">
                    <Bold className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => insertFormat('*', '*')} title="Italic">
                    <Italic className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => insertFormat('# ')} title="Heading">
                    <Heading className="w-4 h-4" />
                </Button>
                <div className="w-px h-4 bg-border mx-1" />
                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => insertFormat('- ')} title="List">
                    <List className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => insertFormat('[', '](url)')} title="Link">
                    <LinkIcon className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => insertFormat('`', '`')} title="Code">
                    <Code className="w-4 h-4" />
                </Button>
            </div>
            <Textarea
                id="fulfillment-message"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="min-h-[200px] border-0 focus-visible:ring-0 rounded-none p-4 font-mono text-sm"
                placeholder="Enter fulfillment message... (Markdown supported)"
            />
        </div>
    );
};

export default function AdminOrders() {
    console.log("AdminOrders component mounting...");
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [fulfillmentText, setFulfillmentText] = useState('');
    const [fulfillmentFiles, setFulfillmentFiles] = useState<{ name: string; url: string }[]>([]);
    const [selectedStatus, setSelectedStatus] = useState<string>('completed');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [confirmationAction, setConfirmationAction] = useState<{ type: 'refund' | 'cancel', orderId: number } | null>(null);
    const queryClient = useQueryClient();

    // Fetch all orders with user and service details
    const { data: orders = [], isLoading, error } = useQuery({
        queryKey: ['admin-orders'],
        queryFn: async () => {
            console.log("Fetching orders from mock DB...");
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (ordersError) {
                console.error("Error fetching orders:", ordersError);
                throw ordersError;
            }

            if (!ordersData || ordersData.length === 0) return [];

            const enrichedOrders = await Promise.all(ordersData.map(async (order: any) => {
                let profile = null;
                let service = null;

                if (order.user_id) {
                    const { data } = await supabase.from('profiles').select('email').eq('id', order.user_id).single();
                    profile = data;
                }
                if (order.service_id) {
                    const { data } = await supabase.from('services').select('name').eq('id', order.service_id).single();
                    service = data;
                }

                return {
                    ...order,
                    profile,
                    service
                };
            }));

            console.log("Enriched orders:", enrichedOrders);
            return enrichedOrders as Order[];
        },
    });

    if (error) {
        console.error("Query error:", error);
        return <div className="p-8 text-destructive">Error loading orders: {error.message}</div>;
    }

    const fulfillOrderMutation = useMutation({
        mutationFn: async (data: { orderId: number; fulfillment: any; status: string }) => {
            const { error } = await supabase
                .from('orders')
                .update({
                    status: data.status,
                    fulfillment_data: data.fulfillment,
                    updated_at: new Date().toISOString()
                })
                .eq('id', data.orderId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            toast.success('Order fulfilled successfully!');
            setIsDialogOpen(false);
            resetFulfillmentForm();
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });

    const refundOrderMutation = useMutation({
        mutationFn: async (orderId: number) => {
            const { error } = await supabase.rpc('refund_order', { order_id: orderId });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            toast.success('Order refunded and cancelled successfully!');
            setIsDialogOpen(false);
            resetFulfillmentForm();
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });

    const resetFulfillmentForm = () => {
        setSelectedOrder(null);
        setFulfillmentText('');
        setFulfillmentFiles([]);
        setSelectedStatus('completed');
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map(file => ({
                name: file.name,
                url: URL.createObjectURL(file)
            }));
            setFulfillmentFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFulfillmentFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleFulfillSubmit = () => {
        if (!selectedOrder) return;

        fulfillOrderMutation.mutate({
            orderId: selectedOrder.id,
            fulfillment: {
                text: fulfillmentText,
                files: fulfillmentFiles
            },
            status: selectedStatus
        });
    };

    const filteredOrders = orders.filter(order =>
        order.id.toString().includes(searchQuery) ||
        (order.profile?.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.service?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <ShoppingCart className="w-8 h-8 text-accent" />
                        Order Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        View and fulfill customer orders
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
                            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-muted-foreground mt-4">Loading orders...</p>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">
                            <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No orders found (Total loaded: {orders.length})</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border/50 hover:bg-transparent">
                                        <TableHead>ID</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Service</TableHead>
                                        <TableHead>Link/Qty</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredOrders.map((order) => (
                                        <TableRow key={order.id} className="border-border/50">
                                            <TableCell className="font-mono">#{order.id}</TableCell>
                                            <TableCell className="text-sm">{order.profile?.email || order.user_id}</TableCell>
                                            <TableCell className="max-w-[200px] truncate" title={order.service?.name}>
                                                {order.service?.name || order.service_id}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-xs">
                                                    <a href={order.link} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline truncate max-w-[150px]">{order.link}</a>
                                                    <span className="text-muted-foreground">Qty: {order.quantity}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>${Number(order.amount).toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={
                                                    order.status === 'completed' ? 'bg-success/20 text-success border-success/30' :
                                                        order.status === 'processing' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                                            'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
                                                }>
                                                    {order.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {format(new Date(order.created_at), 'MMM d, HH:mm')}
                                            </TableCell>
                                            <TableCell>
                                                <Dialog open={isDialogOpen && selectedOrder?.id === order.id} onOpenChange={(open) => {
                                                    // Prevent parent from closing if child is open (basic check, can be refined)
                                                    if (!open && confirmationAction) {
                                                        return;
                                                    }
                                                    setIsDialogOpen(open);
                                                    if (!open) resetFulfillmentForm();
                                                }}>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedOrder(order);
                                                                setFulfillmentText(order.fulfillment_data?.text || '');
                                                                setFulfillmentFiles(order.fulfillment_data?.files || []);
                                                                setSelectedStatus(order.status === 'pending' ? 'completed' : order.status);
                                                            }}
                                                        >
                                                            {order.status === 'completed' ? <Eye className="w-4 h-4" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                                                            {order.status === 'completed' ? 'View' : 'Fulfill'}
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="glass-panel-strong max-w-2xl">
                                                        <DialogHeader>
                                                            <DialogTitle>
                                                                {selectedOrder?.status === 'completed' ? 'Order Fulfillment Details' : 'Fulfill Order #' + selectedOrder?.id}
                                                            </DialogTitle>
                                                        </DialogHeader>


                                                        <div className="mb-4">
                                                            <label className="text-sm font-medium mb-2 block">Order Status</label>
                                                            <Select value={selectedStatus} onValueChange={setSelectedStatus} disabled={selectedOrder?.status === 'completed'}>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select status" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="processing">Processing</SelectItem>
                                                                    <SelectItem value="completed">Completed</SelectItem>
                                                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        <Tabs defaultValue="write" className="w-full">
                                                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                                                <TabsTrigger value="write">Write</TabsTrigger>
                                                                <TabsTrigger value="preview">Preview</TabsTrigger>
                                                            </TabsList>

                                                            <TabsContent value="write" className="space-y-4">
                                                                <div>
                                                                    <label className="text-sm font-medium mb-2 block">Message to User</label>
                                                                    <RichTextEditor value={fulfillmentText} onChange={setFulfillmentText} />
                                                                </div>

                                                                <div>
                                                                    <label className="text-sm font-medium mb-2 block">Attachments</label>
                                                                    <div className="space-y-3">
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                            <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                                                                                <input
                                                                                    type="file"
                                                                                    multiple
                                                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                                                    onChange={handleFileUpload}
                                                                                />
                                                                                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                                                                                <p className="text-sm font-medium">Click to upload files</p>
                                                                                <p className="text-xs text-muted-foreground">PDF, JPG, PNG, DOC, ZIP</p>
                                                                            </div>
                                                                        </div>

                                                                        {fulfillmentFiles.length > 0 && (
                                                                            <div className="space-y-2 mt-4">
                                                                                <h4 className="text-sm font-medium text-muted-foreground">Selected Files</h4>
                                                                                <div className="grid grid-cols-1 gap-2">
                                                                                    {fulfillmentFiles.map((file, idx) => (
                                                                                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-card shadow-sm">
                                                                                            <div className="flex items-center gap-3">
                                                                                                <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center">
                                                                                                    {file.name.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                                                                                        <ImageIcon className="w-5 h-5 text-blue-500" />
                                                                                                    ) : (

                                                                                                        <FileIcon className="w-5 h-5 text-orange-500" />
                                                                                                    )}
                                                                                                </div>
                                                                                                <div className="flex flex-col">
                                                                                                    <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
                                                                                                    <span className="text-xs text-muted-foreground">Ready to upload</span>
                                                                                                </div>
                                                                                            </div>
                                                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeFile(idx)}>
                                                                                                <X className="w-4 h-4" />
                                                                                            </Button>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </TabsContent>

                                                            <TabsContent value="preview">
                                                                <div className="min-h-[300px] border rounded-md p-6 bg-card space-y-6">
                                                                    <div>
                                                                        <h3 className="text-lg font-bold mb-4">Order Completed</h3>
                                                                        <div className="prose prose-invert max-w-none text-sm whitespace-pre-wrap">
                                                                            {fulfillmentText || <span className="text-muted-foreground italic">No message content...</span>}
                                                                        </div>
                                                                    </div>

                                                                    {fulfillmentFiles.length > 0 && (
                                                                        <div>
                                                                            <h4 className="text-sm font-medium mb-3">Attachments ({fulfillmentFiles.length})</h4>
                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                                {fulfillmentFiles.map((file, idx) => (
                                                                                    <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg bg-secondary/20">
                                                                                        <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center">
                                                                                            {file.name.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                                                                                <ImageIcon className="w-4 h-4 text-blue-500" />
                                                                                            ) : (
                                                                                                <FileIcon className="w-4 h-4 text-orange-500" />
                                                                                            )}
                                                                                        </div>
                                                                                        <a href={file.url} target="_blank" rel="noreferrer" className="text-sm hover:underline hover:text-primary truncate">{file.name}</a>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </TabsContent>
                                                        </Tabs>

                                                        {selectedOrder?.status !== 'completed' && selectedOrder?.status !== 'cancelled' && (
                                                            <div className="flex gap-3 mt-4">
                                                                <Button
                                                                    className="flex-1"
                                                                    variant="success"
                                                                    onClick={handleFulfillSubmit}
                                                                    disabled={fulfillOrderMutation.isPending}
                                                                >
                                                                    {fulfillOrderMutation.isPending ? 'Processing...' : 'Complete Order'}
                                                                </Button>

                                                                <Button
                                                                    variant="outline"
                                                                    className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                                                                    onClick={() => setConfirmationAction({ type: 'cancel', orderId: selectedOrder.id })}
                                                                    disabled={fulfillOrderMutation.isPending}
                                                                >
                                                                    Cancel (No Refund)
                                                                </Button>

                                                                <Button
                                                                    variant="destructive"
                                                                    className="flex-1"
                                                                    onClick={() => setConfirmationAction({ type: 'refund', orderId: selectedOrder.id })}
                                                                    disabled={refundOrderMutation.isPending}
                                                                >
                                                                    {refundOrderMutation.isPending ? 'Refunding...' : 'Refund & Cancel'}
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </DialogContent>
                                                </Dialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={!!confirmationAction} onOpenChange={(open) => !open && setConfirmationAction(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmationAction?.type === 'refund' ? 'Refund & Cancel Order' : 'Cancel Order (No Refund)'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmationAction?.type === 'refund'
                                ? 'Are you sure you want to REFUND and CANCEL this order? The funds will be securely returned to the user\'s balance.'
                                : 'Are you sure you want to cancel this order WITHOUT issuing a refund? This action cannot be undone.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className={confirmationAction?.type === 'refund' ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"}
                            onClick={() => {
                                if (!confirmationAction) return;

                                if (confirmationAction.type === 'refund') {
                                    refundOrderMutation.mutate(confirmationAction.orderId);
                                } else {
                                    fulfillOrderMutation.mutate({
                                        orderId: confirmationAction.orderId,
                                        fulfillment: null,
                                        status: 'cancelled'
                                    });
                                }
                                setConfirmationAction(null);
                            }}
                        >
                            {confirmationAction?.type === 'refund' ? 'Confirm Refund' : 'Confirm Cancellation'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
