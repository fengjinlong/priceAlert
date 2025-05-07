const axios = require("axios");
require("dotenv").config();

class PriceCheckService {
  constructor() {
    this.baseUrl = "https://min-api.cryptocompare.com/data/price";
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
      console.error(`Error fetching price for ${coin}:`, error.message);
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
        console.error("Invalid condition:", condition);
        return false;
    }
  }

  async checkAlert(alert) {
    const { coin, condition, target: targetPrice } = alert;

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
      return {
        ...alert,
        currentPrice,
      };
    }

    return false;
  }
}

module.exports = new PriceCheckService();
