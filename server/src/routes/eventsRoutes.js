const { Router } = require("express");
const { streamEvents } = require("../controllers/eventsController");

const router = Router();

router.get("/", streamEvents);

module.exports = router;
