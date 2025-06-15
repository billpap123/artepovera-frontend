// src/pages/MapView.tsx
import React, { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import { useTranslation } from "react-i18next";



import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/MapView.css';
import '../styles/Global.css';
import Navbar from '../components/Navbar';

// --- IMPORT ASSETS USING ES MODULE SYNTAX ---
import artistIconPath from '../assets/icons/artist-icon.png';
import employerIconPath from '../assets/icons/employer-icon.png';
import selfIconPath from '../assets/icons/self-icon.png'; // Make sure you have this icon
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
// --- END ASSET IMPORTS ---

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:50001';

// --- FIX LEAFLET'S DEFAULT ICON PATHS FOR BUNDLERS ---
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});
// --- END FIX ---

const artistIcon = new L.Icon({
  iconUrl: artistIconPath,
  iconSize: [28, 41],
  iconAnchor: [14, 41],
  popupAnchor: [1, -34],
  shadowUrl: markerShadow,
  shadowSize: [41, 41],
});

const employerIcon = new L.Icon({
  iconUrl: employerIconPath,
  iconSize: [28, 41],
  iconAnchor: [14, 41],
  popupAnchor: [1, -34],
  shadowUrl: markerShadow,
  shadowSize: [41, 41],
});

const selfIcon = new L.Icon({
  iconUrl: selfIconPath,
  iconSize: [35, 51],
  iconAnchor: [17, 51],
  popupAnchor: [1, -44],
  shadowUrl: markerShadow,
  shadowSize: [51, 51],
});

// --- Interfaces ---
interface LocationData {
  user_id: number;
  fullname: string;
  user_type: 'Artist' | 'Employer' | string;
  location: { latitude: number; longitude: number; };
  profile?: any; // Keeping this flexible as it was in your original code
}

interface MapViewProps {
  userType: string | null;
  loggedInUserId: number | null;
}

const RecenterAutomatically = ({ locations }: { locations: LocationData[] }) => {
    const map = useMap();
    useEffect(() => {
      if (locations.length > 0) {
        const bounds = L.latLngBounds(locations.map(loc => [loc.location.latitude, loc.location.longitude]));
        if (bounds.isValid()) {
            map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        }
      }
    }, [locations, map]);
    return null;
};


const MapView: React.FC<MapViewProps> = ({ userType: loggedInUserType, loggedInUserId }) => {
  const [allLocations, setAllLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const initialCenter: [number, number] = [39.0742, 21.8243];
  const initialZoom = 7;

  useEffect(() => {
    let isMounted = true;
    const fetchLocations = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          if (isMounted) setError("Authentication required to view the map.");
          if (isMounted) setLoading(false);
          return;
        }

        // --- MODIFIED LOGIC FOR API URL ---
        // Both Artists and Employers should see everyone.
        // We achieve this by NOT sending the userType query parameter to the backend.
        // Your backend is already set up to return all users if no userType is specified.
        const apiUrl = `${API_BASE_URL}/api/locations`;
        console.log(`[MapView] Logged in as ${loggedInUserType}. Fetching all user locations.`);
        // --- END MODIFICATION ---

        const response = await axios.get(apiUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!isMounted) return;

        // The logic for fetching profiles for each location can be kept if you need more details
        // but for now we will use the simpler method from your provided code.
        const fetchedLocations: LocationData[] = response.data.locations || response.data || [];
        
        // We now keep the logged-in user in the list to display their special pin.
        setAllLocations(fetchedLocations);

      } catch (error: any) {
        console.error('[MapView] Error fetching location data:', error);
        if (isMounted) setError(error.response?.data?.message || 'Failed to load location data.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLocations();
    return () => { isMounted = false; };
  }, [loggedInUserType, loggedInUserId, API_BASE_URL]);

  const getImageUrl = (path?: string | null): string => {
    if (!path) return '/default-profile.png';
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}/${path.replace(/^uploads\/uploads\//, 'uploads/')}`;
  };

  if (loading) return (<><Navbar /><div className="map-overlay-message"><p>Loading Map...</p></div></>);
  if (error) return (<><Navbar /><div className="map-overlay-message error"><p>{error}</p></div></>);
  
  return (
    <>
      <Navbar />
      <div className="map-page-container">
        <div className="map-controls">
          <h2 className="map-title">{t('mapView.title')}</h2>
        </div>

        <div className="map-content-wrapper">
          {!loading && !error && allLocations.length === 0 && (
            <div className="map-overlay-message"><p>{t('mapView.status.noUsers')}</p></div>
          )}
          <MapContainer
            className="leaflet-map"
            center={initialCenter}
            zoom={initialZoom}
            scrollWheelZoom={true}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/" target="_blank" rel="noopener noreferrer">CartoDB</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
            />
            
            {allLocations.map((loc) => {
              if (!loc.location?.latitude || !loc.location?.longitude) return null;
              
              const isSelf = loc.user_id === loggedInUserId;
              
              let pinIcon;
              if (isSelf) {
                pinIcon = selfIcon;
              } else {
                pinIcon = loc.user_type === 'Artist' ? artistIcon : employerIcon;
              }

              return (
                <Marker
                  key={loc.user_id}
                  position={[loc.location.latitude, loc.location.longitude]}
                  icon={pinIcon}
                  zIndexOffset={isSelf ? 1000 : 0}
                >
                  <Popup>
                    <div className="map-popup-content">
                        {isSelf && <div className="popup-self-indicator">{t('mapView.popup.selfIndicator')}</div>}
                        <div className="popup-header">
                            <strong className="popup-name">{loc.fullname}</strong>
                            <span className={`popup-user-type ${loc.user_type?.toLowerCase()}`}>{loc.user_type}</span>
                        </div>
                        <button className="popup-button" onClick={() => navigate(`/user-profile/${loc.user_id}`)}>
                          {t('mapView.popup.viewProfile')}
                        </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
            <RecenterAutomatically locations={allLocations} />
          </MapContainer>
        </div>
      </div>
    </>
  );
};

export default MapView;
