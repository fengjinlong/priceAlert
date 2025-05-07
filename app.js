const cron = require("node-cron");
const fs = require("fs").promises;
const path = require("path");
require("dotenv").config();

const priceCheckService = require("./services/priceCheck");
const mailer = require("./utils/mailer");

class PriceAlertApp {
  constructor() {
    this.alerts = [];
    this.cronJobs = new Map();
  }

  async loadAlerts() {
    try {
      const data = await fs.readFile(
        path.join(__dirname, "data", "alerts.json"),
        "utf8"
      );
      const { alerts } = JSON.parse(data);
      this.alerts = alerts;
      // console.log("✅ Alerts loaded successfully:", this.alerts.length, "alerts");
      // console.log("📋 Current alerts:", JSON.stringify(this.alerts, null, 2));
    } catch (error) {
      // console.error("❌ Error loading alerts:", error);
      this.alerts = [];
    }
  }

  async saveAlerts() {
    try {
      await fs.writeFile(
        path.join(__dirname, "data", "alerts.json"),
        JSON.stringify({ alerts: this.alerts }, null, 2)
      );
      // console.log("✅ Alerts saved successfully");
    } catch (error) {
      // console.error("❌ Error saving alerts:", error);
    }
  }

  setupCronJobs() {
    // Clear existing cron jobs
    this.cronJobs.forEach((job) => job.stop());
    this.cronJobs.clear();

    // Setup new cron jobs for each alert
    this.alerts.forEach((alert) => {
      const cronExpression = `*/${alert.interval} * * * *`; // Run every X minutes
      const job = cron.schedule(cronExpression, async () => {
        await this.checkAndNotify(alert);
      });
      this.cronJobs.set(alert.id, job);
      // console.log(`⏰ Scheduled check for ${alert.coin} every ${alert.interval} minutes`);
    });
  }

  async checkAndNotify(alert) {
    // console.log(`\n🔍 Checking alert for ${alert.coin}...`);
    const result = await priceCheckService.checkAlert(alert);

    if (result) {
      // console.log(`🚨 Alert triggered for ${alert.coin}:`);
      // console.log(`   Current Price: $${result.currentPrice}`);
      // console.log(`   Target: ${alert.condition} $${alert.target}`);
      try {
        const emailSent = await mailer.sendPriceAlert(result);
        // if (emailSent) {
        //   console.log(`✉️  Alert email sent successfully to ${alert.email}`);
        // } else {
        //   console.error(`❌ Failed to send alert email to ${alert.email}`);
        // }
      } catch (error) {
        // console.error("❌ Error sending email notification:", error);
      }
    } else {
      // console.log(`ℹ️  No alert triggered for ${alert.coin}`);
    }
  }

  async addAlert(alert) {
    alert.id = alert.id || `${alert.coin}-${Date.now()}`;
    this.alerts.push(alert);
    await this.saveAlerts();
    this.setupCronJobs();
    // console.log(`✅ Added new alert for ${alert.coin}`);
  }

  async removeAlert(alertId) {
    const job = this.cronJobs.get(alertId);
    if (job) {
      job.stop();
      this.cronJobs.delete(alertId);
    }

    this.alerts = this.alerts.filter((alert) => alert.id !== alertId);
    await this.saveAlerts();
    // console.log(`🗑️  Removed alert ${alertId}`);
  }

  async start() {
    // console.log("\n🚀 Starting Price Alert Service...");

    // Verify email connection
    // console.log("\n📧 Verifying email connection...");
    const emailConnected = await mailer.verifyConnection();
    if (!emailConnected) {
      // console.error("❌ Failed to connect to email service. Please check your configuration.");
      // console.log("\n📝 Email configuration checklist:");
      // console.log("1. Check if .env file exists");
      // console.log("2. Verify EMAIL_USER is correct");
      // console.log("3. Verify EMAIL_PASS is correct (should be authorization code, not password)");
      // console.log("4. Confirm EMAIL_HOST is smtp.163.com");
      // console.log("5. Confirm EMAIL_PORT is 465");
      process.exit(1);
    }
    // console.log("✅ Email connection verified successfully");

    // Load alerts and setup monitoring
    await this.loadAlerts();
    this.setupCronJobs();

    // console.log("\n✨ Price Alert Service is running...");
    // console.log("📊 Monitoring the following alerts:");
    // this.alerts.forEach(alert => {
    //   console.log(`   ${alert.coin}: ${alert.condition} $${alert.target} (every ${alert.interval} minutes)`);
    // });
  }
}

// Create and start the application
const app = new PriceAlertApp();
app.start().catch((error) => {
  // console.error("❌ Failed to start the application:", error);
  process.exit(1);
});
