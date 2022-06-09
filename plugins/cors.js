const fp = require('fastify-plugin')

module.exports = fp(async function (fastify, opts) {
  fastify.register(require('@fastify/cors'), {
    methods: ['GET', 'PUT', 'POST'],
    origin: true,
    credentials: true,
  })
})
