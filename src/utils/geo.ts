/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Container } from "../types";

// Bishkek boundaries (approximate)
const BISHKEK_BOUNDS = {
  minLat: 42.82,
  maxLat: 42.91,
  minLng: 74.53,
  maxLng: 74.67,
};

const BISHKEK_STREETS = [
  "Chuy Avenue",
  "Manas Avenue",
  "Abdraimanov St",
  "Toktogul St",
  "Kiev St",
  "Bokonbaev St",
  "Moskovsky St",
  "Akhunbaev St",
  "Baytik Baatyr St",
  "Aitmatov St",
];

export function generateSimulatedContainers(count: number): Container[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `container-${i + 1}`,
    lat: BISHKEK_BOUNDS.minLat + Math.random() * (BISHKEK_BOUNDS.maxLat - BISHKEK_BOUNDS.minLat),
    lng: BISHKEK_BOUNDS.minLng + Math.random() * (BISHKEK_BOUNDS.maxLng - BISHKEK_BOUNDS.minLng),
    fillLevel: Math.floor(Math.random() * 101),
    address: `${BISHKEK_STREETS[Math.floor(Math.random() * BISHKEK_STREETS.length)]} ${Math.floor(Math.random() * 200) + 1}`,
    lastUpdated: Date.now(),
  }));
}

/**
 * Calculates distance between two points in km (Haversine formula simplified for flat grid)
 */
export function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Nearest Neighbor Algorithm for Route Optimization
 */
export function optimizeRoute(containers: Container[], startPoint: { lat: number; lng: number }): Container[] {
  if (containers.length === 0) return [];

  const unvisited = [...containers];
  const route: Container[] = [];
  let currentPos = startPoint;

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
        const d = getDistance(currentPos.lat, currentPos.lng, unvisited[i].lat, unvisited[i].lng);
        if (d < minDistance) {
            minDistance = d;
            nearestIdx = i;
        }
    }

    const next = unvisited.splice(nearestIdx, 1)[0];
    route.push(next);
    currentPos = { lat: next.lat, lng: next.lng };
  }

  return route;
}
