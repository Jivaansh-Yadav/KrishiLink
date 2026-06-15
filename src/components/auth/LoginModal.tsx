import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToRegister: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ open, onOpenChange, onSwitchToRegister }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  
  const [formData, setFormData] = useState({
    identifier: '', // username, email, or mobile
    password: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let email = formData.identifier;

      // If identifier is not an email, try to find the user by username or mobile
      if (!formData.identifier.includes('@')) {
        const { data: userData, error: lookupError } = await supabase
          .from('users')
          .select('email')
          .or(`username.eq.${formData.identifier},mobile_number.eq.+91${formData.identifier}`)
          .maybeSingle();

        if (lookupError) {
          console.error('User lookup error:', lookupError);
        }

        if (userData) {
          email = userData.email;
        } else {
          toast({
            title: 'User Not Found',
            description: 'No account found with this username or mobile number. Please check and try again.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: formData.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: 'Invalid Credentials',
            description: 'The email/username and password combination is incorrect. Please try again.',
            variant: 'destructive',
          });
        } else if (error.message.includes('Email not confirmed')) {
          toast({
            title: 'Email Not Confirmed',
            description: 'Please check your email and click the confirmation link to verify your account.',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
        return;
      }

      // Check if user profile exists, if not create it from auth metadata
      if (data.user) {
        const { data: existingProfile } = await supabase
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle();

        if (!existingProfile && data.user.user_metadata) {
          const meta = data.user.user_metadata;
          const { error: profileError } = await supabase.from('users').insert({
            id: data.user.id,
            first_name: meta.first_name || '',
            last_name: meta.last_name || null,
            mobile_number: meta.mobile_number || null,
            email: data.user.email || '',
            state: meta.state || null,
            district: meta.district || null,
            village: meta.village || null,
            postal_code: meta.postal_code || null,
            role: meta.role || 'farmer',
            username: meta.username || `user${Math.floor(1000 + Math.random() * 9000)}`,
          });

          if (profileError) {
            console.error('Profile creation error on login:', profileError);
          }
        }
      }

      toast({
        title: 'Welcome back!',
        description: 'Login successful',
      });

      onOpenChange(false);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid credentials',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: 'Password Reset Email Sent',
        description: 'Check your email for the reset link',
      });

      setShowResetPassword(false);
      setResetEmail('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send reset email',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-center">
            {showResetPassword ? 'Reset Password' : 'Welcome Back'}
          </DialogTitle>
        </DialogHeader>

        {showResetPassword ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-center text-muted-foreground text-sm">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <div className="space-y-2">
              <Label htmlFor="resetEmail">Email</Label>
              <Input
                id="resetEmail"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Send Reset Link
            </Button>

            <button
              type="button"
              className="w-full text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setShowResetPassword(false)}
            >
              ← Back to login
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Email</Label>
              <Input
                id="identifier"
                value={formData.identifier}
                onChange={(e) => setFormData(prev => ({ ...prev, identifier: e.target.value }))}
                placeholder="Enter email address"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loginPassword">Password</Label>
              <div className="relative">
                <Input
                  id="loginPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter password"
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

            <button
              type="button"
              className="text-sm text-primary hover:underline"
              onClick={() => setShowResetPassword(true)}
            >
              Forgot password?
            </button>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Login
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <button type="button" className="text-primary font-medium hover:underline" onClick={onSwitchToRegister}>
                Register
              </button>
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
