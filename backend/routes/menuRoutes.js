const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menuController");

// GET menu items
router.get("/", menuController.getMenu);

module.exports = router;
