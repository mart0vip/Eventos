import { Event, Registration } from "@/types/event";
import { v4 as uuidv4 } from "uuid";

const EVENTS_KEY = "equestrian_events";
const REGISTRATIONS_KEY = "equestrian_registrations";

const sampleEvents: Event[] = [
  {
    id: "evt-1",
    title: "Grand Prix Show Jumping Championship",
    description:
      "Join us for the most prestigious show jumping event of the season. Watch elite riders and their magnificent horses tackle challenging courses designed by world-class course designers. This two-day event features multiple classes for different skill levels, vendor booths, food trucks, and a VIP lounge with premium viewing areas. Whether you're a seasoned equestrian or a newcomer to the sport, this championship promises an unforgettable experience.",
    date: "2026-07-15",
    endDate: "2026-07-16",
    time: "08:00",
    endTime: "18:00",
    location: "Royal Equestrian Center",
    address: "1234 Stallion Way, Wellington, FL 33414",
    category: "show-jumping",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=500&fit=crop",
    price: 75,
    currency: "USD",
    capacity: 500,
    registered: 342,
    organizer: "Wellington Equestrian Association",
    tags: ["championship", "show jumping", "grand prix", "competitive"],
    status: "upcoming",
    isFeatured: true,
    createdAt: "2026-05-01T10:00:00Z",
  },
  {
    id: "evt-2",
    title: "Classical Dressage Masterclass",
    description:
      "An exclusive masterclass with internationally renowned dressage trainer Maria von Hohenberg. Learn the art of classical dressage through demonstrations, lectures, and hands-on riding sessions. Suitable for intermediate to advanced riders. Includes lunch and course materials. Limited spots available to ensure personalized attention for each participant.",
    date: "2026-07-22",
    time: "09:00",
    endTime: "16:00",
    location: "Harmony Stables",
    address: "567 Bridle Path, Aiken, SC 29801",
    category: "dressage",
    image: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=800&h=500&fit=crop",
    price: 250,
    currency: "USD",
    capacity: 30,
    registered: 24,
    organizer: "Classical Riding Academy",
    tags: ["dressage", "masterclass", "training", "classical"],
    status: "upcoming",
    isFeatured: true,
    createdAt: "2026-05-10T14:00:00Z",
  },
  {
    id: "evt-3",
    title: "Sunset Trail Ride & BBQ",
    description:
      "Experience the beauty of the countryside on horseback during golden hour. This guided trail ride takes you through scenic meadows, along a creek, and up to a hilltop with panoramic views. After the ride, enjoy a Texas-style BBQ with live country music under the stars. Horses provided for all experience levels. A perfect evening for families and friends!",
    date: "2026-08-05",
    time: "17:00",
    endTime: "22:00",
    location: "Golden Meadows Ranch",
    address: "890 Ranch Road, Fredericksburg, TX 78624",
    category: "trail-ride",
    image: "https://images.unsplash.com/photo-1516466723877-e4ec1d736c8a?w=800&h=500&fit=crop",
    price: 95,
    currency: "USD",
    capacity: 40,
    registered: 35,
    organizer: "Hill Country Trail Riders",
    tags: ["trail ride", "sunset", "bbq", "family friendly"],
    status: "upcoming",
    isFeatured: true,
    createdAt: "2026-05-15T09:00:00Z",
  },
  {
    id: "evt-4",
    title: "Annual Polo Cup Tournament",
    description:
      "The most anticipated polo event of the year returns! Eight teams compete for the coveted Silver Stirrup Cup in this three-day tournament. Enjoy champagne brunches, hat contests, and world-class polo action. VIP packages include field-side seating, exclusive access to the players' lounge, and a commemorative gift bag.",
    date: "2026-08-20",
    endDate: "2026-08-22",
    time: "10:00",
    endTime: "19:00",
    location: "Palm Beach Polo Club",
    address: "11199 Polo Club Rd, Wellington, FL 33414",
    category: "polo",
    image: "https://images.unsplash.com/photo-1591035897819-f4bdf739f446?w=800&h=500&fit=crop",
    price: 150,
    currency: "USD",
    capacity: 1000,
    registered: 678,
    organizer: "Palm Beach Polo Association",
    tags: ["polo", "tournament", "vip", "championship"],
    status: "upcoming",
    isFeatured: false,
    createdAt: "2026-06-01T12:00:00Z",
  },
  {
    id: "evt-5",
    title: "Young Riders Cross-Country Challenge",
    description:
      "A thrilling cross-country eventing competition for riders aged 14-21. Navigate a beautifully designed course that tests the partnership between horse and rider through natural terrain, water crossings, and solid fences. Awards for multiple divisions. Registration includes stabling and warm-up arena access.",
    date: "2026-09-10",
    time: "07:30",
    endTime: "17:00",
    location: "Oakwood Eventing Park",
    address: "2345 Timber Lane, Lexington, KY 40511",
    category: "cross-country",
    image: "https://images.unsplash.com/photo-1509343256900-d5fde4d0085a?w=800&h=500&fit=crop",
    price: 120,
    currency: "USD",
    capacity: 80,
    registered: 52,
    organizer: "Kentucky Young Riders Club",
    tags: ["cross country", "youth", "competition", "eventing"],
    status: "upcoming",
    isFeatured: false,
    createdAt: "2026-06-05T08:00:00Z",
  },
  {
    id: "evt-6",
    title: "Western Rodeo Night",
    description:
      "Saddle up for an electrifying night of rodeo action! Featuring barrel racing, bull riding, roping, and bronc busting. Live commentary, food vendors, mechanical bull rides for the kids, and a country dance after the show. Get your boots on and come enjoy authentic Western culture at its finest!",
    date: "2026-08-30",
    time: "18:00",
    endTime: "23:00",
    location: "Dusty Trails Arena",
    address: "456 Rodeo Drive, Cheyenne, WY 82001",
    category: "rodeo",
    image: "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800&h=500&fit=crop",
    price: 45,
    currency: "USD",
    capacity: 2000,
    registered: 1234,
    organizer: "Cheyenne Western Heritage Foundation",
    tags: ["rodeo", "western", "family", "entertainment"],
    status: "upcoming",
    isFeatured: false,
    createdAt: "2026-06-10T16:00:00Z",
  },
  {
    id: "evt-7",
    title: "Equine First Aid & Horse Care Clinic",
    description:
      "Essential knowledge for every horse owner! This full-day clinic covers equine first aid, wound care, colic prevention, nutrition basics, and when to call the vet. Led by Dr. Sarah Mitchell, DVM, with 20 years of equine practice. Hands-on demonstrations with live horses. Certificate of completion included.",
    date: "2026-07-28",
    time: "09:00",
    endTime: "17:00",
    location: "Valley View Equine Hospital",
    address: "789 Pasture Road, Ocala, FL 34482",
    category: "clinic",
    image: "https://images.unsplash.com/photo-1560114928-40f1f1eb26a0?w=800&h=500&fit=crop",
    price: 175,
    currency: "USD",
    capacity: 50,
    registered: 38,
    organizer: "Ocala Equine Education Center",
    tags: ["clinic", "education", "horse care", "veterinary"],
    status: "upcoming",
    isFeatured: false,
    createdAt: "2026-06-12T11:00:00Z",
  },
  {
    id: "evt-8",
    title: "Premium Thoroughbred Auction",
    description:
      "Exclusive auction featuring 40 hand-selected thoroughbred yearlings from top bloodlines. Preview sessions available the day before. Professional handlers will present each lot. Bidding available on-site and online. Veterinary records and X-rays available for all lots. Reception with hors d'oeuvres for registered bidders.",
    date: "2026-09-05",
    time: "11:00",
    endTime: "18:00",
    location: "Keeneland Sales Pavilion",
    address: "4201 Versailles Road, Lexington, KY 40510",
    category: "auction",
    image: "https://images.unsplash.com/photo-1534773728080-2110743c3047?w=800&h=500&fit=crop",
    price: 0,
    currency: "USD",
    capacity: 300,
    registered: 187,
    organizer: "Blue Grass Bloodstock",
    tags: ["auction", "thoroughbred", "yearlings", "bloodstock"],
    status: "upcoming",
    isFeatured: false,
    createdAt: "2026-06-15T10:00:00Z",
  },
];

function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const stored = localStorage.getItem(key);
  if (!stored) return fallback;
  return JSON.parse(stored) as T;
}

function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

export function initializeEvents(): void {
  if (typeof window === "undefined") return;
  const existing = localStorage.getItem(EVENTS_KEY);
  if (!existing) {
    saveToStorage(EVENTS_KEY, sampleEvents);
  }
}

export function getEvents(): Event[] {
  return getFromStorage<Event[]>(EVENTS_KEY, sampleEvents);
}

export function getEvent(id: string): Event | undefined {
  return getEvents().find((e) => e.id === id);
}

export function getFeaturedEvents(): Event[] {
  return getEvents().filter((e) => e.isFeatured && e.status === "upcoming");
}

export function getEventsByCategory(category: string): Event[] {
  return getEvents().filter((e) => e.category === category);
}

export function searchEvents(query: string): Event[] {
  const q = query.toLowerCase();
  return getEvents().filter(
    (e) =>
      e.title.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q) ||
      e.tags.some((t) => t.toLowerCase().includes(q))
  );
}

export function createEvent(
  event: Omit<Event, "id" | "registered" | "createdAt" | "status">
): Event {
  const newEvent: Event = {
    ...event,
    id: uuidv4(),
    registered: 0,
    status: "upcoming",
    createdAt: new Date().toISOString(),
  };
  const events = getEvents();
  events.push(newEvent);
  saveToStorage(EVENTS_KEY, events);
  return newEvent;
}

export function updateEvent(id: string, updates: Partial<Event>): Event | null {
  const events = getEvents();
  const index = events.findIndex((e) => e.id === id);
  if (index === -1) return null;
  events[index] = { ...events[index], ...updates };
  saveToStorage(EVENTS_KEY, events);
  return events[index];
}

export function deleteEvent(id: string): boolean {
  const events = getEvents();
  const filtered = events.filter((e) => e.id !== id);
  if (filtered.length === events.length) return false;
  saveToStorage(EVENTS_KEY, filtered);
  return true;
}

export function getRegistrations(eventId?: string): Registration[] {
  const all = getFromStorage<Registration[]>(REGISTRATIONS_KEY, []);
  if (eventId) return all.filter((r) => r.eventId === eventId);
  return all;
}

export function registerForEvent(
  reg: Omit<Registration, "id" | "registeredAt" | "status">
): Registration {
  const newReg: Registration = {
    ...reg,
    id: uuidv4(),
    status: "confirmed",
    registeredAt: new Date().toISOString(),
  };
  const registrations = getRegistrations();
  registrations.push(newReg);
  saveToStorage(REGISTRATIONS_KEY, registrations);

  const events = getEvents();
  const eventIndex = events.findIndex((e) => e.id === reg.eventId);
  if (eventIndex !== -1) {
    events[eventIndex].registered += reg.tickets;
    saveToStorage(EVENTS_KEY, events);
  }

  return newReg;
}

export function cancelRegistration(id: string): boolean {
  const registrations = getRegistrations();
  const reg = registrations.find((r) => r.id === id);
  if (!reg) return false;

  reg.status = "cancelled";
  saveToStorage(REGISTRATIONS_KEY, registrations);

  const events = getEvents();
  const eventIndex = events.findIndex((e) => e.id === reg.eventId);
  if (eventIndex !== -1) {
    events[eventIndex].registered = Math.max(
      0,
      events[eventIndex].registered - reg.tickets
    );
    saveToStorage(EVENTS_KEY, events);
  }

  return true;
}
