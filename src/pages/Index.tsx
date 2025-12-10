import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useServices } from '@/hooks/useServices';
import { Shield, Zap, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { InstagramIcon, YoutubeIcon, TikTokIcon, FacebookIcon } from '@/components/icons/SocialIcons';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AuthForm } from '@/components/AuthForm';

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: services = [], isLoading } = useServices();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [defaultIsLogin, setDefaultIsLogin] = useState(true);

  const handleBuyNow = (serviceId: number) => {
    if (user) {
      navigate(`/dashboard?serviceId=${serviceId}`);
    } else {
      // Show login popup instead of navigating to /login
      setDefaultIsLogin(true);
      setIsAuthOpen(true);
      // We could store the returnUrl to navigate after success in AuthForm props, 
      // but for simplicity in this popup flow, we can just close it or let user navigate manually.
      // Better UX: AuthForm onSuccess could handle it. 
      // For now, let's just open the popup. User will login and stay on page or go to dashboard default.
      // But typically "Buy Now" -> Login -> Dashboard with item.
      // Let's modify AuthForm to support onSuccess logic better if needed, 
      // or just let the default behavior (navigate to dashboard) happen.
      // AuthForm default behavior navigates to /dashboard. That works for "Buy Now".
    }
  };

  const openAuth = (isLogin: boolean) => {
    setDefaultIsLogin(isLogin);
    setIsAuthOpen(true);
  };

  // Custom Minimal Icons
  const categories = [
    { name: 'Facebook', icon: FacebookIcon, color: 'text-blue-600', count: services.filter(s => s.category?.slug === 'facebook').length },
    { name: 'Instagram', icon: InstagramIcon, color: 'text-pink-500', count: services.filter(s => s.category?.slug === 'instagram').length },
    { name: 'YouTube', icon: YoutubeIcon, color: 'text-red-500', count: services.filter(s => s.category?.slug === 'youtube').length },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass-panel-strong border-b border-border/10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary fill-current" />
            </div>
            <span className="font-bold text-xl tracking-tight">BumbleSMM</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Button variant="default" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={() => openAuth(true)}>
                  Login
                </Button>
                <Button variant="default" className="font-semibold text-black" onClick={() => openAuth(false)}>
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
        {/* ... existing hero content ... */}
        <div className="absolute inset-0 z-0 bg-grid-pattern opacity-50" />
        <div className="absolute inset-0 z-0 hero-gradient" />

        <div className="relative z-10 container mx-auto text-center max-w-5xl">
          <Badge variant="outline" className="mb-8 border-primary/20 text-primary bg-primary/5 px-4 py-1.5 rounded-full backdrop-blur-sm">
            <Shield className="w-3 h-3 mr-2" />
            Trusted by 15,000+ professionals
          </Badge>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1] max-w-4xl mx-auto">
            The World's #1 <span className="text-primary italic">SMM Panel</span><br className="hidden md:block" />
            for <span className="text-primary italic">Viral Growth.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Boost your social media presence instantly. High-quality services for Instagram, YouTube, TikTok, and more at unbeatable prices.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-12 px-8 text-base font-bold text-black" onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base bg-secondary/50 border-white/10 hover:bg-secondary">
              Browse Products
            </Button>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Card key={cat.name} className="glass-panel hover:bg-secondary/50 transition-colors group cursor-pointer border-0">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <cat.icon className={`w-6 h-6 ${cat.color}`} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{cat.name}</h3>
                  <p className="text-sm text-muted-foreground">{cat.count}+ {cat.name} Services</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Featured Products */}
      <div id="products" className="container mx-auto px-6 py-20">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-bold">Featured Products</h2>
          <div className="relative w-64 hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full bg-secondary/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-48 rounded-xl bg-secondary/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card key={service.id} className="glass-panel transition-all hover:-translate-y-1 hover:shadow-2xl flex flex-col border-0">
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                        {service.category?.slug === 'facebook' && <FacebookIcon className="w-5 h-5 text-blue-600" />}
                        {service.category?.slug === 'instagram' && <InstagramIcon className="w-5 h-5 text-pink-500" />}
                        {service.category?.slug === 'youtube' && <YoutubeIcon className="w-5 h-5 text-red-500" />}
                        {service.category?.slug === 'tiktok' && <TikTokIcon className="w-5 h-5 text-cyan-500" />}
                      </div>
                      <div>
                        <h3 className="font-bold line-clamp-1">{service.name}</h3>
                        <Badge variant="secondary" className="text-xs font-normal bg-secondary border-white/10">
                          {service.min_quantity} - {service.max_quantity} qty
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-6 line-clamp-2 flex-1">
                    {service.description || "High quality service with instant delivery and guaranteed results."}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Start From</p>
                      <p className="text-xl font-bold text-primary">
                        {service.type === 'smm'
                          ? `$${Number(service.price_per_1000 || 0).toFixed(2)}`
                          : `$${Number(service.fixed_price || 0).toFixed(2)}`}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleBuyNow(service.id)}
                      className="font-bold text-black"
                    >
                      Buy Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 mt-20 bg-secondary/20">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-black fill-current" />
            </div>
            <span className="font-bold text-lg tracking-tight">BumbleSMM</span>
          </div>
          <p className="text-muted-foreground text-sm">
            &copy; 2024 BumbleSMM. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Auth Dialog */}
      <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
        <DialogContent className="glass-panel-strong p-8 max-w-md border-primary/20">
          <AuthForm defaultIsLogin={defaultIsLogin} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
