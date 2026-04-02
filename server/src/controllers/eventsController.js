const realtimeGateway = require("../events/realtimeGateway");

function streamEvents(req, res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no"
  });

  const removeClient = realtimeGateway.addClient(res);

  const ping = setInterval(() => {
    res.write("event: heartbeat\n");
    res.write(`data: ${JSON.stringify({ ts: Date.now() })}\n\n`);
  }, 15000);

  req.on("close", () => {
    clearInterval(ping);
    removeClient();
    res.end();
  });
}

module.exports = {
  streamEvents
};
