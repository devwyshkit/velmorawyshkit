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

export const getLatLng = (place: any): { lat: number; lng: number } | null => {
  if (place.geometry && place.geometry.location) {
    return {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    };
  }
  return null;
};

