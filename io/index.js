const { debounce } = require('lodash');


module.exports = async function (fastify, opts) {
  const redis = fastify.redis;
  const IONameSpace = fastify.io.of('/');
  fastify.io.on('connection', async (socket) => {
    const room = socket.handshake.query.room;
    let userList;
    await getUserList()

    async function getUserList() {
      const roomUser = await redis.get(room);
      if (roomUser) {
        userList = new Map(JSON.parse(roomUser))
      } else {
        userList = new Map();
      }
    }

    function setUser(userId, type, value) {
      if (userList.get(userId)) {
        userList.set(userId, { ...userList.get(userId), [type]: value })
      } else {
        userList.set(userId, { [type]: value })
      }
    }

    function rmUser(userId) {
      userList.delete(userId);
    }

    async function setRedisRoom() {
      await redis.set(room, JSON.stringify([...userList]))
    }

    const debounceSetRedis = debounce(setRedisRoom, 1000)
    const userId = socket.handshake.query.userId || Math.random();
    const nick = socket.handshake.query.nick || Math.random();
    setUser(userId, 'nick', nick);
    setUser(userId, 'sockId', socket.id);
    if (room) {
      socket.join(room);
      await setRedisRoom();
      socket.to(room).emit('join', userId);
    }
    socket.on('disconnect', async (socket) => {
      await getUserList();
      rmUser(userId);
      await setRedisRoom();
    })

    socket.on('speak', (message, callback) => {
      socket.to(room).emit('speak', message);
      callback({
        status: "ok"
      })
    })

    // 发送Offer给所有人
    socket.on('offer', async (offer, callback) => {
      await getUserList();
      const user = userList.get(offer.recUserId);
      if (user) {
        const io = IONameSpace.sockets.get(user.sockId);
        if (!io) return;
        io.emit('offer', offer);
        callback({
          status: "ok"
        })
      }
    })

    // 发送Offer给所有人
    socket.on('oneOffer', async (offer, callback) => {
      await getUserList();
      const user = userList.get(offer.loginUserId);
      if (user) {
        const io = IONameSpace.sockets.get(user.sockId);
        if (!io) return;
        io.emit('oneOffer', offer);
        callback({
          status: "ok"
        })
      }
    })


    // answer给指定的人
    socket.on('answer', async (answer, callback) => {
      await getUserList();
      const user = userList.get(answer.creatorUserId);
      if (user) {
        const io = IONameSpace.sockets.get(user.sockId);
        if (!io) return;
        io.emit('answer', answer);
        callback({
          status: "ok"
        })
      }
    })

    socket.on('ICE-candidate', async (data, callback) => {
      await getUserList();
      const user = userList.get(data.recUserId);
      if (user) {
        const io = IONameSpace.sockets.get(user.sockId);
        if (!io) return;
        io.emit('ICE-candidate', data);
        callback({
          status: "ok"
        })
      }
    })
  })
}
