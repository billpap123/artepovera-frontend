import React, { useEffect, useState } from 'react';
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
import '../styles/Global.css';

// Read API URL from environment variables or fall back to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:50001';

// Define the shape of each location
interface LocationData {
  user_id: number;
  fullname: string;
  location: {
    latitude: number;
    longitude: number;
  };
  // After we fetch the user’s full profile, we store it here:
  profile?: {
    // If your server returns a flattened shape:
    user_id: number;
    fullname: string;
    user_type: string;
    bio?: string;
    profile_picture?: string;
    // If you have separate artistProfile/employerProfile, adapt accordingly:
    // artistProfile?: { bio?: string; profile_picture?: string; is_student?: boolean; };
    // employerProfile?: { bio?: string; profile_picture?: string; };
  };
}

// Define custom Leaflet icons
const artistIcon = new L.Icon({
  iconUrl: artistIconPath,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const employerIcon = new L.Icon({
  iconUrl: employerIconPath,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// (Optional) component that resets the view to `center` on zoom
const ResetViewOnZoom = ({ center }: { center: [number, number] }) => {
  const map = useMapEvents({
    zoomend: () => {
      map.setView(center); // Keeps the center fixed after zoom
    },
  });
  return null;
};

// Props: userType is the type of the logged-in user (“Artist” or “Employer”)
const MapView = ({ userType }: { userType: string }) => {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const navigate = useNavigate();

  // Example center (Patras, Greece). Adjust as needed
  const center: [number, number] = [38.246639, 21.734573];

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No token found; user might not be logged in.');
          return;
        }

        // If the logged-in user is an Artist, we fetch Employer locations; else fetch Artist
        const targetUserType = userType === 'Artist' ? 'Employer' : 'Artist';

        // 1) Fetch the basic location data from your backend
        const resp = await axios.get(
          `${API_BASE_URL}/api/locations?userType=${targetUserType}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const fetchedLocations: LocationData[] = resp.data;

        // 2) For each location, fetch the user’s full profile
        const updatedLocations = await Promise.all(
          fetchedLocations.map(async (loc) => {
            try {
              const profileResp = await axios.get(
                `${API_BASE_URL}/api/users/profile/${loc.user_id}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              return {
                ...loc,
                profile: profileResp.data,
              };
            } catch (err) {
              console.error(
                `Error fetching profile for user_id=${loc.user_id}:`,
                err
              );
              return loc; // fallback with no `profile`
            }
          })
        );

        setLocations(updatedLocations);
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };

    fetchLocations();
  }, [userType]);

  return (
    <div className="map-page">
      <MapContainer
        className="leaflet-map"
        center={center}
        zoom={14}
        maxZoom={24}
      >
        <ResetViewOnZoom center={center} />

        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CartoDB</a> contributors'
        />

        {locations.map((loc) => {
          // The marker icon depends on the user type we’re looking at
          // If *we* are an Artist, the markers are Employers => use employerIcon
          // If *we* are an Employer, the markers are Artists => use artistIcon
          const markerIcon = userType === 'Artist' ? employerIcon : artistIcon;

          return (
            <Marker
              key={loc.user_id}
              position={[loc.location.latitude, loc.location.longitude]}
              icon={markerIcon}
            >
              <Popup>
                <div className="popup-content">
                  {/* If we have a full profile, show it */}
                  {loc.profile ? (
                    <>
                      <strong>{loc.profile.fullname}</strong>
                      <br />
                      {loc.profile.bio ? (
                        <em>{loc.profile.bio}</em>
                      ) : (
                        <span>No bio available</span>
                      )}
                      <br />
                      {loc.profile.profile_picture && (
                        <img
                          src={loc.profile.profile_picture}
                          alt="Profile"
                          style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                          }}
                        />
                      )}
                    </>
                  ) : (
                    // Fallback if no profile data
                    <>
                      <strong>{loc.fullname}</strong>
                      <br />
                      <span>Loading profile...</span>
                    </>
                  )}

                  <br />
                  {/* The userType logic: if I'm Artist, this loc is Employer, else Artist */}
                  <small>{userType === 'Artist' ? 'Employer' : 'Artist'}</small>
                  <br />

                  {/* Button to go to the user profile page */}
                  <button
                    className="popup-button"
                    onClick={() => navigate(`/user-profile/${loc.user_id}`)}
                  >
                    View Profile
                  </button>
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
