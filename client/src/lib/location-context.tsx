import { createContext, useContext, useState, useEffect } from "react";

interface LocationData {
  id: number;
  slug: string;
  name: string;
  defaultPax: number;
  isActive: boolean;
}

interface LocationContextType {
  locations: LocationData[];
  selectedSlug: string; // "all" or location slug
  setSelectedSlug: (slug: string) => void;
  selectedLocationId: number | null; // null = all
  selectedLocation: LocationData | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const STORAGE_KEY = "mise-selected-location";

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [selectedSlug, setSelectedSlugState] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || "all"; } catch { return "all"; }
  });

  useEffect(() => {
    fetch("/api/locations")
      .then(r => r.json())
      .then(data => setLocations(data))
      .catch(() => {});
  }, []);

  const setSelectedSlug = (slug: string) => {
    setSelectedSlugState(slug);
    try { localStorage.setItem(STORAGE_KEY, slug); } catch {}
  };

  const selectedLocation = selectedSlug === "all" ? null : locations.find(l => l.slug === selectedSlug) || null;
  const selectedLocationId = selectedLocation?.id ?? null;

  return (
    <LocationContext.Provider value={{ locations, selectedSlug, setSelectedSlug, selectedLocationId, selectedLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationFilter() {
  const context = useContext(LocationContext);
  if (!context) throw new Error("useLocationFilter must be used within LocationProvider");
  return context;
}
