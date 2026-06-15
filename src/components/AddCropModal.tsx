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
import { Upload, Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cropTypes } from '@/data/Crops';
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
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const MAX_PHOTOS = 6;
  const MAX_BYTES = 2 * 1024 * 1024; // 2MB
  
  const [formData, setFormData] = useState({
    cropName: '',
    cropType: '',
    quantity: '',
    pricePerQuintal: '',
    description: '',
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const accepted: File[] = [];
    for (const f of files) {
      if (f.size > MAX_BYTES) {
        toast.error(`${f.name} exceeds 2MB and was skipped`);
        continue;
      }
      accepted.push(f);
    }
    const next = [...imageFiles, ...accepted].slice(0, MAX_PHOTOS);
    setImageFiles(next);
    Promise.all(
      next.map(
        (f) =>
          new Promise<string>((resolve) => {
            const r = new FileReader();
            r.onloadend = () => resolve(r.result as string);
            r.readAsDataURL(f);
          }),
      ),
    ).then(setImagePreviews);
    e.target.value = '';
  };

  const removePhoto = (idx: number) => {
    setImageFiles((arr) => arr.filter((_, i) => i !== idx));
    setImagePreviews((arr) => arr.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to add crops');
      return;
    }

    if (!formData.cropName || !formData.quantity || !formData.pricePerQuintal) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);

    try {
      const photoUrls: string[] = [];
      for (const file of imageFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('crop-images')
          .upload(fileName, file);
        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }
        const { data: urlData } = supabase.storage.from('crop-images').getPublicUrl(fileName);
        photoUrls.push(urlData.publicUrl);
      }

      // Insert crop record with crop_type
      const { error } = await supabase.from('crops').insert({
        user_id: user.id,
        crop_name: formData.cropName,
        crop_type: formData.cropType || 'Other',
        quantity_quintal: parseFloat(formData.quantity),
        price_per_quintal: parseFloat(formData.pricePerQuintal),
        photo_url: photoUrls[0] || null,
        photo_urls: photoUrls,
      } as any);

      if (error) throw error;

      toast.success('Crop added successfully!');
      onOpenChange(false);
      onSuccess?.();
      
      // Reset form
      setFormData({
        cropName: '',
        cropType: '',
        quantity: '',
        pricePerQuintal: '',
        description: '',
      });
      setImageFiles([]);
      setImagePreviews([]);
    } catch (error: any) {
      console.error('Add crop error:', error);
      toast.error(error.message || 'Failed to add crop');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[35rem] max-h-[50rem] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Add New Crop
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <div>
            <Label>Crop Photos <span className="text-xs text-muted-foreground">(up to {MAX_PHOTOS}, 2MB each)</span></Label>
            <div className="mt-2">
              <div className="grid grid-cols-3 gap-2">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border">
                    <img src={src} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                      aria-label="Remove photo"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {imageFiles.length < MAX_PHOTOS && (
                  <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Add</span>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
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
                <Label htmlFor="quantity">Quantity (Quintal) *</Label>
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
                  <Label htmlFor="price">Price per Quintal (₹) *</Label>
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
                  value={formData.pricePerQuintal}
                  onChange={(e) => setFormData({ ...formData, pricePerQuintal: e.target.value })}
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
