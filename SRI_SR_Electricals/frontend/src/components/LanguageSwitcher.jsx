
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center space-x-1"
    >
      <Globe className="h-4 w-4 mr-1" />
      <span className="font-medium">
        {language === 'en' ? 'ENG' : 'தமிழ்'}
      </span>
    </Button>
  );
};

export default LanguageSwitcher;