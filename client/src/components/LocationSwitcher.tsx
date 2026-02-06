import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Location {
  id: number;
  slug: string;
  name: string;
  defaultPax: number;
  isActive: boolean;
}

interface LocationSwitcherProps {
  value?: string;
  onChange: (slug: string) => void;
  showAll?: boolean;
}

export default function LocationSwitcher({ value, onChange, showAll = false }: LocationSwitcherProps) {
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    fetch("/api/locations")
      .then(r => r.json())
      .then(data => setLocations(data))
      .catch(() => {});
  }, []);

  return (
    <Select value={value || ""} onValueChange={onChange}>
      <SelectTrigger className="w-[140px] h-8 text-xs">
        <SelectValue placeholder="Standort" />
      </SelectTrigger>
      <SelectContent>
        {showAll && <SelectItem value="all">Alle Standorte</SelectItem>}
        {locations.map(loc => (
          <SelectItem key={loc.slug} value={loc.slug}>{loc.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
