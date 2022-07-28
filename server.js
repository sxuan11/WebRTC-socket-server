'use strict'
const fs = require('fs')
// Read the .env file.
require('dotenv').config()

// Require the framework
const Fastify = require('fastify')

// Require library to exit fastify process, gracefully (if possible)
const closeWithGrace = require('close-with-grace')

// Instantiate Fastify with some config
const app = Fastify({
  logger: true,
  https: {
    key: fs.readFileSync('./7070_key.key'),
    cert: fs.readFileSync('./7070_chain.crt')
  }
})

// Register your application as a normal plugin.
const appService = require('./app.js')
app.register(appService)

// delay is the number of milliseconds for the graceful close to finish
const closeListeners = closeWithGrace({ delay: 500 }, async function ({ signal, err, manual }) {
  if (err) {
    app.log.error(err)
  }
  await app.close()
})

app.addHook('onClose', (instance, done) => {
  closeListeners.uninstall()
  done()
})

// Start listening.
app.listen({ port: process.env.PORT || 7070 }, (err) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
})
