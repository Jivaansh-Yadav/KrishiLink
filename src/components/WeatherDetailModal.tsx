import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Cloud, Sun, CloudRain, Wind, Droplets, Thermometer,
  Sunrise, Sunset, CalendarDays, AlertTriangle, CheckCircle2, ShieldAlert,
  Sparkles, Loader2, Gauge, Moon,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ForecastDay {
  date?: string;
  max_temp?: number;
  min_temp?: number;
  description?: string;
}

interface WeatherDetail {
  location: { name: string; region?: string };
  current: {
    temp_c: number;
    condition: { text: string };
    humidity: number;
    wind_kph: number;
    feelslike_c: number;
  };
  astronomical?: {
    sunrise?: string;
    sunset?: string;
    moonrise?: string;
    moonset?: string;
  } | null;
  forecast?: ForecastDay[];
  rainfall?: any;
}

interface AiSummary {
  severity: 'green' | 'yellow' | 'red';
  headline: string;
  summary: string;
  do: string[];
  dont: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  weather: WeatherDetail | null;
  location?: string;
}

const severityStyles: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
  green: { bg: 'bg-green-500/10 border-green-500/30', text: 'text-green-700 dark:text-green-400', icon: <CheckCircle2 className="h-5 w-5" />, label: 'Safe' },
  yellow: { bg: 'bg-yellow-500/10 border-yellow-500/30', text: 'text-yellow-700 dark:text-yellow-400', icon: <AlertTriangle className="h-5 w-5" />, label: 'Caution' },
  red: { bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-700 dark:text-red-400', icon: <ShieldAlert className="h-5 w-5" />, label: 'Warning' },
};

export const WeatherDetailModal: React.FC<Props> = ({ open, onOpenChange, weather, location }) => {
  const [aiSummary, setAiSummary] = useState<AiSummary | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!open || !weather || aiSummary) return;
    let cancelled = false;
    (async () => {
      try {
        setAiLoading(true);
        const { data } = await supabase.functions.invoke('ai', {
          body: { mode: 'weather-summary', weather, location: location || weather.location?.name },
        });
        const raw = (data as any)?.content || '';
        const cleaned = raw.replace(/```json|```/g, '').trim();
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match && !cancelled) {
          setAiSummary(JSON.parse(match[0]));
        }
      } catch (err) {
        console.warn('AI weather summary failed:', err);
      } finally {
        if (!cancelled) setAiLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, weather, location, aiSummary]);

  if (!weather) return null;
  const sev = aiSummary ? severityStyles[aiSummary.severity] || severityStyles.green : null;
  const forecast = weather.forecast || [];
  const rain = weather.rainfall as any;
  const rainText = rain
    ? (typeof rain === 'object'
        ? (rain.last_24hrs ?? rain.value ?? JSON.stringify(rain))
        : String(rain))
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Weather Details — {weather.location.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* AI Advisory */}
          {aiLoading && !aiSummary && (
            <Card className="border-2 border-dashed">
              <CardContent className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <Sparkles className="h-4 w-4 text-primary" />
                Generating AI weather advisory…
              </CardContent>
            </Card>
          )}
          {aiSummary && sev && (
            <Card className={`border-2 ${sev.bg}`}>
              <CardContent className="p-4 space-y-3">
                <div className={`flex items-center gap-2 font-semibold ${sev.text}`}>
                  {sev.icon}
                  <Sparkles className="h-4 w-4" />
                  <span>{sev.label}: {aiSummary.headline}</span>
                </div>
                <p className="text-sm">{aiSummary.summary}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="font-medium text-green-700 dark:text-green-400 mb-1">✓ Do</div>
                    <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                      {aiSummary.do.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                  </div>
                  <div>
                    <div className="font-medium text-red-700 dark:text-red-400 mb-1">✗ Don't</div>
                    <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                      {aiSummary.dont.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current conditions */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-4xl font-bold">{Math.round(weather.current.temp_c)}°C</div>
                  <div className="text-muted-foreground">{weather.current.condition.text}</div>
                </div>
                <Sun className="h-14 w-14 text-primary" />
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2"><Thermometer className="h-4 w-4 text-orange-500" /><span>Feels {Math.round(weather.current.feelslike_c)}°C</span></div>
                <div className="flex items-center gap-2"><Droplets className="h-4 w-4 text-blue-500" /><span>{weather.current.humidity}% RH</span></div>
                <div className="flex items-center gap-2"><Wind className="h-4 w-4 text-teal-500" /><span>{Math.round(weather.current.wind_kph)} km/h</span></div>
              </div>
              {rainText && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <CloudRain className="h-4 w-4 text-blue-600" />
                  <span>Rainfall: {rainText}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sun / moon */}
          {weather.astronomical && (
            <Card>
              <CardContent className="p-4">
                <div className="font-semibold mb-2">Sun & Moon</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {weather.astronomical.sunrise && (
                    <div className="flex items-center gap-2"><Sunrise className="h-4 w-4 text-orange-400" />Sunrise {weather.astronomical.sunrise}</div>
                  )}
                  {weather.astronomical.sunset && (
                    <div className="flex items-center gap-2"><Sunset className="h-4 w-4 text-orange-600" />Sunset {weather.astronomical.sunset}</div>
                  )}
                  {weather.astronomical.moonrise && (
                    <div className="flex items-center gap-2">🌙 Moonrise {weather.astronomical.moonrise}</div>
                  )}
                  {weather.astronomical.moonset && (
                    <div className="flex items-center gap-2">🌑 Moonset {weather.astronomical.moonset}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Forecast */}
          {forecast.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="font-semibold mb-3 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" /> Forecast
                </div>
                <div className="space-y-2">
                  {forecast.slice(0, 7).map((f, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 p-2 rounded-md bg-muted/50">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{f.date || `Day ${i + 1}`}</div>
                        <div className="text-xs text-muted-foreground">{f.description || '—'}</div>
                      </div>
                      <Badge variant="outline" className="whitespace-nowrap">
                        {f.min_temp ?? '–'}° / {f.max_temp ?? '–'}°
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};