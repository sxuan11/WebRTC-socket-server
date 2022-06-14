const { debounce }  = require('lodash');


module.exports = async function (fastify, opts) {
  const redis = fastify.redis;
  const IONameSpace = fastify.io.of('/');
  fastify.io.on('connection', async (socket) => {
    const room = socket.handshake.query.room;
    const roomUser = await redis.get(room);
    let userList;
    if(roomUser) {
      userList = new Map(JSON.parse(roomUser))
    } else {
      userList = new Map();
    }
    function broadcastToNewLogin(id) {
      for (const [k, v] of userList) {
        if(Object.prototype.hasOwnProperty.call(v, 'offer')) {
          IONameSpace.sockets.get(id).emit('offer', v.offer);
        }
        if(Object.prototype.hasOwnProperty.call(v, 'candidate')) {
          for (const vElement of v.candidate) {
            IONameSpace.sockets.get(id).emit('ICE-candidate', vElement);
          }
        }
      }
    }

    function setUser(userId, type, value) {
      if(userList.get(userId)) {
        userList.set(userId, { ...userList.get(userId), [type]: value })
      } else {
        userList.set(userId, { [type]: value })
      }
    }

    function setICE(userId, data) {
      const obj = userList.get(userId)
      if(obj.candidate) {
        obj.candidate = [...obj.candidate].concat([data]);
      } else {
        obj.candidate = [data]
      }
      userList.set(userId, obj);
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
    setUser(userId ,'nick', nick);
    setUser(userId ,'sockId', socket.id);
    if (room) {
      socket.join(room);
      socket.to(room).emit('join', userId);
      await debounceSetRedis();
      broadcastToNewLogin(socket.id)
    }
    socket.on('disconnect', async (socket) => {
      console.log('someone leave->', socket)
      rmUser(userId);
      await debounceSetRedis();
    })

    socket.on('speak', (message, callback) => {
      socket.to(room).emit('speak', message);
      console.log(IONameSpace.sockets, 'sockets');
      callback({
        status: "ok"
      })
    })

    socket.on('offer', async (offer, callback) => {
      socket.to(room).emit('offer', offer);
      setUser(userId, 'offer', offer);
      console.log("=>(index.js:67) offer", offer, userId);
      await debounceSetRedis();
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

    socket.on('ICE-candidate', async (data, callback) => {
      socket.to(room).emit('ICE-candidate', data);
      setICE(userId, data);
      await debounceSetRedis();
      callback({
        status: "ok"
      })
    })
  })
}
