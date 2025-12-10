import { useProfile } from '@/hooks/useProfile';
import { useOrders } from '@/hooks/useOrders';
import { useTransactions } from '@/hooks/useTransactions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import {
    Wallet,
    TrendingUp,
    Clock,
    CheckCircle,
    ShoppingCart,
    User,
    Lock,
    Mail
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useUpdateProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

export default function Settings() {
    const { data: profile } = useProfile();
    const { data: orders = [] } = useOrders();
    const { data: transactions = [] } = useTransactions();

    const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'processing').length;
    const completedOrders = orders.filter((o) => o.status === 'completed').length;
    const totalSpent = orders.reduce((sum, o) => sum + Number(o.total_cost), 0);

    const recentOrders = orders.slice(0, 5);
    const recentTransactions = transactions.slice(0, 5);

    const stats = [
        {
            title: 'Balance',
            value: `$${Number(profile?.balance || 0).toFixed(2)}`,
            icon: Wallet,
            color: 'text-primary',
            bg: 'bg-primary/10',
        },
        {
            title: 'Pending Orders',
            value: pendingOrders,
            icon: Clock,
            color: 'text-warning',
            bg: 'bg-warning/10',
        },
        {
            title: 'Completed',
            value: completedOrders,
            icon: CheckCircle,
            color: 'text-success',
            bg: 'bg-success/10',
        },
        {
            title: 'Total Spent',
            value: `$${totalSpent.toFixed(2)}`,
            icon: TrendingUp,
            color: 'text-accent',
            bg: 'bg-accent/10',
        },
    ];

    return (
        <div className="p-6 lg:p-8 space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold">Settings & Overview</h1>
                <p className="text-muted-foreground mt-1">
                    Your account statistics and recent activity.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <Card key={stat.title} className="glass-panel border-border/50">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Profile Settings */}
            <Card className="glass-panel border-border/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Profile Details
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ProfileForm email={profile?.email} />
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <Card className="glass-panel border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Recent Orders</CardTitle>
                        <Link to="/dashboard/orders" className="text-sm text-primary hover:underline">
                            View all
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {recentOrders.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                <p>No orders yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">
                                                {order.service?.name || 'Unknown Service'}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                #{order.id} • {order.quantity || 1} qty
                                            </p>
                                        </div>
                                        <div className="text-right ml-4">
                                            <p className="font-medium">${Number(order.total_cost).toFixed(2)}</p>
                                            <span className={`status-badge status-${order.status}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Transactions */}
                <Card className="glass-panel border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Recent Transactions</CardTitle>
                        <Link to="/dashboard/add-funds" className="text-sm text-primary hover:underline">
                            Add funds
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {recentTransactions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Wallet className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                <p>No transactions yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentTransactions.map((tx) => (
                                    <div
                                        key={tx.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium capitalize">{tx.type.replace('_', ' ')}</p>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {tx.description || 'No description'}
                                            </p>
                                        </div>
                                        <div className="text-right ml-4">
                                            <p
                                                className={`font-bold ${Number(tx.amount) > 0 ? 'text-success' : 'text-destructive'
                                                    }`}
                                            >
                                                {Number(tx.amount) > 0 ? '+' : ''}${Number(tx.amount).toFixed(2)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {format(new Date(tx.created_at), 'MMM d, HH:mm')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function ProfileForm({ email }: { email?: string }) {
    const [formData, setFormData] = useState({
        email: email || '',
        password: '',
        confirmPassword: ''
    });
    const updateProfileMutation = useUpdateProfile();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password && formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        const updates: { email?: string; password?: string } = {};
        if (formData.email !== email) updates.email = formData.email;
        if (formData.password) updates.password = formData.password;

        if (Object.keys(updates).length === 0) {
            return;
        }

        updateProfileMutation.mutate(updates, {
            onSuccess: () => {
                toast.success("Profile updated successfully");
                setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
            },
            onError: (error) => toast.error(error.message)
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-9"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        id="password"
                        type="password"
                        placeholder="Leave blank to keep current"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="pl-9"
                    />
                </div>
            </div>

            {formData.password && (
                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="Confirm new password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className="pl-9"
                        />
                    </div>
                </div>
            )}

            <Button
                type="submit"
                variant="glow"
                disabled={updateProfileMutation.isPending}
            >
                {updateProfileMutation.isPending ? 'Updating...' : 'Update Profile'}
            </Button>
        </form>
    );
}
