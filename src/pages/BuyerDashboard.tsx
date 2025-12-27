import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
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
import { cropTypes, indianStates } from '@/data/indianStates';

interface CropWithFarmer {
  id: string;
  crop_name: string;
  crop_type: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  description?: string;
  harvest_date?: string;
  location?: string;
  state?: string;
  image_url?: string;
  status: string;
  farmer?: {
    full_name: string;
    phone?: string;
    email?: string;
  };
}

const BuyerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  
  const [crops, setCrops] = useState<CropWithFarmer[]>([]);
  const [loadingCrops, setLoadingCrops] = useState(true);
  const [showMSP, setShowMSP] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [cropTypeFilter, setCropTypeFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
      toast.error('Please login to access dashboard');
    }
  }, [user, authLoading, navigate]);

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
          farmer:users!crops_farmer_id_fkey (
            full_name,
            phone,
            email
          )
        `)
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCrops(data || []);
    } catch (error: any) {
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
    const matchesType = !cropTypeFilter || crop.crop_type === cropTypeFilter;
    const matchesState = !stateFilter || crop.state === stateFilter;
    return matchesSearch && matchesType && matchesState;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || profile?.role !== 'buyer') {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
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
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-8 w-8 text-primary" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{profile?.full_name}</h3>
                    <Badge variant="outline" className="mt-1">
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Buyer
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  {profile?.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {profile.phone}
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
                      <SelectItem value="">All types</SelectItem>
                      {cropTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">State</label>
                  <Select value={stateFilter} onValueChange={setStateFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All states" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All states</SelectItem>
                      {indianStates.map((state) => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(cropTypeFilter || stateFilter) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full"
                    onClick={() => { setCropTypeFilter(''); setStateFilter(''); }}
                  >
                    Clear Filters
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
                      {searchTerm || cropTypeFilter || stateFilter 
                        ? 'Try adjusting your filters' 
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
    </div>
  );
};

export default BuyerDashboard;
