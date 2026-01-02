/**
 * Email template for invoice payment link
 */
export function generateInvoiceEmail(data: {
  userName: string;
  orderNumber: string;
  productName: string;
  amount: number;
  currency: string;
  paymentLink: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice Ready - NexSupply</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Invoice Ready</h1>
    <p style="color: #e0e7ff; margin: 10px 0 0 0;">Your order is ready for payment</p>
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-top: 0;">Hi ${data.userName},</p>
    
    <p>Your order <strong>${data.orderNumber}</strong> for <strong>${data.productName}</strong> is ready for payment.</p>
    
    <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #1e293b;">Order Summary</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Product:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.productName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Order Number:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.orderNumber}</td>
        </tr>
        <tr style="border-top: 1px solid #e2e8f0;">
          <td style="padding: 12px 0; font-size: 18px; font-weight: 600;">Total Amount:</td>
          <td style="padding: 12px 0; text-align: right; font-size: 20px; font-weight: 700; color: #2563eb;">${data.currency} ${data.amount.toFixed(2)}</td>
        </tr>
      </table>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.paymentLink}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
        Pay Invoice
      </a>
    </div>
    
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>Important:</strong> Payment must be completed within 7 days. Once paid, production will begin immediately.
      </p>
    </div>
    
    <p style="margin-top: 25px; font-size: 14px; color: #64748b;">
      Questions? Reply to this email or contact us at <a href="mailto:support@nexsupply.com" style="color: #2563eb; text-decoration: none;">support@nexsupply.com</a>
    </p>
    
    <p style="font-size: 14px; color: #64748b;">
      Best regards,<br>
      <strong>NexSupply Team</strong>
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
    <p style="font-size: 12px; color: #94a3b8; margin: 5px 0;">
      © ${new Date().getFullYear()} NexSupply. All rights reserved.
    </p>
    <p style="font-size: 12px; color: #94a3b8; margin: 5px 0;">
      You're receiving this because you placed an order on NexSupply.
    </p>
  </div>
</body>
</html>
  `.trim();
}
