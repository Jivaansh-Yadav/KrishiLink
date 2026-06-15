import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { indianStates } from '@/data/indianStates';
import { stateDistricts } from '@/data/districts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, EyeOff, Loader2, Mail } from 'lucide-react';

interface RegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin: () => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ open, onOpenChange, onSwitchToLogin }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobileNumber: '',
    whatsappNumber: '',
    email: '',
    state: '',
    district: '',
    village: '',
    postalCode: '',
    role: '' as 'farmer' | 'buyer' | '',
    password: '',
  });

  const validateMobile = (mobile: string) => /^\d{10}$/.test(mobile);
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password: string) => password.length >= 6 && /^(?=.*[a-zA-Z])(?=.*\d).+$/.test(password);

  const generateUsername = (role: string) => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${role}${randomNum}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateMobile(formData.mobileNumber)) {
      toast({ title: 'Invalid Mobile Number', description: 'Please enter a valid 10-digit mobile number', variant: 'destructive' });
      return;
    }

    if (!validateEmail(formData.email)) {
      toast({ title: 'Invalid Email', description: 'Please enter a valid email address', variant: 'destructive' });
      return;
    }

    if (!validatePassword(formData.password)) {
      toast({ title: 'Weak Password', description: 'Password must be at least 6 characters with at least one letter and one number', variant: 'destructive' });
      return;
    }

    if (!formData.role) {
      toast({ title: 'Select Role', description: 'Please select if you are a Farmer or Buyer', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const username = generateUsername(formData.role);
      // Use auth/callback route for email confirmation redirect
      const redirectUrl = `${window.location.origin}/auth/callback`;

      // Use signUp with email/password and confirmation link
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            mobile_number: '+91' + formData.mobileNumber,
            whatsapp_number: formData.whatsappNumber ? '+91' + formData.whatsappNumber : null,
            state: formData.state,
            district: formData.district,
            village: formData.village,
            postal_code: formData.postalCode,
            role: formData.role,
            username: username,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast({
            title: 'Email Already Registered',
            description: 'This email is already registered. Please login or use a different email.',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
        return;
      }

      // If email confirmation is required
      if (data.user && !data.session) {
        setEmailSent(true);
        toast({
          title: 'Confirmation Email Sent',
          description: 'Please check your email and click the confirmation link to complete registration.',
        });
      } else if (data.user && data.session) {
        // If email confirmation is disabled, create profile and navigate
        const { error: profileError } = await supabase.from('users').insert({
          id: data.user.id,
          first_name: formData.firstName,
          last_name: formData.lastName || null,
          mobile_number: '+91' + formData.mobileNumber,
          whatsapp_number: formData.whatsappNumber ? '+91' + formData.whatsappNumber : null,
          email: formData.email,
          state: formData.state,
          district: formData.district,
          village: formData.village || null,
          postal_code: formData.postalCode || null,
          role: formData.role as 'farmer' | 'buyer',
          username: username,
        });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }

        toast({
          title: 'Registration Successful!',
          description: `Welcome! Your username is: ${username}`,
        });

        onOpenChange(false);
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration Failed',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmailSent(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-center">
            {emailSent ? 'Check Your Email' : 'Create Account'}
          </DialogTitle>
        </DialogHeader>

        {emailSent ? (
          <div className="text-center space-y-4 py-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <p className="text-muted-foreground">
              We've sent a confirmation link to <span className="font-medium text-foreground">{formData.email}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Click the link in the email to complete your registration and access your dashboard.
            </p>
            <Button variant="outline" onClick={() => setEmailSent(false)}>
              ← Back to form
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number *</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-sm bg-muted border border-r-0 border-input rounded-l-md">
                  +91
                </span>
                <Input
                  id="mobile"
                  type="tel"
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, mobileNumber: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  className="rounded-l-none"
                  placeholder="10-digit number"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp Number <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-sm bg-muted border border-r-0 border-input rounded-l-md">
                  +91
                </span>
                <Input
                  id="whatsapp"
                  type="tel"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, whatsappNumber: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  className="rounded-l-none"
                  placeholder="WhatsApp 10-digit (if different)"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Select value={formData.state} onValueChange={(value) => setFormData(prev => ({ ...prev, state: value, district: '' }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {indianStates.map((state) => (
                      <SelectItem key={state.code} value={state.name}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">District *</Label>
                <Select
                  value={formData.district}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, district: value }))}
                  disabled={!formData.state}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.state ? 'Select district' : 'Select state first'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {(stateDistricts[formData.state] || []).map((d) => {
                      const name = typeof d === 'string' ? d : d.name;
                      return <SelectItem key={name} value={name}>{name}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="village">Village</Label>
                <Input
                  id="village"
                  value={formData.village}
                  onChange={(e) => setFormData(prev => ({ ...prev, village: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>I am a *</Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={formData.role === 'farmer' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'farmer' }))}
                >
                  🌾 Farmer
                </Button>
                <Button
                  type="button"
                  variant={formData.role === 'buyer' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'buyer' }))}
                >
                  🛒 Buyer
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Min 6 chars, letter + number"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Register
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <button type="button" className="text-primary font-medium hover:underline" onClick={onSwitchToLogin}>
                Login
              </button>
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RegisterModal;
