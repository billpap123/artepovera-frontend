import React, { useEffect, useState, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/MapView.css';
import artistIconPath from '../assets/icons/artist-icon.png';
import employerIconPath from '../assets/icons/employer-icon.png';
import '../styles/Global.css';
import Navbar from '../components/Navbar';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:50001';

const artistIcon = new L.Icon({
  iconUrl: artistIconPath,
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const employerIcon = new L.Icon({
  iconUrl: employerIconPath,
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

interface LocationData {
  user_id: number;
  fullname: string;
  location: {
    latitude: number;
    longitude: number;
  };
  profile?: {
    user_id: number;
    fullname: string;
    user_type: 'Artist' | 'Employer' | string;
    city?: string; // Still keeping this in case backend provides it for popup
    artistProfile?: {
      bio?: string;
      profile_picture?: string;
      is_student?: boolean;
    };
    employerProfile?: {
      bio?: string;
      profile_picture?: string;
    };
  };
}

const ResetViewOnZoom = ({ center }: { center: [number, number] }) => {
  const map = useMapEvents({
    zoomend: () => { map.setView(center); },
  });
  return null;
};

const MapView = ({ userType: loggedInUserType }: { userType: string }) => {
  // State for all locations after all profile fetches are complete
  const [allLocationsWithProfiles, setAllLocationsWithProfiles] = useState<LocationData[]>([]);
  // REMOVED: filteredLocations, availableCities, selectedCity states

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const center: [number, number] = [38.246639, 21.734573];
  const initialZoom = 13;

  // Fetch locations and then full profiles
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const fetchLocationsAndProfiles = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token && loggedInUserType) {
          console.warn('No token found; user might not be logged in.');
          if(isMounted) setError("Authentication required to view locations.");
          if(isMounted) setLoading(false);
          return;
        }

        const targetUserTypeOnMap = loggedInUserType === 'Artist' ? 'Employer' : 'Artist';

        console.log(`[MapView] Fetching initial locations for type: ${targetUserTypeOnMap}`);
        const response = await axios.get(
          `${API_BASE_URL}/api/locations?userType=${targetUserTypeOnMap}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );

        const initialFetchedLocations: LocationData[] = response.data.locations || response.data || [];
        console.log("[MapView] Initial locations fetched:", initialFetchedLocations.length);
        if (!isMounted) return;

        if (!initialFetchedLocations.length) {
            console.log("[MapView] No initial locations found.");
            if(isMounted) {
                setAllLocationsWithProfiles([]);
                setLoading(false);
            }
            return;
        }

        console.log("[MapView] Fetching detailed profiles for locations...");
        const profilePromises = initialFetchedLocations.map(async (loc) => {
          if (!isMounted) return loc;
          try {
            const profileRes = await axios.get(
              `${API_BASE_URL}/api/users/profile/${loc.user_id}`,
              { headers: token ? { Authorization: `Bearer ${token}` } : {} }
            );
            if (!isMounted) return loc;
            return { ...loc, profile: profileRes.data };
          } catch (err) {
            console.error('Error fetching profile for user_id=', loc.user_id, err);
            return { ...loc, profile: undefined };
          }
        });

        const locationsWithFullProfilesData = await Promise.all(profilePromises);
        if (!isMounted) return;

        console.log("[MapView] All profiles fetched. Number of profiles:", locationsWithFullProfilesData.length);
        setAllLocationsWithProfiles(locationsWithFullProfilesData);
        // REMOVED: setFilteredLocations (map will use allLocationsWithProfiles)
        // REMOVED: Logic to setAvailableCities

      } catch (error: any) {
        console.error('Error fetching initial locations or profiles:', error);
        if (isMounted) setError(error.response?.data?.message || 'Failed to load location data.');
      } finally {
        if (isMounted) {
            console.log("[MapView] Setting loading to false.");
            setLoading(false);
        }
      }
    };

    if (loggedInUserType) {
        fetchLocationsAndProfiles();
    } else {
        if (isMounted) {
            setError("User type not determined. Cannot fetch locations.");
            setLoading(false);
        }
    }
    return () => { isMounted = false; };
  }, [loggedInUserType, API_BASE_URL]); // Removed navigate dependency as it wasn't used in effect


  // REMOVED: useEffect for filtering locations


  const getImageUrl = (path?: string | null) => {
    if (!path) return '/default-profile.png';
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}/${path.replace(/^uploads\/uploads\//, 'uploads/')}`;
  };

  console.log("[MapView] Render - Loading:", loading, "Error:", error, "Locations to display:", allLocationsWithProfiles.length);

  if (loading) {
    return (
        <>
            <Navbar />
            <div className="map-page-container loading-map">
                <p className="loading-message">Loading map and locations...</p>
            </div>
        </>
    );
  }

  if (error) {
    return (
        <>
            <Navbar />
            <div className="map-page-container error-map">
                <p className="error-message">{error}</p>
            </div>
        </>
    );
  }

  return (
    <div className="map-page-container">
      <Navbar />
      {/* --- REMOVED City Filter Dropdown UI --- */}
      {/* <div className="map-controls-area"> ... </div> */}

      <MapContainer
        className="leaflet-map"
        center={center}
        zoom={initialZoom}
      >
        {/* <ResetViewOnZoom center={center} /> */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/" target="_blank" rel="noopener noreferrer">CartoDB</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
        />

        {/* --- UPDATED: Map over allLocationsWithProfiles directly --- */}
        {allLocationsWithProfiles.map((loc) => {
          const markerUserType = loc.profile?.user_type;
          const pinIcon = markerUserType === 'Artist' ? artistIcon :
                          markerUserType === 'Employer' ? employerIcon :
                          artistIcon;

          const displayName = loc.profile?.fullname || loc.fullname;
          let displayBio: string | null = null;
          let displayProfilePic: string | null = null;

          if (loc.profile) {
            if (loc.profile.user_type === 'Artist' && loc.profile.artistProfile) {
              displayBio = loc.profile.artistProfile.bio || null;
              displayProfilePic = loc.profile.artistProfile.profile_picture || null;
            } else if (loc.profile.user_type === 'Employer' && loc.profile.employerProfile) {
              displayBio = loc.profile.employerProfile.bio || null;
              displayProfilePic = loc.profile.employerProfile.profile_picture || null;
            }
          }

          if (!loc.location?.latitude || !loc.location?.longitude) {
            console.warn("Skipping marker for location with invalid coordinates:", loc);
            return null;
          }

          return (
            <Marker
              key={loc.user_id}
              position={[loc.location.latitude, loc.location.longitude]}
              icon={pinIcon}
            >
              <Popup>
                <div className="map-popup-content">
                  <img src={getImageUrl(displayProfilePic)} alt={displayName} className="popup-profile-pic" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/default-profile.png'; }} />
                  <div className="popup-info">
                      <strong className="popup-name">{displayName}</strong>
                      {markerUserType && <span className="popup-user-type">{markerUserType}</span>}
                      {loc.profile?.city && <span className="popup-location">{loc.profile.city}</span>} {/* Still displays city if available */}
                      {displayBio ? ( <p className="popup-bio"><em>{displayBio}</em></p> ) : ( <p className="popup-bio"><span>No bio available</span></p> )}
                      <button className="popup-button" onClick={() => navigate(`/user-profile/${loc.user_id}`)} >
                        View Profile
                      </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapView;