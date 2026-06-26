import fs from 'fs';
import path from 'path';
import {
  User, Company, Driver, Vehicle, Trip,
  TripEvent, GPSLocation, Incident, DriverToken,
  Notification, Photo, Signature
} from '../../../shared/types';

const DATA_DIR = path.join(__dirname, '../../data');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readFile<T>(filename: string): T[] {
  ensureDataDir();
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) {
    return [];
  }
  try {
    const content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content) as T[];
  } catch {
    return [];
  }
}

function writeFile<T>(filename: string, data: T[]): void {
  ensureDataDir();
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
}

// Generic CRUD factory
function createStore<T extends { id: string }>(filename: string) {
  return {
    findAll: (): T[] => readFile<T>(filename),
    findById: (id: string): T | undefined => readFile<T>(filename).find(item => item.id === id),
    findWhere: (predicate: (item: T) => boolean): T[] => readFile<T>(filename).filter(predicate),
    findOneWhere: (predicate: (item: T) => boolean): T | undefined => readFile<T>(filename).find(predicate),
    create: (item: T): T => {
      const items = readFile<T>(filename);
      items.push(item);
      writeFile(filename, items);
      return item;
    },
    update: (id: string, updates: Partial<T>): T | undefined => {
      const items = readFile<T>(filename);
      const index = items.findIndex(item => item.id === id);
      if (index === -1) return undefined;
      items[index] = { ...items[index], ...updates };
      writeFile(filename, items);
      return items[index];
    },
    delete: (id: string): boolean => {
      const items = readFile<T>(filename);
      const index = items.findIndex(item => item.id === id);
      if (index === -1) return false;
      items.splice(index, 1);
      writeFile(filename, items);
      return true;
    },
    save: (items: T[]): void => writeFile(filename, items),
  };
}

export const db = {
  users: createStore<User>('users.json'),
  companies: createStore<Company>('companies.json'),
  drivers: createStore<Driver>('drivers.json'),
  vehicles: createStore<Vehicle>('vehicles.json'),
  trips: createStore<Trip>('trips.json'),
  tripEvents: createStore<TripEvent>('trip_events.json'),
  locations: createStore<GPSLocation>('locations.json'),
  incidents: createStore<Incident>('incidents.json'),
  driverTokens: createStore<DriverToken>('driver_tokens.json'),
  notifications: createStore<Notification>('notifications.json'),
  photos: createStore<Photo>('photos.json'),
  signatures: createStore<Signature>('signatures.json'),
};
