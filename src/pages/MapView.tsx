import React, { useEffect, useState, useCallback } from 'react'; // Added useCallback
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

// --- UPDATED LocationData Interface ---
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
    fullname: string; // Might be more up-to-date than initial loc.fullname
    user_type: 'Artist' | 'Employer' | string; // Type of the user on the map
    city?: string; // <<< ASSUMING backend /api/users/profile/:id returns this
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

// (Optional) Component to reset the view on zoom changes (kept as is)
const ResetViewOnZoom = ({ center }: { center: [number, number] }) => {
  const map = useMapEvents({
    zoomend: () => { map.setView(center); },
  });
  return null;
};

const MapView = ({ userType: loggedInUserType }: { userType: string }) => {
  // State for all locations after all profile fetches are complete
  const [allLocationsWithProfiles, setAllLocationsWithProfiles] = useState<LocationData[]>([]);
  // State for locations to be displayed on the map (filtered)
  const [filteredLocations, setFilteredLocations] = useState<LocationData[]>([]);
  // State for the city filter dropdown
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>(''); // '' means "All Cities"

  const [loading, setLoading] = useState(true); // For initial data load
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const center: [number, number] = [38.246639, 21.734573]; // Patras, Greece
  const initialZoom = 13;

  // Fetch locations and then full profiles
  useEffect(() => {
    setLoading(true);
    setError(null);
    const fetchLocationsAndProfiles = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No token found; user might not be logged in.');
          setError("Authentication required to view locations.");
          setLoading(false);
          return;
        }

        const targetUserTypeOnMap = loggedInUserType === 'Artist' ? 'Employer' : 'Artist';

        // 1) Fetch the basic location data (user_id, fullname, lat/lng)
        const response = await axios.get(
          `${API_BASE_URL}/api/locations?userType=${targetUserTypeOnMap}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const initialFetchedLocations: LocationData[] = response.data.locations || response.data || [];
        if (!initialFetchedLocations.length) {
            setAllLocationsWithProfiles([]);
            setFilteredLocations([]);
            setAvailableCities(['All Cities']);
            console.log("No initial locations found.");
            setLoading(false);
            return;
        }

        // 2) For each location, fetch the user’s full profile (includes city, user_type of marker)
        const profilePromises = initialFetchedLocations.map(async (loc) => {
          try {
            const profileRes = await axios.get(
              `${API_BASE_URL}/api/users/profile/${loc.user_id}`, // Fetch full profile
              { headers: { Authorization: `Bearer ${token}` } }
            );
            return {
              ...loc, // Keep initial lat/lng and user_id
              profile: profileRes.data, // Add the full profile data
            };
          } catch (err) {
            console.error('Error fetching profile for user_id=', loc.user_id, err);
            return { ...loc, profile: undefined }; // Keep location even if profile fetch fails
          }
        });

        const locationsWithFullProfiles = await Promise.all(profilePromises);
        setAllLocationsWithProfiles(locationsWithFullProfiles);
        setFilteredLocations(locationsWithFullProfiles); // Initially show all

        // 3) Populate available cities for the filter (from the fetched profile data)
        const cities = new Set<string>();
        locationsWithFullProfiles.forEach(loc => {
            // --- ASSUMPTION: profile data contains 'city' ---
            if (loc.profile?.city) {
                cities.add(loc.profile.city);
            }
        });
        setAvailableCities(['All Cities', ...Array.from(cities).sort()]);

      } catch (error: any) {
        console.error('Error fetching initial locations or profiles:', error);
        setError(error.response?.data?.message || 'Failed to load location data.');
      } finally {
        setLoading(false);
      }
    };

    if (loggedInUserType) { // Only fetch if loggedInUserType is determined
        fetchLocationsAndProfiles();
    } else {
        setError("User type not determined. Cannot fetch locations.");
        setLoading(false);
    }
  // Dependency: re-fetch if the type of user we are looking for changes
  }, [loggedInUserType, API_BASE_URL]); // Removed navigate, not used in effect

  // Effect to filter locations when selectedCity or allLocationsWithProfiles changes
  useEffect(() => {
    if (selectedCity === '' || selectedCity === 'All Cities') {
      setFilteredLocations(allLocationsWithProfiles);
    } else {
      setFilteredLocations(
        allLocationsWithProfiles.filter(loc => loc.profile?.city === selectedCity)
      );
    }
  }, [selectedCity, allLocationsWithProfiles]);


  // Helper function to build full URLs for images (keep as is)
  const getImageUrl = (path?: string | null) => {
    if (!path) return '/default-profile.png';
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}/${path.replace(/^uploads\/uploads\//, 'uploads/')}`;
  };

  // --- RENDER LOGIC ---
  if (loading) {
    return (
        <>
            <Navbar />
            <div className="map-page-container loading-map"> {/* Added loading-map class */}
                <p className="loading-message">Loading map and locations...</p>
            </div>
        </>
    );
  }

  if (error) {
    return (
        <>
            <Navbar />
            <div className="map-page-container error-map"> {/* Added error-map class */}
                <p className="error-message">{error}</p>
            </div>
        </>
    );
  }

  return (
    <div className="map-page-container">
      <Navbar />
      <div className="map-controls-area"> {/* Container for filters */}
        <div className="filter-group">
          <label htmlFor="city-filter">Filter by City: </label>
          <select
            id="city-filter"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="map-filter-select" // Class for styling
          >
            {availableCities.map(city => (
              <option key={city} value={city === 'All Cities' ? '' : city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>

      <MapContainer
        className="leaflet-map"
        center={center}
        zoom={initialZoom} // Use initialZoom
        // maxZoom={24} // Keep your maxZoom
        // scrollWheelZoom={false} // Optional
      >
        {/* <ResetViewOnZoom center={center} /> You can uncomment this if needed */}

        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/" target="_blank" rel="noopener noreferrer">CartoDB</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
        />

        {/* Map over filteredLocations now */}
        {filteredLocations.map((loc) => {
          // Icon depends on the user_type OF THE MARKER ITSELF
          // which comes from loc.profile.user_type
          const markerUserType = loc.profile?.user_type;
          const pinIcon = markerUserType === 'Artist' ? artistIcon :
                          markerUserType === 'Employer' ? employerIcon :
                          artistIcon; // Default icon if type unknown

          // Prepare display data from loc.profile
          const displayName = loc.profile?.fullname || loc.fullname; // Fallback to initial fullname
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

          // Only render marker if location is valid
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
                <div className="map-popup-content"> {/* Class for styling popup */}
                  <img
                      src={getImageUrl(displayProfilePic)}
                      alt={displayName}
                      className="popup-profile-pic" // Class for styling
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/default-profile.png'; }}
                  />
                  <div className="popup-info">
                      <strong className="popup-name">{displayName}</strong>
                      {/* Display the type of the user on the map */}
                      {markerUserType && <span className="popup-user-type">{markerUserType}</span>}
                      {loc.profile?.city && <span className="popup-location">{loc.profile.city}</span>}
                      {displayBio ? ( <p className="popup-bio"><em>{displayBio}</em></p> ) : ( <p className="popup-bio"><span>No bio available</span></p> )}
                      <button
                        className="popup-button" // Class for styling
                        onClick={() => navigate(`/user-profile/${loc.user_id}`)}
                      >
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