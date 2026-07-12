import {
  getCompletedRouteSegment,
  getPointAlongRoute,
  getRouteBearingAtProgress,
  LatLng,
  MapCoords,
} from "@/lib/mapbox";

type LiveMapPayload = {
  token: string;
  origin: [number, number];
  destination: [number, number];
  route: [number, number][];
  progress: number;
  initialVehicle?: [number, number] | null;
  initialBearing?: number;
};

function toLineString(coords: LatLng[]) {
  return coords.map((point) => [point.longitude, point.latitude]);
}

function buildPayload(options: {
  token: string;
  originCoords: MapCoords;
  destCoords: MapCoords;
  route: LatLng[];
  progress: number;
  initialVehicle?: { latitude: number; longitude: number; heading?: number | null } | null;
}): LiveMapPayload {
  return {
    token: options.token,
    origin: [options.originCoords.lng, options.originCoords.lat],
    destination: [options.destCoords.lng, options.destCoords.lat],
    route: options.route.map((point) => [point.longitude, point.latitude] as [number, number]),
    progress: options.progress,
    initialVehicle: options.initialVehicle
      ? [options.initialVehicle.longitude, options.initialVehicle.latitude]
      : null,
    initialBearing: options.initialVehicle?.heading ?? 0,
  };
}

export function buildLiveTrackingGpsUpdateScript(options: {
  latitude: number;
  longitude: number;
  heading?: number | null;
}) {
  return `window.__trackingMapGpsUpdate && window.__trackingMapGpsUpdate(${JSON.stringify({
    vehicle: [options.longitude, options.latitude],
    bearing: options.heading ?? 0,
  })}); true;`;
}

export function buildLiveTrackingUpdateScript(progress: number, route: LatLng[]) {
  const vehicle = getPointAlongRoute(route, progress);
  if (!vehicle) return "true;";

  const completed = getCompletedRouteSegment(route, progress);
  const bearing = getRouteBearingAtProgress(route, progress);

  return `window.__trackingMapUpdate && window.__trackingMapUpdate(${JSON.stringify({
    progress,
    vehicle: [vehicle.longitude, vehicle.latitude],
    bearing,
    completed: toLineString(completed),
  })}); true;`;
}

export function buildLiveTrackingMapHtml(options: {
  token: string;
  originCoords: MapCoords;
  destCoords: MapCoords;
  route: LatLng[];
  progress: number;
  initialVehicle?: { latitude: number; longitude: number; heading?: number | null } | null;
}) {
  const payload = buildPayload(options);
  const payloadJson = JSON.stringify(payload);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link href="https://api.mapbox.com/mapbox-gl-js/v3.9.4/mapbox-gl.css" rel="stylesheet" />
  <script src="https://api.mapbox.com/mapbox-gl-js/v3.9.4/mapbox-gl.js"></script>
  <style>
    html, body, #map {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #eef1f4;
      touch-action: none;
    }
    .mapboxgl-ctrl-bottom-right, .mapboxgl-ctrl-bottom-left {
      margin-bottom: 88px;
    }
    .mapboxgl-ctrl-logo,
    .mapboxgl-ctrl-attrib,
    .mapboxgl-ctrl-attrib-button,
    .mapboxgl-compact {
      display: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
    }
    .vehicle-marker {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      transform-origin: center center;
    }
    .vehicle-arrow {
      width: 0;
      height: 0;
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
      border-bottom: 22px solid #f97316;
      filter: drop-shadow(0 1px 2px rgba(15, 23, 42, 0.35));
    }
    .pin-marker {
      width: 28px;
      height: 28px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font: 700 12px/1 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      color: #151b24;
      border: 2px solid #151b24;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.18);
    }
    .pin-origin { background: #bfff07; }
    .pin-destination { background: #ffffff; color: #151b24; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const payload = ${payloadJson};
    mapboxgl.accessToken = payload.token;

    let vehicleMarker = null;
    let map = null;

    function sliceRoute(route, progress) {
      if (!route.length) return [];
      if (progress <= 0) return [route[0]];
      if (progress >= 100) return route.slice();
      const targetIndex = Math.max(1, Math.round((progress / 100) * (route.length - 1)));
      return route.slice(0, targetIndex + 1);
    }

    function pointAlongRoute(route, progress) {
      if (!route.length) return null;
      if (progress <= 0) return route[0];
      if (progress >= 100) return route[route.length - 1];
      const targetIndex = (progress / 100) * (route.length - 1);
      const lowerIndex = Math.floor(targetIndex);
      const upperIndex = Math.min(lowerIndex + 1, route.length - 1);
      const blend = targetIndex - lowerIndex;
      const lower = route[lowerIndex];
      const upper = route[upperIndex];
      return [
        lower[0] + (upper[0] - lower[0]) * blend,
        lower[1] + (upper[1] - lower[1]) * blend,
      ];
    }

    function bearingAtProgress(route, progress) {
      if (route.length < 2) return 0;
      const targetIndex = Math.max(0, Math.min((progress / 100) * (route.length - 1), route.length - 2));
      const fromIndex = Math.floor(targetIndex);
      const toIndex = Math.min(fromIndex + 1, route.length - 1);
      const from = route[fromIndex];
      const to = route[toIndex];
      const dLon = ((to[0] - from[0]) * Math.PI) / 180;
      const lat1 = (from[1] * Math.PI) / 180;
      const lat2 = (to[1] * Math.PI) / 180;
      const y = Math.sin(dLon) * Math.cos(lat2);
      const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
      return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
    }

    function setVehicleGps(vehicle, bearing) {
      if (!vehicle) return;
      if (!vehicleMarker) {
        const element = document.createElement("div");
        element.className = "vehicle-marker";
        element.innerHTML = '<div class="vehicle-arrow"></div>';
        vehicleMarker = new mapboxgl.Marker({ element, anchor: "center", rotationAlignment: "map" })
          .setLngLat(vehicle)
          .setRotation(bearing || 0)
          .addTo(map);
      } else {
        vehicleMarker.setLngLat(vehicle);
        vehicleMarker.setRotation(bearing || 0);
      }
    }

    function setVehicle(route, progress) {
      const vehicle = pointAlongRoute(route, progress);
      if (!vehicle) return;
      const bearing = bearingAtProgress(route, progress);
      if (!vehicleMarker) {
        const element = document.createElement("div");
        element.className = "vehicle-marker";
        element.innerHTML = '<div class="vehicle-arrow"></div>';
        vehicleMarker = new mapboxgl.Marker({ element, anchor: "center", rotationAlignment: "map" })
          .setLngLat(vehicle)
          .setRotation(bearing)
          .addTo(map);
      } else {
        vehicleMarker.setLngLat(vehicle);
        vehicleMarker.setRotation(bearing);
      }
    }

    function setCompletedRoute(completed) {
      const source = map.getSource("route-completed");
      if (!source) return;
      source.setData({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: completed.length >= 2 ? completed : [],
        },
        properties: {},
      });
    }

    window.__trackingMapUpdate = function updateTracking(data) {
      if (!map || !payload.route.length) return;
      setCompletedRoute(data.completed || sliceRoute(payload.route, data.progress));
      setVehicle(payload.route, data.progress);
    };

    function fitTrackingView(vehicle) {
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend(payload.origin);
      bounds.extend(payload.destination);
      payload.route.forEach(function (coord) { bounds.extend(coord); });
      if (vehicle) bounds.extend(vehicle);
      map.fitBounds(bounds, {
        padding: { top: 72, bottom: 120, left: 40, right: 40 },
        maxZoom: vehicle ? 14 : 13,
        duration: vehicle ? 700 : 0,
      });
    }

    window.__trackingMapGpsUpdate = function updateTrackingGps(data) {
      if (!map) return;
      setCompletedRoute([]);
      setVehicleGps(data.vehicle, data.bearing || 0);
      fitTrackingView(data.vehicle);
    };

    map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/streets-v12",
      center: payload.origin,
      zoom: 10,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
      cooperativeGestures: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: true, showZoom: true }), "top-right");

    map.on("load", function () {
      map.addSource("route-remaining", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: payload.route,
          },
          properties: {},
        },
      });

      map.addSource("route-completed", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [],
          },
          properties: {},
        },
      });

      map.addLayer({
        id: "route-remaining-line",
        type: "line",
        source: "route-remaining",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#cbd5e1",
          "line-width": 6,
          "line-opacity": 0.95,
        },
      });

      map.addLayer({
        id: "route-completed-line",
        type: "line",
        source: "route-completed",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#f97316",
          "line-width": 7,
          "line-opacity": 1,
        },
      });

      const originElement = document.createElement("div");
      originElement.className = "pin-marker pin-origin";
      originElement.textContent = "A";
      new mapboxgl.Marker({ element: originElement, anchor: "center" })
        .setLngLat(payload.origin)
        .addTo(map);

      const destinationElement = document.createElement("div");
      destinationElement.className = "pin-marker pin-destination";
      destinationElement.textContent = "B";
      new mapboxgl.Marker({ element: destinationElement, anchor: "center" })
        .setLngLat(payload.destination)
        .addTo(map);

      if (payload.initialVehicle) {
        setVehicleGps(payload.initialVehicle, payload.initialBearing || 0);
        fitTrackingView(payload.initialVehicle);
      } else {
        fitTrackingView(null);
      }
    });
  </script>
</body>
</html>`;
}
