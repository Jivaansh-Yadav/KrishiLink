import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, Sun, CloudRain, Wind, Droplets, Thermometer, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { stateDistricts } from '@/data/districts';
import { WeatherDetailModal } from './WeatherDetailModal';

interface WeatherData {
  location: { name: string; region?: string; lat?: number; lon?: number };
  current: {
    temp_c: number;
    condition: { text: string; icon: string };
    humidity: number;
    wind_kph: number;
    feelslike_c: number;
    uv?: number;
    precip_mm?: number;
  };
  astronomical?: any;
  forecast?: any[];
  rainfall?: any;
  agronomy?: any;
}

interface WeatherCardProps {
  location?: string;
}

// Delhi fallback
const FALLBACK = { name: 'Delhi', lat: 28.6139, lon: 77.209 };

const findCoords = (cityOrState?: string) => {
  if (!cityOrState) return FALLBACK;
  const q = cityOrState.trim().toLowerCase();
  for (const districts of Object.values(stateDistricts)) {
    for (const d of districts) {
      if (typeof d === 'object' && d?.name && d.lat != null && d.lon != null
          && d.name.toLowerCase() === q) {
        return { name: d.name, lat: d.lat as number, lon: d.lon as number };
      }
    }
  }
  // try state name → use first district with coords
  const stateKey = Object.keys(stateDistricts).find(s => s.toLowerCase() === q);
  if (stateKey) {
    const first = stateDistricts[stateKey].find(d => d.lat != null && d.lon != null);
    if (first) return { name: stateKey, lat: first.lat as number, lon: first.lon as number };
  }
  return FALLBACK;
};

export const WeatherCard: React.FC<WeatherCardProps> = ({ location = 'Delhi' }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const coords = findCoords(location);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      const { data, error } = await supabase.functions.invoke('weather', {
        body: { lat: coords.lat, lon: coords.lon, name: coords.name },
      });

      if (error) throw error;

      setWeather(data as WeatherData);
      setError(null);
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError('Unable to load weather data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [coords.lat, coords.lon]);

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

  return (
    <>
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          Weather in {coords.name}
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1"
          onClick={() => setShowDetail(true)}
          aria-label="Expand weather details"
        >
          <Maximize2 className="h-4 w-4" />
          <span className="text-xs">Expand</span>
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
      </CardContent>
    </Card>
    <WeatherDetailModal
      open={showDetail}
      onOpenChange={setShowDetail}
      weather={weather as any}
      location={coords.name}
      onRefresh={fetchWeather}
      refreshing={refreshing}
    />
    </>
  );
};
