import React, { useState, useEffect } from 'react';
import { Heart, Mail, Phone, MessageCircle, MapPin, Youtube, Instagram, Facebook, Twitter, Sprout } from 'lucide-react';
import Logo from './Logo';
import SupportModal from './SupportModal';
import { Button } from '@/components/ui/button';

const Footer: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSupport, setShowSupport] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const day = days[date.getDay()];
    const dd = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    
    return `${day}, ${dd} ${month}, ${year} - ${hours.toString().padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
  };

  const contactOptions = [
    { icon: Mail, label: 'Email', value: 'jivaanshyadav@gmail.com', href: 'mailto:jivaanshyadav@gmail.com' },
    { icon: Phone, label: 'Mobile', value: '+91 12345 67890', href: 'tel:+911234567890' },
    { icon: MessageCircle, label: 'WhatsApp', value: '+91 12345 67890', href: 'https://wa.me/911234567890' },
  ];

  const socialLinks = [
    { icon: Youtube, label: 'YouTube', href: 'https://youtube.com' },
    { icon: Instagram, label: 'Instagram', href: 'https://instagram.com' },
    { icon: Facebook, label: 'Facebook', href: 'https://facebook.com' },
    { icon: Twitter, label: 'X/Twitter', href: 'https://twitter.com' },
  ];

  return (
    <>
      <footer className="bg-primary text-primary-foreground">
        

        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-foreground">
                  <Sprout className="w-6 h-6 text-primary" />
                </div>
                <span className="font-heading font-bold text-xl">KrishiLink</span>
              </div>
              <p className="text-primary-foreground/80 text-sm">
                Bridging Farmers and Buyers for fair and transparent agricultural trading.
              </p>
              <div className="flex items-center gap-1 text-primary-foreground/70 text-sm">
                <MapPin className="w-4 h-4" />
                <span>KrishiLink, India</span>
              </div>
            </div>

            {/* Contact Options */}
            <div className="space-y-4">
              <h3 className="font-heading font-semibold text-lg">Contact Us</h3>
              <div className="space-y-3">
                {contactOptions.map((option) => (
                  <a
                    key={option.label}
                    href={option.href}
                    className="flex items-center gap-2 text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  >
                    <option.icon className="w-4 h-4" />
                    <span>{option.value}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="font-heading font-semibold text-lg">Quick Links</h3>
              <nav className="space-y-2">
                <a href="/#features" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">Features</a>
                <a href="/#about" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">About</a>
                <a href="/#contact" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">Contact</a>
                <a href="/#support" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">Support</a>
              </nav>
            </div>

            {/* Social Media */}
            <div className="space-y-4">
              <h3 className="font-heading font-semibold text-lg">Follow Us</h3>
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
                    aria-label={social.label}
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-5 pt-5 border-t border-primary-foreground/20 text-center">
            <p className="text-sm text-primary-foreground/70">
              Made with <Heart className="w-4 h-4 inline-block text-red-400 fill-current" /> for farmers | Developed by <span className="font-semibold">Jivaansh</span>
            </p>
            <p className="text-xs text-primary-foreground/50 mt-2">
              © {new Date().getFullYear()} KrishiLink. All rights reserved.
            </p>
          </div>
        </div>
        {/* DateTime Bar */}
        <div className="bg-primary-dark py-2">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-primary-foreground/80 font-mono">{formatDate(currentTime)}</p>
          </div>
        </div>
      </footer>

      <SupportModal open={showSupport} onOpenChange={setShowSupport} />
    </>
  );
};

export default Footer;
