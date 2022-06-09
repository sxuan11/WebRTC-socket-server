module.exports = async function (fastify, opts) {
  fastify.io.on('connection', (socket) => {
    console.log('some one join')
    const room = socket.handshake.query.room;
    const userId = socket.handshake.query.userId;
    if (room) {
      socket.join(room);
      socket.to(room).emit('join', userId);
    }
    socket.on('disconnect', () => {
      console.log('someone leave')
    })

    socket.on('speak', (message, callback) => {
      socket.to(room).emit('speak', message);
      callback({
        status: "ok"
      })
    })

    socket.on('offer', (offer, callback) => {
      socket.to(room).emit('offer', offer);
      callback({
        status: "ok"
      })
    })

    socket.on('answer', (answer, callback) => {
      socket.to(room).emit('answer', answer);
      callback({
        status: "ok"
      })
    })

    socket.on('ICE-candidate', (data, callback) => {
      socket.to(room).emit('ICE-candidate', data);
      callback({
        status: "ok"
      })
    })
  })
}
