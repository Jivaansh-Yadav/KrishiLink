import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Cloud, Sun, CloudRain, Wind, Droplets, Thermometer,
  Sunrise, Sunset, CalendarDays, AlertTriangle, CheckCircle2, ShieldAlert,
  Sparkles, Loader2, Sprout, Bug, CalendarRange, Gauge, RotateCcw,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ForecastDay {
  date?: string;
  max_temp?: number;
  min_temp?: number;
  precip_mm?: number;
  precip_prob?: number;
  uv_max?: number;
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
    uv?: number;
    precip_mm?: number;
    wind_gust_kph?: number;
  };
  astronomical?: { sunrise?: string; sunset?: string } | null;
  forecast?: ForecastDay[];
  rainfall?: { today_mm?: number; prob_pct?: number };
  agronomy?: {
    dew_point_c?: number | null;
    soil_temp_c?: number | null;
    et0_today?: number | null;
    max_dry_spell_days?: number;
    max_rainy_spell_days?: number;
    rain_14d_mm?: number;
    uv_index_today?: number | null;
    precip_prob_today?: number | null;
  };
}

interface AiSummary {
  severity: 'green' | 'yellow' | 'red';
  headline: string;
  summary: string;
  categories?: Record<string, { title: string; points: string[] }>;
  do: string[];
  dont: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  weather: WeatherDetail | null;
  location?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}

const severityStyles: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
  green: { bg: 'bg-green-500/10 border-green-500/30', text: 'text-green-700 dark:text-green-400', icon: <CheckCircle2 className="h-5 w-5" />, label: 'Safe' },
  yellow: { bg: 'bg-yellow-500/10 border-yellow-500/30', text: 'text-yellow-700 dark:text-yellow-400', icon: <AlertTriangle className="h-5 w-5" />, label: 'Caution' },
  red: { bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-700 dark:text-red-400', icon: <ShieldAlert className="h-5 w-5" />, label: 'Warning' },
};

const categoryIcons: Record<string, React.ReactNode> = {
  immediate: <Sun className="h-4 w-4" />,
  crop_field: <Sprout className="h-4 w-4" />,
  pest_disease: <Bug className="h-4 w-4" />,
  seasonal: <CalendarRange className="h-4 w-4" />,
};

export const WeatherDetailModal: React.FC<Props> = ({ open, onOpenChange, weather, location, onRefresh, refreshing }) => {
  const [aiSummary, setAiSummary] = useState<AiSummary | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!open || !weather) return;
    let cancelled = false;
    (async () => {
      try {
        setAiLoading(true);
        setAiSummary(null);
        const { data } = await supabase.functions.invoke('ai', {
          body: { mode: 'weather-summary', weather, location: location || weather.location?.name },
        });
        const raw = (data as any)?.content || '';
        const cleaned = raw.replace(/```json|```/g, '').trim();
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match && !cancelled) setAiSummary(JSON.parse(match[0]));
      } catch (err) {
        console.warn('AI weather summary failed:', err);
      } finally {
        if (!cancelled) setAiLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, weather, location]);

  if (!weather) return null;
  const sev = aiSummary ? severityStyles[aiSummary.severity] || severityStyles.green : null;
  const forecast = weather.forecast || [];
  const ag = weather.agronomy || {};
  const rain = weather.rainfall || {};

  const fmtNum = (n?: number | null, d = 1) =>
    n == null || !isFinite(n as number) ? '–' : (Math.round((n as number) * 10 ** d) / 10 ** d).toString();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Weather Details — {weather.location.name}
            </DialogTitle>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                className="mr-8 inline-flex h-8 items-center gap-1.5 rounded-full border border-input bg-background px-3 text-sm text-muted-foreground hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Refresh weather data"
              >
                {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                <span>Refresh</span>
              </button>
            )}
          </div>
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

                {aiSummary.categories && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(aiSummary.categories).map(([key, cat]) => (
                      <div key={key} className="rounded-md border bg-background/50 p-3">
                        <div className="flex items-center gap-2 font-medium text-sm mb-2">
                          {categoryIcons[key] || <Sparkles className="h-4 w-4" />}
                          {cat.title}
                        </div>
                        <ul className="space-y-1 text-xs text-muted-foreground list-disc list-inside">
                          {cat.points?.map((p, i) => <li key={i}>{p}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm pt-1">
                  <div>
                    <div className="font-medium text-green-700 dark:text-green-400 mb-1">✓ Do</div>
                    <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                      {aiSummary.do?.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                  </div>
                  <div>
                    <div className="font-medium text-red-700 dark:text-red-400 mb-1">✗ Don't</div>
                    <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                      {aiSummary.dont?.map((d, i) => <li key={i}>{d}</li>)}
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="flex items-center gap-2"><Thermometer className="h-4 w-4 text-orange-500" /><span>Feels {Math.round(weather.current.feelslike_c)}°C</span></div>
                <div className="flex items-center gap-2"><Droplets className="h-4 w-4 text-blue-500" /><span>{weather.current.humidity}% RH</span></div>
                <div className="flex items-center gap-2"><Wind className="h-4 w-4 text-teal-500" /><span>{Math.round(weather.current.wind_kph)} km/h</span></div>
                <div className="flex items-center gap-2"><Gauge className="h-4 w-4 text-purple-500" /><span>UV {fmtNum(weather.current.uv, 1)}</span></div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm">
                <CloudRain className="h-4 w-4 text-blue-600" />
                <span>Rain today: {fmtNum(rain.today_mm, 1)} mm · {fmtNum(rain.prob_pct, 0)}% chance</span>
              </div>
            </CardContent>
          </Card>

          {/* Agronomy */}
          <Card>
            <CardContent className="p-4">
              <div className="font-semibold mb-3 flex items-center gap-2"><Sprout className="h-4 w-4" /> Agronomy</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <Stat label="Dew point" value={`${fmtNum(ag.dew_point_c)}°C`} />
                <Stat label="Soil temp (0cm)" value={`${fmtNum(ag.soil_temp_c)}°C`} />
                <Stat label="ET₀ today" value={`${fmtNum(ag.et0_today)} mm`} />
                <Stat label="Max dry spell" value={`${ag.max_dry_spell_days ?? 0} d`} />
                <Stat label="Max wet spell" value={`${ag.max_rainy_spell_days ?? 0} d`} />
                <Stat label="14-day rainfall" value={`${fmtNum(ag.rain_14d_mm)} mm`} />
              </div>
            </CardContent>
          </Card>

          {/* Sun */}
          {weather.astronomical && (weather.astronomical.sunrise || weather.astronomical.sunset) && (
            <Card>
              <CardContent className="p-4">
                <div className="font-semibold mb-2">Sun</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {weather.astronomical.sunrise && (
                    <div className="flex items-center gap-2"><Sunrise className="h-4 w-4 text-orange-400" />Sunrise {weather.astronomical.sunrise}</div>
                  )}
                  {weather.astronomical.sunset && (
                    <div className="flex items-center gap-2"><Sunset className="h-4 w-4 text-orange-600" />Sunset {weather.astronomical.sunset}</div>
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
                  <CalendarDays className="h-4 w-4" /> 14-Day Forecast
                </div>
                <div className="space-y-2">
                  {forecast.slice(0, 14).map((f, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 p-2 rounded-md bg-muted/50">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{f.date || `Day ${i + 1}`}</div>
                        <div className="text-xs text-muted-foreground truncate">{f.description || '—'}</div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="outline" className="whitespace-nowrap">
                          {fmtNum(f.min_temp, 0)}° / {fmtNum(f.max_temp, 0)}°
                        </Badge>
                        <Badge variant="secondary" className="whitespace-nowrap">
                          <CloudRain className="h-3 w-3 mr-1" />
                          {fmtNum(f.precip_mm, 1)}mm
                        </Badge>
                        <span className="text-muted-foreground hidden sm:inline">{fmtNum(f.precip_prob, 0)}%</span>
                      </div>
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

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-md border bg-muted/30 p-2">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="font-medium">{value}</div>
  </div>
);