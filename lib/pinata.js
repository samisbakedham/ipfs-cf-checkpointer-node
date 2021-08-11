// Copyright (c) 2019, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

'use strict'

const EventEmitter = require('events')
const fs = require('fs')
const path = require('path')
const pinataSDK = require('@pinata/sdk')

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

class PinataHelper extends EventEmitter {
  constructor (apiKey, apiSecretKey) {
    super()

    this.pinata = pinataSDK(apiKey, apiSecretKey)

    this.pinata.testAuthentication().catch((error) => {
      throw new Error(error.toString())
    })
  }

  cleanFiles (keepHash, filename) {
    filename = path.basename(filename) || ''
    return new Promise((resolve, reject) => {
      const unpins = []

      this.findPinnedFiles(filename).then((result) => {
        const promises = []

        result.rows.forEach((item) => {
          if (item.ipfs_pin_hash !== keepHash) {
            unpins.push(item.ipfs_pin_hash)
            promises.push(this.unpin(item.ipfs_pin_hash))
          }
        })

        return Promise.all(promises)
      }).then(() => {
        return resolve(unpins)
      }).catch((error) => {
        return reject(error)
      })
    })
  }

  findPinnedFiles (filename) {
    return this.pinata.pinList({
      status: 'pinned',
      metadata: {
        name: filename
      }
    })
  }

  pin (hash, filename) {
    filename = path.basename(filename) || ''
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

  pinFile (filename) {
    return new Promise((resolve, reject) => {
      const rs = fs.createReadStream(filename)
      this.pinata.pinFileToIPFS(rs, {
        pinataMetadata: {
          name: path.basename(filename)
        }
      }).then((result) => {
        return resolve(result.IpfsHash)
      }).catch((error) => {
        return reject(error)
      })
    })
  }

  unpin (hash) {
    return new Promise((resolve, reject) => {
      this.pinata.removePinFromIPFS(hash)
        .then(() => { return resolve() })
        .catch(() => { return resolve() })
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

module.exports = PinataHelper
