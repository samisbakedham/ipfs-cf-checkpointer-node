// Copyright (c) 2019, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

'use strict'

const IPFS = require('ipfs')
const pinataSDK = require('@pinata/sdk')
const EventEmitter = require('events')

class PinataPinner extends EventEmitter {
  constructor (pinata, hash, filename) {
    super()

    const that = this
    function checkPin () {
      isPending(pinata, hash).then((pending) => {
        if (!pending) {
          isPinned(pinata, hash).then((pinned) => {
            if (pinned) {
              return that.emit('pinned', hash)
            }
            return that.emit('failed', hash)
          })
        } else {
          that.emit('pinPending', hash)
          setTimeout(checkPin, 5000)
        }
      })
    }

    pinata.addHashToPinQueue(hash, {
      pinataMetadata: {
        name: filename
      }
    }).then(() => {
      checkPin()
    }).catch((error) => {
      this.emit('error', error)
    })
  }
}

class IPFSHelper extends EventEmitter {
  constructor (apiKey, apiSecretKey) {
    super()

    this.pinata = pinataSDK(apiKey, apiSecretKey)
  }

  start () {
    return new Promise((resolve, reject) => {
      this.pinata.testAuthentication().then(() => {
        return IPFS.create({
          silent: true
        })
      }).then((ipfs) => {
        this.ipfs = ipfs
        this.ipfs.on('error', error => this.emit('error', error))
      }).then(() => {
        return resolve()
      }).catch((error) => {
        return reject(error)
      })
    })
  }

  stop () {
    return this.ipfs.stop()
  }

  addFile (file) {
    return new Promise((resolve, reject) => {
      this.ipfs.addFromFs(file, (err, result) => {
        if (err) return reject(err)
        return resolve(result[0])
      })
    })
  }

  pin (hash) {
    return new Promise((resolve, reject) => {
      this.ipfs.pin.add(hash).then(() => {
        return resolve(hash)
      }).catch((error) => {
        return reject(error)
      })
    })
  }

  stick (hash, filename) {
    return new Promise((resolve, reject) => {
      const pinner = new PinataPinner(this.pinata, hash, filename)
      pinner.on('pinPending', hash => this.emit('pinPending', hash))
      pinner.on('pinned', hash => {
        return resolve(hash)
      })
      pinner.on('failed', hash => {
        return reject(new Error('Could not pin the tail on the donkey'))
      })
    })
  }
}

function isPending (pinata, hash) {
  return new Promise((resolve, reject) => {
    pinata.pinJobs({
      ipfs_pin_hash: hash,
      status: 'searching'
    }).then((result) => {
      if (result.count !== 0) return resolve(true)
      return resolve(false)
    }).catch(() => {
      return resolve(true)
    })
  })
}

function isPinned (pinata, hash) {
  return new Promise((resolve, reject) => {
    pinata.pinList({
      status: 'pinned',
      hashContains: hash
    }).then((result) => {
      if (result.count !== 0) return resolve(true)
      return resolve(false)
    }).catch(() => {
      return resolve(false)
    })
  })
}

module.exports = IPFSHelper
