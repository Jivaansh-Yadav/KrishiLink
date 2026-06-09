import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Phone, Mail, Wheat, IndianRupee, Info, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import { WhatsAppIcon } from './icons/WhatsAppIcon';

interface CropCardProps {
  crop: {
    id: string;
    crop_name: string;
    crop_type: string;
    quantity?: number | null;
    unit: string;
    price_per_unit?: number | null;
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
  };
  showFarmerContact?: boolean;
  onContact?: () => void;
  onWhatsApp?: () => void;
  onViewFarmer?: () => void;
  onEdit?: () => void;
}

export const CropCard: React.FC<CropCardProps> = ({ crop, showFarmerContact = false, onContact, onWhatsApp, onViewFarmer, onEdit }) => {
  const images = (crop.image_urls && crop.image_urls.length > 0)
    ? crop.image_urls
    : (crop.image_url ? [crop.image_url] : []);
  const [imgIdx, setImgIdx] = useState(0);
  const currentImg = images[imgIdx];
  const pricePerUnit = typeof crop.price_per_unit === 'number' && Number.isFinite(crop.price_per_unit)
    ? crop.price_per_unit
    : null;
  const quantity = typeof crop.quantity === 'number' && Number.isFinite(crop.quantity)
    ? crop.quantity
    : null;
  const initials = (crop.crop_name || "Crop")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");


  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-40">
        {currentImg ? (
          <>
            <img
              src={currentImg}
              alt={`${crop.crop_name} image ${imgIdx + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setImgIdx((i) => (i - 1 + images.length) % images.length); }}
                  className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setImgIdx((i) => (i + 1) % images.length); }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1"
                  aria-label="Next photo"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
                  {imgIdx + 1}/{images.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <div className="text-center">
              <div className="font-heading text-3xl font-bold text-foreground">{initials || "CR"}</div>
              <div className="text-xs text-muted-foreground mt-1">{crop.crop_name}</div>
            </div>
          </div>
        )}


        {onEdit && (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute top-2 left-2 h-8 w-8 shadow"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            aria-label="Edit crop"
            title="Edit crop"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-lg">{crop.crop_name}</h3>
            <Badge variant="outline" className="mt-1">
              <Wheat className="h-3 w-3 mr-1" />
              {crop.crop_type}
            </Badge>
          </div>
          <div className="text-right">
            <div className="flex items-center text-primary font-bold text-lg">
              <IndianRupee className="h-4 w-4" />
              {pricePerUnit !== null ? pricePerUnit.toLocaleString('en-IN') : 'Price unavailable'}
            </div>
            <span className="text-xs text-muted-foreground">per {crop.unit}</span>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="font-medium">Qty:</span>
            <span>{quantity !== null ? `${quantity} ${crop.unit}` : 'Quantity unavailable'}</span>
          </div>
          
          {(crop.location || crop.state) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{[crop.location, crop.state].filter(Boolean).join(', ')}</span>
            </div>
          )}
          
          {crop.harvest_date && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Harvest: {new Date(crop.harvest_date).toLocaleDateString('en-IN')}</span>
            </div>
          )}

          {crop.description && (
            <p className="text-muted-foreground line-clamp-2 mt-2">{crop.description}</p>
          )}
        </div>

        {showFarmerContact && crop.farmer && (
          <div className="mt-3 pt-3 border-t">
            <p className="font-medium text-sm mb-1">Farmer: {crop.farmer.full_name}</p>
            <div className="flex gap-2 text-xs text-muted-foreground">
              {crop.farmer.phone && (
                <a href={`tel:${crop.farmer.phone}`} className="flex items-center gap-1 hover:text-primary">
                  <Phone className="h-3 w-3" />
                  {crop.farmer.phone}
                </a>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {showFarmerContact && onContact && (
        <CardFooter className="p-4 pt-0 gap-2">
          <Button onClick={onContact} className="flex-1" size="sm">
            <Phone className="h-4 w-4 mr-2" />
            Contact
          </Button>
          {onWhatsApp && (
            <Button
              size="icon"
              variant="outline"
              className="border-green-600 text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
              onClick={onWhatsApp}
              aria-label="WhatsApp farmer"
              title="WhatsApp"
            >
              <WhatsAppIcon size={16} />
            </Button>
          )}
          {onViewFarmer && (
            <Button
              size="icon"
              variant="outline"
              onClick={onViewFarmer}
              aria-label="View farmer details"
              title="View farmer details"
            >
              <Info className="h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};
