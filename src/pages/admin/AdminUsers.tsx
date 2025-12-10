import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
} from '@/components/ui/dialog';
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
import { Users, Search, DollarSign, Ban, CheckCircle, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateUserRole } from '@/hooks/useProfile';

interface User {
    id: string;
    email: string;
    role: 'admin' | 'user';
    balance: number;
    is_active: boolean;
    created_at: string;
}

export default function AdminUsers() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isFundsDialogOpen, setIsFundsDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userToPromote, setUserToPromote] = useState<User | null>(null);
    const [fundsAmount, setFundsAmount] = useState('');

    const queryClient = useQueryClient();

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['admin-users'],
        queryFn: async (): Promise<User[]> => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
    });

    const addFundsMutation = useMutation({
        mutationFn: async ({ userId, amount }: { userId: string, amount: number }) => {
            // First get current balance to be safe, though we have it in selectedUser
            const { data: user, error: fetchError } = await supabase
                .from('profiles')
                .select('balance')
                .eq('id', userId)
                .single();

            if (fetchError) throw fetchError;

            const newBalance = (user?.balance || 0) + amount;

            const { error } = await supabase
                .from('profiles')
                .update({ balance: newBalance })
                .eq('id', userId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast.success('Balance updated successfully');
            setIsFundsDialogOpen(false);
            setFundsAmount('');
            setSelectedUser(null);
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const updateUserRoleMutation = useUpdateUserRole();

    const toggleStatusMutation = useMutation({
        mutationFn: async (user: User) => {
            const { error } = await supabase
                .from('profiles')
                .update({ is_active: !user.is_active })
                .eq('id', user.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast.success('User status updated');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const handlePromoteDemote = (user: User) => {
        setUserToPromote(user);
    };

    const handleAddFunds = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || !fundsAmount) return;
        addFundsMutation.mutate({
            userId: selectedUser.id,
            amount: parseFloat(fundsAmount)
        });
    };

    const filteredUsers = users.filter((user) =>
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Users className="w-8 h-8 text-accent" />
                        User Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage users and balances
                    </p>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        placeholder="Search users..."
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
                            <p className="text-muted-foreground mt-4">Loading users...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">
                            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No users found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border/50 hover:bg-transparent">
                                        <TableHead className="text-muted-foreground">User</TableHead>
                                        <TableHead className="text-muted-foreground">Role</TableHead>
                                        <TableHead className="text-muted-foreground">Balance</TableHead>
                                        <TableHead className="text-muted-foreground">Status</TableHead>
                                        <TableHead className="text-muted-foreground">Joined</TableHead>
                                        <TableHead className="text-muted-foreground">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user) => (
                                        <TableRow key={user.id} className="border-border/50">
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{user.email}</span>
                                                    <span className="text-xs text-muted-foreground font-mono">{user.id}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={user.role === 'admin' ? "default" : "secondary"}>
                                                    {user.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-accent">
                                                ${user.balance?.toFixed(2) || '0.00'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        user.is_active
                                                            ? 'bg-success/20 text-success border-success/30'
                                                            : 'bg-muted text-muted-foreground'
                                                    }
                                                >
                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setIsFundsDialogOpen(true);
                                                        }}
                                                    >
                                                        <DollarSign className="w-4 h-4 mr-1" />
                                                        Manage Balance
                                                    </Button>
                                                    <Button
                                                        variant={user.is_active ? "destructive" : "success"}
                                                        size="sm"
                                                        onClick={() => toggleStatusMutation.mutate(user)}
                                                        disabled={user.role === 'admin'} // Prevent banning admins
                                                    >
                                                        {user.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handlePromoteDemote(user)}
                                                        title={user.role === 'admin' ? "Demote to User" : "Promote to Admin"}
                                                    >
                                                        <Shield className={`w-4 h-4 ${user.role === 'admin' ? 'text-destructive' : 'text-primary'}`} />
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

            <Dialog open={isFundsDialogOpen} onOpenChange={(open) => {
                setIsFundsDialogOpen(open);
                if (!open) {
                    setFundsAmount('');
                    setSelectedUser(null);
                }
            }}>
                <DialogContent className="glass-panel-strong max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Manage Balance</DialogTitle>
                    </DialogHeader>
                    <div className="pt-4">
                        <p className="text-sm text-muted-foreground mb-4">
                            Managing balance for <b>{selectedUser?.email}</b>
                        </p>
                        <div className="bg-secondary/30 p-3 rounded-md mb-4 flex justify-between items-center">
                            <span className="text-sm">Current Balance:</span>
                            <span className="font-mono font-bold">${selectedUser?.balance?.toFixed(2)}</span>
                        </div>
                        <form onSubmit={handleAddFunds} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Amount ($)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        value={fundsAmount}
                                        onChange={(e) => setFundsAmount(e.target.value)}
                                        className="pl-9"
                                        placeholder="0.00"
                                        step="0.01"
                                        required
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Use negative value (e.g. -5.00) to deduct funds.
                                </p>
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                variant="glow"
                                disabled={addFundsMutation.isPending}
                            >
                                {addFundsMutation.isPending ? 'Processing...' : 'Update Balance'}
                            </Button>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!userToPromote} onOpenChange={(open) => !open && setUserToPromote(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {userToPromote?.role === 'admin' ? 'Demote Admin' : 'Promote User'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to {userToPromote?.role === 'admin' ? 'demote' : 'promote'}
                            <span className="font-semibold"> {userToPromote?.email}</span>?
                            {userToPromote?.role !== 'admin' && (
                                <span className="block mt-2 text-warning">
                                    They will gain full access to the Admin Panel.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className={userToPromote?.role === 'admin' ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"}
                            onClick={() => {
                                if (userToPromote) {
                                    const newRole = userToPromote.role === 'admin' ? 'user' : 'admin';
                                    updateUserRoleMutation.mutate(
                                        { userId: userToPromote.id, newRole },
                                        {
                                            onSuccess: () => {
                                                toast.success(`User updated successfully`);
                                                setUserToPromote(null);
                                            },
                                            onError: (e) => toast.error(e.message)
                                        }
                                    );
                                }
                            }}
                        >
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
}
