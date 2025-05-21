
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/LanguageContext';

const VoiceSearch = ({ onResult }) => {
  const [isListening, setIsListening] = useState(false);
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  const startListening = () => {
    if (!recognition) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive",
      });
      return;
    }

    try {
      const recognitionInstance = new recognition();
      // Set language based on current app language
      recognitionInstance.lang = language === 'en' ? 'en-US' : 'ta-IN';
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;

      recognitionInstance.onstart = () => {
        setIsListening(true);
      };

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
        setIsListening(false);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        toast({
          title: "Error",
          description: `Speech recognition error: ${event.error}`,
          variant: "destructive",
        });
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      recognitionInstance.start();
    } catch (error) {
      console.error('Speech recognition error:', error);
      toast({
        title: "Error",
        description: "An error occurred while starting speech recognition.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={startListening}
      disabled={isListening}
      title={t('searchByVoice')}
      className="relative"
    >
      {isListening ? (
        <>
          <MicOff className="h-5 w-5 text-red-500" />
          <span className="sr-only">{t('listening')}</span>
          <div className="absolute -top-8 whitespace-nowrap bg-slate-800 text-white px-2 py-1 rounded text-xs">
            {t('listening')}
          </div>
        </>
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </Button>
  );
};

export default VoiceSearch;