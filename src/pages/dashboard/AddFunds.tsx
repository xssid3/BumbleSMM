import { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useTransactions } from '@/hooks/useTransactions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Wallet,
  CreditCard,
  Bitcoin,
  DollarSign,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function AddFunds() {
  const { data: profile } = useProfile();
  const { data: transactions = [] } = useTransactions();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');

  const quickAmounts = [10, 25, 50, 100, 250, 500];
  const amount = selectedAmount || Number(customAmount) || 0;

  const depositTransactions = transactions.filter((t) => t.type === 'deposit');

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Wallet className="w-8 h-8 text-primary" />
          Add Funds
        </h1>
        <p className="text-muted-foreground mt-1">
          Top up your balance to place orders
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Add Funds Form */}
        <div className="space-y-6">
          {/* Current Balance */}
          <Card className="glass-panel-strong border-border/50 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="text-4xl font-bold mt-1">
                    ${Number(profile?.balance || 0).toFixed(2)}
                  </p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <DollarSign className="w-8 h-8 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Amounts */}
          <Card className="glass-panel border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Select Amount</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => {
                      setSelectedAmount(amt);
                      setCustomAmount('');
                    }}
                    className={cn(
                      'p-4 rounded-lg font-bold text-lg transition-all duration-200',
                      selectedAmount === amt
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/80'
                    )}
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="Enter custom amount..."
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedAmount(null);
                  }}
                  className="pl-10"
                  min={1}
                  step={0.01}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card className="glass-panel border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button className="w-full p-4 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-all duration-200 flex items-center gap-4 text-left">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Credit / Debit Card</p>
                  <p className="text-sm text-muted-foreground">Visa, Mastercard, Amex</p>
                </div>
                <Badge variant="outline" className="text-xs">Coming Soon</Badge>
              </button>

              <button className="w-full p-4 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-all duration-200 flex items-center gap-4 text-left">
                <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Bitcoin className="w-6 h-6 text-warning" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Cryptocurrency</p>
                  <p className="text-sm text-muted-foreground">BTC, ETH, USDT, LTC</p>
                </div>
                <Badge variant="outline" className="text-xs">Coming Soon</Badge>
              </button>

              {amount > 0 && (
                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between mb-4">
                    <span className="text-muted-foreground">Amount to deposit</span>
                    <span className="font-bold text-xl">${amount.toFixed(2)}</span>
                  </div>
                  <Button
                    className="w-full"
                    variant="glow"
                    size="lg"
                    disabled
                  >
                    Continue to Payment
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Payment integration coming soon. Contact admin to add funds manually.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Transaction History */}
        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30"
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center',
                        Number(tx.amount) > 0 ? 'bg-success/10' : 'bg-destructive/10'
                      )}
                    >
                      {Number(tx.amount) > 0 ? (
                        <ArrowDownRight className="w-5 h-5 text-success" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-destructive" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium capitalize">
                        {tx.type.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {tx.description || 'No description'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={cn(
                          'font-bold',
                          Number(tx.amount) > 0 ? 'text-success' : 'text-destructive'
                        )}
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
