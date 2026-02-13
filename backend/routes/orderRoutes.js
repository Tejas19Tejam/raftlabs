const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

// GET all orders by customer name and phone
router
  .route("/customer/:customer/:phone")
  .get(orderController.getOrdersByCustomer);

// GET order by ID
router
  .route("/:id")
  .get(orderController.getOrder)
  .patch(orderController.updateOrder);

// POST create new order
router.route("/").post(orderController.createOrder);

module.exports = router;
