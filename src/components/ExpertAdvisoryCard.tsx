import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, ExternalLink, HelpCircle } from 'lucide-react';

interface HelplineInfo {
  name: string;
  number: string;
  description: string;
  toll_free?: boolean;
}

const helplines: HelplineInfo[] = [
  {
    name: 'PM Kisan Helpline',
    number: '155261',
    description: 'PM Kisan Samman Nidhi Yojana support',
    toll_free: true,
  },
  {
    name: 'PM Kisan Support',
    number: '011-24300606',
    description: 'Direct assistance for PM Kisan queries',
    toll_free: true,
  },
  {
    name: 'Kisan Call Centre',
    number: '1800-180-1551',
    description: 'DACKKMS - 24/7 agricultural support',
    toll_free: true,
  },
  {
    name: 'Agriculture Ministry',
    number: '1800-11-0031',
    description: 'Ministry of Agriculture helpline',
    toll_free: true,
  },
];

const usefulLinks = [
  { name: 'PM Kisan Portal', url: 'https://pmkisan.gov.in/' },
  { name: 'Kisan Suvidha', url: 'https://kisansuvidha.gov.in/' },
  { name: 'eNAM Portal', url: 'https://enam.gov.in/' },
];

export const ExpertAdvisoryCard: React.FC = () => {
  const handleCall = (number: string) => {
    window.open(`tel:${number}`, '_self');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          Expert Advisory Helplines
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {helplines.map((helpline) => (
            <div
              key={helpline.number}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm truncate">{helpline.name}</h4>
                  {helpline.toll_free && (
                    <span className="text-xs text-primary font-medium">Toll-Free</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {helpline.description}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCall(helpline.number)}
                className="flex-shrink-0 ml-2"
              >
                <Phone className="h-3 w-3 mr-1" />
                {helpline.number}
              </Button>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t">
          <h4 className="text-sm font-medium mb-2">Useful Links</h4>
          <div className="flex flex-wrap gap-2">
            {usefulLinks.map((link) => (
              <Button
                key={link.name}
                size="sm"
                variant="ghost"
                className="h-auto py-1 px-2 text-xs"
                onClick={() => window.open(link.url, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                {link.name}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
