const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || 'your-email@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || 'YOUR_GMAIL_APP_PASSWORD';
const SMTP_FROM = process.env.SMTP_FROM || 'your-email@gmail.com';

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for 587
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
});

const sendEmergencyAlert = async ({
  contactName,
  contactEmail,
  userName,
  userFirstName,
  relationship,
  riskLevel,
}) => {
  const subject = `Checking in on ${userFirstName} — A gentle heads up from CalmRoot`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'DM Sans', Arial, sans-serif; background: #F7F5F0; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #2D5A3D, #4A7C59); padding: 32px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; }
    .body { padding: 32px; }
    .body p { color: #2C3E2D; line-height: 1.6; }
    .tip-box { background: #EEF2EC; border-left: 4px solid #4A7C59; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .crisis { background: #FEF2F2; border: 1px solid #FCA5A5; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .crisis p { color: #991B1B; margin: 0; }
    .footer { background: #0D1117; padding: 20px; text-align: center; }
    .footer p { color: #8B949E; font-size: 12px; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌿 CalmRoot</h1>
      <p>Wellness Support Network</p>
    </div>
    <div class="body">
      <p>Hi <strong>${contactName}</strong>,</p>
      
      <p>You're receiving this because <strong>${userName}</strong> 
      listed you as their trusted ${relationship} in CalmRoot, 
      a mental health support platform.</p>
      
      <p>Our wellness AI has noticed that 
      <strong>${userFirstName}</strong> may be going through 
      a challenging time emotionally. This is <strong>not an 
      emergency alert</strong>, but a gentle heads-up so you 
      can check in with them.</p>
      
      <div class="tip-box">
        <p><strong>💚 Simple ways you can help:</strong></p>
        <ul>
          <li>Send a text saying you're thinking of them</li>
          <li>Invite them for a walk, coffee, or a call</li>
          <li>Just listen without judgment</li>
          <li>Remind them they are loved and not alone</li>
        </ul>
      </div>
      
      <div class="crisis">
        <p>🆘 If you believe ${userFirstName} is in 
        <strong>immediate danger</strong>, please:<br/>
        Call iCall: <strong>9152987821</strong> | 
        Emergency: <strong>112</strong></p>
      </div>
      
      <p>Thank you for being part of 
      <strong>${userFirstName}'s</strong> support network. 
      Your care makes a real difference. 💙</p>
      
      <p>Warm regards,<br/>The CalmRoot Team</p>
    </div>
    <div class="footer">
      <p>This message was sent by CalmRoot's wellness monitoring system.</p>
      <p>${userName} consented to this notification during registration.</p>
      <p>© 2025 CalmRoot. Ground Yourself. Grow Together.</p>
    </div>
  </div>
</body>
</html>`;

  const textBody = `
Hi ${contactName},

You're receiving this because ${userName} listed you as their 
trusted ${relationship} in CalmRoot.

Our wellness AI has noticed ${userFirstName} may be going through 
a challenging time. Please consider reaching out to check on them.

Simple ways to help:
- Send a text saying you're thinking of them
- Invite them for a walk or call
- Just listen without judgment

If you believe they are in immediate danger:
iCall: 9152987821 | Emergency: 112

Thank you for being part of their support network.

The CalmRoot Team
`;

  try {
    const info = await transporter.sendMail({
      from: `"${SMTP_FROM}" <${SMTP_USER}>`,
      to: contactEmail,
      subject: subject,
      text: textBody,
      html: htmlBody
    });
    console.log(`✅ Emergency alert sent via SMTP to ${contactEmail}. MessageId: ${info.messageId}`);
    return { success: true };
  } catch (error) {
    console.error('SMTP send failed:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmergencyAlert };
