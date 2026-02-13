const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    priority: {
      type: Boolean,
      default: false,
    },
    cart: [
      {
        pizzaId: {
          type: Number,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        unitPrice: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        totalPrice: {
          type: Number,
          required: true,
        },
      },
    ],
    position: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "preparing", "out-for-delivery", "delivered"],
      default: "preparing",
    },
    orderPrice: {
      type: Number,
      required: true,
    },
    priorityPrice: {
      type: Number,
      default: 0,
    },
    estimatedDelivery: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        return ret;
      },
    },
  },
);

// Static method to calculate order price from cart
orderSchema.statics.calculateOrderPrice = function (cart) {
  return cart.reduce((sum, item) => sum + item.totalPrice, 0);
};

// Static method to calculate priority price (20% of order price)
orderSchema.statics.calculatePriorityPrice = function (orderPrice, priority) {
  if (!priority) return 0;
  return Math.round(orderPrice * 0.2);
};

// Calculate estimated delivery time based on priority
// Priority orders: 44 minutes, Regular orders: 60 minutes
orderSchema.statics.calculateEstimatedDelivery = function (priority) {
  const deliveryTime = priority ? 44 : 60; // in minutes
  return new Date(Date.now() + deliveryTime * 60 * 1000);
};

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
