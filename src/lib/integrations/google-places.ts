// Google Places API integration for address autocomplete
declare global {
  interface Window {
    google: any;
  }
}

export const loadGooglePlaces = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.google && window.google.maps) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const initAutocomplete = (inputElement: HTMLInputElement, onPlaceSelected: (place: any) => void) => {
  if (!window.google || !window.google.maps) {
    console.error('Google Maps not loaded');
    return;
  }

  const autocomplete = new window.google.maps.places.Autocomplete(inputElement, {
    componentRestrictions: { country: 'in' }, // India
    fields: ['address_components', 'formatted_address', 'geometry', 'name'],
    types: ['address'],
  });

  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    onPlaceSelected(place);
  });

  return autocomplete;
};

export const formatAddress = (place: any): string => {
  return place.formatted_address || '';
};

// Extract area and city from Google Places address components (Swiggy 2025 pattern)
export const extractAreaAndCity = (place: any): { area: string; city: string; full: string } => {
  if (!place.address_components) {
    const fallback = place.formatted_address || '';
    const parts = fallback.split(',');
    return {
      area: parts[0]?.trim() || 'Unknown',
      city: parts[1]?.trim() || parts[0]?.trim() || 'Unknown',
      full: fallback
    };
  }

  const components = place.address_components;
  
  // Extract area/locality (neighborhood or sublocality)
  let area = '';
  const sublocality = components.find((comp: any) => 
    comp.types.includes('sublocality') || comp.types.includes('sublocality_level_1')
  );
  const neighborhood = components.find((comp: any) => 
    comp.types.includes('neighborhood')
  );
  area = (sublocality?.long_name || neighborhood?.long_name || '');

  // Extract city (locality)
  let city = '';
  const locality = components.find((comp: any) => 
    comp.types.includes('locality')
  );
  city = locality?.long_name || '';

  // Fallback to administrative_area_level_2 (district) if no city
  if (!city) {
    const district = components.find((comp: any) =>
      comp.types.includes('administrative_area_level_2')
    );
    city = district?.long_name || '';
  }

  // If no area found, use first part of formatted address
  if (!area && place.formatted_address) {
    area = place.formatted_address.split(',')[0]?.trim() || '';
  }

  // Format: "Area, City" (Swiggy 2025 pattern)
  const full = area && city ? `${area}, ${city}` : (area || city || place.formatted_address || 'Unknown Location');

  return { area: area || city || 'Unknown', city: city || 'Unknown', full };
};

export const getLatLng = (place: any): { lat: number; lng: number } | null => {
  if (place.geometry && place.geometry.location) {
    return {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    };
  }
  return null;
};

// Reverse geocode coordinates to get full address data (for area and city extraction)
export const reverseGeocode = async (lat: number, lng: number): Promise<any> => {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '';
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );
    const data = await response.json();
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      // Return full place object with address_components for extractAreaAndCity
      return {
        formatted_address: data.results[0].formatted_address,
        address_components: data.results[0].address_components || []
      };
    }
    
    return {
      formatted_address: 'Unknown Location',
      address_components: []
    };
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return {
      formatted_address: 'Unknown Location',
      address_components: []
    };
  }
};

