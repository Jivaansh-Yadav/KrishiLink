import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { indianStates } from '@/data/indianStates';
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
import { Eye, EyeOff, Loader2 } from 'lucide-react';

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
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState('');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobileNumber: '',
    email: '',
    state: '',
    district: '',
    village: '',
    postalCode: '',
    role: '' as 'farmer' | 'buyer' | '',
    password: '',
  });

  const validateMobile = (mobile: string) => /^\d{10}$/.test(mobile);
  const validateEmail = (email: string) => email.includes('@');
  const validatePassword = (password: string) => /^(?=.*[a-zA-Z])(?=.*\d).+$/.test(password);

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
      toast({ title: 'Weak Password', description: 'Password must contain at least one letter and one number', variant: 'destructive' });
      return;
    }

    if (!formData.role) {
      toast({ title: 'Select Role', description: 'Please select if you are a Farmer or Buyer', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            mobile_number: '+91' + formData.mobileNumber,
            state: formData.state,
            district: formData.district,
            village: formData.village,
            postal_code: formData.postalCode,
            role: formData.role,
            username: generateUsername(formData.role),
            password: formData.password,
          },
        },
      });

      if (error) throw error;

      toast({
        title: 'OTP Sent',
        description: 'Please check your email for the verification code',
      });

      setStep('otp');
    } catch (error: any) {
      toast({
        title: 'Registration Failed',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: formData.email,
        token: otp,
        type: 'email',
      });

      if (error) throw error;

      if (data.user) {
        const username = generateUsername(formData.role);
        
        // Create user profile
        const { error: profileError } = await supabase.from('users').insert({
          id: data.user.id,
          first_name: formData.firstName,
          last_name: formData.lastName || null,
          mobile_number: '+91' + formData.mobileNumber,
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
        setStep('form');
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: 'Verification Failed',
        description: error.message || 'Invalid OTP',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('form');
    setOtp('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-center">
            {step === 'form' ? 'Create Account' : 'Verify Email'}
          </DialogTitle>
        </DialogHeader>

        {step === 'form' ? (
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
                <Select value={formData.state} onValueChange={(value) => setFormData(prev => ({ ...prev, state: value }))}>
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
                <Input
                  id="district"
                  value={formData.district}
                  onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                  required
                />
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
                  placeholder="Must contain letter and number"
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
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <p className="text-center text-muted-foreground">
              Enter the OTP sent to <span className="font-medium text-foreground">{formData.email}</span>
            </p>

            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit code"
                className="text-center text-lg tracking-widest"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Verify & Complete Registration
            </Button>

            <button
              type="button"
              className="w-full text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setStep('form')}
            >
              ← Back to form
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RegisterModal;
