import { Resend } from "resend";

function getResend(): Resend {
  return new Resend(process.env.RESEND_API_KEY);
}

interface ConfirmationEmailParams {
  to: string;
  participantName: string;
  horseName: string;
  competitionTitle: string;
  competitionDate: string;
  eventName: string;
  drawOrder: number | null;
  boxRequested: boolean;
  amountPaidArs: number;
  mpPaymentId: string;
}

/**
 * Sends the automatic confirmation receipt after a Mercado Pago payment is
 * approved. Called only from the webhook handler, never from the frontend.
 */
export async function sendConfirmationEmail(params: ConfirmationEmailParams): Promise<void> {
  const resend = getResend();
  await resend.emails.send({
    from: process.env.NOTIFICATION_FROM_EMAIL!,
    to: params.to,
    subject: `Inscripción confirmada — ${params.competitionTitle}`,
    html: buildConfirmationHtml(params),
  });
}

/**
 * Renders the confirmation email as a single self-contained HTML string
 * (inline styles only, no external CSS/assets) so it renders consistently
 * across email clients.
 */
function buildConfirmationHtml(params: ConfirmationEmailParams): string {
  const amountFormatted = (params.amountPaidArs / 100).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
  });

  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:6px 0;color:#5D4037;font-size:14px;">${label}</td>
      <td style="padding:6px 0;color:#3E2723;font-size:14px;font-weight:600;text-align:right;">${value}</td>
    </tr>`;

  return `
<!DOCTYPE html>
<html lang="es">
  <body style="margin:0;padding:0;background-color:#FFF8F0;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;padding:24px;">
      <tr>
        <td style="background-color:#3E2723;border-radius:12px 12px 0 0;padding:20px 24px;">
          <span style="font-size:28px;">🐴</span>
          <span style="color:#ffffff;font-size:18px;font-weight:bold;margin-left:8px;">Club de Equitación</span>
        </td>
      </tr>
      <tr>
        <td style="background-color:#ffffff;border-radius:0 0 12px 12px;padding:24px;">
          <h1 style="color:#8B4513;font-size:20px;margin:0 0 8px;">✅ Inscripción confirmada</h1>
          <p style="color:#5D4037;font-size:14px;margin:0 0 16px;">
            ${params.competitionTitle} — ${params.eventName}
          </p>
          <table role="presentation" width="100%" style="border-top:1px solid #D7CCC8;padding-top:8px;">
            ${row("Fecha del concurso", params.competitionDate)}
            ${row("Jinete", params.participantName)}
            ${row("Caballo", params.horseName)}
            ${
              params.drawOrder !== null
                ? row("Orden de sorteo", String(params.drawOrder))
                : ""
            }
            ${row("Box reservado", params.boxRequested ? "Sí" : "No")}
            ${row("Monto pagado", amountFormatted)}
            ${row("N.º de operación MP", params.mpPaymentId)}
          </table>
          <p style="color:#8D6E63;font-size:12px;margin-top:20px;">
            Club de Equitación — este comprobante fue generado automáticamente.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
