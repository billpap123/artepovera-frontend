// src/pages/MapView.tsx
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
import '../styles/MapView.css'; // Make sure this file contains your map styles
import artistIconPath from '../assets/icons/artist-icon.png';
import employerIconPath from '../assets/icons/employer-icon.png';
import '../styles/Global.css'; // Keep if you have global styles affecting this page
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
  fullname: string; // From the initial /api/locations fetch
  location: {
    latitude: number;
    longitude: number;
  };
  // Profile data is fetched separately and added
  profile?: {
    user_id: number;
    fullname: string;
    user_type: 'Artist' | 'Employer' | string; // Type of the user on the map
    city?: string; // <<< Crucial: Backend /api/users/profile/:id MUST return this
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
  const [allLocationsWithProfiles, setAllLocationsWithProfiles] = useState<LocationData[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<LocationData[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>(['All Cities']); // Start with 'All Cities'
  const [selectedCity, setSelectedCity] = useState<string>(''); // '' means "All Cities"

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const center: [number, number] = [38.246639, 21.734573]; // Patras, Greece
  const initialZoom = 13;

  useEffect(() => {
    let isMounted = true; // For cleanup

    const fetchLocationsAndProfiles = async () => {
      if (!isMounted) return;
      setLoading(true);
      setError(null);
      setAllLocationsWithProfiles([]); // Reset on new fetch
      setFilteredLocations([]);
      setAvailableCities(['All Cities']);


      try {
        const token = localStorage.getItem('token');
        if (!token && loggedInUserType) { // Only block if viewing a protected map view
          console.warn('No token found; user might not be logged in.');
          if (isMounted) setError("Authentication required to view locations.");
          setLoading(false);
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
            if (isMounted) {
                setAllLocationsWithProfiles([]);
                setFilteredLocations([]);
                setAvailableCities(['All Cities']);
                setLoading(false);
            }
            return;
        }

        console.log("[MapView] Fetching detailed profiles for locations...");
        const profilePromises = initialFetchedLocations.map(async (loc) => {
          if (!isMounted) return loc; // Early exit if unmounted
          try {
            const profileRes = await axios.get(
              `${API_BASE_URL}/api/users/profile/${loc.user_id}`,
              { headers: token ? { Authorization: `Bearer ${token}` } : {} }
            );
            if (!isMounted) return loc; // Check again after await
            return { ...loc, profile: profileRes.data };
          } catch (err) {
            console.error('Error fetching profile for user_id=', loc.user_id, err);
            return { ...loc, profile: undefined }; // Keep location even if profile fetch fails
          }
        });

        const locationsWithFullProfilesData = await Promise.all(profilePromises);
        if (!isMounted) return;

        console.log("[MapView] All profiles fetched. Number of profiles:", locationsWithFullProfilesData.length);
        setAllLocationsWithProfiles(locationsWithFullProfilesData);
        setFilteredLocations(locationsWithFullProfilesData);

        const cities = new Set<string>();
        locationsWithFullProfilesData.forEach(loc => {
            if (loc.profile?.city) { // Ensure city is present in profile data
                cities.add(loc.profile.city);
            }
        });
        if (isMounted) {
            setAvailableCities(['All Cities', ...Array.from(cities).sort()]);
            console.log("[MapView] Available cities:", ['All Cities', ...Array.from(cities).sort()]);
        }

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
    return () => { isMounted = false; }; // Cleanup
  }, [loggedInUserType, API_BASE_URL]);


  useEffect(() => {
    console.log("[MapView] Filtering locations. Selected city:", selectedCity, "All locations:", allLocationsWithProfiles.length);
    if (selectedCity === '' || selectedCity === 'All Cities') {
      setFilteredLocations(allLocationsWithProfiles);
    } else {
      setFilteredLocations(
        allLocationsWithProfiles.filter(loc => loc.profile?.city === selectedCity)
      );
    }
  }, [selectedCity, allLocationsWithProfiles]);


  const getImageUrl = (path?: string | null) => {
    if (!path) return '/default-profile.png';
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}/${path.replace(/^uploads\/uploads\//, 'uploads/')}`;
  };

  // RENDER LOGIC
  console.log("[MapView] Render - Loading:", loading, "Error:", error, "Filtered Locations:", filteredLocations.length);

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
      <div className="map-controls-area">
        <div className="filter-group">
          <label htmlFor="city-filter">Filter by City: </label>
          <select
            id="city-filter"
            value={selectedCity}
            onChange={(e) => {
                console.log("[MapView] City filter changed to:", e.target.value);
                setSelectedCity(e.target.value);
            }}
            className="map-filter-select"
          >
            {availableCities.map(city => (
              <option key={city} value={city === 'All Cities' ? '' : city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Only render MapContainer if not loading and no error */}
      <MapContainer
        className="leaflet-map" // IMPORTANT: This class needs CSS height: eg. height: 70vh;
        center={center}
        zoom={initialZoom}
      >
        {/* <ResetViewOnZoom center={center} /> */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/" target="_blank" rel="noopener noreferrer">CartoDB</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
        />

        {filteredLocations.map((loc) => {
          const markerUserType = loc.profile?.user_type;
          const pinIcon = markerUserType === 'Artist' ? artistIcon :
                          markerUserType === 'Employer' ? employerIcon :
                          artistIcon; // Default fallback

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
            console.warn("Skipping marker due to invalid coordinates:", loc);
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
                      {loc.profile?.city && <span className="popup-location">{loc.profile.city}</span>}
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