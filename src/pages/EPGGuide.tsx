import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Search, Tv, Loader2, ChevronLeft, ChevronRight, Clock, Calendar, Play } from "lucide-react";
import { useIPTV, LiveChannel } from "@/contexts/IPTVContext";
import { supabase } from "@/integrations/supabase/client";
import { useVideoPlayer } from "@/contexts/VideoPlayerContext";
import { cn } from "@/lib/utils";

interface EPGProgram {
  id: string;
  epg_id: string;
  title: string;
  lang: string;
  start: string;
  end: string;
  description: string;
  channel_id: string;
  start_timestamp: number;
  stop_timestamp: number;
}

const EPGGuide = () => {
  const navigate = useNavigate();
  const { liveChannels, liveCategories, getActivePlaylist, loadLiveContent } = useIPTV();
  const { playStream } = useVideoPlayer();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [epgData, setEpgData] = useState<Record<number, EPGProgram[]>>({});
  const [isLoadingEPG, setIsLoadingEPG] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeOffset, setTimeOffset] = useState(0);
  const [selectedChannel, setSelectedChannel] = useState<LiveChannel | null>(null);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Load channels on mount
  useEffect(() => {
    if (getActivePlaylist() && liveChannels.length === 0) {
      loadLiveContent();
    }
  }, []);

  // Fetch EPG data for visible channels
  const fetchEPGForChannels = async (channelIds: number[]) => {
    const playlist = getActivePlaylist();
    if (!playlist) return;

    setIsLoadingEPG(true);
    
    try {
      const channelsToFetch = channelIds.slice(0, 20);
      
      const epgPromises = channelsToFetch.map(async (streamId) => {
        const { data, error } = await supabase.functions.invoke('xtream-proxy', {
          body: {
            serverAddress: playlist.serverAddress,
            username: playlist.username,
            password: playlist.password,
            action: 'get_short_epg',
            streamId: streamId,
            limit: 10,
          },
        });

        if (!error && data?.epg_listings) {
          return { streamId, programs: data.epg_listings };
        }
        return { streamId, programs: [] };
      });

      const results = await Promise.all(epgPromises);
      
      const newEpgData: Record<number, EPGProgram[]> = {};
      results.forEach(({ streamId, programs }) => {
        newEpgData[streamId] = programs;
      });

      setEpgData(prev => ({ ...prev, ...newEpgData }));
    } catch (error) {
      console.error("Error fetching EPG:", error);
    } finally {
      setIsLoadingEPG(false);
    }
  };

  // Group channels by category
  const channelsByCategory = useMemo(() => {
    const grouped: Record<string, LiveChannel[]> = {};
    
    liveChannels.forEach((channel) => {
      const category = liveCategories.find(cat => cat.category_id === channel.category_id);
      const categoryName = category?.category_name || "Uncategorized";
      
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push(channel);
    });
    
    return grouped;
  }, [liveChannels, liveCategories]);

  // Get sorted category names
  const sortedCategories = useMemo(() => {
    return Object.keys(channelsByCategory).sort((a, b) => a.localeCompare(b));
  }, [channelsByCategory]);

  // Filter channels
  const filteredChannels = useMemo(() => {
    let channels = selectedCategory 
      ? (channelsByCategory[selectedCategory] || [])
      : liveChannels;
    
    if (searchQuery) {
      channels = channels.filter(channel => 
        channel.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return channels;
  }, [liveChannels, channelsByCategory, searchQuery, selectedCategory]);

  // Load EPG when channels are filtered
  useEffect(() => {
    if (filteredChannels.length > 0) {
      const channelIds = filteredChannels.map(c => c.stream_id);
      const missingEpg = channelIds.filter(id => !epgData[id]);
      if (missingEpg.length > 0) {
        fetchEPGForChannels(missingEpg);
      }
    }
  }, [filteredChannels]);

  // Set first channel as selected when loaded
  useEffect(() => {
    if (filteredChannels.length > 0 && !selectedChannel) {
      setSelectedChannel(filteredChannels[0]);
    }
  }, [filteredChannels, selectedChannel]);

  // Calculate time slots for the grid
  const baseTime = new Date(currentTime);
  baseTime.setHours(baseTime.getHours() + timeOffset);
  baseTime.setMinutes(0, 0, 0);

  const timeSlots = Array.from({ length: 4 }, (_, i) => {
    const time = new Date(baseTime);
    time.setMinutes(time.getMinutes() + i * 30);
    return time;
  });

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getProgramAtTime = (streamId: number, time: Date): EPGProgram | null => {
    const programs = epgData[streamId] || [];
    const timestamp = Math.floor(time.getTime() / 1000);
    
    return programs.find(p => {
      const start = parseInt(p.start_timestamp?.toString() || '0');
      const end = parseInt(p.stop_timestamp?.toString() || '0');
      return timestamp >= start && timestamp < end;
    }) || null;
  };

  const handlePlay = (channel: LiveChannel) => {
    playStream({
      type: "live",
      streamId: channel.stream_id,
      title: channel.name,
    });
  };

  const hasPlaylist = getActivePlaylist() !== null;

  if (!hasPlaylist) {
    return (
      <MainLayout>
        <div className="p-6 lg:p-8 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
            <Calendar className="w-10 h-10 text-primary" />
          </div>
          <h2 className="font-display font-bold text-2xl text-foreground mb-2 text-center">
            No Playlist Connected
          </h2>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Connect your IPTV provider using Xtream Codes to view the program guide
          </p>
          <Button variant="hero" onClick={() => navigate("/playlists")}>
            Add Playlist
          </Button>
        </div>
      </MainLayout>
    );
  }

  // Get current program for selected channel
  const currentProgram = selectedChannel ? getProgramAtTime(selectedChannel.stream_id, currentTime) : null;

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Sidebar - Categories */}
        <div className="w-56 flex-shrink-0 border-r border-border bg-card/50">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9 h-9 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-10rem)]">
            <div className="p-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  selectedCategory === null 
                    ? "bg-primary text-primary-foreground" 
                    : "text-foreground hover:bg-secondary"
                )}
              >
                All channels
              </button>
              
              {sortedCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors truncate",
                    selectedCategory === category 
                      ? "bg-primary text-primary-foreground" 
                      : "text-foreground hover:bg-secondary"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Preview Bar */}
          {selectedChannel && (
            <div className="h-48 flex-shrink-0 border-b border-border bg-card/80 flex">
              {/* Preview Image */}
              <div className="w-80 h-full bg-secondary flex items-center justify-center relative group cursor-pointer" onClick={() => handlePlay(selectedChannel)}>
                {selectedChannel.stream_icon ? (
                  <img 
                    src={selectedChannel.stream_icon} 
                    alt={selectedChannel.name}
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Tv className="w-16 h-16 text-muted-foreground/30" />
                )}
                <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
                    <Play className="w-6 h-6 text-primary-foreground fill-current" />
                  </div>
                </div>
              </div>
              
              {/* Program Info */}
              <div className="flex-1 p-4">
                <h2 className="font-display font-bold text-xl text-foreground mb-1">
                  {currentProgram?.title || selectedChannel.name}
                </h2>
                {currentProgram && (
                  <>
                    <p className="text-sm text-muted-foreground mb-2">
                      {new Date(currentProgram.start_timestamp * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} – {new Date(currentProgram.stop_timestamp * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {currentProgram.description || "No description available"}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Time Navigation */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="font-medium text-foreground">{formatDate(baseTime)}, {formatTime(currentTime)}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setTimeOffset(prev => prev - 2)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8" onClick={() => setTimeOffset(0)}>
                Now
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setTimeOffset(prev => prev + 2)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* EPG Grid */}
          <div className="flex-1 overflow-hidden">
            {/* Time Header */}
            <div className="flex border-b border-border bg-secondary/50 sticky top-0 z-10">
              <div className="w-48 lg:w-56 flex-shrink-0 p-2 border-r border-border" />
              <div className="flex-1 flex">
                {timeSlots.map((slot, index) => (
                  <div key={index} className="flex-1 p-2 border-r border-border/50 last:border-r-0 text-center text-sm font-medium text-muted-foreground">
                    {formatTime(slot)}
                  </div>
                ))}
              </div>
            </div>

            {/* Loading State */}
            {isLoadingEPG && filteredChannels.length === 0 && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading program guide...</span>
              </div>
            )}

            {/* Channel Rows */}
            <ScrollArea className="h-[calc(100%-40px)]">
              {filteredChannels.slice(0, 100).map((channel) => (
                <div 
                  key={channel.stream_id} 
                  className={cn(
                    "flex border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer",
                    selectedChannel?.stream_id === channel.stream_id && "bg-primary/10"
                  )}
                  onClick={() => setSelectedChannel(channel)}
                >
                  {/* Channel Info */}
                  <div className="w-48 lg:w-56 flex-shrink-0 p-2 border-r border-border flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-8 text-right flex-shrink-0">
                      {channel.num}
                    </span>
                    <div className="w-8 h-8 rounded bg-secondary overflow-hidden flex-shrink-0">
                      {channel.stream_icon ? (
                        <img
                          src={channel.stream_icon}
                          alt={channel.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Tv className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-foreground truncate">{channel.name}</span>
                  </div>

                  {/* Programs */}
                  <div className="flex-1 flex min-h-[48px]">
                    {timeSlots.map((slot, slotIndex) => {
                      const program = getProgramAtTime(channel.stream_id, slot);
                      const isNow = timeOffset === 0 && slotIndex === 0;
                      
                      return (
                        <div
                          key={slotIndex}
                          className="flex-1 border-r border-border/30 last:border-r-0 p-1"
                          onDoubleClick={() => handlePlay(channel)}
                        >
                          <div className={cn(
                            "h-full rounded px-2 py-1 text-xs",
                            isNow ? "bg-primary/20 border border-primary/40" : "bg-secondary/50"
                          )}>
                            <p className="font-medium text-foreground truncate">
                              {program?.title || "No information"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <ScrollBar orientation="vertical" />
            </ScrollArea>

            {/* Empty State */}
            {!isLoadingEPG && filteredChannels.length === 0 && (
              <div className="text-center py-16">
                <Tv className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">No channels found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default EPGGuide;
