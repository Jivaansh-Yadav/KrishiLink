import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, Wheat, Search, Loader2, ShoppingCart, 
  ChevronLeft, ChevronRight, Shield
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { UserProfile } from '@/types/database';

const ITEMS_PER_PAGE = 10;

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  
  const [farmers, setFarmers] = useState<UserProfile[]>([]);
  const [buyers, setBuyers] = useState<UserProfile[]>([]);
  const [loadingFarmers, setLoadingFarmers] = useState(true);
  const [loadingBuyers, setLoadingBuyers] = useState(true);
  
  const [farmerSearch, setFarmerSearch] = useState('');
  const [buyerSearch, setBuyerSearch] = useState('');
  const [farmerPage, setFarmerPage] = useState(1);
  const [buyerPage, setBuyerPage] = useState(1);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
      toast.error('Please login to access dashboard');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      fetchFarmers();
      fetchBuyers();
    }
  }, [user, profile]);

  const fetchFarmers = async () => {
    setLoadingFarmers(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'farmer')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFarmers(data || []);
    } catch (error: any) {
      console.error('Fetch farmers error:', error);
      toast.error('Failed to load farmers');
    } finally {
      setLoadingFarmers(false);
    }
  };

  const fetchBuyers = async () => {
    setLoadingBuyers(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'buyer')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBuyers(data || []);
    } catch (error: any) {
      console.error('Fetch buyers error:', error);
      toast.error('Failed to load buyers');
    } finally {
      setLoadingBuyers(false);
    }
  };

  const filteredFarmers = farmers.filter(f =>
    f.full_name?.toLowerCase().includes(farmerSearch.toLowerCase()) ||
    f.email?.toLowerCase().includes(farmerSearch.toLowerCase()) ||
    f.phone?.includes(farmerSearch)
  );

  const filteredBuyers = buyers.filter(b =>
    b.full_name?.toLowerCase().includes(buyerSearch.toLowerCase()) ||
    b.email?.toLowerCase().includes(buyerSearch.toLowerCase()) ||
    b.phone?.includes(buyerSearch)
  );

  const paginatedFarmers = filteredFarmers.slice(
    (farmerPage - 1) * ITEMS_PER_PAGE,
    farmerPage * ITEMS_PER_PAGE
  );

  const paginatedBuyers = filteredBuyers.slice(
    (buyerPage - 1) * ITEMS_PER_PAGE,
    buyerPage * ITEMS_PER_PAGE
  );

  const farmerTotalPages = Math.ceil(filteredFarmers.length / ITEMS_PER_PAGE);
  const buyerTotalPages = Math.ceil(filteredBuyers.length / ITEMS_PER_PAGE);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || profile?.role !== 'admin') {
    return null;
  }

  const renderUserTable = (
    users: UserProfile[],
    loading: boolean,
    search: string,
    setSearch: (s: string) => void,
    page: number,
    setPage: (p: number) => void,
    totalPages: number,
    roleIcon: React.ReactNode
  ) => (
    <>
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10"
          />
        </div>
        <Badge variant="outline">
          Total: {users.length}
        </Badge>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No users found
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {roleIcon}
                        {u.full_name}
                      </div>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.phone || '-'}</TableCell>
                    <TableCell>{u.state || '-'}</TableCell>
                    <TableCell>
                      {new Date(u.created_at).toLocaleDateString('en-IN')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Wheat className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Farmers</p>
                  <p className="text-2xl font-bold">{farmers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Buyers</p>
                  <p className="text-2xl font-bold">{buyers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{farmers.length + buyers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Badge */}
        <div className="flex items-center gap-2 mb-6">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Badge className="ml-2">Admin</Badge>
        </div>

        {/* User Tables */}
        <Card>
          <Tabs defaultValue="farmers">
            <CardHeader>
              <TabsList>
                <TabsTrigger value="farmers" className="gap-2">
                  <Wheat className="h-4 w-4" />
                  Farmers
                </TabsTrigger>
                <TabsTrigger value="buyers" className="gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Buyers
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="farmers">
                {renderUserTable(
                  paginatedFarmers,
                  loadingFarmers,
                  farmerSearch,
                  setFarmerSearch,
                  farmerPage,
                  setFarmerPage,
                  farmerTotalPages,
                  <Wheat className="h-4 w-4 text-green-500" />
                )}
              </TabsContent>
              <TabsContent value="buyers">
                {renderUserTable(
                  paginatedBuyers,
                  loadingBuyers,
                  buyerSearch,
                  setBuyerSearch,
                  buyerPage,
                  setBuyerPage,
                  buyerTotalPages,
                  <ShoppingCart className="h-4 w-4 text-blue-500" />
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
