import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { Platform } from 'react-native';

// --- Constants ---

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  process.env.API_BASE_URL ||
  'https://africa-railways.vercel.app';

/** Readings above this magnitude trigger a TrackAlert */
const G_FORCE_ALERT_THRESHOLD = 2.5;

/** Minimum interval between GPS pings (ms) */
const GPS_INTERVAL_MS = 5_000;

/** Minimum distance change to trigger a new reading (metres) */
const GPS_DISTANCE_FILTER_M = 10;

/** Accelerometer sample rate (ms) */
const ACCEL_INTERVAL_MS = 200;

/** Max queued readings before a forced flush */
const QUEUE_FLUSH_SIZE = 50;

/** Key for persisting the offline queue */
const QUEUE_STORAGE_KEY = '@telemetry_queue';

// --- Types ---

export interface TelemetryReading {
  device_id: string;
  latitude: number;
  longitude: number;
  altitude: number | null;
  speed_kmh: number | null;
  heading: number | null;
  accuracy_m: number | null;
  g_force_x: number | null;
  g_force_y: number | null;
  g_force_z: number | null;
  g_force_magnitude: number | null;
  is_alert: boolean;
  alert_type: string | null;
  route_id: string | null;
  recorded_at: string;
}

export interface TrackAlert {
  device_id: string;
  latitude: number;
  longitude: number;
  g_force_magnitude: number;
  g_force_x: number;
  g_force_y: number;
  g_force_z: number;
  route_id: string | null;
  recorded_at: string;
}

// --- State ---

let _locationSubscription: Location.LocationSubscription | null = null;
let _accelSubscription: ReturnType<typeof Accelerometer.addListener> | null = null;
let _isRunning = false;
let _deviceId: string | null = null;
let _routeId: string | null = null;
let _latestAccel = { x: 0, y: 0, z: 0, magnitude: 0 };
let _queue: TelemetryReading[] = [];
let _flushTimer: ReturnType<typeof setInterval> | null = null;

// --- Helpers ---

function magnitude(x: number, y: number, z: number): number {
  return Math.sqrt(x * x + y * y + z * z);
}

async function getDeviceId(): Promise<string> {
  if (_deviceId) return _deviceId;
  let id = await AsyncStorage.getItem('@telemetry_device_id');
  if (!id) {
    id = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await AsyncStorage.setItem('@telemetry_device_id', id);
  }
  _deviceId = id;
  return id;
}

// --- Queue management ---

async function persistQueue(): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(_queue));
  } catch {
    // Non-critical — queue lives in memory as fallback
  }
}

async function loadPersistedQueue(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as TelemetryReading[];
      _queue = [...parsed, ..._queue];
    }
  } catch {
    // Ignore corrupt data
  }
}

async function flushQueue(): Promise<void> {
  if (_queue.length === 0) return;

  const batch = _queue.splice(0, QUEUE_FLUSH_SIZE);

  try {
    // Send to Go backend sensor endpoint (in-memory store + trip detection)
    const sensorPayloads = batch.map((r) => ({
      train_id: r.device_id,
      lat: r.latitude,
      lon: r.longitude,
      altitude_m: r.altitude ?? undefined,
      speed_kmh: r.speed_kmh ?? undefined,
      heading: r.heading ?? undefined,
      accuracy_m: r.accuracy_m ?? undefined,
      route_id: r.route_id ?? undefined,
      timestamp: r.recorded_at,
    }));

    // Fire individual POSTs — the Go endpoint expects one reading per request
    await Promise.allSettled(
      sensorPayloads.map((p) =>
        fetch(`${API_BASE_URL}/api/sensor/log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(p),
        })
      )
    );

    // Also persist to Supabase for long-term storage
    const { error } = await supabase.from('telemetry_readings').insert(batch);
    if (error) {
      console.warn('Supabase telemetry insert failed, re-queuing:', error.message);
      _queue.unshift(...batch);
    }

    await persistQueue();
  } catch (err) {
    // Network failure — put readings back for retry
    _queue.unshift(...batch);
    await persistQueue();
  }
}

// --- G-force alert ---

async function createTrackAlert(alert: TrackAlert): Promise<void> {
  try {
    await supabase.from('track_alerts').insert({
      device_id: alert.device_id,
      latitude: alert.latitude,
      longitude: alert.longitude,
      g_force_magnitude: alert.g_force_magnitude,
      g_force_x: alert.g_force_x,
      g_force_y: alert.g_force_y,
      g_force_z: alert.g_force_z,
      route_id: alert.route_id,
      recorded_at: alert.recorded_at,
      severity: alert.g_force_magnitude > 4.0 ? 'critical' : 'warning',
    });
  } catch (err) {
    console.error('Failed to create TrackAlert:', err);
  }
}

// --- Accelerometer ---

function startAccelerometer(): void {
  Accelerometer.setUpdateInterval(ACCEL_INTERVAL_MS);
  _accelSubscription = Accelerometer.addListener(({ x, y, z }) => {
    const mag = magnitude(x, y, z);
    _latestAccel = { x, y, z, magnitude: mag };
  });
}

function stopAccelerometer(): void {
  _accelSubscription?.remove();
  _accelSubscription = null;
}

// --- Public API ---

/**
 * Request location permissions. Call before start().
 * Returns true if granted.
 */
export async function requestPermissions(): Promise<boolean> {
  const { status: fg } = await Location.requestForegroundPermissionsAsync();
  if (fg !== 'granted') return false;

  if (Platform.OS !== 'web') {
    const { status: bg } = await Location.requestBackgroundPermissionsAsync();
    // Background is optional — foreground is sufficient for basic telemetry
    if (bg !== 'granted') {
      console.warn('Background location not granted; telemetry pauses when app is backgrounded');
    }
  }

  return true;
}

/**
 * Start collecting GPS + accelerometer telemetry.
 * Readings are batched and flushed to the backend periodically.
 */
export async function start(routeId?: string): Promise<void> {
  if (_isRunning) return;
  _isRunning = true;
  _routeId = routeId ?? null;

  const deviceId = await getDeviceId();
  await loadPersistedQueue();

  // Start accelerometer
  startAccelerometer();

  // Start GPS tracking
  _locationSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: GPS_INTERVAL_MS,
      distanceInterval: GPS_DISTANCE_FILTER_M,
    },
    async (location) => {
      const { latitude, longitude, altitude, speed, heading, accuracy } =
        location.coords;

      const speedKmh = speed != null && speed >= 0 ? speed * 3.6 : null;
      const isAlert = _latestAccel.magnitude > G_FORCE_ALERT_THRESHOLD;
      const now = new Date().toISOString();

      const reading: TelemetryReading = {
        device_id: deviceId,
        latitude,
        longitude,
        altitude: altitude ?? null,
        speed_kmh: speedKmh,
        heading: heading ?? null,
        accuracy_m: accuracy ?? null,
        g_force_x: _latestAccel.x,
        g_force_y: _latestAccel.y,
        g_force_z: _latestAccel.z,
        g_force_magnitude: _latestAccel.magnitude,
        is_alert: isAlert,
        alert_type: isAlert ? 'high_g_force' : null,
        route_id: _routeId,
        recorded_at: now,
      };

      _queue.push(reading);

      // Fire a TrackAlert immediately when threshold exceeded
      if (isAlert) {
        await createTrackAlert({
          device_id: deviceId,
          latitude,
          longitude,
          g_force_magnitude: _latestAccel.magnitude,
          g_force_x: _latestAccel.x,
          g_force_y: _latestAccel.y,
          g_force_z: _latestAccel.z,
          route_id: _routeId,
          recorded_at: now,
        });
      }

      // Flush when queue is full
      if (_queue.length >= QUEUE_FLUSH_SIZE) {
        await flushQueue();
      }
    }
  );

  // Periodic flush every 30 seconds
  _flushTimer = setInterval(() => {
    flushQueue();
  }, 30_000);
}

/**
 * Stop telemetry collection and flush remaining readings.
 */
export async function stop(): Promise<void> {
  if (!_isRunning) return;
  _isRunning = false;
  _routeId = null;

  _locationSubscription?.remove();
  _locationSubscription = null;

  stopAccelerometer();

  if (_flushTimer) {
    clearInterval(_flushTimer);
    _flushTimer = null;
  }

  // Final flush
  await flushQueue();
}

/**
 * Update the route context (e.g. when user boards a different train).
 */
export function setRouteId(routeId: string | null): void {
  _routeId = routeId;
}

/**
 * Get the latest accelerometer snapshot.
 */
export function getLatestAccel() {
  return { ..._latestAccel };
}

/**
 * Returns true if telemetry is actively collecting.
 */
export function isRunning(): boolean {
  return _isRunning;
}

/**
 * Returns the number of readings waiting to be flushed.
 */
export function pendingCount(): number {
  return _queue.length;
}
