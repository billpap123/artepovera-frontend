// src/pages/MapView.tsx (or wherever your MapView.tsx is)
import React, { useEffect, useState, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  // useMapEvents, // ResetViewOnZoom was commented out, so this might not be needed
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/MapView.css';
import artistIconPath from '../assets/icons/artist-icon.png';
import employerIconPath from '../assets/icons/employer-icon.png';
import '../styles/Global.css'; // Assuming this contains .loading-message, .error-message
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
  profile?: { // This structure comes from /api/users/profile/:userId
    user_id: number;
    fullname: string;
    user_type: 'Artist' | 'Employer' | string;
    city?: string;
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

// ResetViewOnZoom was commented out in your provided code. If you use it, uncomment useMapEvents.
// const ResetViewOnZoom = ({ center }: { center: [number, number] }) => {
//   const map = useMapEvents({
//     zoomend: () => { map.setView(center); },
//   });
//   return null;
// };

// --- MODIFIED Props: Added loggedInUserId ---
interface MapViewProps {
  userType: string | null; // Logged-in user's type (e.g., 'Artist', 'Employer', or null if not logged in/determined)
  loggedInUserId: number | null; // Logged-in user's ID
}

const MapView: React.FC<MapViewProps> = ({ userType: loggedInUserType, loggedInUserId }) => {
  const [allLocationsWithProfiles, setAllLocationsWithProfiles] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const center: [number, number] = [38.246639, 21.734573]; // Default center (Patras, GR)
  const initialZoom = 13;

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const fetchLocationsAndProfiles = async () => {
      try {
        const token = localStorage.getItem('token');
        // If a certain userType is required to view the map, enforce it here.
        // For now, we proceed if loggedInUserType is determined.
        if (!loggedInUserType) {
          if (isMounted) {
            console.warn('[MapView] Logged-in user type not provided. Cannot determine map content.');
            setError("Your user type is not determined. Cannot display specific map content.");
            setLoading(false);
          }
          return;
        }
        
        // --- MODIFIED LOGIC for targetUserTypeOnMap ---
        let targetUserTypeOnMapToDisplay: string;
        if (loggedInUserType === 'Artist') {
          targetUserTypeOnMapToDisplay = 'Artist'; // Artists see other Artists
        } else if (loggedInUserType === 'Employer') {
          targetUserTypeOnMapToDisplay = 'Artist'; // Employers see Artists (maintaining previous behavior for employers)
        } else {
          // Fallback for other user types or if loggedInUserType is not 'Artist' or 'Employer'
          console.warn(`[MapView] LoggedInUserType '${loggedInUserType}' has no specific map view configured. Defaulting to show Artists.`);
          targetUserTypeOnMapToDisplay = 'Artist'; // Or handle as an error/empty map
        }
        // --- END MODIFICATION ---

        console.log(`[MapView] Logged-in as: ${loggedInUserType}. Fetching locations for type: ${targetUserTypeOnMapToDisplay}`);
        // The backend /api/locations should filter by userType if the query param is provided.
        const response = await axios.get(
          `${API_BASE_URL}/api/locations?userType=${targetUserTypeOnMapToDisplay}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );

        const initialFetchedLocations: LocationData[] = response.data.locations || response.data || [];
        console.log("[MapView] Initial locations fetched:", initialFetchedLocations.length);
        if (!isMounted) return;

        if (!initialFetchedLocations.length) {
            console.log(`[MapView] No locations found for type: ${targetUserTypeOnMapToDisplay}.`);
            if(isMounted) {
                setAllLocationsWithProfiles([]);
                setLoading(false);
                // setError(`No ${targetUserTypeOnMapToDisplay.toLowerCase()}s found in this area yet.`); // Optional: set an info message instead of error
            }
            return;
        }

        console.log("[MapView] Fetching detailed profiles for locations...");
        const profilePromises = initialFetchedLocations.map(async (loc) => {
          if (!isMounted || !loc.user_id) return loc; // Skip if no user_id
          try {
            // Fetching full profile to get user_type for icon and detailed popup info
            const profileRes = await axios.get(
              `${API_BASE_URL}/api/users/profile/${loc.user_id}`,
              { headers: token ? { Authorization: `Bearer ${token}` } : {} }
            );
            if (!isMounted) return loc;
            // Ensure the profile fetched matches the targetUserTypeOnMapToDisplay,
            // though the /api/locations endpoint should ideally handle this.
            // This is more of a double-check or if /api/locations returns mixed types for some reason.
            if (profileRes.data.user_type === targetUserTypeOnMapToDisplay) {
                return { ...loc, profile: profileRes.data };
            } else {
                // This should ideally not happen if /api/locations filters correctly.
                console.warn(`[MapView] Fetched profile for user ${loc.user_id} is type ${profileRes.data.user_type}, expected ${targetUserTypeOnMapToDisplay}. Excluding.`);
                return null; // Mark for filtering
            }
          } catch (err) {
            console.error('[MapView] Error fetching profile for user_id=', loc.user_id, err);
            return { ...loc, profile: undefined }; // Keep location but mark profile as failed
          }
        });

        const locationsWithFullProfilesData = (await Promise.all(profilePromises)).filter(Boolean) as LocationData[];
        if (!isMounted) return;

        console.log("[MapView] All profiles fetched. Valid profiles for map:", locationsWithFullProfilesData.length);
        
        // --- ADDED: Filter out the logged-in user if they are an artist viewing other artists ---
        let finalLocationsToDisplay = locationsWithFullProfilesData;
        if (loggedInUserType === 'Artist' && targetUserTypeOnMapToDisplay === 'Artist' && loggedInUserId) {
            console.log(`[MapView] Filtering out self (ID: ${loggedInUserId}) from artist map.`);
            finalLocationsToDisplay = locationsWithFullProfilesData.filter(loc => loc.user_id !== loggedInUserId);
        }
        // --- END ADDED ---

        setAllLocationsWithProfiles(finalLocationsToDisplay);

      } catch (error: any) {
        console.error('[MapView] Error fetching initial locations or profiles:', error);
        if (isMounted) setError(error.response?.data?.message || 'Failed to load location data.');
      } finally {
        if (isMounted) {
            console.log("[MapView] Setting loading to false.");
            setLoading(false);
        }
      }
    };

    fetchLocationsAndProfiles(); // Call fetch if loggedInUserType is determined

    return () => { isMounted = false; };
  }, [loggedInUserType, loggedInUserId, API_BASE_URL]); // Added loggedInUserId to dependencies


  const getImageUrl = (path?: string | null): string => { // Ensure return type is string for <img> src
    if (!path) return '/default-profile.png';
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}/${path.replace(/^uploads\/uploads\//, 'uploads/')}`;
  };

  console.log("[MapView] Render - Loading:", loading, "Error:", error, "Locations to display:", allLocationsWithProfiles.length);

  if (loading) { /* ... loading JSX ... */ }
  if (error) { /* ... error JSX ... */ }

  return (
    <div className="map-page-container">
      <Navbar />
      <MapContainer className="leaflet-map" center={center} zoom={initialZoom} scrollWheelZoom={true}>
        {/* <ResetViewOnZoom center={center} /> */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/" target="_blank" rel="noopener noreferrer">CartoDB</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
        />

        {allLocationsWithProfiles.map((loc) => {
          // Ensure profile and location data are valid before rendering marker
          if (!loc.profile || !loc.location?.latitude || !loc.location?.longitude) {
            console.warn("[MapView] Skipping marker due to incomplete data for user_id:", loc.user_id, loc);
            return null;
          }

          const markerUserType = loc.profile.user_type;
          const pinIcon = markerUserType === 'Artist' ? artistIcon :
                          markerUserType === 'Employer' ? employerIcon :
                          artistIcon; // Default icon

          const displayName = loc.profile.fullname || "N/A"; // Use profile fullname primarily
          let displayBio: string | null = null;
          let displayProfilePic: string | null = null;

          if (loc.profile.user_type === 'Artist' && loc.profile.artistProfile) {
            displayBio = loc.profile.artistProfile.bio || null;
            displayProfilePic = loc.profile.artistProfile.profile_picture || null;
          } else if (loc.profile.user_type === 'Employer' && loc.profile.employerProfile) {
            displayBio = loc.profile.employerProfile.bio || null;
            displayProfilePic = loc.profile.employerProfile.profile_picture || null;
          }

          return (
            <Marker
              key={loc.user_id}
              position={[loc.location.latitude, loc.location.longitude]}
              icon={pinIcon}
            >
              <Popup>
                <div className="map-popup-content">
                  <img 
                    src={getImageUrl(displayProfilePic)} 
                    alt={displayName} 
                    className="popup-profile-pic" 
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/default-profile.png'; }} 
                  />
                  <div className="popup-info">
                      <strong className="popup-name">{displayName}</strong>
                      {markerUserType && <span className="popup-user-type">{markerUserType}</span>}
                      {loc.profile.city && <span className="popup-location">{loc.profile.city}</span>}
                      {displayBio ? ( <p className="popup-bio"><em>{displayBio.substring(0, 100)}{displayBio.length > 100 ? '...' : ''}</em></p> ) : ( <p className="popup-bio"><span>No bio available</span></p> )}
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