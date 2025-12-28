import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cropTypes } from '@/data/indianStates';
import { MSPListModal } from '@/components/MSPListModal';

interface AddCropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AddCropModal: React.FC<AddCropModalProps> = ({ open, onOpenChange, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showMSP, setShowMSP] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    cropName: '',
    cropType: '',
    quantity: '',
    pricePerKg: '',
    description: '',
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to add crops');
      return;
    }

    if (!formData.cropName || !formData.quantity || !formData.pricePerKg) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);

    try {
      let photoUrl = null;

      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('crop-images')
          .upload(fileName, imageFile);

        if (uploadError) {
          console.error('Upload error:', uploadError);
        } else {
          const { data: urlData } = supabase.storage
            .from('crop-images')
            .getPublicUrl(fileName);
          photoUrl = urlData.publicUrl;
        }
      }

      // Insert crop record
      const { error } = await supabase.from('crops').insert({
        user_id: user.id,
        crop_name: formData.cropName,
        quantity_kg: parseFloat(formData.quantity),
        price_per_kg: parseFloat(formData.pricePerKg),
        photo_url: photoUrl,
      });

      if (error) throw error;

      toast.success('Crop added successfully!');
      onOpenChange(false);
      onSuccess?.();
      
      // Reset form
      setFormData({
        cropName: '',
        cropType: '',
        quantity: '',
        pricePerKg: '',
        description: '',
      });
      setImageFile(null);
      setImagePreview(null);
    } catch (error: any) {
      console.error('Add crop error:', error);
      toast.error(error.message || 'Failed to add crop');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Add New Crop
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <div>
            <Label>Crop Image</Label>
            <div className="mt-2">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Crop preview"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-sm text-muted-foreground">Upload image</span>
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cropName">Crop Name *</Label>
              <Input
                id="cropName"
                value={formData.cropName}
                onChange={(e) => setFormData({ ...formData, cropName: e.target.value })}
                placeholder="e.g., Basmati Rice"
                required
              />
            </div>
            <div>
              <Label htmlFor="cropType">Crop Type</Label>
              <Select
                value={formData.cropType}
                onValueChange={(value) => setFormData({ ...formData, cropType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {cropTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantity (kg) *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="100"
                  required
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="price">Price per kg (₹) *</Label>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                    onClick={() => setShowMSP(true)}
                  >
                    View MSP list
                  </Button>
                </div>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.pricePerKg}
                  onChange={(e) => setFormData({ ...formData, pricePerKg: e.target.value })}
                  placeholder="50"
                  required
                />
              </div>
            </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add details about your crop quality, organic certification, etc."
              rows={3}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding Crop...
              </>
            ) : (
              'Add Crop'
            )}
          </Button>
        </form>
        <MSPListModal open={showMSP} onOpenChange={setShowMSP} />
      </DialogContent>
    </Dialog>
  );
};
