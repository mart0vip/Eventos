import { Event, Registration } from "@/types/event";
import { v4 as uuidv4 } from "uuid";

const EVENTS_KEY = "equestrian_events";
const REGISTRATIONS_KEY = "equestrian_registrations";

const sampleEvents: Event[] = [
  {
    id: "evt-1",
    title: "Campeonato Gran Premio de Salto de Obstáculos",
    description:
      "Únete a nosotros en el evento de salto de obstáculos más prestigioso de la temporada. Observa a jinetes de élite y sus magníficos caballos enfrentar recorridos desafiantes diseñados por diseñadores de pista de clase mundial. Este evento de dos días incluye múltiples categorías para distintos niveles, puestos de proveedores, food trucks y un área VIP con vistas privilegiadas. Ya seas un jinete experimentado o nuevo en el deporte, este campeonato promete una experiencia inolvidable.",
    date: "2026-07-15",
    endDate: "2026-07-16",
    time: "08:00",
    endTime: "18:00",
    location: "Centro Ecuestre Real",
    address: "Camino del Potro 1234, Wellington, FL 33414",
    category: "show-jumping",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=500&fit=crop",
    price: 75,
    currency: "USD",
    capacity: 500,
    registered: 342,
    organizer: "Asociación Ecuestre de Wellington",
    tags: ["campeonato", "salto de obstáculos", "gran premio", "competitivo"],
    status: "upcoming",
    isFeatured: true,
    createdAt: "2026-05-01T10:00:00Z",
  },
  {
    id: "evt-2",
    title: "Masterclass de Doma Clásica",
    description:
      "Una masterclass exclusiva con la reconocida entrenadora internacional de doma clásica María von Hohenberg. Aprende el arte de la doma clásica a través de demostraciones, charlas y sesiones prácticas de equitación. Apta para jinetes de nivel intermedio a avanzado. Incluye comida y material del curso. Plazas limitadas para garantizar atención personalizada a cada participante.",
    date: "2026-07-22",
    time: "09:00",
    endTime: "16:00",
    location: "Caballerizas Armonía",
    address: "Camino de la Brida 567, Aiken, SC 29801",
    category: "dressage",
    image: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=800&h=500&fit=crop",
    price: 250,
    currency: "USD",
    capacity: 30,
    registered: 24,
    organizer: "Academia de Equitación Clásica",
    tags: ["doma clásica", "masterclass", "entrenamiento", "clásico"],
    status: "upcoming",
    isFeatured: true,
    createdAt: "2026-05-10T14:00:00Z",
  },
  {
    id: "evt-3",
    title: "Cabalgata al Atardecer y Asado",
    description:
      "Vive la belleza del campo a caballo durante la hora dorada. Esta cabalgata guiada te lleva por praderas pintorescas, a lo largo de un arroyo y hasta una colina con vistas panorámicas. Después del paseo, disfruta de un auténtico asado con música country en vivo bajo las estrellas. Caballos disponibles para todos los niveles de experiencia. ¡Una velada perfecta para familias y amigos!",
    date: "2026-08-05",
    time: "17:00",
    endTime: "22:00",
    location: "Rancho Praderas Doradas",
    address: "Camino del Rancho 890, Fredericksburg, TX 78624",
    category: "trail-ride",
    image: "https://images.unsplash.com/photo-1516466723877-e4ec1d736c8a?w=800&h=500&fit=crop",
    price: 95,
    currency: "USD",
    capacity: 40,
    registered: 35,
    organizer: "Jinetes de Senderos del Valle",
    tags: ["cabalgata", "atardecer", "asado", "familiar"],
    status: "upcoming",
    isFeatured: true,
    createdAt: "2026-05-15T09:00:00Z",
  },
  {
    id: "evt-4",
    title: "Torneo Anual de la Copa de Polo",
    description:
      "¡Vuelve el evento de polo más esperado del año! Ocho equipos compiten por la codiciada Copa de Plata en este torneo de tres días. Disfruta de brunches con champán, concursos de sombreros y polo de clase mundial. Los paquetes VIP incluyen asientos junto al campo, acceso exclusivo al salón de jugadores y un regalo conmemorativo.",
    date: "2026-08-20",
    endDate: "2026-08-22",
    time: "10:00",
    endTime: "19:00",
    location: "Club de Polo Palm Beach",
    address: "Camino del Club de Polo 11199, Wellington, FL 33414",
    category: "polo",
    image: "https://images.unsplash.com/photo-1591035897819-f4bdf739f446?w=800&h=500&fit=crop",
    price: 150,
    currency: "USD",
    capacity: 1000,
    registered: 678,
    organizer: "Asociación de Polo Palm Beach",
    tags: ["polo", "torneo", "vip", "campeonato"],
    status: "upcoming",
    isFeatured: false,
    createdAt: "2026-06-01T12:00:00Z",
  },
  {
    id: "evt-5",
    title: "Desafío de Cross Country para Jóvenes Jinetes",
    description:
      "Una emocionante competencia de cross country para jinetes de 14 a 21 años. Recorre un trazado bellamente diseñado que pone a prueba la conexión entre caballo y jinete a través de terreno natural, cruces de agua y obstáculos fijos. Premios para múltiples categorías. La inscripción incluye box y acceso a pista de calentamiento.",
    date: "2026-09-10",
    time: "07:30",
    endTime: "17:00",
    location: "Parque Ecuestre Oakwood",
    address: "Sendero de la Madera 2345, Lexington, KY 40511",
    category: "cross-country",
    image: "https://images.unsplash.com/photo-1509343256900-d5fde4d0085a?w=800&h=500&fit=crop",
    price: 120,
    currency: "USD",
    capacity: 80,
    registered: 52,
    organizer: "Club de Jóvenes Jinetes de Kentucky",
    tags: ["cross country", "juvenil", "competencia", "concurso completo"],
    status: "upcoming",
    isFeatured: false,
    createdAt: "2026-06-05T08:00:00Z",
  },
  {
    id: "evt-6",
    title: "Noche de Rodeo del Oeste",
    description:
      "¡Prepárate para una noche electrizante de acción de rodeo! Con carreras de barriles, monta de toros, lazo y monta de potros. Comentarios en vivo, puestos de comida, toro mecánico para los niños y baile country después del show. ¡Ponte las botas y ven a disfrutar de la auténtica cultura del oeste en su máximo esplendor!",
    date: "2026-08-30",
    time: "18:00",
    endTime: "23:00",
    location: "Arena Senderos Polvorientos",
    address: "Avenida del Rodeo 456, Cheyenne, WY 82001",
    category: "rodeo",
    image: "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800&h=500&fit=crop",
    price: 45,
    currency: "USD",
    capacity: 2000,
    registered: 1234,
    organizer: "Fundación del Patrimonio del Oeste de Cheyenne",
    tags: ["rodeo", "oeste", "familiar", "entretenimiento"],
    status: "upcoming",
    isFeatured: false,
    createdAt: "2026-06-10T16:00:00Z",
  },
  {
    id: "evt-7",
    title: "Clínica de Primeros Auxilios y Cuidado del Caballo",
    description:
      "Conocimientos esenciales para todo propietario de caballos. Esta clínica de día completo cubre primeros auxilios equinos, cuidado de heridas, prevención de cólicos, nutrición básica y cuándo llamar al veterinario. Impartida por la Dra. Sara Mitchell, veterinaria con 20 años de práctica equina. Demostraciones prácticas con caballos en vivo. Incluye certificado de finalización.",
    date: "2026-07-28",
    time: "09:00",
    endTime: "17:00",
    location: "Hospital Equino Valle Verde",
    address: "Camino de la Pradera 789, Ocala, FL 34482",
    category: "clinic",
    image: "https://images.unsplash.com/photo-1560114928-40f1f1eb26a0?w=800&h=500&fit=crop",
    price: 175,
    currency: "USD",
    capacity: 50,
    registered: 38,
    organizer: "Centro de Educación Equina de Ocala",
    tags: ["clínica", "educación", "cuidado del caballo", "veterinaria"],
    status: "upcoming",
    isFeatured: false,
    createdAt: "2026-06-12T11:00:00Z",
  },
  {
    id: "evt-8",
    title: "Subasta Premium de Pura Sangre",
    description:
      "Subasta exclusiva con 40 potros pura sangre cuidadosamente seleccionados de las mejores líneas genealógicas. Sesiones de previsualización disponibles el día anterior. Manejadores profesionales presentarán cada lote. Pujas disponibles en sitio y en línea. Registros veterinarios y radiografías disponibles para todos los lotes. Recepción con aperitivos para postores registrados.",
    date: "2026-09-05",
    time: "11:00",
    endTime: "18:00",
    location: "Pabellón de Ventas Keeneland",
    address: "Camino de Versalles 4201, Lexington, KY 40510",
    category: "auction",
    image: "https://images.unsplash.com/photo-1534773728080-2110743c3047?w=800&h=500&fit=crop",
    price: 0,
    currency: "USD",
    capacity: 300,
    registered: 187,
    organizer: "Blue Grass Bloodstock",
    tags: ["subasta", "pura sangre", "potros", "genealogía"],
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
