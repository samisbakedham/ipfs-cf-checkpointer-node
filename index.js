// Copyright (c) 2019, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

'use strict'

require('colors')
require('dotenv').config()
const CheckPointsHelper = require('./lib/checkpoints')
const CloudflareHelper = require('./lib/cloudflare')
const IPFSHelper = require('./lib/ipfs')
const path = require('path')
const util = require('util')

function log (message) {
  console.log(util.format('%s: %s', (new Date()).toUTCString(), message))
}

if (!process.env.PINATA_API_KEY || !process.env.PINATA_SECRET_API_KEY) {
  log('[ERROR] Please verify that you have supplied a PINATA_API_KEY and PINATA_SECRET_API_KEY'.red)
  process.exit(1)
}

if (!process.env.CLOUDFLARE_TOKEN || !process.env.CLOUDFLARE_ZONE_ID || !process.env.CLOUDFLARE_SUBDOMAIN) {
  log('[ERROR] Please verify that you have supplied a CLOUDFLARE_TOKEN, CLOUDFLARE_ZONE_ID, and CLOUDFLARE_SUBDOMAIN'.red)
  process.exit(1)
}

if (!process.env.NODE_ENV || process.env.NODE_ENV.toLowerCase() !== 'production') {
  log('[WARNING] Node.js is not running in production mode. Consider running in production mode: export NODE_ENV=production'.yellow)
}

const ipfs = new IPFSHelper(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_API_KEY)

const cloudflare = new CloudflareHelper(process.env.CLOUDFLARE_TOKEN)

const checkpointsFile = path.resolve(process.env.CHECKPOINT_FILE || './checkpoints.csv')
const checkpointsDelayDays = process.env.CHEcKPOINT_DELAY || 1
const checkpointsDelay = checkpointsDelayDays * 2880

var lastKnownHeight = -1

ipfs.on('error', error => {
  log(util.format('[ERROR] %s', error.toString()).red)
  process.exit(1)
})

ipfs.on('pinPending', hash => {
  log(util.format('[INFO] Pinata pin currently pending for: %s', hash).yellow)
})

cloudflare.verifyToken().then(() => {
  log('[INFO] Cloudflare Token Verified'.green)
  return ipfs.start()
}).then(() => {
  log('[INFO] IPFS subsystem started'.green)

  return CheckPointsHelper.lastCheckPoint(checkpointsFile)
}).then((height) => {
  lastKnownHeight = height
  log(util.format('[INFO] Block Delay: %s', checkpointsDelay).green)
  log(util.format('[INFO] Starting from block: %s', (lastKnownHeight >= 0) ? lastKnownHeight : 0).green)

  return CheckPointsHelper.networkHeight()
}).then((networkHeight) => {
  const checkpointsStop = networkHeight - checkpointsDelay
  const checkpointsToGenerate = checkpointsStop - lastKnownHeight
  log(util.format('[INFO] Network at block: %s', networkHeight).green)

  if (checkpointsToGenerate < 0) {
    throw new Error('The current checkpoints file contains more blocks than the configured delay allows. Cancelling...')
  }

  log(util.format('[INFO] Updating checkpoints to block: %s (%s blocks)', networkHeight - checkpointsDelay, checkpointsToGenerate).green)

  return CheckPointsHelper.retrieveCheckPoints(lastKnownHeight, checkpointsStop)
}).then((checkpoints) => {
  return CheckPointsHelper.addCheckPointsToFile(checkpointsFile, checkpoints)
}).then(() => {
  log(util.format('[INFO] Updated checkpoints in: %s', checkpointsFile).green)

  return ipfs.addFile(checkpointsFile)
}).then((result) => {
  log(util.format('[INFO] IPFS Hash: %s', result.hash).green)

  return ipfs.pin(result.hash)
}).then((hash) => {
  log(util.format('[INFO] Pinned IPFS hash locally: %s', hash).green)

  return ipfs.stick(hash, 'checkpoints.csv')
}).then((hash) => {
  log(util.format('[INFO] Pinned IPFS hash via Pinata: %s', hash).green)

  return cloudflare.setIPFSDNSLink(process.env.CLOUDFLARE_ZONE_ID, process.env.CLOUDFLARE_SUBDOMAIN, hash)
}).then((info) => {
  log(util.format('[INFO] Updated Cloudflare IPFS DNSlink record for [%s] to: %s', process.env.CLOUDFLARE_SUBDOMAIN, info.hash).green)

  return ipfs.stop()
}).then(() => {
  log('[INFO] Process complete. Exiting...'.green)
}).catch((error) => {
  log(error.toString().red)
  process.exit(1)
})
