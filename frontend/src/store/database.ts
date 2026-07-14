import AsyncStorage from "@react-native-async-storage/async-storage";
import { Trip, Vehicle, Driver, Profile } from "./types";

const KEYS = {
  trips: "@logidiary/trips",
  vehicles: "@logidiary/vehicles",
  drivers: "@logidiary/drivers",
  profile: "@logidiary/profile",
};

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

async function readList<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

async function writeList<T>(key: string, list: T[]) {
  await AsyncStorage.setItem(key, JSON.stringify(list));
}

// Trips
export const TripsDB = {
  list: () => readList<Trip>(KEYS.trips),
  async add(t: Omit<Trip, "id" | "createdAt">): Promise<Trip> {
    const list = await readList<Trip>(KEYS.trips);
    const trip: Trip = { ...t, id: uid(), createdAt: new Date().toISOString() };
    list.push(trip);
    await writeList(KEYS.trips, list);
    return trip;
  },
  async update(id: string, patch: Partial<Trip>): Promise<Trip | null> {
    const list = await readList<Trip>(KEYS.trips);
    const idx = list.findIndex((x) => x.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...patch };
    await writeList(KEYS.trips, list);
    return list[idx];
  },
  async remove(id: string) {
    const list = await readList<Trip>(KEYS.trips);
    await writeList(KEYS.trips, list.filter((x) => x.id !== id));
  },
};

// Vehicles
export const VehiclesDB = {
  list: () => readList<Vehicle>(KEYS.vehicles),
  async add(v: Omit<Vehicle, "id" | "createdAt">): Promise<Vehicle> {
    const list = await readList<Vehicle>(KEYS.vehicles);
    const vh: Vehicle = { ...v, id: uid(), createdAt: new Date().toISOString() };
    list.push(vh);
    await writeList(KEYS.vehicles, list);
    return vh;
  },
  async update(id: string, patch: Partial<Vehicle>): Promise<Vehicle | null> {
    const list = await readList<Vehicle>(KEYS.vehicles);
    const idx = list.findIndex((x) => x.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...patch };
    await writeList(KEYS.vehicles, list);
    return list[idx];
  },
  async remove(id: string) {
    const list = await readList<Vehicle>(KEYS.vehicles);
    await writeList(KEYS.vehicles, list.filter((x) => x.id !== id));
  },
};

// Drivers
export const DriversDB = {
  list: () => readList<Driver>(KEYS.drivers),
  async add(d: Omit<Driver, "id" | "createdAt">): Promise<Driver> {
    const list = await readList<Driver>(KEYS.drivers);
    const dr: Driver = { ...d, id: uid(), createdAt: new Date().toISOString() };
    list.push(dr);
    await writeList(KEYS.drivers, list);
    return dr;
  },
  async update(id: string, patch: Partial<Driver>): Promise<Driver | null> {
    const list = await readList<Driver>(KEYS.drivers);
    const idx = list.findIndex((x) => x.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...patch };
    await writeList(KEYS.drivers, list);
    return list[idx];
  },
  async remove(id: string) {
    const list = await readList<Driver>(KEYS.drivers);
    await writeList(KEYS.drivers, list.filter((x) => x.id !== id));
  },
};

// Profile
export const ProfileDB = {
  async get(): Promise<Profile> {
    const raw = await AsyncStorage.getItem(KEYS.profile);
    if (!raw) return { name: "", mobile: "", email: "", company: "" };
    try {
      return JSON.parse(raw) as Profile;
    } catch {
      return { name: "", mobile: "", email: "", company: "" };
    }
  },
  async save(p: Profile) {
    await AsyncStorage.setItem(KEYS.profile, JSON.stringify(p));
  },
};
