import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Search, Tv, Loader2, ChevronLeft, ChevronRight, Clock, Calendar } from "lucide-react";
import { useIPTV } from "@/contexts/IPTVContext";
import { supabase } from "@/integrations/supabase/client";

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

interface ChannelEPG {
  channel: {
    stream_id: number;
    name: string;
    stream_icon: string;
    epg_channel_id: string;
  };
  programs: EPGProgram[];
}

const EPGGuide = () => {
  const navigate = useNavigate();
  const { liveChannels, liveCategories, getActivePlaylist, loadLiveContent } = useIPTV();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [epgData, setEpgData] = useState<Record<number, EPGProgram[]>>({});
  const [isLoadingEPG, setIsLoadingEPG] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeOffset, setTimeOffset] = useState(0); // Hours offset from now

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
      // Fetch EPG for first 20 channels to avoid overloading
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

  // Filter channels
  const filteredChannels = useMemo(() => {
    return liveChannels.filter((channel) => {
      const matchesSearch = channel.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || 
        liveCategories.find(cat => cat.category_id === channel.category_id)?.category_name === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [liveChannels, searchQuery, selectedCategory, liveCategories]);

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

  const categories = ["All", ...liveCategories.map(cat => cat.category_name)];

  // Calculate time slots for the grid (2-hour window)
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

  // Get program at a specific time for a channel
  const getProgramAtTime = (streamId: number, time: Date): EPGProgram | null => {
    const programs = epgData[streamId] || [];
    const timestamp = Math.floor(time.getTime() / 1000);
    
    return programs.find(p => {
      const start = parseInt(p.start_timestamp?.toString() || '0');
      const end = parseInt(p.stop_timestamp?.toString() || '0');
      return timestamp >= start && timestamp < end;
    }) || null;
  };

  // Calculate program position and width in the grid
  const getProgramStyle = (program: EPGProgram, slotStart: Date) => {
    const slotStartTs = slotStart.getTime() / 1000;
    const slotEndTs = slotStartTs + 1800; // 30 min slot
    
    const progStart = Math.max(parseInt(program.start_timestamp?.toString() || '0'), slotStartTs);
    const progEnd = Math.min(parseInt(program.stop_timestamp?.toString() || '0'), slotEndTs);
    
    const duration = progEnd - progStart;
    const width = (duration / 1800) * 100;
    const left = ((progStart - slotStartTs) / 1800) * 100;
    
    return { width: `${width}%`, left: `${left}%` };
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

  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display font-bold text-3xl lg:text-4xl text-foreground mb-2">
            Program Guide
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {formatDate(baseTime)} • {formatTime(currentTime)} (Now)
          </p>
        </div>

        {/* Filters & Time Navigation */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search channels..."
              className="pl-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.slice(0, 8).map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="flex-shrink-0"
              >
                {category}
              </Button>
            ))}
          </div>

          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTimeOffset(prev => prev - 2)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTimeOffset(0)}
            >
              Now
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTimeOffset(prev => prev + 2)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* EPG Grid */}
        <div className="relative border border-border rounded-lg overflow-hidden bg-card">
          {/* Time Header */}
          <div className="flex border-b border-border bg-secondary/50 sticky top-0 z-10">
            <div className="w-48 lg:w-64 flex-shrink-0 p-3 border-r border-border font-semibold text-sm text-muted-foreground">
              Channel
            </div>
            <div className="flex-1 flex">
              {timeSlots.map((slot, index) => (
                <div
                  key={index}
                  className="flex-1 p-3 border-r border-border last:border-r-0 text-center font-medium text-sm"
                >
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
          <ScrollArea className="h-[600px]">
            {filteredChannels.slice(0, 50).map((channel) => {
              const programs = epgData[channel.stream_id] || [];
              
              return (
                <div key={channel.stream_id} className="flex border-b border-border last:border-b-0 hover:bg-secondary/30 transition-colors">
                  {/* Channel Info */}
                  <div className="w-48 lg:w-64 flex-shrink-0 p-3 border-r border-border flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                      {channel.stream_icon ? (
                        <img
                          src={channel.stream_icon}
                          alt={channel.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Tv className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{channel.name}</p>
                      <p className="text-xs text-muted-foreground">{channel.num}</p>
                    </div>
                  </div>

                  {/* Programs Grid */}
                  <div className="flex-1 flex relative min-h-[60px]">
                    {timeSlots.map((slot, slotIndex) => {
                      const program = getProgramAtTime(channel.stream_id, slot);
                      const isNow = timeOffset === 0 && slotIndex === 0;
                      
                      return (
                        <div
                          key={slotIndex}
                          className="flex-1 border-r border-border/50 last:border-r-0 relative p-1"
                        >
                          {program ? (
                            <div
                              className={`absolute inset-y-1 rounded px-2 py-1 overflow-hidden cursor-pointer transition-colors ${
                                isNow 
                                  ? 'bg-primary/20 border border-primary/50 hover:bg-primary/30' 
                                  : 'bg-secondary hover:bg-secondary/80'
                              }`}
                              style={{ left: '2px', right: '2px' }}
                              title={`${program.title}\n${program.description || 'No description'}`}
                            >
                              <p className="text-xs font-medium text-foreground truncate">
                                {program.title}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {program.start && new Date(parseInt(program.start_timestamp?.toString() || '0') * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                              </p>
                            </div>
                          ) : (
                            <div className="absolute inset-y-1 left-1 right-1 rounded bg-muted/30 flex items-center justify-center">
                              <span className="text-xs text-muted-foreground">No data</span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Current Time Indicator */}
                    {timeOffset === 0 && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-destructive z-20"
                        style={{
                          left: `${((currentTime.getMinutes() % 30) / 30) * 25}%`,
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
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
    </MainLayout>
  );
};

export default EPGGuide;
