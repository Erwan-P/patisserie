import nodemailer from "nodemailer";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendReceiptEmail(order: any, pickupDate: string, pickupTime: string) {
  if (!process.env.SMTP_USER) {
    console.warn("⚠️ SMTP_USER is not set. Receipt email is not sent.");
    return;
  }

  const formattedDate = format(new Date(pickupDate), "EEEE d MMMM yyyy", { locale: fr });
  
  let itemsHtml = "";
  order.items.forEach((item: any) => {
    itemsHtml += `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #E5E7EB;">${item.product.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: right;">${item.price.toFixed(2)} €</td>
        <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: right; font-weight: bold;">${(item.price * item.quantity).toFixed(2)} €</td>
      </tr>
    `;
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f9f9f9; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background-color: #ffffff; border-radius: 24px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
    .header { text-align: center; margin-bottom: 40px; }
    .logo { font-size: 24px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; color: #1a1a1a; margin: 0; }
    h1 { font-size: 28px; font-weight: normal; text-align: center; margin-bottom: 10px; color: #1a1a1a; }
    .subtitle { text-align: center; color: #666; margin-bottom: 40px; font-size: 16px; }
    
    .info-box { background-color: #f3f4f6; border-radius: 12px; padding: 20px; margin-bottom: 30px; text-align: center; }
    .info-box h3 { margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #666; }
    .info-box p { margin: 0; font-size: 18px; font-weight: bold; color: #1a1a1a; }
    
    table { w-full: 100%; width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { text-align: left; padding: 12px; border-bottom: 2px solid #1a1a1a; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; color: #666; }
    
    .total-row { text-align: right; font-size: 20px; font-weight: bold; padding-top: 20px; }
    .footer { text-align: center; margin-top: 40px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <h2 class="logo">La Maison Sucrée</h2>
      </div>
      
      <h1>Merci pour votre commande !</h1>
      <p class="subtitle">Voici le récapitulatif de votre commande N° ${order.id.slice(-8).toUpperCase()}</p>

      <div class="info-box">
        <h3>Retrait en boutique prévu le</h3>
        <p>${formattedDate} à ${pickupTime}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Produit</th>
            <th style="text-align: center;">Qté</th>
            <th style="text-align: right;">Prix unitaire</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="total-row">
        Total réglé : ${order.total.toFixed(2)} €
      </div>

      <div class="footer">
        <p>Cette email fait office de facture pour votre achat.</p>
        <p>La Maison Sucrée - 15 Place Vendôme, 75001 Paris</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  await transport.sendMail({
    to: order.user.email,
    from: process.env.EMAIL_FROM || "contact@lamaisonsucree.fr",
    subject: "Confirmation de votre commande - La Maison Sucrée",
    html: html,
  });
}
