const { Router } = require("express");
const historyController = require("../controllers/historyController");

const router = Router();

router.get("/", historyController.listHistory);
router.get("/export.csv", historyController.exportHistoryCsv);

module.exports = router;
