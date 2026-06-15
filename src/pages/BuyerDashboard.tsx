import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { MSPListModal } from '@/components/MSPListModal';
import { CropCard } from '@/components/CropCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  User, Phone, Mail, Search, IndianRupee, 
  Wheat, Loader2, Edit, Filter, ShoppingCart
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cropTypes } from '@/data/Crops';
import { UserDetailModal, UserDetail } from '@/components/UserDetailModal';


type CropRowWithFarmer = {
  id: string;
  crop_name: string;
  crop_type?: string | null;
  quantity_quintal?: number | null;
  price_per_quintal?: number | null;
  quantity_kg?: number | null;
  price_per_kg?: number | null;
  photo_url?: string | null;
  photo_urls?: string[] | null;
  users?: (UserDetail & {
    first_name: string;
    last_name?: string | null;
    mobile_number?: string | null;
    whatsapp_number?: string | null;
    email?: string | null;
  }) | null;
};

interface CropWithFarmer {
  id: string;
  crop_name: string;
  crop_type: string;
  quantity: number | null;
  unit: string;
  price_per_unit: number | null;
  description?: string;
  harvest_date?: string;
  location?: string;
  state?: string;
  image_url?: string;
  image_urls?: string[];
  farmer?: {
    full_name: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
  };
  farmer_detail?: UserDetail;
}

const BuyerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  
  const [crops, setCrops] = useState<CropWithFarmer[]>([]);
  const [loadingCrops, setLoadingCrops] = useState(true);
  const [showMSP, setShowMSP] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<UserDetail | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [cropTypeFilter, setCropTypeFilter] = useState('all');

  const getFullName = () => {
    if (!profile) return '';
    return `${profile.first_name} ${profile.last_name || ''}`.trim();
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
      toast.error('Please login to access dashboard');
      return;
    }

    if (!authLoading && user && profile && profile.role !== 'buyer') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, profile, authLoading, navigate]);

  useEffect(() => {
    fetchCrops();
  }, []);

  const fetchCrops = async () => {
    setLoadingCrops(true);
    try {
      const { data, error } = await supabase
        .from('crops')
        .select(`
          *,
          users!crops_user_id_fkey (
            id,
            username,
            first_name,
            last_name,
            mobile_number,
            whatsapp_number,
            email,
            state,
            district,
            village,
            postal_code,
            profile_photo,
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map DB fields to component fields. The crops table now stores quintal values;
      // keep kg fallbacks only so older local/dev databases do not crash the card renderer.
      const mappedCrops = (data || []).map(c => {
        const cropRow = c as CropRowWithFarmer;
        const quantity = cropRow.quantity_quintal ?? cropRow.quantity_kg ?? null;
        const pricePerUnit = cropRow.price_per_quintal ?? cropRow.price_per_kg ?? null;
        const imageUrls = Array.isArray(cropRow.photo_urls) && cropRow.photo_urls.length > 0
          ? cropRow.photo_urls
          : (cropRow.photo_url ? [cropRow.photo_url] : []);

        return {
          id: cropRow.id,
          crop_name: cropRow.crop_name,
          crop_type: cropRow.crop_type || 'Other',
          quantity,
          unit: cropRow.quantity_quintal !== undefined || cropRow.price_per_quintal !== undefined ? 'Quintal' : 'kg',
          price_per_unit: pricePerUnit,
          image_url: cropRow.photo_url,
          image_urls: imageUrls,
          farmer: cropRow.users ? {
            full_name: `${cropRow.users.first_name} ${cropRow.users.last_name || ''}`.trim(),
            phone: cropRow.users.mobile_number,
            whatsapp: cropRow.users.whatsapp_number,
            email: cropRow.users.email,
          } : undefined,
          farmer_detail: cropRow.users ? (cropRow.users as UserDetail) : undefined,
        };
      });
      setCrops(mappedCrops);
    } catch (error: unknown) {
      console.error('Fetch crops error:', error);
      toast.error('Failed to load crops');
    } finally {
      setLoadingCrops(false);
    }
  };

  const filteredCrops = crops.filter(crop => {
    const matchesSearch = !searchTerm || 
      crop.crop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      crop.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      cropTypeFilter === 'all' ||
      crop.crop_type?.toLowerCase() === cropTypeFilter.toLowerCase();
    return matchesSearch && matchesType;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Profile row is fetched async (can be briefly null after signup/login)
  if (user && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (profile.role !== 'buyer') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - User Info & Filters */}
          <div className="space-y-6">
            {/* User Info Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {profile?.profile_photo ? (
                      <img src={profile.profile_photo} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-8 w-8 text-primary" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{getFullName()}</h3>
                    {profile?.username && (
                      <p className="text-xs text-muted-foreground">@{profile.username}</p>
                    )}
                    <Badge variant="outline" className="mt-1">
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Buyer
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  {profile?.mobile_number && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {profile.mobile_number}
                    </div>
                  )}
                  {profile?.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {profile.email}
                    </div>
                  )}
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-2"
                  onClick={() => navigate('/profile')}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </CardContent>
            </Card>

            {/* MSP Button */}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowMSP(true)}
            >
              <IndianRupee className="h-4 w-4 mr-2" />
              View MSP Rates
            </Button>

            {/* Filters Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Crop Type</label>
                  <Select value={cropTypeFilter} onValueChange={setCropTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      {cropTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {cropTypeFilter !== 'all' && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setCropTypeFilter('all')}
                  >
                    Clear Filter
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Browse Crops */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Wheat className="h-5 w-5 text-primary" />
                    Browse Crops
                  </CardTitle>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search crops..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingCrops ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredCrops.length === 0 ? (
                  <div className="text-center py-12">
                    <Wheat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">No crops found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm || cropTypeFilter !== 'all'
                        ? 'Try adjusting your crop type filter'
                        : 'No crops are currently available'}
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      Showing {filteredCrops.length} crop{filteredCrops.length !== 1 ? 's' : ''}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filteredCrops.map((crop) => (
                        <CropCard 
                          key={crop.id} 
                          crop={crop} 
                          showFarmerContact
                          onContact={() => {
                            if (crop.farmer?.phone) {
                              window.open(`tel:${crop.farmer.phone}`);
                            }
                          }}
                          onWhatsApp={() => {
                            const wa = (crop.farmer?.whatsapp || crop.farmer?.phone || '')
                              .replace(/[^\d+]/g, '').replace('+', '');
                            if (!wa) {
                              toast.info('No WhatsApp number available for this farmer');
                              return;
                            }
                            window.open(`https://wa.me/${wa}`, '_blank');
                          }}
                          onViewFarmer={() => crop.farmer_detail && setSelectedFarmer(crop.farmer_detail)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
      <MSPListModal open={showMSP} onOpenChange={setShowMSP} />
      <UserDetailModal
        open={!!selectedFarmer}
        onOpenChange={(v) => !v && setSelectedFarmer(null)}
        user={selectedFarmer}
      />
    </div>
  );
};

export default BuyerDashboard;
