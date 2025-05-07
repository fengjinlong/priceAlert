const nodemailer = require("nodemailer");
require("dotenv").config();

class Mailer {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendPriceAlert(alertData) {
    const { coin, currentPrice, condition, target, email } = alertData;

    // 格式化价格为两位小数
    const formattedCurrentPrice = Number(currentPrice).toFixed(2);
    const formattedTargetPrice = Number(target).toFixed(2);

    const subject = `Price Alert: ${coin} ${condition} ${formattedTargetPrice} USD`;
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2c3e50;">Price Alert Triggered</h2>
            <p>Your price alert for ${coin} has been triggered:</p>
            <ul style="list-style: none; padding-left: 0;">
                <li style="margin: 10px 0;">
                    <strong>Current Price:</strong> ${formattedCurrentPrice} USD
                </li>
                <li style="margin: 10px 0;">
                    <strong>Condition:</strong> ${condition}
                </li>
                <li style="margin: 10px 0;">
                    <strong>Target Price:</strong> ${formattedTargetPrice} USD
                </li>
                <li style="margin: 10px 0;">
                    <strong>Triggered at:</strong> ${new Date().toLocaleString()}
                </li>
            </ul>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
                This is an automated alert from your Crypto Price Alert Service.
            </p>
        </div>
    `;

    try {
      const info = await this.transporter.sendMail({
        from: `Crypto Price Alert <${process.env.EMAIL_USER}>`,
        to: email,
        subject,
        html,
      });
      console.log("📧 Email sent successfully:", info.messageId);
      return true;
    } catch (error) {
      console.error("❌ Error sending email:", error);
      return false;
    }
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log("📧 Email connection verified successfully");
      return true;
    } catch (error) {
      console.error("❌ Email connection verification failed:", error);
      return false;
    }
  }
}

module.exports = new Mailer();
