import { z } from "zod";

const pruebaInputSchema = z.object({
  name: z.string().trim().min(1),
  category: z.string().trim().min(1),
  priceArs: z.number().int().nonnegative(),
  totalSlots: z.number().int().positive(),
});

const dayInputSchema = z.object({
  dayDate: z.iso.date(),
  dayLabel: z.string().trim().min(1),
  sortOrder: z.number().int().nonnegative(),
  events: z.array(pruebaInputSchema),
});

/** Validates the body of `POST /api/admin/competitions` (nested anteprograma create). */
export const createCompetitionSchema = z.object({
  title: z.string().trim().min(1),
  dateFrom: z.iso.date(),
  dateTo: z.iso.date(),
  location: z.string().trim().min(1),
  description: z.string().trim().optional(),
  boxPriceArs: z.number().int().nonnegative(),
  days: z.array(dayInputSchema),
});

/** Validates the body of `POST /api/admin/competitions/[id]/days`. */
export const addDaySchema = dayInputSchema.omit({ events: true });

/** Validates the body of `POST /api/admin/days/[dayId]/events`. */
export const addEventSchema = pruebaInputSchema;

/** Validates the body of `PATCH /api/admin/competitions/[id]`. */
export const updateCompetitionStatusSchema = z.object({
  status: z.enum(["draft", "open", "closed", "cancelled"]),
});
