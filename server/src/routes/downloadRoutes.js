const { Router } = require("express");
const downloadController = require("../controllers/downloadController");
const { validate } = require("../middlewares/validate");
const { createDownloadSchema } = require("../utils/validators");

const router = Router();

router.get("/", downloadController.listDownloads);
router.post("/", validate(createDownloadSchema), downloadController.createDownload);
router.post("/:id/pause", downloadController.pauseDownload);
router.post("/:id/resume", downloadController.resumeDownload);
router.post("/:id/cancel", downloadController.cancelDownload);
router.post("/:id/retry", downloadController.retryDownload);
router.post("/clear-completed", downloadController.clearCompleted);
router.delete("/:id", downloadController.removeDownload);

module.exports = router;
