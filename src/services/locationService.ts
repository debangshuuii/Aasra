export interface EmergencyCenter {
  id: string;
  name: string;
  type: 'hospital' | 'psychiatric' | 'crisis_center' | 'clinic';
  distanceKm: number;
  address?: string;
  phone?: string;
  emergency24x7: boolean;
  directionsUrl: string;
  callUrl?: string;
  lat: number;
  lng: number;
}

export interface UserCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

/**
 * Calculates Haversine distance between two coordinates in kilometers.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

/**
 * Prompts the browser for high-accuracy GPS coordinates.
 */
export function getUserCoordinates(): Promise<UserCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser or device.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Location access was denied. Please allow location permissions in your browser settings to find nearby centers.'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Location information is currently unavailable.'));
            break;
          case error.TIMEOUT:
            reject(new Error('Location request timed out. Please check your signal and try again.'));
            break;
          default:
            reject(new Error('Unable to retrieve your location.'));
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}

/**
 * Curated premier psychiatric & tertiary trauma emergency centers across India.
 * Used as reliable immediate results and offline/timeout fallbacks.
 */
const CURATED_EMERGENCY_CENTERS = [
  {
    id: 'nimhans-bengaluru',
    name: 'NIMHANS (National Institute of Mental Health & Neurosciences)',
    type: 'psychiatric' as const,
    lat: 12.9431,
    lng: 77.5969,
    address: 'Hosur Road, Lakkasandra, Bengaluru, Karnataka 560029',
    phone: '080-26995000',
    emergency24x7: true,
  },
  {
    id: 'aiims-delhi',
    name: 'AIIMS Emergency & Psychiatric Center',
    type: 'hospital' as const,
    lat: 28.5672,
    lng: 77.2100,
    address: 'Ansari Nagar, New Delhi, Delhi 110029',
    phone: '011-26588500',
    emergency24x7: true,
  },
  {
    id: 'pgimer-chandigarh',
    name: 'PGIMER Emergency Care & Psychiatry Dept',
    type: 'hospital' as const,
    lat: 30.7644,
    lng: 76.7766,
    address: 'Sector 12, Chandigarh, 160012',
    phone: '0172-2747585',
    emergency24x7: true,
  },
  {
    id: 'kem-mumbai',
    name: 'KEM Hospital & Emergency Psychiatry',
    type: 'hospital' as const,
    lat: 19.0028,
    lng: 72.8427,
    address: 'Acharya Donde Marg, Parel, Mumbai, Maharashtra 400012',
    phone: '022-24107000',
    emergency24x7: true,
  },
  {
    id: 'cip-ranchi',
    name: 'Central Institute of Psychiatry (CIP)',
    type: 'psychiatric' as const,
    lat: 23.3855,
    lng: 85.3218,
    address: 'Kanke, Ranchi, Jharkhand 834006',
    phone: '0651-2231122',
    emergency24x7: true,
  },
  {
    id: 'rg-kar-kolkata',
    name: 'R. G. Kar Medical College & Trauma Care',
    type: 'hospital' as const,
    lat: 22.6042,
    lng: 88.3712,
    address: '1, Khudiram Bose Sarani, Kolkata, West Bengal 700004',
    phone: '033-25557656',
    emergency24x7: true,
  },
  {
    id: 'apollo-chennai',
    name: 'Apollo Hospital 24/7 Emergency & Crisis',
    type: 'hospital' as const,
    lat: 13.0604,
    lng: 80.2508,
    address: 'Greams Road, Thousand Lights, Chennai, Tamil Nadu 600006',
    phone: '044-28290200',
    emergency24x7: true,
  },
  {
    id: 'nizam-hyderabad',
    name: "Nizam's Institute of Medical Sciences (NIMS)",
    type: 'hospital' as const,
    lat: 17.4225,
    lng: 78.4526,
    address: 'Punjagutta, Hyderabad, Telangana 500082',
    phone: '040-23489000',
    emergency24x7: true,
  },
];

/**
 * Fetch nearby hospitals and emergency departments.
 * Uses OpenStreetMap Overpass API with automatic fallback to curated centers.
 */
export async function fetchNearbyEmergencyCenters(
  userLat: number,
  userLng: number,
  radiusKm = 20
): Promise<EmergencyCenter[]> {
  const centers: EmergencyCenter[] = [];

  try {
    // OpenStreetMap Overpass query for emergency hospitals and clinics within radius
    const radiusMeters = radiusKm * 1000;
    const overpassQuery = `
      [out:json][timeout:8];
      (
        node["amenity"="hospital"](around:${radiusMeters},${userLat},${userLng});
        way["amenity"="hospital"](around:${radiusMeters},${userLat},${userLng});
        node["healthcare"="hospital"](around:${radiusMeters},${userLat},${userLng});
        node["amenity"="clinic"](around:${radiusMeters},${userLat},${userLng});
      );
      out center 15;
    `;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: overpassQuery,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.elements)) {
        for (const el of data.elements) {
          const lat = el.lat || el.center?.lat;
          const lng = el.lon || el.center?.lon;
          if (!lat || !lng) continue;

          const tags = el.tags || {};
          const name = tags.name || tags['name:en'] || 'Local Medical Center';
          const distance = calculateDistanceKm(userLat, userLng, lat, lng);

          const phone = tags['phone'] || tags['contact:phone'] || tags['emergency:phone'] || undefined;
          const address = tags['addr:street'] 
            ? `${tags['addr:street']}, ${tags['addr:city'] || ''}`.trim()
            : tags['addr:full'] || undefined;

          const isPsych = (tags.healthcare === 'psychiatrist' || name.toLowerCase().includes('psych') || name.toLowerCase().includes('mental'));

          centers.push({
            id: `osm-${el.id}`,
            name,
            type: isPsych ? 'psychiatric' : 'hospital',
            distanceKm: distance,
            address,
            phone,
            emergency24x7: tags['emergency'] === 'yes' || tags['opening_hours'] === '24/7',
            directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
            callUrl: phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : undefined,
            lat,
            lng,
          });
        }
      }
    }
  } catch (err) {
    console.warn('[LocationService] Overpass API query error, using curated emergency centers:', err);
  }

  // Also calculate distances for curated premier centers and merge
  for (const curated of CURATED_EMERGENCY_CENTERS) {
    const distance = calculateDistanceKm(userLat, userLng, curated.lat, curated.lng);
    centers.push({
      id: curated.id,
      name: curated.name,
      type: curated.type,
      distanceKm: distance,
      address: curated.address,
      phone: curated.phone,
      emergency24x7: curated.emergency24x7,
      directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${curated.lat},${curated.lng}`,
      callUrl: `tel:${curated.phone.replace(/[^\d+]/g, '')}`,
      lat: curated.lat,
      lng: curated.lng,
    });
  }

  // Deduplicate by name and sort by nearest distance first
  const seen = new Set<string>();
  const uniqueCenters = centers.filter((c) => {
    const key = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return uniqueCenters.sort((a, b) => a.distanceKm - b.distanceKm);
}
