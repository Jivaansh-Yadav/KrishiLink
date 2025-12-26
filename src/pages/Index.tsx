import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sprout, Users, TrendingUp, ArrowRight, Zap, Shield, MessageSquare, CheckCircle } from 'lucide-react';

const Index: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center hero-gradient overflow-hidden">
        <div className="decorative-circle w-64 h-64 -top-20 -left-20" />
        <div className="decorative-circle w-48 h-48 top-1/4 right-10" />
        <div className="decorative-circle w-32 h-32 bottom-32 left-1/4" />
        
        <div className="container mx-auto px-4 pt-24 pb-32 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 mb-6 animate-fade-in">
              <Sprout className="w-4 h-4 text-primary-foreground" />
              <span className="text-sm text-primary-foreground">Digital Agriculture Platform</span>
            </div>
            
            <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 animate-slide-up">
              Bridging Farmers<br />and Buyers
            </h1>
            
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 animate-slide-up animation-delay-200">
              Smarter, Faster, and Simpler agricultural trading
            </p>
            
            <Button size="lg" className="btn-hero animate-scale-in animation-delay-300">
              Get Started <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 animate-fade-in animation-delay-500">
              <div className="text-center">
                <p className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground">10K+</p>
                <p className="text-sm text-primary-foreground/70">Farmers</p>
              </div>
              <div className="text-center">
                <p className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground">5K+</p>
                <p className="text-sm text-primary-foreground/70">Buyers</p>
              </div>
              <div className="text-center">
                <p className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground">₹50Cr+</p>
                <p className="text-sm text-primary-foreground/70">Trade Value</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="wave-divider absolute bottom-0 left-0 right-0" />
      </section>

      {/* What is KrishiLink */}
      <section id="about" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4 text-gradient-green">What is KrishiLink?</h2>
            <p className="text-lg text-muted-foreground">
              KrishiLink connects farmers and buyers, promoting fair trade and transparent interactions. 
              Our platform enables direct communication, eliminating middlemen and ensuring farmers get the best prices for their produce.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-12">Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Zap, title: 'Instant Connection', desc: 'Connect with buyers/sellers instantly' },
              { icon: Shield, title: 'Transparent Pricing', desc: 'Fair prices with no hidden fees' },
              { icon: Users, title: 'Simplified Listings', desc: 'Easy crop listing in minutes' },
              { icon: MessageSquare, title: 'Direct Communication', desc: 'Chat, call, or WhatsApp directly' },
            ].map((benefit, i) => (
              <Card key={i} className="card-gradient border-0 shadow-card hover:shadow-card-hover transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-12">How it Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: 1, title: 'Login or Select Role', desc: 'Create account as Farmer or Buyer' },
              { step: 2, title: 'Farmers Create Listings', desc: 'Add crops with price and quantity' },
              { step: 3, title: 'Buyers Send Offers', desc: 'Browse and contact farmers' },
              { step: 4, title: 'Confirm Orders', desc: 'Finalize deals directly' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 font-heading font-bold text-xl">
                  {item.step}
                </div>
                <h3 className="font-heading font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">Get in Touch</h2>
          <p className="text-muted-foreground mb-8">Have questions? We're here to help farmers and buyers succeed.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="outline" size="lg">📧 Email Us</Button>
            <Button variant="outline" size="lg">📞 Call Us</Button>
            <Button size="lg">💬 WhatsApp</Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
