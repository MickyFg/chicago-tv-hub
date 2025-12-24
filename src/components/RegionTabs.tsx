import { Button } from "@/components/ui/button";
import { Globe, Flag } from "lucide-react";

export const REGIONS = [
  { id: "all", name: "All", icon: Globe },
  { id: "usa", name: "USA", icon: Flag },
  { id: "europe", name: "EUROPE", icon: Flag },
  { id: "asia", name: "ASIA", icon: Flag },
  { id: "arabic", name: "ARABIC", icon: Flag },
  { id: "africa", name: "AFRICA", icon: Flag },
] as const;

export type RegionId = (typeof REGIONS)[number]["id"];

// Keywords for region detection in category/channel names
const REGION_KEYWORDS: Record<RegionId, string[]> = {
  all: [],
  usa: [
    "usa", "us ", "united states", "american", "america", "fox", "abc", "cbs", "nbc", "cnn", 
    "espn", "hbo", "showtime", "disney", "nickelodeon", "cartoon network", "mtv", "vh1",
    "bet", "comedy central", "tbs", "tnt", "amc", "fx", "syfy", "bravo", "e!", "lifetime",
    "hallmark", "food network", "hgtv", "discovery", "history", "a&e", "tlc", "nat geo",
    "pbs", "cw", "paramount", "starz", "cinemax", "epix"
  ],
  europe: [
    "uk", "england", "british", "bbc", "itv", "sky uk", "channel 4", "channel 5",
    "germany", "german", "ard", "zdf", "rtl", "sat.1", "pro7", "prosieben",
    "france", "french", "tf1", "france 2", "france 3", "canal+", "m6",
    "italy", "italian", "rai", "mediaset", "canale 5",
    "spain", "spanish", "tve", "antena 3", "telecinco",
    "portugal", "portuguese", "rtp", "sic", "tvi",
    "netherlands", "dutch", "npo", "rtl nl",
    "belgium", "flemish", "vrt", "rtbf",
    "poland", "polish", "tvp", "polsat", "tvn",
    "romania", "romanian", "tvr", "pro tv",
    "greece", "greek", "ert", "ant1", "alpha tv",
    "sweden", "swedish", "svt", "tv4",
    "norway", "norwegian", "nrk", "tv2 no",
    "denmark", "danish", "dr", "tv2 dk",
    "finland", "finnish", "yle",
    "austria", "austrian", "orf",
    "switzerland", "swiss", "srf", "rts",
    "ireland", "irish", "rte",
    "europe", "euro ", "euronews", "eurosport"
  ],
  asia: [
    "india", "indian", "hindi", "zee", "star", "sony", "colors", "ndtv", "aaj tak",
    "pakistan", "pakistani", "ary", "geo", "hum tv", "ptv",
    "bangladesh", "bangla", "btv", "channel i", "ntv",
    "japan", "japanese", "nhk", "fuji tv", "tbs japan", "anime",
    "korea", "korean", "kbs", "mbc", "sbs korea", "arirang",
    "china", "chinese", "cctv", "phoenix", "dragon",
    "taiwan", "taiwanese",
    "hong kong", "tvb", "atv",
    "philippines", "filipino", "abs-cbn", "gma",
    "thailand", "thai",
    "vietnam", "vietnamese", "vtv",
    "indonesia", "indonesian", "trans tv", "sctv",
    "malaysia", "malaysian", "rtm", "astro",
    "singapore", "mediacorp",
    "asia", "asian"
  ],
  arabic: [
    "arabic", "arab", "al jazeera", "mbc", "rotana", "al arabiya", "lbc",
    "saudi", "ksa", "sbc",
    "uae", "dubai", "abu dhabi",
    "egypt", "egyptian", "nile", "cbc", "on tv", "dmc",
    "lebanon", "lebanese", "mtv leb",
    "syria", "syrian",
    "iraq", "iraqi",
    "jordan", "jordanian",
    "morocco", "moroccan", "2m",
    "algeria", "algerian",
    "tunisia", "tunisian",
    "libya", "libyan",
    "kuwait", "kuwaiti",
    "qatar", "qatari", "bein", "beinsport",
    "oman", "omani",
    "bahrain", "bahraini",
    "yemen", "yemeni",
    "palestine", "palestinian"
  ],
  africa: [
    "africa", "african",
    "nigeria", "nigerian", "nta", "channels tv",
    "south africa", "sabc", "dstv", "supersport",
    "kenya", "kenyan", "kbc", "citizen tv",
    "ghana", "ghanaian", "ghone", "tv3 ghana",
    "ethiopia", "ethiopian", "ebc",
    "tanzania", "tanzanian",
    "uganda", "ugandan",
    "cameroon", "cameroonian",
    "ivory coast", "cote d'ivoire",
    "senegal", "senegalese",
    "zimbabwe",
    "zambia",
    "congo", "congolese",
    "angola", "angolan",
    "mozambique",
    "rwanda"
  ],
};

// Detect region from category name or channel/content name
export function detectRegion(categoryName: string, contentName: string = ""): RegionId {
  const searchText = `${categoryName} ${contentName}`.toLowerCase();
  
  // Check each region (excluding 'all')
  for (const region of REGIONS) {
    if (region.id === "all") continue;
    
    const keywords = REGION_KEYWORDS[region.id];
    for (const keyword of keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        return region.id;
      }
    }
  }
  
  return "all"; // Default to all if no region detected
}

interface RegionTabsProps {
  selectedRegion: RegionId;
  onRegionChange: (region: RegionId) => void;
  className?: string;
}

export function RegionTabs({ selectedRegion, onRegionChange, className }: RegionTabsProps) {
  return (
    <div className={`flex gap-2 overflow-x-auto pb-2 scrollbar-hide ${className || ""}`}>
      {REGIONS.map((region) => {
        const Icon = region.icon;
        return (
          <Button
            key={region.id}
            variant={selectedRegion === region.id ? "default" : "outline"}
            size="sm"
            onClick={() => onRegionChange(region.id)}
            className="flex-shrink-0 gap-2"
          >
            <Icon className="w-4 h-4" />
            {region.name}
          </Button>
        );
      })}
    </div>
  );
}
