import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVoiceCommandContext } from '@/contexts/VoiceCommandContext';
import { cn } from '@/lib/utils';

interface VoiceCommandButtonProps {
  className?: string;
  variant?: 'floating' | 'inline';
}

export function VoiceCommandButton({ className, variant = 'floating' }: VoiceCommandButtonProps) {
  const { status, isSupported, startVoiceSearch } = useVoiceCommandContext();

  if (!isSupported) {
    return null;
  }

  const isListening = status === 'listening';

  if (variant === 'inline') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={startVoiceSearch}
        className={cn(
          'transition-all duration-300',
          isListening && 'text-primary animate-pulse',
          className
        )}
        title="Voice search"
      >
        {isListening ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </Button>
    );
  }

  return (
    <Button
      onClick={startVoiceSearch}
      className={cn(
        'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-300',
        'bg-primary hover:bg-primary/90 text-primary-foreground',
        'flex items-center justify-center',
        isListening && 'animate-pulse ring-4 ring-primary/30',
        className
      )}
      title="Voice search"
    >
      <Mic className="w-6 h-6" />
      
      {/* Pulse rings when listening */}
      {isListening && (
        <>
          <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          <span className="absolute inset-[-4px] rounded-full border-2 border-primary/40 animate-pulse" />
        </>
      )}
    </Button>
  );
}
