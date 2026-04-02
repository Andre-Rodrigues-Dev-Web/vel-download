const { Router } = require("express");
const browserController = require("../controllers/browserController");
const { validate } = require("../middlewares/validate");
const { requireExtensionAccess } = require("../middlewares/extensionAccess");
const {
  browserImportSchema,
  extensionStartDownloadSchema,
  extensionDownloadEventSchema
} = require("../utils/validators");

const router = Router();

router.post("/import", validate(browserImportSchema), browserController.importBrowserHistory);
router.get("/limitations", browserController.getIntegrationLimitations);
router.get("/extension/ping", requireExtensionAccess, browserController.extensionPing);
router.post(
  "/extension/download",
  requireExtensionAccess,
  validate(extensionStartDownloadSchema),
  browserController.enqueueByExtension
);
router.post(
  "/extension/event",
  requireExtensionAccess,
  validate(extensionDownloadEventSchema),
  browserController.ingestExtensionEvent
);

module.exports = router;
