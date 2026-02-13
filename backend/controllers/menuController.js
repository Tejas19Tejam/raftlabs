const menuItems = require("../data/items.json");
const catchAsync = require("../utils/catchAsync");

// Get all menu items
exports.getMenu = catchAsync(async (req, res) => {
  res.status(200).json({
    status: "success",
    data: menuItems,
  });
});
