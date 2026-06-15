import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { WeatherCard } from '@/components/WeatherCard';
import { MSPListModal } from '@/components/MSPListModal';
import { CropDiseaseModal } from '@/components/CropDiseaseModal';
import { AIChatModal } from '@/components/AIChatModal';
import { AddCropModal } from '@/components/AddCropModal';
import { EditCropModal } from '@/components/EditCropModal';
import { CropCard } from '@/components/CropCard';
import { FindBuyersModal } from '@/components/FindBuyersModal';
import { ExpertAdvisoryCard } from '@/components/ExpertAdvisoryCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, MapPin, Phone, Mail, Plus, IndianRupee, Bug, 
  MessageSquare, Users, Wheat, Loader2, Edit, Bot
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Crop {
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
  image_urls?: string[];
}

const FarmerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loadingCrops, setLoadingCrops] = useState(true);
  
  const [showMSP, setShowMSP] = useState(false);
  const [showDisease, setShowDisease] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showAddCrop, setShowAddCrop] = useState(false);
  const [showFindBuyers, setShowFindBuyers] = useState(false);
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null);

  const getFullName = () => {
    if (!profile) return '';
    return `${profile.first_name} ${profile.last_name || ''}`.trim();
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
      toast.error('Please login to access dashboard');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchCrops();
    }
  }, [user]);

  const fetchCrops = async () => {
    if (!user) return;
    
    setLoadingCrops(true);
    try {
      const { data, error } = await supabase
        .from('crops')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map DB fields to component fields - use actual crop_type from DB
      const mappedCrops = (data || []).map(c => ({
        id: c.id,
        crop_name: c.crop_name,
        crop_type: c.crop_type || 'Crop',
        quantity: c.quantity_quintal,
        unit: 'Quintal',
        price_per_unit: c.price_per_quintal,
        image_url: c.photo_url,
        image_urls: (c as any).photo_urls || (c.photo_url ? [c.photo_url] : []),
      }));
      setCrops(mappedCrops);
    } catch (error: any) {
      console.error('Fetch crops error:', error);
      toast.error('Failed to load crops');
    } finally {
      setLoadingCrops(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const location = profile?.district || profile?.state || 'Delhi';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - User Info & Quick Actions */}
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
                    <h3 className="font-semibold">{getFullName() || 'Farmer'}</h3>
                    {profile?.username && (
                      <p className="text-xs text-muted-foreground">@{profile.username}</p>
                    )}
                    <Badge variant="outline" className="mt-1">
                      <Wheat className="h-3 w-3 mr-1" />
                      Farmer
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
                  {profile?.state && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {profile.state}
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

            {/* Weather Card */}
            <WeatherCard location={location} />

            

            
          </div>

          
          <div className="lg:col-span-2">
            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col gap-2"
                  onClick={() => setShowMSP(true)}
                >
                  <IndianRupee className="h-10 w-10 text-primary" />
                  <span className="text-s">MSP List</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col gap-2"
                  onClick={() => setShowDisease(true)}
                >
                  <Bug className="h-10 w-10 text-orange-500" />
                  <span className="text-s">Disease Check</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col gap-2"
                  onClick={() => setShowAIChat(true)}
                >
                  <MessageSquare className="h-10 w-10a text-blue-500" />
                  <span className="text-s">AI Assistant</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col gap-2"
                  onClick={() => setShowFindBuyers(true)}
                >
                  <Users className="h-10 w-10 text-green-500" />
                  <span className="text-s">Find Buyers</span>
                </Button>
              </CardContent>
            </Card>

            <br></br>

            {/* Right Column - My Crops */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Wheat className="h-5 w-5 text-primary" />
                  My Crops
                </CardTitle>
                <Button onClick={() => setShowAddCrop(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Crop
                </Button>
              </CardHeader>
              <CardContent>
                {loadingCrops ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : crops.length === 0 ? (
                  <div className="text-center py-12">
                    <Wheat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">No crops listed yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start by adding your first crop to connect with buyers
                    </p>
                    <Button onClick={() => setShowAddCrop(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Crop
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {crops.map((crop) => (
                      <CropCard key={crop.id} crop={crop} onEdit={() => setEditingCrop(crop)} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <br></br>
            {/* Expert Advisory Card */}
            <ExpertAdvisoryCard />
          </div>
        </div>
      </main>

      <Footer />

      {/* Floating AI Assistant Button */}
      <button
        onClick={() => setShowAIChat(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center z-40"
        aria-label="Open AI Assistant"
      >
        <Bot className="h-6 w-6" />
      </button>

      {/* Modals */}
      <MSPListModal open={showMSP} onOpenChange={setShowMSP} />
      <CropDiseaseModal open={showDisease} onOpenChange={setShowDisease} />
      <AIChatModal open={showAIChat} onOpenChange={setShowAIChat} />
      <AddCropModal open={showAddCrop} onOpenChange={setShowAddCrop} onSuccess={fetchCrops} />
      <EditCropModal
        open={!!editingCrop}
        onOpenChange={(o) => !o && setEditingCrop(null)}
        crop={editingCrop}
        onSuccess={() => { setEditingCrop(null); fetchCrops(); }}
      />
      <FindBuyersModal open={showFindBuyers} onOpenChange={setShowFindBuyers} />
    </div>
  );
};

export default FarmerDashboard;