const Order = require("../models/Order");
const catchAsync = require("../utils/catchAsync");
const AutoStatusUpdater = require("../utils/autoStatusUpdater");

// Create new order
exports.createOrder = catchAsync(async (req, res) => {
  const { customer, phone, address, priority, cart, position } = req.body;

  // Calculate order price from cart
  const orderPrice = Order.calculateOrderPrice(cart);

  // Calculate priority price (20% of order price if priority is true)
  const priorityPrice = Order.calculatePriorityPrice(orderPrice, priority);

  // Calculate estimated delivery time
  const estimatedDelivery = Order.calculateEstimatedDelivery(priority);

  const newOrder = {
    customer,
    phone,
    address,
    priority,
    cart,
    position: position || "",
    orderPrice,
    priorityPrice,
    estimatedDelivery,
  };

  const order = await Order.create(newOrder);

  const autoStatusUpdater = new AutoStatusUpdater(order.id);
  autoStatusUpdater.start();

  // Format response
  const response = {
    customer: order.customer,
    phone: order.phone,
    position: order.position,
    address: order.address,
    status: order.status,
    priority: order.priority,
    cart: order.cart,
    id: order.id,
    createdAt: order.createdAt,
    estimatedDelivery: order.estimatedDelivery,
    orderPrice: order.orderPrice,
    priorityPrice: order.priorityPrice,
  };

  res.status(201).json({
    status: "success",
    data: response,
  });
});

// Get order by ID
exports.getOrder = catchAsync(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({
      status: "fail",
      message: "Order not found",
    });
  }

  // Format response
  const response = {
    customer: order.customer,
    status: order.status,
    priority: order.priority,
    cart: order.cart,
    id: order.id,
    estimatedDelivery: order.estimatedDelivery,
    orderPrice: order.orderPrice,
    priorityPrice: order.priorityPrice,
  };

  res.status(200).json({
    status: "success",
    data: response,
  });
});

// Get all orders by customer by phone
exports.getOrdersByCustomer = catchAsync(async (req, res) => {
  const { phone, customer } = req.params;

  const orders = await Order.find({
    phone: phone,
    customer: customer,
  });

  if (!orders || orders.length === 0) {
    return res.status(404).json({
      status: "fail",
      message: "No orders found for this customer",
    });
  }

  // Format response
  const response = orders.map((order) => ({
    customer: order.customer,
    status: order.status,
    priority: order.priority,
    cart: order.cart,
    id: order.id,
    estimatedDelivery: order.estimatedDelivery,
    orderPrice: order.orderPrice,
    priorityPrice: order.priorityPrice,
  }));

  res.status(200).json({
    status: "success",
    data: response,
  });
});

// Update order
exports.updateOrder = catchAsync(async (req, res) => {
  const { priority } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({
      status: "fail",
      message: "Order not found",
    });
  }

  // Clear existing timer when manually updating order
  AutoStatusUpdater.clearTimer(order.id);

  // If priority is being updated, recalculate prices and delivery time
  if (priority !== undefined && priority !== order.priority) {
    order.priority = priority;
    order.priorityPrice = Order.calculatePriorityPrice(
      order.orderPrice,
      priority,
    );
    order.estimatedDelivery = Order.calculateEstimatedDelivery(priority);
  }

  await order.save();

  // Format response
  const response = {
    customer: order.customer,
    phone: order.phone,
    position: order.position,
    address: order.address,
    status: order.status,
    priority: order.priority,
    cart: order.cart,
    id: order.id,
    createdAt: order.createdAt,
    estimatedDelivery: order.estimatedDelivery,
    orderPrice: order.orderPrice,
    priorityPrice: order.priorityPrice,
  };

  res.status(200).json({
    status: "success",
    data: response,
  });
});
