import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useVoiceCommand, VoiceCommandStatus } from '@/hooks/useVoiceCommand';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

interface VoiceCommandContextType {
  status: VoiceCommandStatus;
  transcript: string;
  interimTranscript: string;
  isSupported: boolean;
  isModalOpen: boolean;
  startVoiceSearch: () => void;
  stopVoiceSearch: () => void;
  closeModal: () => void;
  searchQuery: string;
}

const VoiceCommandContext = createContext<VoiceCommandContextType | undefined>(undefined);

interface VoiceCommandProviderProps {
  children: ReactNode;
}

export function VoiceCommandProvider({ children }: VoiceCommandProviderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleResult = useCallback((transcript: string) => {
    setSearchQuery(transcript);
    
    // Parse voice commands
    const lowerTranscript = transcript.toLowerCase();
    
    // Navigation commands
    if (lowerTranscript.includes('go to live') || lowerTranscript.includes('open live tv') || lowerTranscript.includes('show live')) {
      navigate('/live');
      toast.success('Navigating to Live TV');
      setIsModalOpen(false);
      return;
    }
    
    if (lowerTranscript.includes('go to movies') || lowerTranscript.includes('open movies') || lowerTranscript.includes('show movies')) {
      navigate('/movies');
      toast.success('Navigating to Movies');
      setIsModalOpen(false);
      return;
    }
    
    if (lowerTranscript.includes('go to series') || lowerTranscript.includes('open series') || lowerTranscript.includes('show series')) {
      navigate('/series');
      toast.success('Navigating to Series');
      setIsModalOpen(false);
      return;
    }
    
    if (lowerTranscript.includes('go to favorites') || lowerTranscript.includes('open favorites') || lowerTranscript.includes('show favorites')) {
      navigate('/favorites');
      toast.success('Navigating to Favorites');
      setIsModalOpen(false);
      return;
    }
    
    if (lowerTranscript.includes('go to settings') || lowerTranscript.includes('open settings')) {
      navigate('/settings');
      toast.success('Navigating to Settings');
      setIsModalOpen(false);
      return;
    }
    
    if (lowerTranscript.includes('go home') || lowerTranscript.includes('go to home')) {
      navigate('/');
      toast.success('Navigating to Home');
      setIsModalOpen(false);
      return;
    }

    // Search commands - extract search query
    let searchTerm = transcript;
    
    // Remove common prefixes
    const prefixes = [
      'search for',
      'search',
      'find',
      'look for',
      'play',
      'watch',
      'show me',
      'open',
    ];
    
    for (const prefix of prefixes) {
      if (lowerTranscript.startsWith(prefix)) {
        searchTerm = transcript.slice(prefix.length).trim();
        break;
      }
    }

    // Determine which page to search on based on current location or keywords
    const currentPath = location.pathname;
    
    if (lowerTranscript.includes('channel') || lowerTranscript.includes('live')) {
      navigate(`/live?search=${encodeURIComponent(searchTerm)}`);
    } else if (lowerTranscript.includes('movie')) {
      navigate(`/movies?search=${encodeURIComponent(searchTerm)}`);
    } else if (lowerTranscript.includes('series') || lowerTranscript.includes('show')) {
      navigate(`/series?search=${encodeURIComponent(searchTerm)}`);
    } else if (currentPath === '/live') {
      navigate(`/live?search=${encodeURIComponent(searchTerm)}`);
    } else if (currentPath === '/movies') {
      navigate(`/movies?search=${encodeURIComponent(searchTerm)}`);
    } else if (currentPath === '/series') {
      navigate(`/series?search=${encodeURIComponent(searchTerm)}`);
    } else {
      // Default to movies search
      navigate(`/movies?search=${encodeURIComponent(searchTerm)}`);
    }
    
    toast.success(`Searching for "${searchTerm}"`);
    
    // Close modal after a short delay to show the result
    setTimeout(() => {
      setIsModalOpen(false);
    }, 1500);
  }, [navigate, location.pathname]);

  const handleError = useCallback((error: string) => {
    toast.error(error);
  }, []);

  const {
    status,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceCommand({
    onResult: handleResult,
    onError: handleError,
  });

  const startVoiceSearch = useCallback(() => {
    resetTranscript();
    setSearchQuery('');
    setIsModalOpen(true);
    startListening();
  }, [startListening, resetTranscript]);

  const stopVoiceSearch = useCallback(() => {
    stopListening();
  }, [stopListening]);

  const closeModal = useCallback(() => {
    stopListening();
    setIsModalOpen(false);
    resetTranscript();
    setSearchQuery('');
  }, [stopListening, resetTranscript]);

  return (
    <VoiceCommandContext.Provider
      value={{
        status,
        transcript,
        interimTranscript,
        isSupported,
        isModalOpen,
        startVoiceSearch,
        stopVoiceSearch,
        closeModal,
        searchQuery,
      }}
    >
      {children}
    </VoiceCommandContext.Provider>
  );
}

export function useVoiceCommandContext() {
  const context = useContext(VoiceCommandContext);
  if (context === undefined) {
    throw new Error('useVoiceCommandContext must be used within a VoiceCommandProvider');
  }
  return context;
}
