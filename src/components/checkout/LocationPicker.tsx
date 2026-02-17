import { useState, useCallback, useRef } from 'react';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Locate } from "lucide-react";
import { toast } from 'sonner';

interface LocationPickerProps {
    onSelect: (location: { lat: number; lng: number; address?: string }) => void;
    initialLocation?: { lat: number; lng: number };
}

const libraries: ("places")[] = ["places"];

const mapContainerStyle = {
    width: "100%",
    height: "300px",
    borderRadius: "0.75rem",
};

// Default center (New Delhi)
const defaultCenter = {
    lat: 28.6139,
    lng: 77.2090,
};

export default function LocationPicker({ onSelect, initialLocation }: LocationPickerProps) {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: apiKey || "",
        libraries,
    });

    if (!apiKey) {
        return (
            <div className="h-[300px] w-full bg-muted rounded-xl flex flex-col items-center justify-center text-center p-4">
                <p className="text-red-500 font-semibold mb-2">Google Maps API Key Missing</p>
                <p className="text-xs text-muted-foreground">Please set VITE_GOOGLE_MAPS_API_KEY in your .env file.</p>
            </div>
        );
    }

    const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(initialLocation || null);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const mapRef = useRef<google.maps.Map | null>(null);

    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
    }, []);

    const getAddress = async ({ lat, lng }: { lat: number; lng: number }) => {
        try {
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
            );
            const data = await response.json();
            if (data.results && data.results[0]) {
                return data.results[0].formatted_address;
            }
        } catch (error) {
            console.error("Geocoding failed", error);
        }
        return undefined;
    };

    const handleMapClick = async (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        const newLocation = { lat, lng };
        setMarker(newLocation);

        // Reverse geocode
        const address = await getAddress(newLocation);
        onSelect({ ...newLocation, address });
    };

    const getUserLocation = () => {
        setLoadingLocation(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    setMarker(pos);
                    if (mapRef.current) {
                        mapRef.current.panTo(pos);
                        mapRef.current.setZoom(15);
                    }
                    const address = await getAddress(pos);
                    onSelect({ ...pos, address });
                    setLoadingLocation(false);
                },
                () => {
                    toast.error("Error detecting location. Please enable location services.");
                    setLoadingLocation(false);
                }
            );
        } else {
            toast.error("Geolocation is not supported by this browser.");
            setLoadingLocation(false);
        }
    };

    if (loadError) return <div className="text-red-500 text-sm">Error loading maps</div>;
    if (!isLoaded) return <div className="h-[300px] w-full bg-muted animate-pulse rounded-xl flex items-center justify-center text-muted-foreground">Loading Map...</div>;

    return (
        <div className="space-y-3">
            <div className="relative">
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    zoom={12}
                    center={marker || defaultCenter}
                    onClick={handleMapClick}
                    onLoad={onMapLoad}
                    options={{
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: false,
                    }}
                >
                    {marker && <Marker position={marker} />}
                </GoogleMap>

                <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white shadow-sm"
                    onClick={getUserLocation}
                    disabled={loadingLocation}
                >
                    {loadingLocation ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Locate className="h-4 w-4 mr-2 text-primary" />}
                    Use My Location
                </Button>
            </div>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Tap on map to refine location
            </p>
        </div>
    );
}
