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
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Loader2, Bug, AlertTriangle, CheckCircle, Leaf } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CropDiseaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DiagnosisResult {
  disease: string;
  confidence: string;
  description: string;
  symptoms: string[];
  treatment: string[];
  prevention: string[];
}

export const CropDiseaseModal: React.FC<CropDiseaseModalProps> = ({ open, onOpenChange }) => {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeDisease = async () => {
    if (!image && !symptoms) {
      toast.error('Please upload an image or describe symptoms');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const imageBase64 = imagePreview ? imagePreview.split(',')[1] : undefined;
      const mimeType = image?.type || 'image/jpeg';

      const { data, error } = await supabase.functions.invoke('ai', {
        body: {
          mode: 'disease',
          symptoms: symptoms || undefined,
          imageBase64,
          mimeType,
        },
      });

      if (error) throw error;

      const text = (data as any)?.content || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const diagnosis = JSON.parse(jsonMatch[0]);
        setResult(diagnosis);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Disease analysis error:', error);
      toast.error('Failed to analyze. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setImage(null);
    setImagePreview(null);
    setSymptoms('');
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-primary" />
            Crop Disease Detection
          </DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <div>
              <Label>Upload Crop Image</Label>
              <div className="mt-2">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Crop preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => { setImage(null); setImagePreview(null); }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Click to upload image</span>
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

            <div>
              <Label htmlFor="symptoms">Describe Crop Name and Symptoms (Optional)</Label>
              <Textarea
                id="symptoms"
                placeholder="E.g., Wheat crop leaves having yellow spots, wilting, brown edges..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="mt-2"
                rows={3}
              />
            </div>

            <Button
              onClick={analyzeDisease}
              disabled={loading || (!image && !symptoms)}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Leaf className="h-4 w-4 mr-2" />
                  Analyze Crop Disease
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Card className={`border-2 ${result.disease.toLowerCase().includes('healthy') ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  {result.disease.toLowerCase().includes('healthy') ? (
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-8 w-8 text-yellow-500" />
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">{result.disease}</h3>
                    <p className="text-sm text-muted-foreground">Confidence: {result.confidence}</p>
                  </div>
                </div>
                <p className="text-sm">{result.description}</p>
              </CardContent>
            </Card>

            {result.symptoms.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Symptoms</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {result.symptoms.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}

            {result.treatment.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-primary">Treatment</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {result.treatment.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            )}

            {result.prevention.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Prevention</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {result.prevention.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            )}

            <Button onClick={resetForm} variant="outline" className="w-full">
              Check Another Crop
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
