import { useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, X, Loader2 } from 'lucide-react';
import { useVoiceCommandContext } from '@/contexts/VoiceCommandContext';
import { cn } from '@/lib/utils';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

export function VoiceSearchModal() {
  const {
    status,
    transcript,
    interimTranscript,
    isModalOpen,
    closeModal,
    startVoiceSearch,
    stopVoiceSearch,
  } = useVoiceCommandContext();

  const isListening = status === 'listening';
  const isProcessing = status === 'processing';
  const isError = status === 'error';

  // Restart listening when clicking the mic button while modal is open
  const handleMicClick = () => {
    if (isListening) {
      stopVoiceSearch();
    } else {
      startVoiceSearch();
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-lg bg-card border-border/50 backdrop-blur-xl">
        <VisuallyHidden>
          <DialogTitle>Voice Search</DialogTitle>
        </VisuallyHidden>
        
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={closeModal}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </Button>

        <div className="flex flex-col items-center py-8 px-4">
          {/* Animated microphone button */}
          <div className="relative mb-8">
            <Button
              onClick={handleMicClick}
              className={cn(
                'w-24 h-24 rounded-full transition-all duration-300',
                isListening
                  ? 'bg-live hover:bg-live/90 shadow-[0_0_30px_rgba(239,68,68,0.4)]'
                  : 'bg-primary hover:bg-primary/90',
                isProcessing && 'bg-secondary',
                isError && 'bg-destructive'
              )}
            >
              {isProcessing ? (
                <Loader2 className="w-10 h-10 animate-spin" />
              ) : isListening ? (
                <MicOff className="w-10 h-10" />
              ) : (
                <Mic className="w-10 h-10" />
              )}
            </Button>

            {/* Animated rings */}
            {isListening && (
              <>
                <span className="absolute inset-0 rounded-full bg-live/20 animate-ping" />
                <span className="absolute inset-[-8px] rounded-full border-2 border-live/30 animate-pulse" />
                <span className="absolute inset-[-16px] rounded-full border border-live/20 animate-pulse" style={{ animationDelay: '0.2s' }} />
              </>
            )}
          </div>

          {/* Status text */}
          <div className="text-center space-y-3 min-h-[80px]">
            {isListening && !interimTranscript && !transcript && (
              <p className="text-lg text-muted-foreground animate-pulse">
                Listening... Speak now
              </p>
            )}

            {/* Interim transcript (real-time) */}
            {interimTranscript && (
              <p className="text-xl text-foreground/70 font-medium">
                {interimTranscript}
              </p>
            )}

            {/* Final transcript */}
            {transcript && (
              <div className="space-y-2">
                <p className="text-xl text-foreground font-semibold">
                  "{transcript}"
                </p>
                {isProcessing && (
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching...
                  </p>
                )}
              </div>
            )}

            {isError && (
              <div className="space-y-2">
                <p className="text-destructive font-medium">
                  Voice recognition unavailable
                </p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  This feature works best in the deployed app or a direct browser tab. Preview environments may block voice access.
                </p>
              </div>
            )}
          </div>

          {/* Helper text */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Try saying:
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-3">
              {[
                'Search for Breaking Bad',
                'Go to Movies',
                'Find ESPN',
                'Show Live TV',
              ].map((example) => (
                <span
                  key={example}
                  className="px-3 py-1.5 text-xs bg-muted rounded-full text-muted-foreground"
                >
                  "{example}"
                </span>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
