const axios = require("axios");
require("dotenv").config();

class PriceCheckService {
  constructor() {
    this.baseUrl = "https://min-api.cryptocompare.com/data/price";
    this.lastTriggerTimes = new Map(); // Store last trigger times for cooldown
  }

  async getCurrentPrice(coin) {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          fsym: coin,
          tsyms: "USD",
        },
        headers: {
          authorization: `Apikey ${process.env.CRYPTO_COMPARE_API_KEY}`,
        },
      });
      return response.data.USD;
    } catch (error) {
      // console.error(`Error fetching price for ${coin}:`, error.message);
      return null;
    }
  }

  checkCondition(currentPrice, condition, targetPrice) {
    switch (condition) {
      case ">":
        return currentPrice > targetPrice;
      case "<":
        return currentPrice < targetPrice;
      default:
        // console.error("Invalid condition:", condition);
        return false;
    }
  }

  canTriggerAlert(alertId) {
    const lastTriggerTime = this.lastTriggerTimes.get(alertId);
    if (!lastTriggerTime) return true;

    const cooldownMinutes = parseInt(process.env.TRIGGER_COOLDOWN) || 60;
    const cooldownMs = cooldownMinutes * 60 * 1000;
    const timeSinceLastTrigger = Date.now() - lastTriggerTime;

    return timeSinceLastTrigger >= cooldownMs;
  }

  updateLastTriggerTime(alertId) {
    this.lastTriggerTimes.set(alertId, Date.now());
  }

  async checkAlert(alert) {
    const { id, coin, condition, target: targetPrice } = alert;

    if (!this.canTriggerAlert(id)) {
      return false;
    }

    const currentPrice = await this.getCurrentPrice(coin);
    if (currentPrice === null) {
      return false;
    }

    const isTriggered = this.checkCondition(
      currentPrice,
      condition,
      targetPrice
    );
    if (isTriggered) {
      this.updateLastTriggerTime(id);
      return {
        ...alert,
        currentPrice,
      };
    }

    return false;
  }
}

module.exports = new PriceCheckService();
