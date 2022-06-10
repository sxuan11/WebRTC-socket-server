module.exports = async function (fastify, opts) {
  const redis = fastify.redis;
  const userList = new Map();

  function broadcast() {

  }

  function setUser(userId, nick) {
    userList.set(userId, { nick })
  }

  function rmUser(userId) {
    userList.delete(userId);
  }
  fastify.io.on('connection', (socket) => {
    console.log('some one join')
    const room = socket.handshake.query.room;
    const roomUser = redis.get(room);
    if(!roomUser) {
      redis.set(room, userList)
    }
    const userId = socket.handshake.query.userId || Math.random();
    const nick = socket.handshake.query.nick || Math.random();
    setUser(userId ,nick)
    if (room) {
      socket.join(room);
      socket.to(room).emit('join', userId);
    }
    socket.on('disconnect', (socket) => {
      console.log('someone leave->', socket)
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
