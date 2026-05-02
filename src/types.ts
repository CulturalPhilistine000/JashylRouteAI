/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Container {
  id: string;
  lat: number;
  lng: number;
  fillLevel: number; // 0-100
  address: string;
  lastUpdated: number;
}

export interface RouteStats {
  totalDistance: number;
  optimizedCount: number;
  estimatedTime: number; // minutes
}
