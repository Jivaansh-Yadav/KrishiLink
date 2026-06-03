import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Phone, Mail, MapPin, Wheat, ShoppingCart } from 'lucide-react';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { toast } from 'sonner';

export interface UserDetail {
  id: string;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  mobile_number?: string | null;
  whatsapp_number?: string | null;
  email?: string | null;
  state?: string | null;
  district?: string | null;
  village?: string | null;
  postal_code?: string | null;
  profile_photo?: string | null;
  role?: 'farmer' | 'buyer' | string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: UserDetail | null;
}

const sanitizePhone = (s?: string | null) => (s || '').replace(/[^\d+]/g, '');

export const UserDetailModal: React.FC<Props> = ({ open, onOpenChange, user }) => {
  if (!user) return null;
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'User';
  const isFarmer = user.role === 'farmer';
  const phone = sanitizePhone(user.mobile_number);
  const wa = sanitizePhone(user.whatsapp_number) || phone;

  const handleCall = () => {
    if (!phone) return toast.info('No phone number available');
    window.open(`tel:${phone}`, '_self');
  };
  const handleWhatsApp = () => {
    if (!wa) return toast.info('No WhatsApp number available');
    const num = wa.replace('+', '');
    window.open(`https://wa.me/${num}`, '_blank');
  };
  const handleEmail = () => {
    if (!user.email) return toast.info('No email available');
    window.open(`mailto:${user.email}`, '_self');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isFarmer ? <Wheat className="h-5 w-5 text-primary" /> : <ShoppingCart className="h-5 w-5 text-primary" />}
            {isFarmer ? 'Farmer Details' : 'Buyer Details'}
          </DialogTitle>
          <DialogDescription>Contact details and location for this {isFarmer ? 'farmer' : 'buyer'}.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {user.profile_photo ? (
                <img src={user.profile_photo} alt={fullName} className="h-full w-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-primary" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{fullName}</h3>
              {user.username && <Badge variant="secondary">@{user.username}</Badge>}
            </div>
          </div>

          <div className="space-y-2 text-sm">
            {phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" /> {user.mobile_number}
              </div>
            )}
            {user.whatsapp_number && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <WhatsAppIcon size={14} className="text-green-600" /> {user.whatsapp_number}
              </div>
            )}
            {user.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" /> {user.email}
              </div>
            )}
            {(user.village || user.district || user.state) && (
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>
                  {[user.village, user.district, user.state, user.postal_code].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2">
            <Button size="sm" onClick={handleCall} disabled={!phone}>
              <Phone className="h-4 w-4 mr-1" /> Call
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-green-600 text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
              onClick={handleWhatsApp}
              disabled={!wa}
            >
              <WhatsAppIcon size={16} className="mr-1" /> WhatsApp
            </Button>
            <Button size="sm" variant="outline" onClick={handleEmail} disabled={!user.email}>
              <Mail className="h-4 w-4 mr-1" /> Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailModal;