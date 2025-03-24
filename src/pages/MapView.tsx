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

// ✅ Read API URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:50001';

// Define custom icons
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

// Data from your GET /api/locations?userType=...
interface LocationData {
  user_id: number;
  fullname: string;
  location: {
    latitude: number;
    longitude: number;
  };
  // The profile data from GET /api/users/profile/:userId
  profile?: {
    user_id: number;
    fullname: string;
    user_type: string;
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

// (Optional) Component to reset the view on zoom changes
const ResetViewOnZoom = ({ center }: { center: [number, number] }) => {
  const map = useMapEvents({
    zoomend: () => {
      map.setView(center); // This keeps the center fixed after zoom
    },
  });
  return null;
};

const MapView = ({ userType }: { userType: string }) => {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const navigate = useNavigate();

  // Center of Patras, Greece
  const center: [number, number] = [38.246639, 21.734573];

  // Fetch basic location data => Then fetch each user’s full profile
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No token found; user might not be logged in.');
          return;
        }

        // If I'm an Artist, I want to see Employers, else Artists
        const targetUserType = userType === 'Artist' ? 'Employer' : 'Artist';

        // 1) Fetch the basic location data
        const response = await axios.get(
          `${API_BASE_URL}/api/locations?userType=${targetUserType}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const fetchedLocations: LocationData[] = response.data;

        // 2) For each location, fetch the user’s full profile
        const updatedLocations = await Promise.all(
          fetchedLocations.map(async (loc) => {
            try {
              const profileRes = await axios.get(
                `${API_BASE_URL}/api/users/profile/${loc.user_id}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              return {
                ...loc,
                profile: profileRes.data, // This is where we get artistProfile/employerProfile
              };
            } catch (err) {
              console.error('Error fetching profile for user_id=', loc.user_id, err);
              return loc; // Fallback: keep location as is
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

  // Helper function to build full URLs for images
  const getImageUrl = (path?: string) => {
    if (!path) return '/default-profile.png';
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}/${path.replace(/^uploads\/uploads\//, 'uploads/')}`;
  };

  return (
    <div className="map-page">
      <MapContainer
        className="leaflet-map"
        center={center}
        zoom={15}
        maxZoom={24}
      >
        <ResetViewOnZoom center={center} />

        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CartoDB</a> contributors'
        />

        {locations.map((loc) => {
          // Decide which icon to use (if I'm Artist => these pins are Employers, else Artists)
          const pinIcon = userType === 'Artist' ? employerIcon : artistIcon;

          // Prepare top-level fallback name
          let displayName = loc.fullname;
          let displayBio: string | null = null;
          let displayProfilePic: string | null = null;

          // If we have a loaded profile from /api/users/profile/:id
          if (loc.profile) {
            displayName = loc.profile.fullname;

            // If this user is an Artist
            if (loc.profile.user_type === 'Artist' && loc.profile.artistProfile) {
              displayBio = loc.profile.artistProfile.bio || null;
              displayProfilePic = loc.profile.artistProfile.profile_picture || null;
            }
            // If this user is an Employer
            else if (loc.profile.user_type === 'Employer' && loc.profile.employerProfile) {
              displayBio = loc.profile.employerProfile.bio || null;
              displayProfilePic = loc.profile.employerProfile.profile_picture || null;
            }
          }

          return (
            <Marker
              key={loc.user_id}
              position={[loc.location.latitude, loc.location.longitude]}
              icon={pinIcon}
            >
              <Popup>
                <div className="popup-content">
                  <strong>{displayName}</strong>
                  <br />

                  {displayBio ? (
                    <em>{displayBio}</em>
                  ) : (
                    <span>No bio available</span>
                  )}

                  <br />
                  {displayProfilePic && (
                    <img
                      src={getImageUrl(displayProfilePic)}
                      alt="Profile"
                      style={{ width: '60px', height: '60px', borderRadius: '50%' }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/default-profile.png';
                      }}
                    />
                  )}

                  <br />
                  {/* The userType logic: if I'm Artist, this location is Employer, else Artist */}
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
