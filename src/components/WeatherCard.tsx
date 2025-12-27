import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, Sun, CloudRain, Wind, Droplets, Thermometer } from 'lucide-react';

interface WeatherData {
  location: {
    name: string;
    region: string;
  };
  current: {
    temp_c: number;
    condition: {
      text: string;
      icon: string;
    };
    humidity: number;
    wind_kph: number;
    feelslike_c: number;
  };
}

interface WeatherCardProps {
  location?: string;
}

const WEATHER_API_KEY = 'c2f92a4c124f4c0c902113230250501';

export const WeatherCard: React.FC<WeatherCardProps> = ({ location = 'Delhi' }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(location)}&aqi=no`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch weather data');
        }
        
        const data = await response.json();
        setWeather(data);
        setError(null);
      } catch (err) {
        setError('Unable to load weather data');
        console.error('Weather fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [location]);

  const getWeatherIcon = (condition: string) => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) {
      return <CloudRain className="h-12 w-12 text-blue-500" />;
    } else if (lowerCondition.includes('cloud') || lowerCondition.includes('overcast')) {
      return <Cloud className="h-12 w-12 text-gray-500" />;
    } else {
      return <Sun className="h-12 w-12 text-yellow-500" />;
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
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          Weather in {weather.location.name}
        </CardTitle>
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
  );
};
