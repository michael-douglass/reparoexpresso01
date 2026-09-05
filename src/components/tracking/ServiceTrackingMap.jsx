import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Navigation, MapPin } from 'lucide-react';

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const estimateETA = (distanceKm) => {
  const minutes = Math.ceil((distanceKm / 30) * 60);
  if (minutes < 1) return '< 1 min';
  return `${minutes} min`;
};

const MOTO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#f59e0b" stroke="#fff" stroke-width="2"/><text x="20" y="27" text-anchor="middle" font-size="20">🛵</text></svg>'
)}`;

const CLIENT_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#3b82f6" stroke="#fff" stroke-width="2"/><text x="16" y="22" text-anchor="middle" font-size="14">🏠</text></svg>'
)}`;

export default function ServiceTrackingMap({ request }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const providerMarkerRef = useRef(null);
  const clientMarkerRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [mapsApiKey, setMapsApiKey] = useState(null);
  const [keyError, setKeyError] = useState(false);

  const clientLat = request?.client_latitude || request?.latitude;
  const clientLng = request?.client_longitude || request?.longitude;
  const hasClient = !!clientLat && !!clientLng;
  const hasProvider = !!request?.provider_latitude && !!request?.provider_longitude;

  const distance = hasClient && hasProvider
    ? calculateDistance(clientLat, clientLng, request.provider_latitude, request.provider_longitude)
    : null;
  const eta = distance != null ? estimateETA(distance) : null;

  // Fetch API key
  useEffect(() => {
    base44.functions.invoke('getGoogleMapsKey', {})
      .then(res => setMapsApiKey(res.data?.key))
      .catch(() => setKeyError(true));
  }, []);

  // Load Google Maps SDK
  useEffect(() => {
    if (window.google?.maps) { setScriptLoaded(true); return; }
    if (mapsApiKey && !window.google?.maps) {
      const existing = document.getElementById('gmap-sdk');
      if (existing) { existing.addEventListener('load', () => setScriptLoaded(true)); return; }
      const script = document.createElement('script');
      script.id = 'gmap-sdk';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsApiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = () => setScriptLoaded(true);
      document.head.appendChild(script);
    }
  }, [mapsApiKey]);

  // Init map
  useEffect(() => {
    if (!scriptLoaded || !mapRef.current || !hasClient || mapInstanceRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: clientLat, lng: clientLng },
      zoom: 14,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      zoomControl: true,
      zoomControlOptions: { position: window.google.maps.ControlPosition.TOP_RIGHT },
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#1a1f2e' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1f2e' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#8a9bb5' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a3245' }] },
        { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#334055' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d1520' }] },
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
      ],
    });
    mapInstanceRef.current = map;

    // Client marker
    clientMarkerRef.current = new window.google.maps.Marker({
      position: { lat: clientLat, lng: clientLng },
      map,
      title: 'Seu local',
      icon: CLIENT_SVG,
      zIndex: 10,
    });

    directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: { strokeColor: '#f59e0b', strokeWeight: 5, strokeOpacity: 0.85 },
    });
    directionsRendererRef.current.setMap(map);
  }, [scriptLoaded, hasClient, clientLat, clientLng]);

  // Update provider marker + route
  useEffect(() => {
    if (!mapInstanceRef.current || !scriptLoaded) return;
    if (!hasProvider || !hasClient) return;

    const provPos = { lat: request.provider_latitude, lng: request.provider_longitude };

    if (providerMarkerRef.current) {
      providerMarkerRef.current.setPosition(provPos);
    } else {
      providerMarkerRef.current = new window.google.maps.Marker({
        position: provPos,
        map: mapInstanceRef.current,
        title: 'Prestador',
        icon: MOTO_SVG,
        zIndex: 20,
      });
    }

    // Route
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route({
      origin: provPos,
      destination: { lat: clientLat, lng: clientLng },
      travelMode: window.google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      if (status === 'OK' && directionsRendererRef.current) {
        directionsRendererRef.current.setDirections(result);
      }
    });

    // Fit bounds
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend({ lat: clientLat, lng: clientLng });
    bounds.extend(provPos);
    mapInstanceRef.current.fitBounds(bounds, { top: 50, right: 50, bottom: 80, left: 50 });
  }, [request?.provider_latitude, request?.provider_longitude, scriptLoaded, hasClient, clientLat, clientLng]);

  const recenter = () => {
    if (mapInstanceRef.current && hasClient) {
      mapInstanceRef.current.panTo({ lat: clientLat, lng: clientLng });
      mapInstanceRef.current.setZoom(15);
    }
  };

  // Fallback when no map key or no client location
  if (keyError || (!mapsApiKey && !scriptLoaded)) {
    return (
      <div className="w-full h-64 rounded-2xl bg-muted border border-border flex flex-col items-center justify-center gap-2 relative overflow-hidden">
        <div className="circuit-bg absolute inset-0 opacity-50" />
        <div className="relative z-10 text-center px-4">
          <MapPin className="w-8 h-8 text-primary mx-auto mb-2" />
          {distance != null ? (
            <>
              <p className="text-sm font-bold text-foreground">Chega em {eta} • {distance.toFixed(1)} km</p>
              <p className="text-xs text-muted-foreground mt-1">Mapa em tempo real disponível após upgrade do plano</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Aguardando localização do prestador</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-border">
      <div ref={mapRef} className="w-full h-full" style={{ minHeight: 256 }} />

      {/* Recenter button */}
      {scriptLoaded && hasClient && (
        <button
          onClick={recenter}
          className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center hover:bg-accent transition-colors z-10"
          title="Centralizar no meu local"
        >
          <Navigation className="w-5 h-5 text-primary" />
        </button>
      )}

      {/* ETA overlay */}
      {distance != null && (
        <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur border border-border rounded-xl px-3 py-2 shadow-lg z-10">
          <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <span className="text-primary">🛵</span>
            Chega em {eta} • {distance.toFixed(1)} km
          </p>
        </div>
      )}

      {!scriptLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-card">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}