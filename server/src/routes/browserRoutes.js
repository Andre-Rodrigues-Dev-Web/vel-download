const { Router } = require("express");
const browserController = require("../controllers/browserController");
const { validate } = require("../middlewares/validate");
const { browserImportSchema } = require("../utils/validators");

const router = Router();

router.post("/import", validate(browserImportSchema), browserController.importBrowserHistory);
router.get("/limitations", browserController.getIntegrationLimitations);

module.exports = router;
