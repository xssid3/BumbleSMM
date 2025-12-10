import { useProfile } from '@/hooks/useProfile';
import { useOrders } from '@/hooks/useOrders';
import { useTransactions } from '@/hooks/useTransactions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowUpRight,
} from 'lucide-react';
import { format } from 'date-fns';

export default function DashboardHome() {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's your overview.
          </p>
        </div>
        <Link to="/dashboard/new-order">
          <Button variant="glow" size="lg">
            <ShoppingCart className="w-4 h-4" />
            New Order
          </Button>
        </Link>
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
                <Link to="/dashboard/new-order" className="text-primary hover:underline text-sm">
                  Place your first order
                </Link>
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
                        className={`font-bold ${
                          Number(tx.amount) > 0 ? 'text-success' : 'text-destructive'
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
