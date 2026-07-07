import { z } from "zod";

/** Validates the body of `POST /api/members` (alta de socio, admin). */
export const createMemberSchema = z.object({
  name: z.string().trim().min(1),
  email: z.email(),
  memberNumber: z.string().trim().min(1),
});

const debtInputSchema = z.object({
  concept: z.enum(["cuota", "pension", "ropero", "otro"]),
  amountArs: z.number().int().positive(),
  dueDate: z.iso.date(),
});

/**
 * Validates the body of `POST /api/members/[id]/debts` (carga de deudas,
 * admin). Accepts one or many records in a single request so the admin tab
 * can load a whole period at once.
 */
export const createDebtsSchema = z.object({
  debts: z.array(debtInputSchema).min(1),
});
