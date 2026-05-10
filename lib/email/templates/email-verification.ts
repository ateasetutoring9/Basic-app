const PRODUCT_NAME = "At Ease Learning";
const ACCENT = "#2D5F4C";

interface EmailVerificationEmailOptions {
  verifyUrl: string;
  firstName?: string;
}

interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

export function emailVerificationEmail({
  verifyUrl,
  firstName,
}: EmailVerificationEmailOptions): EmailContent {
  const greeting = firstName ? `Hi ${firstName},` : "Hi there,";

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#FAFAF7;font-family:Inter,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAFAF7;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:28px;text-align:center;">
              <span style="font-size:18px;font-weight:600;color:#1A1A1A;">${PRODUCT_NAME}</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#FFFFFF;border:1px solid #E5E3DD;border-radius:10px;padding:40px 36px;">

              <p style="margin:0 0 8px;font-size:22px;font-weight:600;color:#1A1A1A;line-height:1.3;">
                Verify your email
              </p>

              <p style="margin:0 0 24px;font-size:15px;color:#595956;line-height:1.6;">
                ${greeting}
              </p>

              <p style="margin:0 0 24px;font-size:15px;color:#595956;line-height:1.6;">
                Confirm this email belongs to you so we can keep your account secure.
              </p>

              <!-- Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="background-color:${ACCENT};border-radius:8px;">
                    <a href="${verifyUrl}"
                       style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#FAFAF7;text-decoration:none;border-radius:8px;">
                      Verify email
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 20px;font-size:13px;color:#8B8B85;line-height:1.6;">
                If the button does not work, copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 28px;font-size:13px;color:${ACCENT};word-break:break-all;">
                ${verifyUrl}
              </p>

              <hr style="border:none;border-top:1px solid #E5E3DD;margin:0 0 24px;" />

              <p style="margin:0;font-size:13px;color:#8B8B85;line-height:1.6;">
                This link expires in 24 hours. If you did not sign up, you can ignore this — your address will not be added to any list.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#8B8B85;">
                &copy; ${new Date().getFullYear()} ${PRODUCT_NAME}. Free education for Year 7&ndash;12 Australian students.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `${PRODUCT_NAME} — Verify your email

${greeting}

Confirm this email belongs to you so we can keep your account secure.

Verify your email: ${verifyUrl}

This link expires in 24 hours. If you did not sign up, you can ignore this — your address will not be added to any list.

Thanks,
The ${PRODUCT_NAME} team`;

  return {
    subject: `Verify your email for ${PRODUCT_NAME}`,
    html,
    text,
  };
}
