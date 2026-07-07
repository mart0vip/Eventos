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

interface MemberDebtReceiptParams {
  to: string;
  memberName: string;
  memberNumber: string;
  conceptLabel: string;
  dueDate: string;
  amountPaidArs: number;
  mpPaymentId: string;
}

/**
 * Sends the automatic receipt after a socio's debt payment is approved
 * (Fase 2). Called only from the webhook handler, same rule as registrations.
 */
export async function sendMemberDebtReceiptEmail(
  params: MemberDebtReceiptParams
): Promise<void> {
  const resend = getResend();
  await resend.emails.send({
    from: process.env.NOTIFICATION_FROM_EMAIL!,
    to: params.to,
    subject: `Pago recibido — ${params.conceptLabel}`,
    html: buildMemberDebtReceiptHtml(params),
  });
}

/**
 * Renders the confirmation email as a single self-contained HTML string
 * (inline styles only, no external CSS/assets) so it renders consistently
 * across email clients.
 */
function buildConfirmationHtml(params: ConfirmationEmailParams): string {
  const amountFormatted = formatArs(params.amountPaidArs);
  const row = buildRow;

  return `
<!DOCTYPE html>
<html lang="es">
  <body style="margin:0;padding:0;background-color:#FFFFFF;font-family:'Open Sans',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;padding:24px;">
      <tr>
        <td style="background-color:#242424;padding:20px 24px;">
          <img src="${process.env.NEXT_PUBLIC_BASE_URL}/logo-white.png" alt="Club Hípico Argentino" width="28" height="28" style="vertical-align:middle;" />
          <span style="color:#ffffff;font-size:18px;font-weight:bold;margin-left:8px;vertical-align:middle;">Club Hípico Argentino</span>
        </td>
      </tr>
      <tr>
        <td style="background-color:#ffffff;padding:24px;">
          <h1 style="color:#0096DC;font-size:20px;margin:0 0 8px;">✅ Inscripción confirmada</h1>
          <p style="color:#545454;font-size:14px;margin:0 0 16px;">
            ${params.competitionTitle} — ${params.eventName}
          </p>
          <table role="presentation" width="100%" style="border-top:1px solid #E6E6E6;padding-top:8px;">
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
          <p style="color:#545454;font-size:12px;margin-top:20px;">
            Club Hípico Argentino — este comprobante fue generado automáticamente.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Renders the member-debt receipt email — same self-contained inline-styles
 * approach and visual shell as the registration confirmation.
 */
function buildMemberDebtReceiptHtml(params: MemberDebtReceiptParams): string {
  const amountFormatted = formatArs(params.amountPaidArs);
  const row = buildRow;

  return `
<!DOCTYPE html>
<html lang="es">
  <body style="margin:0;padding:0;background-color:#FFFFFF;font-family:'Open Sans',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;padding:24px;">
      <tr>
        <td style="background-color:#242424;padding:20px 24px;">
          <img src="${process.env.NEXT_PUBLIC_BASE_URL}/logo-white.png" alt="Club Hípico Argentino" width="28" height="28" style="vertical-align:middle;" />
          <span style="color:#ffffff;font-size:18px;font-weight:bold;margin-left:8px;vertical-align:middle;">Club Hípico Argentino</span>
        </td>
      </tr>
      <tr>
        <td style="background-color:#ffffff;padding:24px;">
          <h1 style="color:#0096DC;font-size:20px;margin:0 0 8px;">✅ Pago recibido</h1>
          <p style="color:#545454;font-size:14px;margin:0 0 16px;">
            ${params.conceptLabel}
          </p>
          <table role="presentation" width="100%" style="border-top:1px solid #E6E6E6;padding-top:8px;">
            ${row("Socio", params.memberName)}
            ${row("N.º de socio", params.memberNumber)}
            ${row("Concepto", params.conceptLabel)}
            ${row("Vencimiento", params.dueDate)}
            ${row("Monto pagado", amountFormatted)}
            ${row("N.º de operación MP", params.mpPaymentId)}
          </table>
          <p style="color:#545454;font-size:12px;margin-top:20px;">
            Club Hípico Argentino — este comprobante fue generado automáticamente.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Formats centavos ARS as a localized currency string for email bodies. */
function formatArs(amountArs: number): string {
  return (amountArs / 100).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
  });
}

/** Renders one label/value row of the receipt tables. */
function buildRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:6px 0;color:#545454;font-size:14px;">${label}</td>
      <td style="padding:6px 0;color:#3C3C3B;font-size:14px;font-weight:600;text-align:right;">${value}</td>
    </tr>`;
}
