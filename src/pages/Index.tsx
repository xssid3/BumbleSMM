import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Zap, ArrowRight, ShoppingCart, Shield, Gauge, Globe } from 'lucide-react';

export default function Index() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/20 rounded-full blur-[100px]" />
        </div>

        <nav className="relative z-10 container mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold gradient-text">SMM Panel</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/dashboard">
                <Button variant="glow">Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link to="/auth">
                  <Button variant="glow">Get Started <ArrowRight className="w-4 h-4" /></Button>
                </Link>
              </>
            )}
          </div>
        </nav>

        <div className="relative z-10 container mx-auto px-6 py-24 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
            Grow Your <span className="gradient-text">Social Presence</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up">
            Premium SMM services and digital products. Boost your engagement with instant delivery and 24/7 support.
          </p>
          <Link to="/auth">
            <Button variant="glow" size="xl" className="animate-fade-in-up">
              Start Growing Today <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="relative z-10 container mx-auto px-6 py-20">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Gauge, title: 'Instant Delivery', desc: 'Orders start within minutes' },
              { icon: Shield, title: 'Secure & Safe', desc: 'Your data is always protected' },
              { icon: Globe, title: '24/7 Support', desc: 'Help whenever you need it' },
            ].map((f, i) => (
              <div key={i} className="glass-panel p-8 text-center animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <f.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
