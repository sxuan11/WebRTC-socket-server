const fp = require('fastify-plugin')

module.exports = fp(async function (fastify, opts) {
  fastify.register(require('@fastify/redis'), {
    host: '114.55.34.57',
    port: 16377, // Redis port
    password: 'sxuan@123',
  })
})
