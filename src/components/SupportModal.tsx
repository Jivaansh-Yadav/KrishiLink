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
import { Send } from 'lucide-react';

interface SupportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SupportModal: React.FC<SupportModalProps> = ({ open, onOpenChange }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('support').insert({
        user_id: user?.id || null,
        subject: formData.subject,
        message: formData.message,
      });

      if (error) throw error;

      toast({
        title: 'Support Request Submitted',
        description: 'We will get back to you soon!',
      });

      setFormData({ subject: '', message: '' });
      onOpenChange(false);
    } catch (error: any) {
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
          <DialogTitle className="font-heading text-xl">Support</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {profile && (
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">User ID: <span className="font-medium text-foreground">{profile.username}</span></p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Brief description of your query"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
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
            <Send className="w-4 h-4 mr-2" />
            {loading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SupportModal;
