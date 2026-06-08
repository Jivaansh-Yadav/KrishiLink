import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Logo from './Logo';
import { Button } from '@/components/ui/button';
import { Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import RegisterModal from './auth/RegisterModal';
import LoginModal from './auth/LoginModal';

const Header: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const showMarketingNav = !user && location.pathname === '/';

  useEffect(() => {
    const handler = () => setShowRegister(true);
    window.addEventListener('krishilink:open-register', handler);
    return () => window.removeEventListener('krishilink:open-register', handler);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navLinks = [
    { href: '#features', label: 'Features' },
    { href: '#about', label: 'About' },
    { href: '#contact', label: 'Contact' },
    { href: '#support', label: 'Support' },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 glass-effect">
        <div className="container mx-auto px-4">
          <div className="relative flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Logo />

            {/* Desktop Navigation */}
            {showMarketingNav && (
              <nav className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-10">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="nav-link-animated text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            )}

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                  <Button variant="outline" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => setShowLogin(true)}>
                    Login
                  </Button>
                  <Button onClick={() => setShowRegister(true)}>
                    Get Started
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-background">
            <div className="container mx-auto px-4 py-4 space-y-4">
              {showMarketingNav && (
                <nav className="flex flex-col gap-2">
                  {navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className="py-2 text-foreground/80 hover:text-primary transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </a>
                  ))}
                </nav>
              )}
              <div className="pt-4 border-t border-border space-y-2">
                {user ? (
                  <>
                    <Button className="w-full" onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }}>
                      Dashboard
                    </Button>
                    <Button variant="outline" className="w-full" onClick={handleSignOut}>
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="w-full" onClick={() => { setShowLogin(true); setMobileMenuOpen(false); }}>
                      Login
                    </Button>
                    <Button className="w-full" onClick={() => { setShowRegister(true); setMobileMenuOpen(false); }}>
                      Get Started
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <RegisterModal open={showRegister} onOpenChange={setShowRegister} onSwitchToLogin={() => { setShowRegister(false); setShowLogin(true); }} />
      <LoginModal open={showLogin} onOpenChange={setShowLogin} onSwitchToRegister={() => { setShowLogin(false); setShowRegister(true); }} />
    </>
  );
};

export default Header;