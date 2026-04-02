class RealtimeGateway {
  constructor() {
    this.clients = new Set();
  }

  addClient(response) {
    this.clients.add(response);

    response.write("event: connected\n");
    response.write(`data: ${JSON.stringify({ connectedAt: new Date().toISOString() })}\n\n`);

    return () => {
      this.clients.delete(response);
    };
  }

  broadcast(event, payload) {
    const content = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;

    for (const client of this.clients) {
      try {
        client.write(content);
      } catch (error) {
        this.clients.delete(client);
      }
    }
  }
}

module.exports = new RealtimeGateway();
