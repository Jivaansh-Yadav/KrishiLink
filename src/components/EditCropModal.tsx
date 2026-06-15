import React, { useEffect, useState } from 'react';
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
import { Upload, Loader2, Save, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cropTypes } from '@/data/Crops';
import { MSPListModal } from '@/components/MSPListModal';

interface EditCropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crop: any | null;
  onSuccess?: () => void;
}

const MAX_PHOTOS = 6;
const MAX_BYTES = 2 * 1024 * 1024;

export const EditCropModal: React.FC<EditCropModalProps> = ({ open, onOpenChange, crop, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showMSP, setShowMSP] = useState(false);

  const [existingUrls, setExistingUrls] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    cropName: '',
    cropType: '',
    quantity: '',
    pricePerQuintal: '',
    description: '',
  });

  useEffect(() => {
    if (crop) {
      setFormData({
        cropName: crop.crop_name || '',
        cropType: crop.crop_type || '',
        quantity: String(crop.quantity_quintal ?? ''),
        pricePerQuintal: String(crop.price_per_quintal ?? ''),
        description: crop.description || '',
      });
      setExistingUrls(
        crop.photo_urls && crop.photo_urls.length
          ? crop.photo_urls
          : crop.photo_url
          ? [crop.photo_url]
          : [],
      );
      setNewFiles([]);
      setNewPreviews([]);
    }
  }, [crop]);

  const totalPhotos = existingUrls.length + newFiles.length;

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_PHOTOS - totalPhotos;
    const accepted: File[] = [];
    for (const f of files.slice(0, remaining)) {
      if (f.size > MAX_BYTES) {
        toast.error(`${f.name} exceeds 2MB and was skipped`);
        continue;
      }
      accepted.push(f);
    }
    const next = [...newFiles, ...accepted];
    setNewFiles(next);
    Promise.all(
      next.map(
        (f) =>
          new Promise<string>((resolve) => {
            const r = new FileReader();
            r.onloadend = () => resolve(r.result as string);
            r.readAsDataURL(f);
          }),
      ),
    ).then(setNewPreviews);
    e.target.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !crop) return;
    setLoading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of newFiles) {
        const ext = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('crop-images').upload(fileName, file);
        if (upErr) {
          console.error(upErr);
          continue;
        }
        const { data } = supabase.storage.from('crop-images').getPublicUrl(fileName);
        uploadedUrls.push(data.publicUrl);
      }

      const allUrls = [...existingUrls, ...uploadedUrls];
      const { error } = await supabase
        .from('crops')
        .update({
          crop_name: formData.cropName,
          crop_type: formData.cropType || 'Other',
          quantity_quintal: parseFloat(formData.quantity),
          price_per_quintal: parseFloat(formData.pricePerQuintal),
          description: formData.description,
          photo_url: allUrls[0] || null,
          photo_urls: allUrls,
        } as any)
        .eq('id', crop.id);

      if (error) throw error;
      toast.success('Crop updated');
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to update crop');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!crop) return;
    if (!confirm('Delete this crop listing? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('crops').delete().eq('id', crop.id);
      if (error) throw error;
      toast.success('Crop deleted');
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  if (!crop) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[35rem] max-h-[50rem] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Crop</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <Label>
              Photos <span className="text-xs text-muted-foreground">(up to {MAX_PHOTOS}, 2MB each)</span>
            </Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {existingUrls.map((url, i) => (
                <div key={url} className="relative aspect-square rounded-lg overflow-hidden border">
                  <img src={url} alt={`Existing ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setExistingUrls((arr) => arr.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                    aria-label="Remove photo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {newPreviews.map((src, i) => (
                <div key={`new-${i}`} className="relative aspect-square rounded-lg overflow-hidden border">
                  <img src={src} alt={`New ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setNewFiles((arr) => arr.filter((_, idx) => idx !== i));
                      setNewPreviews((arr) => arr.filter((_, idx) => idx !== i));
                    }}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                    aria-label="Remove photo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {totalPhotos < MAX_PHOTOS && (
                <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Add</span>
                  <Input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
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
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
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

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
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
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </div>
        </form>

        <MSPListModal open={showMSP} onOpenChange={setShowMSP} />
      </DialogContent>
    </Dialog>
  );
};
