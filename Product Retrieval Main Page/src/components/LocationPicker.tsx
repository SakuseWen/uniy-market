import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { MapPin, Search } from 'lucide-react';

// Fix leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface LocationPickerProps {
  latitude?: number;
  longitude?: number;
  address?: string;
  onChange: (lat: number, lng: number, address: string) => void;
  readonly?: boolean;
}

function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onClick(e.latlng.lat, e.latlng.lng) });
  return null;
}

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo([lat, lng], 15); }, [lat, lng, map]);
  return null;
}

export function LocationPicker({ latitude, longitude, address, onChange, readonly = false }: LocationPickerProps) {
  const [lat, setLat] = useState(latitude || 13.7942);
  const [lng, setLng] = useState(longitude || 100.3250);
  const [addr, setAddr] = useState(address || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const handleMapClick = (newLat: number, newLng: number) => {
    if (readonly) return;
    setLat(newLat);
    setLng(newLng);
    onChange(newLat, newLng, addr);
    // Reverse geocode
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}`)
      .then(r => r.json())
      .then(data => {
        const newAddr = data.display_name || '';
        setAddr(newAddr);
        onChange(newLat, newLng, newAddr);
      })
      .catch(() => {});
  };

  const handleSearch = () => {
    if (!searchQuery.trim() || searching) return;
    setSearching(true);
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`, {
      headers: { 'Accept': 'application/json' },
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(results => {
        if (results.length > 0) {
          const newLat = parseFloat(results[0].lat);
          const newLng = parseFloat(results[0].lon);
          const newAddr = results[0].display_name || searchQuery;
          setLat(newLat);
          setLng(newLng);
          setAddr(newAddr);
          onChange(newLat, newLng, newAddr);
        }
      })
      .catch((err) => { console.error('Location search failed:', err); })
      .finally(() => setSearching(false));
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <div className="space-y-2">
      {!readonly && (
        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search location..."
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
          />
          <Button type="button" variant="outline" onClick={handleSearch} disabled={searching}>
            {searching ? <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>
      )}
      <div style={{ height: 300, borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
        <MapContainer center={[lat, lng]} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[lat, lng]} />
          <FlyTo lat={lat} lng={lng} />
          {!readonly && <ClickHandler onClick={handleMapClick} />}
        </MapContainer>
      </div>
      {addr && <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{addr}</p>}
      {readonly && (
        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
          <MapPin className="w-3 h-3" /> Open in Google Maps
        </a>
      )}
    </div>
  );
}
