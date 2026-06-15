import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { 
  User, Phone, Mail, MapPin, Camera, Loader2, 
  Save, ArrowLeft, Lock, Key
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { stateNames } from '@/data/indianStates';
import { stateDistricts } from '@/data/districts';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobileNumber: '',
    whatsappNumber: '',
    state: '',
    district: '',
    village: '',
    postalCode: '',
  });
  
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
      toast.error('Please login to access profile');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        email: profile.email || '',
        mobileNumber: profile.mobile_number || '',
        whatsappNumber: (profile as any).whatsapp_number || '',
        state: profile.state || '',
        district: profile.district || '',
        village: (profile as any).village || '',
        postalCode: (profile as any).postal_code || '',
      });
    }
  }, [profile]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_photo: urlData.publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      toast.success('Profile picture updated!');
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const emailChanged = !!formData.email && formData.email !== (profile?.email || '');

      if (emailChanged) {
        const { error: authEmailError } = await supabase.auth.updateUser({
          email: formData.email,
        });
        if (authEmailError) throw authEmailError;
      }

      const { error } = await supabase
        .from('users')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          mobile_number: formData.mobileNumber,
          whatsapp_number: formData.whatsappNumber || null,
          email: formData.email,
          state: formData.state,
          district: formData.district,
          village: formData.village || null,
          postal_code: formData.postalCode || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      toast.success(
        emailChanged
          ? 'Profile updated. Please confirm your new email from your inbox.'
          : 'Profile updated successfully!'
      );
    } catch (error: any) {
      console.error('Save profile error:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      toast.success('Password changed successfully!');
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Change password error:', error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const goToDashboard = () => {
    if (profile?.role === 'farmer') {
      navigate('/farmer-dashboard');
    } else if (profile?.role === 'buyer') {
      navigate('/buyer-dashboard');
    } else {
      navigate('/');
    }
  };

  const getFullName = () => {
    if (!profile) return '';
    return `${profile.first_name} ${profile.last_name || ''}`.trim();
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 mt-16 max-w-2xl">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={goToDashboard}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="space-y-6">
          {/* Profile Picture */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Profile Picture
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {profile?.profile_photo ? (
                      <img 
                        src={profile.profile_photo} 
                        alt="Profile photo" 
                        className="h-full w-full object-cover" 
                      />
                    ) : (
                      <User className="h-12 w-12 text-primary" />
                    )}
                  </div>
                  {uploadingImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <label>
                    <Button variant="outline" disabled={uploadingImage} asChild>
                      <span className="cursor-pointer">
                        <Camera className="h-4 w-4 mr-2" />
                        Change Photo
                      </span>
                    </Button>
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                  </label>
                  <p className="text-sm text-muted-foreground mt-2">
                    JPG, PNG or GIF. Max 2MB.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="First name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <Label>Username</Label>
                <Input value={profile?.username || ''} disabled className="bg-muted" />
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  If you change email, you may need to confirm it from your inbox.
                </p>
              </div>

              <div>
                <Label htmlFor="mobileNumber" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Mobile Number
                </Label>
                <Input
                  id="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                  placeholder="+91 XXXXXXXXXX"
                />
              </div>

              <div>
                <Label htmlFor="whatsappNumber" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  WhatsApp Number <span className="text-xs text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="whatsappNumber"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  placeholder="+91 XXXXXXXXXX"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Buyers/Farmers can reach you on WhatsApp using this number.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="state" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    State
                  </Label>
                  <Select
                    value={formData.state}
                    onValueChange={(value) => setFormData({ ...formData, state: value, district: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your state" />
                    </SelectTrigger>
                    <SelectContent>
                      {stateNames.map((state) => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="district">District</Label>
                  <Select
                    value={formData.district}
                    onValueChange={(value) => setFormData({ ...formData, district: value })}
                    disabled={!formData.state}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={formData.state ? 'Select district' : 'Select state first'} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {(stateDistricts[formData.state] || []).map((d) => {
                        const name = typeof d === 'string' ? d : d.name;
                        return <SelectItem key={name} value={name}>{name}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="village">Village / Town</Label>
                  <Input
                    id="village"
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    placeholder="Your village or town"
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="6-digit PIN"
                    maxLength={6}
                  />
                </div>
              </div>

              <Button 
                onClick={handleSaveProfile} 
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                />
              </div>

              <Button 
                onClick={handleChangePassword} 
                disabled={changingPassword || !passwordData.newPassword}
                variant="outline"
                className="w-full"
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Changing...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Change Password
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
