export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate?: string;
  time: string;
  endTime?: string;
  location: string;
  address: string;
  category: EventCategory;
  image: string;
  price: number;
  currency: string;
  capacity: number;
  registered: number;
  organizer: string;
  tags: string[];
  status: "upcoming" | "ongoing" | "past" | "cancelled";
  isFeatured: boolean;
  createdAt: string;
}

export interface Registration {
  id: string;
  eventId: string;
  name: string;
  email: string;
  phone: string;
  tickets: number;
  notes: string;
  registeredAt: string;
  status: "confirmed" | "pending" | "cancelled";
}

export type EventCategory =
  | "show-jumping"
  | "dressage"
  | "cross-country"
  | "polo"
  | "rodeo"
  | "trail-ride"
  | "clinic"
  | "auction"
  | "social"
  | "other";

export const categoryIcons: Record<EventCategory, string> = {
  "show-jumping": "🏇",
  dressage: "🎩",
  "cross-country": "🌿",
  polo: "🏑",
  rodeo: "🤠",
  "trail-ride": "🌄",
  clinic: "📋",
  auction: "🔨",
  social: "🥂",
  other: "📌",
};
