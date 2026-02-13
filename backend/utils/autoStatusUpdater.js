const Order = require("../models/Order");
const { ORDER_STATUS } = require("./constants");

// Global storage for active timers
const activeTimers = new Map();

class AutoStatusUpdater {
  statuses = ORDER_STATUS.slice(1); // Exclude "pending" as it's the initial status
  AUTO_UPDATE_TIME = process.env.AUTO_STATUS_UPDATE_TIME_IN_MIN * 60 * 1000;

  constructor(orderId) {
    this.orderId = orderId;
    this.currentStatusIndex = 0;
    this.timer = null;
  }

  start() {
    // Store this instance
    activeTimers.set(this.orderId, this);

    this.timer = setInterval(async () => {
      try {
        console.log(`Auto-updating status for order ${this.orderId}`);

        const order = await Order.findById(this.orderId);
        if (!order) {
          console.log(`Order ${this.orderId} not found, stopping timer`);
          this.stop();
          return;
        }

        // Get current status to update to
        const newStatus = this.statuses[this.currentStatusIndex];

        order.status = newStatus;
        await order.save();

        console.log(`✅ Order ${this.orderId} updated to ${newStatus}`);

        // Move to next status
        this.currentStatusIndex++;

        // Stop timer after reaching "DELIVERED"
        if (newStatus === "DELIVERED") {
          console.log(`Order ${this.orderId} delivered, stopping timer`);
          this.stop();
        }
      } catch (error) {
        console.error(
          `❌ Error updating order ${this.orderId}:`,
          error.message,
        );
        this.stop();
      }
    }, this.AUTO_UPDATE_TIME);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      activeTimers.delete(this.orderId);
    }
    this.timer = null;
  }

  static getTimer(orderId) {
    return activeTimers.get(orderId);
  }

  static clearTimer(orderId) {
    const timer = activeTimers.get(orderId);
    if (timer) {
      timer.stop();
    }
  }

  static clearAllTimers() {
    activeTimers.forEach((timer) => timer.stop());
    activeTimers.clear();
  }
}

module.exports = AutoStatusUpdater;
