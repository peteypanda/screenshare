const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const nextHandler = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server);

  io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('signal', (data) => {
      // Broadcast the signal to all selected TVs
      data.tvs.forEach(tv => {
        socket.to(tv).emit('signal', data);
      });
    });

    socket.on('stop-screenshare', (data) => {
      // Broadcast stop signal to all selected TVs
      data.tvs.forEach(tv => {
        socket.to(tv).emit('stop-screenshare');
      });
    });

    socket.on('content-update', (data) => {
      // Broadcast content update to all selected TVs
      data.tvs.forEach(tv => {
        socket.to(tv).emit('content-update', data);
      });
    });

    socket.on('join-room', (room) => {
      socket.join(room);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  app.all('*', (req, res) => {
    return nextHandler(req, res);
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});