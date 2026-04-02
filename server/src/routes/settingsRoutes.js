const { Router } = require("express");
const settingsController = require("../controllers/settingsController");

const router = Router();

router.get("/", settingsController.getSettings);
router.put("/", settingsController.updateSettings);

module.exports = router;
