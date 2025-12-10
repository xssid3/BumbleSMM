import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Users, Search, Plus, DollarSign, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ProfileWithRole {
  id: string;
  email: string;
  balance: number;
  created_at: string;
  role?: 'user' | 'admin';
}

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<ProfileWithRole | null>(null);
  const [addAmount, setAddAmount] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async (): Promise<ProfileWithRole[]> => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get roles for all users
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const roleMap = new Map(roles?.map((r) => [r.user_id, r.role]) || []);

      return (profiles || []).map((p) => ({
        ...p,
        role: roleMap.get(p.id) || 'user',
      }));
    },
  });

  const addFundsMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: number }) => {
      // Get current balance
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      const newBalance = Number(profile.balance) + amount;

      // Update balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Create transaction
      await supabase.from('transactions').insert({
        user_id: userId,
        amount,
        type: 'deposit',
        description: 'Admin deposit',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Funds added successfully!');
      setIsDialogOpen(false);
      setAddAmount('');
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.includes(searchQuery)
  );

  const handleAddFunds = () => {
    if (!selectedUser || !addAmount) return;
    const amount = Number(addAmount);
    if (amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }
    addFundsMutation.mutate({ userId: selectedUser.id, amount });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="w-8 h-8 text-accent" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage users and their balances
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
                    <TableHead className="text-muted-foreground">Email</TableHead>
                    <TableHead className="text-muted-foreground">Role</TableHead>
                    <TableHead className="text-muted-foreground">Balance</TableHead>
                    <TableHead className="text-muted-foreground">Joined</TableHead>
                    <TableHead className="text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="border-border/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            user.role === 'admin'
                              ? 'bg-accent/20 text-accent border-accent/30'
                              : ''
                          }
                        >
                          {user.role || 'user'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono font-medium">
                        ${Number(user.balance).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(user.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Dialog open={isDialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                          setIsDialogOpen(open);
                          if (!open) {
                            setSelectedUser(null);
                            setAddAmount('');
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add Funds
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="glass-panel-strong">
                            <DialogHeader>
                              <DialogTitle>Add Funds to {user.email}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Current Balance:</span>
                                <span className="font-mono font-bold text-foreground">
                                  ${Number(user.balance).toFixed(2)}
                                </span>
                              </div>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                  type="number"
                                  placeholder="Amount to add..."
                                  value={addAmount}
                                  onChange={(e) => setAddAmount(e.target.value)}
                                  className="pl-10"
                                  min={0}
                                  step={0.01}
                                />
                              </div>
                              <Button
                                className="w-full"
                                variant="success"
                                onClick={handleAddFunds}
                                disabled={addFundsMutation.isPending}
                              >
                                {addFundsMutation.isPending ? 'Adding...' : 'Add Funds'}
                              </Button>
                            </div>
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
    </div>
  );
}
