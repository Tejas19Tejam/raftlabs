const orderController = require("../controllers/orderController");
const Order = require("../models/Order");
const AutoStatusUpdater = require("../utils/autoStatusUpdater");

// Mock the dependencies
jest.mock("../models/Order");
jest.mock("../utils/autoStatusUpdater");

describe("Order Controller Tests", () => {
  let req, res;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Mock request and response objects
    req = {
      body: {},
      params: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("createOrder", () => {
    test("should create an order successfully with priority", async () => {
      // Arrange
      const mockOrderData = {
        customer: "John Doe",
        phone: "1234567890",
        address: "123 Main St",
        priority: true,
        cart: [{ pizzaId: 1, name: "Margherita", quantity: 2, unitPrice: 10 }],
        position: "40.7128,-74.0060",
      };

      const mockCreatedOrder = {
        id: "order123",
        customer: "John Doe",
        phone: "1234567890",
        address: "123 Main St",
        status: "preparing",
        priority: true,
        cart: mockOrderData.cart,
        position: "40.7128,-74.0060",
        orderPrice: 20,
        priorityPrice: 4,
        estimatedDelivery: new Date(Date.now() + 30 * 60000),
        createdAt: new Date(),
      };

      req.body = mockOrderData;
      const next = jest.fn();

      // Mock static methods
      Order.calculateOrderPrice = jest.fn().mockReturnValue(20);
      Order.calculatePriorityPrice = jest.fn().mockReturnValue(4);
      Order.calculateEstimatedDelivery = jest
        .fn()
        .mockReturnValue(mockCreatedOrder.estimatedDelivery);
      Order.create = jest.fn().mockResolvedValue(mockCreatedOrder);

      // Mock AutoStatusUpdater
      AutoStatusUpdater.mockImplementation(() => ({
        start: jest.fn(),
      }));

      // Act
      await orderController.createOrder(req, res, next);

      // Assert
      expect(Order.calculateOrderPrice).toHaveBeenCalledWith(
        mockOrderData.cart,
      );
      expect(Order.calculatePriorityPrice).toHaveBeenCalledWith(20, true);
      expect(Order.calculateEstimatedDelivery).toHaveBeenCalledWith(true);
      expect(Order.create).toHaveBeenCalledWith({
        customer: "John Doe",
        phone: "1234567890",
        address: "123 Main St",
        priority: true,
        cart: mockOrderData.cart,
        position: "40.7128,-74.0060",
        orderPrice: 20,
        priorityPrice: 4,
        estimatedDelivery: mockCreatedOrder.estimatedDelivery,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        data: expect.objectContaining({
          customer: "John Doe",
          phone: "1234567890",
          id: "order123",
          orderPrice: 20,
          priorityPrice: 4,
        }),
      });
    });

    test("should create an order successfully without priority", async () => {
      // Arrange
      const mockOrderData = {
        customer: "Jane Smith",
        phone: "9876543210",
        address: "456 Oak Ave",
        priority: false,
        cart: [{ pizzaId: 2, name: "Pepperoni", quantity: 1, unitPrice: 12 }],
      };

      const mockCreatedOrder = {
        id: "order456",
        customer: "Jane Smith",
        phone: "9876543210",
        address: "456 Oak Ave",
        status: "preparing",
        priority: false,
        cart: mockOrderData.cart,
        position: "",
        orderPrice: 12,
        priorityPrice: 0,
        estimatedDelivery: new Date(Date.now() + 60 * 60000),
        createdAt: new Date(),
      };

      req.body = mockOrderData;
      const next = jest.fn();

      Order.calculateOrderPrice = jest.fn().mockReturnValue(12);
      Order.calculatePriorityPrice = jest.fn().mockReturnValue(0);
      Order.calculateEstimatedDelivery = jest
        .fn()
        .mockReturnValue(mockCreatedOrder.estimatedDelivery);
      Order.create = jest.fn().mockResolvedValue(mockCreatedOrder);

      AutoStatusUpdater.mockImplementation(() => ({
        start: jest.fn(),
      }));

      // Act
      await orderController.createOrder(req, res, next);

      // Assert
      expect(Order.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        data: expect.objectContaining({
          customer: "Jane Smith",
          priority: false,
          priorityPrice: 0,
        }),
      });
    });
  });

  describe("getOrder", () => {
    test("should retrieve an order successfully", async () => {
      // Arrange
      const mockOrder = {
        id: "order123",
        customer: "John Doe",
        status: "preparing",
        priority: true,
        cart: [{ pizzaId: 1, name: "Margherita", quantity: 2, unitPrice: 10 }],
        orderPrice: 20,
        priorityPrice: 4,
        estimatedDelivery: new Date(),
      };

      req.params.id = "order123";
      const next = jest.fn();
      Order.findById = jest.fn().mockResolvedValue(mockOrder);

      // Act
      await orderController.getOrder(req, res, next);

      // Assert
      expect(Order.findById).toHaveBeenCalledWith("order123");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        data: expect.objectContaining({
          id: "order123",
          customer: "John Doe",
          status: "preparing",
          priority: true,
        }),
      });
    });

    test("should return 404 when order is not found", async () => {
      // Arrange
      req.params.id = "nonexistent123";
      const next = jest.fn();
      Order.findById = jest.fn().mockResolvedValue(null);

      // Act
      await orderController.getOrder(req, res, next);

      // Assert
      expect(Order.findById).toHaveBeenCalledWith("nonexistent123");
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: "fail",
        message: "Order not found",
      });
    });
  });

  describe("getOrdersByCustomer", () => {
    test("should retrieve all orders for a customer successfully", async () => {
      // Arrange
      const mockOrders = [
        {
          id: "order123",
          customer: "John Doe",
          status: "preparing",
          priority: true,
          cart: [
            { pizzaId: 1, name: "Margherita", quantity: 2, unitPrice: 10 },
          ],
          orderPrice: 20,
          priorityPrice: 4,
          estimatedDelivery: new Date(),
        },
        {
          id: "order124",
          customer: "John Doe",
          status: "delivered",
          priority: false,
          cart: [{ pizzaId: 2, name: "Pepperoni", quantity: 1, unitPrice: 12 }],
          orderPrice: 12,
          priorityPrice: 0,
          estimatedDelivery: new Date(),
        },
      ];

      req.params = {
        phone: "1234567890",
        customer: "John Doe",
      };
      const next = jest.fn();

      Order.find = jest.fn().mockResolvedValue(mockOrders);

      // Act
      await orderController.getOrdersByCustomer(req, res, next);

      // Assert
      expect(Order.find).toHaveBeenCalledWith({
        phone: "1234567890",
        customer: "John Doe",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        data: expect.arrayContaining([
          expect.objectContaining({
            customer: "John Doe",
            id: "order123",
          }),
          expect.objectContaining({
            customer: "John Doe",
            id: "order124",
          }),
        ]),
      });
    });

    test("should return 404 when no orders found for customer", async () => {
      // Arrange
      req.params = {
        phone: "9999999999",
        customer: "Unknown Customer",
      };
      const next = jest.fn();

      Order.find = jest.fn().mockResolvedValue([]);

      // Act
      await orderController.getOrdersByCustomer(req, res, next);

      // Assert
      expect(Order.find).toHaveBeenCalledWith({
        phone: "9999999999",
        customer: "Unknown Customer",
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: "fail",
        message: "No orders found for this customer",
      });
    });

    test("should return 404 when orders is null", async () => {
      // Arrange
      req.params = {
        phone: "1111111111",
        customer: "Test User",
      };
      const next = jest.fn();

      Order.find = jest.fn().mockResolvedValue(null);

      // Act
      await orderController.getOrdersByCustomer(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: "fail",
        message: "No orders found for this customer",
      });
    });
  });

  describe("updateOrder", () => {
    test("should return 404 when order not found for update", async () => {
      // Arrange
      req.params.id = "nonexistent123";
      req.body = { priority: true };
      const next = jest.fn();

      Order.findById = jest.fn().mockResolvedValue(null);

      // Act
      await orderController.updateOrder(req, res, next);

      // Assert
      expect(Order.findById).toHaveBeenCalledWith("nonexistent123");
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: "fail",
        message: "Order not found",
      });
    });
  });
});
