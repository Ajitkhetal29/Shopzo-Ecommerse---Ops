"use client";

import { useRef, useState } from "react";
import { Autocomplete, GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";

type AddressResult = {
  formatted: string;
  city: string;
  state: string;
  pincode: string;
  area: string;
  country: string;
  method: "google-maps-sdk-geocoder" | "google-geocoding-http";
};

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 };
const MAP_LIBRARIES: ("places")[] = ["places"];

export default function MapTestPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: MAP_LIBRARIES,
  });

  // UI state
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<AddressResult | null>(null);
  const [searchText, setSearchText] = useState("");
  const [status, setStatus] = useState("Pick location using map click, search, or my location.");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // Google instances
  const mapRef = useRef<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const mapAddress = (
    result: google.maps.GeocoderResult,
    method: AddressResult["method"]
  ): AddressResult => {
    const components = result.address_components || [];
    const getPart = (...types: string[]) =>
      components.find((item) => types.some((type) => item.types.includes(type)))?.long_name || "";

    return {
      formatted: result.formatted_address || "",
      city:
        getPart("locality") ||
        getPart("administrative_area_level_3") ||
        getPart("sublocality") ||
        getPart("administrative_area_level_2"),
      state: getPart("administrative_area_level_1"),
      pincode: getPart("postal_code"),
      area: getPart("sublocality", "neighborhood"),
      country: getPart("country"),
      method,
    };
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    setStatus("Running reverse geocode...");

    // Method 1: Google Maps SDK Geocoder (preferred)
    if (typeof window !== "undefined" && window.google?.maps?.Geocoder) {
      const geocoder = new window.google.maps.Geocoder();
      const sdkResult = await new Promise<google.maps.GeocoderResult | null>((resolve) => {
        geocoder.geocode({ location: { lat, lng } }, (results, geocodeStatus) => {
          if (geocodeStatus === "OK" && results?.length) {
            resolve(results[0]);
            return;
          }
          resolve(null);
        });
      });

      if (sdkResult) {
        setAddress(mapAddress(sdkResult, "google-maps-sdk-geocoder"));
        setStatus("Reverse geocode success using Google Maps SDK Geocoder.");
        setIsReverseGeocoding(false);
        return;
      }
    }

    // Method 2: Google Geocoding HTTP API (fallback)
    if (!apiKey) {
      setStatus("API key missing. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.");
      setAddress(null);
      setIsReverseGeocoding(false);
      return;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      );
      const data = await response.json();

      if (data.status === "OK" && data.results?.length) {
        setAddress(mapAddress(data.results[0], "google-geocoding-http"));
        setStatus("Reverse geocode success using Google Geocoding HTTP fallback.");
      } else {
        setAddress(null);
        setStatus(`Reverse geocode failed. Status: ${data.status}`);
      }
    } catch {
      setAddress(null);
      setStatus("Reverse geocode request failed. Check browser console/network.");
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  const chooseLocation = async (lat: number, lng: number, source: string) => {
    setPosition({ lat, lng });
    setStatus(`Location selected via ${source}.`);
    await reverseGeocode(lat, lng);
    if (mapRef.current) {
      mapRef.current.panTo({ lat, lng });
      mapRef.current.setZoom(15);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setStatus("Geolocation is not supported in this browser.");
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsLoadingLocation(false);
        await chooseLocation(pos.coords.latitude, pos.coords.longitude, "my-location button");
      },
      (error) => {
        setIsLoadingLocation(false);
        setStatus(`Unable to fetch current location: ${error.message}`);
      }
    );
  };

  if (!isLoaded) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading Google Maps...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Map Test Lab (Google Maps)</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Test click-to-pick, search, my-location, and reverse geocoding in one place.
        </p>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Route: <code>/map-test</code>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_460px]">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
          <div className="absolute left-4 right-40 top-4 z-[20]">
            <Autocomplete
              onLoad={(autocomplete) => {
                autocompleteRef.current = autocomplete;
              }}
              onPlaceChanged={async () => {
                const place = autocompleteRef.current?.getPlace();
                const placeLocation = place?.geometry?.location;
                if (!placeLocation) {
                  setStatus("No geometry found for selected place.");
                  return;
                }
                const lat = placeLocation.lat();
                const lng = placeLocation.lng();
                setSearchText(place?.formatted_address || place?.name || "");
                await chooseLocation(lat, lng, "search autocomplete");
              }}
            >
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search any location"
                className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              />
            </Autocomplete>
          </div>

          <button
            onClick={handleUseMyLocation}
            disabled={isLoadingLocation}
            className="absolute right-4 top-4 z-[20] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoadingLocation ? "Locating..." : "Use my location"}
          </button>

          <GoogleMap
            center={position || DEFAULT_CENTER}
            zoom={position ? 15 : 5}
            mapContainerClassName="h-[600px] w-full"
            options={{
              streetViewControl: false,
              fullscreenControl: false,
              mapTypeControl: false,
            }}
            onLoad={(map) => {
              mapRef.current = map;
            }}
            onClick={async (e) => {
              const lat = e.latLng?.lat();
              const lng = e.latLng?.lng();
              if (typeof lat === "number" && typeof lng === "number") {
                await chooseLocation(lat, lng, "map click");
              }
            }}
          >
            {position && <MarkerF position={position} />}
          </GoogleMap>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Debug Panel</h2>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
            <p className="font-semibold">Flow used in app</p>
            <p className="mt-1">
              1) Pick location from map/search/my-location <br />
              2) Run reverse geocode <br />
              3) Fill address fields
            </p>
          </div>

          <button
            onClick={() => {
              if (!position) {
                setStatus("Please pick a location first.");
                return;
              }
              void reverseGeocode(position.lat, position.lng);
            }}
            disabled={!position || isReverseGeocoding}
            className="inline-flex h-10 min-w-40 items-center justify-center rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-300"
          >
            {isReverseGeocoding ? "Reverse geocoding..." : "Re-run reverse geocode"}
          </button>

          <div className="space-y-2 text-sm">
            <p className="text-slate-600 dark:text-slate-300">
              <span className="font-semibold">Status:</span> {status}
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              <span className="font-semibold">Coordinates:</span>{" "}
              {position ? `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}` : "Not selected"}
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              <span className="font-semibold">Method used:</span> {address?.method || "N/A"}
            </p>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Reverse Geocode Result</h3>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div>
                <p className="text-xs text-slate-500">Full Address</p>
                <p className="text-slate-800 dark:text-slate-200">{address?.formatted || "-"}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-slate-500">City</p>
                  <p className="text-slate-800 dark:text-slate-200">{address?.city || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">State</p>
                  <p className="text-slate-800 dark:text-slate-200">{address?.state || "-"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-slate-500">Pincode</p>
                  <p className="text-slate-800 dark:text-slate-200">{address?.pincode || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Area</p>
                  <p className="text-slate-800 dark:text-slate-200">{address?.area || "-"}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500">Country</p>
                <p className="text-slate-800 dark:text-slate-200">{address?.country || "-"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
