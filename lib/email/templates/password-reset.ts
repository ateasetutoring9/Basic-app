const PRODUCT_NAME = "At Ease Learning";
const ACCENT = "#2D5F4C";

interface PasswordResetEmailOptions {
  resetUrl: string;
  firstName?: string;
}

interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

export function passwordResetEmail({ resetUrl, firstName }: PasswordResetEmailOptions): EmailContent {
  const greeting = firstName ? `Hi ${firstName},` : "Hi,";

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
                Reset your password
              </p>

              <p style="margin:0 0 24px;font-size:15px;color:#595956;line-height:1.6;">
                ${greeting}
              </p>

              <p style="margin:0 0 24px;font-size:15px;color:#595956;line-height:1.6;">
                Someone requested a password reset for your ${PRODUCT_NAME} account. If this was you, click the button below to set a new password. The link expires in one hour.
              </p>

              <!-- Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="background-color:${ACCENT};border-radius:8px;">
                    <a href="${resetUrl}"
                       style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#FAFAF7;text-decoration:none;border-radius:8px;">
                      Reset password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 20px;font-size:13px;color:#8B8B85;line-height:1.6;">
                If the button does not work, copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 28px;font-size:13px;color:${ACCENT};word-break:break-all;">
                ${resetUrl}
              </p>

              <hr style="border:none;border-top:1px solid #E5E3DD;margin:0 0 24px;" />

              <p style="margin:0;font-size:13px;color:#8B8B85;line-height:1.6;">
                If you did not request a password reset, you can ignore this email. Your password will not change.
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

  const text = `${PRODUCT_NAME} — Reset your password

${greeting}

Someone requested a password reset for your ${PRODUCT_NAME} account. If this was you, use the link below to set a new password. The link expires in one hour.

${resetUrl}

If you did not request a password reset, you can ignore this email. Your password will not change.

— The ${PRODUCT_NAME} team`;

  return {
    subject: `Reset your ${PRODUCT_NAME} password`,
    html,
    text,
  };
}
