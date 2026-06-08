import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Sprout, Cloud, ShoppingCart, Bug, IndianRupee, HelpCircle,
  ArrowRight, Mail, Phone, MapPin, Clock, Loader2 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import heroFarm from '@/assets/hero-farm.jpg';

const Index: React.FC = () => {
  const { toast } = useToast();
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }
    
    setSubmitting(true);
    try {
      const { error } = await supabase.from('support').insert({
        name: contactForm.name,
        email: contactForm.email,
        mobile_number: contactForm.phone || null,
        subject: contactForm.subject,
        message: contactForm.message,
        is_registered: false,
      });
      
      if (error) throw error;
      
      toast({
        title: 'Message Sent!',
        description: 'Thank you for contacting us. We will get back to you soon.',
      });
      
      setContactForm({ name: '', phone: '', email: '', subject: 'General Inquiry', message: '' });
    } catch (error: any) {
      console.error('Contact form error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const features = [
    { icon: Sprout, title: 'KrishiBot AI Assistant', desc: 'Get answers, personalized farming advice, crop recommendations, and real-time solutions to improve farm yields.' },
    { icon: Cloud, title: 'Weather Forecast', desc: 'Get accurate local weather predictions to plan your farming activities and protect your harvest.' },
    { icon: ShoppingCart, title: 'Direct Marketplace', desc: 'Sell directly to buyers at fair prices, eliminating middlemen and increasing your profits.' },
    { icon: Bug, title: 'Crop Health Analysis', desc: 'AI-powered disease detection and expert recommendations to keep your crops healthy and thriving.' },
    { icon: IndianRupee, title: 'MSP Reference Guide', desc: 'Access updated Minimum Support Prices to make informed decisions and get fair value for your produce.' },
    { icon: HelpCircle, title: 'Expert Advisory', desc: 'Access toll-free helplines and government resources for agricultural guidance, PM Kisan support, and farming assistance.' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroFarm})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/70 to-primary/90" />
        </div>
        
        <div className="container mx-auto px-4 pt-24 pb-32 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 mb-6 animate-fade-in">
              
              <span className="text-sm text-primary-foreground">Bridging Agriculture & Technology for a Stronger India</span>
            </div>
            
            <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-2 animate-slide-up">
              Connecting Farmers to
            </h1>
            <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold text-yellow-400 mb-6 animate-slide-up animation-delay-100">
              Better Markets
            </h1>
            
            <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto animate-slide-up animation-delay-200">
              KrishiLink is a digital platform that helps farmers access fair prices, expert guidance, weather updates, and connects them directly to buyers — eliminating middlemen.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 animate-scale-in animation-delay-300">
              <Button
                size="lg"
                className="btn-hero"
                onClick={() => window.dispatchEvent(new Event('krishilink:open-register'))}
              >
                Start Selling Today <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <p className="text-primary font-medium mb-2">Why Choose KrishiLink</p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">Everything You Need to Grow & Sell</h2>
            <p className="text-muted-foreground">
              Our comprehensive platform provides all the tools and resources you need to maximize your agricultural success.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="card-gradient border-0 shadow-card hover:shadow-card-hover transition-all hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-primary font-medium mb-2">About KrishiLink</p>
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6">Our Mission: Farmer First</h2>
              <p className="text-muted-foreground mb-6">
                KrishiLink was born from a simple idea: farmers deserve fair prices for their produce. We're building technology that bridges the gap between farmers and markets, eliminating middlemen and ensuring every farmer gets what they truly deserve.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="font-heading text-2xl font-bold text-primary">10+</p>
                  <p className="text-sm text-muted-foreground">Indian Languages</p>
                </div>
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="font-heading text-2xl font-bold text-primary">24/7</p>
                  <p className="text-sm text-muted-foreground">Expert Support</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-background shadow-card">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Sprout className="w-5 h-5 text-green-600" />
                  </div>
                  <h4 className="font-heading font-semibold">Sustainability</h4>
                </div>
                <p className="text-sm text-muted-foreground">Promoting eco-friendly farming practices</p>
              </div>
              
              <div className="p-6 rounded-2xl bg-background shadow-card">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                  </div>
                  <h4 className="font-heading font-semibold">Fair Trade</h4>
                </div>
                <p className="text-sm text-muted-foreground">Direct market access for better prices</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 hero-gradient relative overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Transform Your Farming Business?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join thousands of farmers who are already earning more with KrishiLink. Sign up today — it's completely free!
          </p>
          <Button
            size="lg"
            className="btn-hero"
            onClick={() => window.dispatchEvent(new Event('krishilink:open-register'))}
          >
            Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-primary font-medium mb-2">Get In Touch</p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">We're Here to Help You</h2>
            <p className="text-muted-foreground">
              Have questions? Reach out to our team and we'll get back to you within 24 hours.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h3 className="font-heading font-semibold text-xl mb-6">Contact Information</h3>
                <div className="space-y-4">
                  <a href="mailto:support@krishilink.com" className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">jivaanshyadav@gmail.com</p>
                    </div>
                  </a>
                  
                  <a href="tel:+911234567890" className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">+91 12345 67890</p>
                    </div>
                  </a>
                  
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">KrishiLink</p>
                      <p className="text-sm text-muted-foreground">India</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-heading font-semibold text-xl mb-4">Working Hours</h3>
                <div className="p-4 rounded-xl bg-muted/50">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <Badge className="bg-green-500 text-white mb-2">Support Available 24/7</Badge>
                      <p className="text-sm text-muted-foreground mb-1">Office Hours:</p>
                      <p className="font-medium text-sm">Monday - Saturday: 6:00 AM - 10:00 PM</p>
                      <p className="font-medium text-sm">Sunday: 8:00 AM - 6:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Support Form */}
            <section id="support" className="py-20 bg-muted/30">
            <div className="p-8 rounded-2xl bg-muted/30 border border-border">
              <h3 className="font-heading font-semibold text-xl mb-6">Send Us a Message</h3>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <Input 
                    placeholder="Your Name" 
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <Input 
                    placeholder="Phone Number" 
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Input 
                    type="email"
                    placeholder="Email Address" 
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <Textarea 
                    placeholder="Your Message for us!" 
                    rows={4}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Message'
                  )}
                </Button>
              </form>
            </div>
            </section>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;