import { z } from "zod";

/** Validates the body of `POST /api/registrations`. */
export const createRegistrationSchema = z.object({
  eventId: z.uuid(),
  participantName: z.string().trim().min(1),
  participantEmail: z.email(),
  horseName: z.string().trim().min(1),
  licenseNumber: z.string().trim().min(1).optional(),
  boxRequested: z.boolean(),
});

export type CreateRegistrationBody = z.infer<typeof createRegistrationSchema>;
