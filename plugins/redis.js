const fp = require('fastify-plugin')

module.exports = fp(async function (fastify, opts) {
  fastify.register(require('@fastify/redis'), {
    host: '127.0.0.1',
    port: 16379, // Redis port
  })
})
