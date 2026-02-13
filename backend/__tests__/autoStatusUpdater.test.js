const AutoStatusUpdater = require("../utils/autoStatusUpdater");
const Order = require("../models/Order");

// Mock the Order model
jest.mock("../models/Order");

// Mock timers
jest.useFakeTimers();

describe("AutoStatusUpdater Tests", () => {
  let mockOrder;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    AutoStatusUpdater.clearAllTimers();

    // Mock order object
    mockOrder = {
      id: "order123",
      status: "PENDING",
      save: jest.fn().mockResolvedValue(true),
    };

    // Set environment variable for testing
    process.env.AUTO_STATUS_UPDATE_TIME_IN_MIN = 1; // 1 minute for testing
  });

  afterEach(() => {
    AutoStatusUpdater.clearAllTimers();
    jest.clearAllTimers();
  });

  describe("start", () => {
    test("should start automatic status updates", () => {
      // Arrange
      const updater = new AutoStatusUpdater("order123");

      // Act
      updater.start();

      // Assert
      expect(updater.timer).not.toBeNull();
      expect(AutoStatusUpdater.getTimer("order123")).toBe(updater);
    });

    test("should update order status from PENDINGto PREPARING", async () => {
      // Arrange
      mockOrder.status = "PENDING";
      Order.findById = jest.fn().mockResolvedValue(mockOrder);

      const updater = new AutoStatusUpdater("order123");
      updater.start();

      // Act - Fast-forward time by 1 minute
      await jest.advanceTimersByTimeAsync(60 * 1000);

      // Assert
      expect(Order.findById).toHaveBeenCalledWith("order123");
      expect(mockOrder.status).toBe("PREPARING");
      expect(mockOrder.save).toHaveBeenCalled();
    });

    test("should update order status through all stages", async () => {
      // Arrange
      Order.findById = jest.fn().mockResolvedValue(mockOrder);

      const updater = new AutoStatusUpdater("order123");
      updater.start();

      // Act & Assert - Go through all status updates
      // Stage 1: PENDING-> PREPARING
      await jest.advanceTimersByTimeAsync(60 * 1000);
      expect(mockOrder.status).toBe("PREPARING");

      // Stage 2: PREPARING -> OUT_FOR_DELIVERY
      await jest.advanceTimersByTimeAsync(60 * 1000);
      expect(mockOrder.status).toBe("OUT_FOR_DELIVERY");

      // Stage 3: OUT_FOR_DELIVERY -> DELIVERED
      await jest.advanceTimersByTimeAsync(60 * 1000);
      expect(mockOrder.status).toBe("DELIVERED");

      // Verify save was called for each update
      expect(mockOrder.save).toHaveBeenCalledTimes(3);
    });

    test("should stop timer after reaching DELIVERED status", async () => {
      // Arrange
      Order.findById = jest.fn().mockResolvedValue(mockOrder);

      const updater = new AutoStatusUpdater("order123");
      updater.start();

      // Act - Fast-forward through all updates
      await jest.advanceTimersByTimeAsync(60 * 1000); // PREPARING
      await jest.advanceTimersByTimeAsync(60 * 1000); // OUT_FOR_DELIVERY
      await jest.advanceTimersByTimeAsync(60 * 1000); // DELIVERED

      // Try to advance one more time (should not update)
      const saveCallCount = mockOrder.save.mock.calls.length;
      await jest.advanceTimersByTimeAsync(60 * 1000);

      // Assert
      expect(mockOrder.save).toHaveBeenCalledTimes(saveCallCount); // No additional calls
      expect(mockOrder.status).toBe("DELIVERED");
      expect(updater.timer).toBeNull();
      expect(AutoStatusUpdater.getTimer("order123")).toBeUndefined();
    });

    test("should stop timer when order is not found", async () => {
      // Arrange
      Order.findById = jest.fn().mockResolvedValue(null);

      const updater = new AutoStatusUpdater("nonexistent123");
      updater.start();

      // Act
      await jest.advanceTimersByTimeAsync(60 * 1000);

      // Assert
      expect(Order.findById).toHaveBeenCalledWith("nonexistent123");
      expect(updater.timer).toBeNull();
      expect(AutoStatusUpdater.getTimer("nonexistent123")).toBeUndefined();
    });

    test("should stop timer on error during status update", async () => {
      // Arrange
      const error = new Error("Database error");
      Order.findById = jest.fn().mockRejectedValue(error);

      const updater = new AutoStatusUpdater("order123");
      updater.start();

      // Act
      await jest.advanceTimersByTimeAsync(60 * 1000);

      // Assert
      expect(Order.findById).toHaveBeenCalledWith("order123");
      expect(updater.timer).toBeNull();
      expect(AutoStatusUpdater.getTimer("order123")).toBeUndefined();
    });
  });

  describe("stop", () => {
    test("should stop the timer and remove from active timers", () => {
      // Arrange
      const updater = new AutoStatusUpdater("order123");
      updater.start();

      // Act
      updater.stop();

      // Assert
      expect(updater.timer).toBeNull();
      expect(AutoStatusUpdater.getTimer("order123")).toBeUndefined();
    });

    test("should handle stop when timer is already null", () => {
      // Arrange
      const updater = new AutoStatusUpdater("order123");

      // Act & Assert (should not throw error)
      expect(() => updater.stop()).not.toThrow();
      expect(updater.timer).toBeNull();
    });
  });

  describe("clearTimer", () => {
    test("should clear a specific timer by order ID", () => {
      // Arrange
      const updater = new AutoStatusUpdater("order123");
      updater.start();

      // Act
      AutoStatusUpdater.clearTimer("order123");

      // Assert
      expect(updater.timer).toBeNull();
      expect(AutoStatusUpdater.getTimer("order123")).toBeUndefined();
    });

    test("should handle clearing non-existent timer gracefully", () => {
      // Act & Assert (should not throw error)
      expect(() =>
        AutoStatusUpdater.clearTimer("nonexistent123"),
      ).not.toThrow();
    });
  });

  describe("clearAllTimers", () => {
    test("should clear all active timers", () => {
      // Arrange
      const updater1 = new AutoStatusUpdater("order1");
      const updater2 = new AutoStatusUpdater("order2");
      const updater3 = new AutoStatusUpdater("order3");

      updater1.start();
      updater2.start();
      updater3.start();

      // Act
      AutoStatusUpdater.clearAllTimers();

      // Assert
      expect(updater1.timer).toBeNull();
      expect(updater2.timer).toBeNull();
      expect(updater3.timer).toBeNull();
      expect(AutoStatusUpdater.getTimer("order1")).toBeUndefined();
      expect(AutoStatusUpdater.getTimer("order2")).toBeUndefined();
      expect(AutoStatusUpdater.getTimer("order3")).toBeUndefined();
    });

    test("should handle clearing when no timers are active", () => {
      // Act & Assert (should not throw error)
      expect(() => AutoStatusUpdater.clearAllTimers()).not.toThrow();
    });
  });

  describe("getTimer", () => {
    test("should retrieve an active timer by order ID", () => {
      // Arrange
      const updater = new AutoStatusUpdater("order123");
      updater.start();

      // Act
      const retrievedTimer = AutoStatusUpdater.getTimer("order123");

      // Assert
      expect(retrievedTimer).toBe(updater);
    });

    test("should return undefined for non-existent timer", () => {
      // Act
      const retrievedTimer = AutoStatusUpdater.getTimer("nonexistent123");

      // Assert
      expect(retrievedTimer).toBeUndefined();
    });
  });
});
