import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Phone, Mail, MapPin, Search, Loader2, ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { UserDetailModal, UserDetail } from './UserDetailModal';

interface Buyer {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  mobile_number: string;
  whatsapp_number?: string | null;
  email: string;
  state: string;
  district?: string | null;
  village?: string | null;
  postal_code?: string | null;
  profile_photo?: string | null;
}

interface FindBuyersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FindBuyersModal: React.FC<FindBuyersModalProps> = ({ open, onOpenChange }) => {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<UserDetail | null>(null);

  useEffect(() => {
    if (open) {
      fetchBuyers();
    }
  }, [open]);

  const fetchBuyers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, first_name, last_name, mobile_number, whatsapp_number, email, state, district, village, postal_code, profile_photo, role')
        .eq('role', 'buyer')
        .order('first_name', { ascending: true });

      if (error) throw error;
      setBuyers(data || []);
    } catch (error: any) {
      console.error('Error fetching buyers:', error);
      toast.error('Failed to load buyers');
    } finally {
      setLoading(false);
    }
  };

  const filteredBuyers = buyers.filter((buyer) => {
    const query = searchQuery.toLowerCase();
    const fullName = `${buyer.first_name || ''} ${buyer.last_name || ''}`.toLowerCase();
    return (
      fullName.includes(query) ||
      (buyer.username?.toLowerCase() || '').includes(query) ||
      (buyer.state?.toLowerCase() || '').includes(query)
    );
  });

  const handleContact = (buyer: Buyer) => {
    if (buyer.mobile_number) {
      window.open(`tel:${buyer.mobile_number}`, '_self');
    } else if (buyer.email) {
      window.open(`mailto:${buyer.email}`, '_self');
    } else {
      toast.info('No contact information available for this buyer');
    }
  };

  const handleWhatsApp = (buyer: Buyer) => {
    const wa = (buyer.whatsapp_number || buyer.mobile_number || '').replace(/[^\d+]/g, '').replace('+', '');
    if (!wa) return toast.info('No WhatsApp number available for this buyer');
    window.open(`https://wa.me/${wa}`, '_blank');
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Find Buyers
          </DialogTitle>
          <DialogDescription>
            Connect with registered buyers to sell your crops directly
          </DialogDescription>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, username, or state..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredBuyers.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No buyers found</h3>
              <p className="text-muted-foreground text-sm">
                {searchQuery ? 'Try a different search term' : 'No registered buyers yet'}
              </p>
            </div>
          ) : (
            filteredBuyers.map((buyer) => (
              <Card
                key={buyer.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelected({ ...buyer, role: 'buyer' })}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">
                            {buyer.first_name || ''} {buyer.last_name || ''}
                          </h4>
                          {buyer.username && (
                            <Badge variant="secondary" className="text-xs">
                              @{buyer.username}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          {buyer.mobile_number && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span>{buyer.mobile_number}</span>
                            </div>
                          )}
                          {buyer.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span className="truncate max-w-[180px]">{buyer.email}</span>
                            </div>
                          )}
                          {buyer.state && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>{buyer.state}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div
                      className="flex flex-shrink-0 gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button size="sm" onClick={() => handleContact(buyer)}>
                        <Phone className="h-4 w-4 mr-1" />
                        Contact
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="border-green-600 text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                        onClick={() => handleWhatsApp(buyer)}
                        aria-label="WhatsApp"
                        title="WhatsApp"
                      >
                        <WhatsAppIcon size={16} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
    <UserDetailModal open={!!selected} onOpenChange={(v) => !v && setSelected(null)} user={selected} />
    </>
  );
};
