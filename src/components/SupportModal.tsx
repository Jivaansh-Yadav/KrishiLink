import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Send, Loader2 } from 'lucide-react';

interface SupportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SupportModal: React.FC<SupportModalProps> = ({ open, onOpenChange }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile_number: '',
    subject: '',
    message: '',
  });

  // Pre-fill form with profile data when modal opens
  React.useEffect(() => {
    if (open && profile) {
      setFormData(prev => ({
        ...prev,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        email: profile.email || '',
        mobile_number: profile.mobile_number || '',
      }));
    }
  }, [open, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const insertData: Record<string, any> = {
        subject: formData.subject,
        message: formData.message,
        name: formData.name || null,
        email: formData.email || null,
        mobile_number: formData.mobile_number || null,
      };

      // If user is logged in, include user details
      if (user && profile) {
        insertData.user_id = user.id;
        insertData.username = profile.username || null;
        insertData.role = profile.role || null;
        insertData.is_registered = true;
      } else {
        insertData.is_registered = false;
      }

      const { error } = await supabase.from('support').insert(insertData);

      if (error) throw error;

      toast({
        title: 'Support Request Submitted',
        description: 'We will get back to you soon!',
      });

      setFormData({ name: '', email: '', mobile_number: '', subject: '', message: '' });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Support submission error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit support request',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Contact Support</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {profile && (
            <div className="p-3 rounded-lg bg-muted text-sm">
              <p className="text-muted-foreground">
                Logged in as: <span className="font-medium text-foreground">@{profile.username}</span>
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supportName">Name {!profile && '*'}</Label>
              <Input
                id="supportName"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your name"
                required={!profile}
                disabled={!!profile}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportMobile">Mobile</Label>
              <Input
                id="supportMobile"
                value={formData.mobile_number}
                onChange={(e) => setFormData(prev => ({ ...prev, mobile_number: e.target.value }))}
                placeholder="+91XXXXXXXXXX"
                disabled={!!profile}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supportEmail">Email {!profile && '*'}</Label>
            <Input
              id="supportEmail"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="your@email.com"
              required={!profile}
              disabled={!!profile}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Brief description of your query"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Describe your issue or query in detail..."
              rows={5}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {loading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SupportModal;
