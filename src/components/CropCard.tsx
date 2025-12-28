import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Phone, Mail, Wheat, IndianRupee } from 'lucide-react';

interface CropCardProps {
  crop: {
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
  };
  showFarmerContact?: boolean;
  onContact?: () => void;
}

export const CropCard: React.FC<CropCardProps> = ({ crop, showFarmerContact = false, onContact }) => {
  const initials = (crop.crop_name || "Crop")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  const statusClass =
    crop.status === "available"
      ? "bg-primary text-primary-foreground"
      : crop.status === "sold"
        ? "bg-destructive text-destructive-foreground"
        : "bg-secondary text-secondary-foreground";

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-40">
        {crop.image_url ? (
          <img
            src={crop.image_url}
            alt={`${crop.crop_name} crop image`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <div className="text-center">
              <div className="font-heading text-3xl font-bold text-foreground">{initials || "CR"}</div>
              <div className="text-xs text-muted-foreground mt-1">{crop.crop_name}</div>
            </div>
          </div>
        )}

        <Badge className={`absolute top-2 right-2 ${statusClass}`}>
          {crop.status}
        </Badge>
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
              {crop.price_per_unit.toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-muted-foreground">per {crop.unit}</span>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="font-medium">Qty:</span>
            <span>{crop.quantity} {crop.unit}</span>
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
        <CardFooter className="p-4 pt-0">
          <Button onClick={onContact} className="w-full" size="sm">
            <Phone className="h-4 w-4 mr-2" />
            Contact Farmer
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
