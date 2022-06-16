'use strict'

module.exports = async function (fastify, opts) {
  fastify.get('/', async function (request, reply) {
    return {root: true}
  })

  fastify.get('/userlist', async function (request, reply) {
    const redis = fastify.redis;
    return await redis.get(request.query.room);
  })
}
