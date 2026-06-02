import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, Sun, CloudRain, Wind, Droplets, Thermometer, Maximize2, CheckCircle2, AlertTriangle, ShieldAlert, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { WeatherDetailModal } from './WeatherDetailModal';

interface WeatherData {
  location: { name: string; region: string };
  current: {
    temp_c: number;
    condition: { text: string; icon: string };
    humidity: number;
    wind_kph: number;
    feelslike_c: number;
  };
  astronomical?: any;
  forecast?: any[];
  rainfall?: any;
}

interface AiSummary {
  severity: 'green' | 'yellow' | 'red';
  headline: string;
  summary: string;
  do: string[];
  dont: string[];
}

interface WeatherCardProps {
  location?: string;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({ location = 'Delhi' }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<AiSummary | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.functions.invoke('weather', {
          body: { location },
        });

        if (error) throw error;

        setWeather(data as WeatherData);
        setError(null);

        // Fetch AI advisory (non-blocking)
        try {
          const { data: aiData } = await supabase.functions.invoke('ai', {
            body: { mode: 'weather-summary', weather: data, location },
          });
          const raw = (aiData as any)?.content || '';
          const cleaned = raw.replace(/```json|```/g, '').trim();
          const match = cleaned.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            setAiSummary(parsed);
          }
        } catch (aiErr) {
          console.warn('AI weather summary failed:', aiErr);
        }
      } catch (err) {
        console.error('Weather fetch error:', err);
        setError('Unable to load weather data');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [location]);

  const getWeatherIcon = (condition: string) => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) {
      return <CloudRain className="h-12 w-12 text-primary" />;
    } else if (lowerCondition.includes('cloud') || lowerCondition.includes('overcast')) {
      return <Cloud className="h-12 w-12 text-muted-foreground" />;
    } else {
      return <Sun className="h-12 w-12 text-primary" />;
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardContent className="p-6 flex items-center justify-center min-h-[200px]">
          <div className="animate-pulse text-muted-foreground">Loading weather...</div>
        </CardContent>
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardContent className="p-6 flex items-center justify-center min-h-[200px]">
          <div className="text-muted-foreground">{error || 'Weather unavailable'}</div>
        </CardContent>
      </Card>
    );
  }

  const sevMap = {
    green: { cls: 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400', Icon: CheckCircle2 },
    yellow: { cls: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400', Icon: AlertTriangle },
    red: { cls: 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400', Icon: ShieldAlert },
  } as const;
  const sev = aiSummary ? sevMap[aiSummary.severity] : null;

  return (
    <>
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          Weather in {weather.location.name}
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setShowDetail(true)}
          aria-label="Expand weather details"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {getWeatherIcon(weather.current.condition.text)}
            <div>
              <div className="text-4xl font-bold">{Math.round(weather.current.temp_c)}°C</div>
              <div className="text-muted-foreground">{weather.current.condition.text}</div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-orange-500" />
            <div>
              <div className="text-xs text-muted-foreground">Feels Like</div>
              <div className="font-medium">{Math.round(weather.current.feelslike_c)}°C</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-500" />
            <div>
              <div className="text-xs text-muted-foreground">Humidity</div>
              <div className="font-medium">{weather.current.humidity}%</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-teal-500" />
            <div>
              <div className="text-xs text-muted-foreground">Wind</div>
              <div className="font-medium">{Math.round(weather.current.wind_kph)} km/h</div>
            </div>
          </div>
        </div>

        {aiSummary && sev && (
          <button
            onClick={() => setShowDetail(true)}
            className={`mt-4 w-full text-left rounded-md border p-3 text-xs space-y-1 transition hover:opacity-90 ${sev.cls}`}
          >
            <div className="flex items-center gap-1.5 font-semibold">
              <sev.Icon className="h-3.5 w-3.5" />
              <Sparkles className="h-3 w-3" />
              <span>{aiSummary.headline}</span>
            </div>
            <p className="text-foreground/80 leading-snug">{aiSummary.summary}</p>
            {(aiSummary.do?.[0] || aiSummary.dont?.[0]) && (
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 pt-1 text-[11px]">
                {aiSummary.do?.[0] && <span className="text-green-700 dark:text-green-400">✓ {aiSummary.do[0]}</span>}
                {aiSummary.dont?.[0] && <span className="text-red-700 dark:text-red-400">✗ {aiSummary.dont[0]}</span>}
              </div>
            )}
          </button>
        )}
      </CardContent>
    </Card>
    <WeatherDetailModal
      open={showDetail}
      onOpenChange={setShowDetail}
      weather={weather as any}
      aiSummary={aiSummary}
    />
    </>
  );
};
