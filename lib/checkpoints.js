// Copyright (c) 2019, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

'use strict'

const fs = require('fs')
const readLastLines = require('read-last-lines')
const request = require('request-promise-native')

class CheckpointHelper {
  static addCheckPointsToFile (filename, data) {
    return new Promise((resolve, reject) => {
      fs.appendFile(filename, data, (error) => {
        if (error) return reject(error)
        return resolve()
      })
    })
  }

  static networkHeight () {
    return new Promise((resolve, reject) => {
      request({
        url: 'https://blockapi.turtlepay.io/height',
        method: 'get',
        json: true
      }).then((result) => {
        return resolve(result.network_height)
      }).catch((error) => {
        return reject(error)
      })
    })
  }

  static lastCheckPoint (filename) {
    return new Promise((resolve, reject) => {
      const promises = []

      if (fs.existsSync(filename)) {
        promises.push(readLastLines.read(filename, 1))
      }

      Promise.all(promises).then((lastLine) => {
        if (lastLine.length > 0) {
          try {
            return resolve(parseInt(lastLine[0].trim().split(',', 1)[0]))
          } catch (e) {
            return reject(new Error('Error parsing checkpoints file. Are you sure this file contains checkpoints?'))
          }
        }

        return resolve(0)
      })
    })
  }

  static retrieveCheckPoints (startHeight, endHeight) {
    return new Promise((resolve, reject) => {
      const batches = []

      for (var i = endHeight; i > startHeight; i -= 1000) {
        batches.push(i)
      }
      batches.reverse()

      retrieveBatches(batches).then((responses) => {
        const lines = []

        responses.forEach((response) => {
          response.forEach((block) => {
            if (block.height <= startHeight) return

            lines.push([
              block.height,
              block.hash
            ])
          })
        })

        lines.sort((a, b) => (a[0] > b[0]) ? 1 : -1)

        return lines.map(elem => elem.join(','))
      }).then((lines) => {
        return lines.join('\n') + '\n'
      }).then((lines) => {
        return resolve(lines)
      }).catch((error) => {
        return reject(error)
      })
    })
  }
}

function getBlocksHashByHeight (height) {
  return request({
    url: 'https://blockapi.turtlepay.io/block/headers/' + height + '/bulk',
    method: 'get',
    json: true,
    timeout: 10000
  })
}

function retrieveBatches (batches) {
  return new Promise((resolve, reject) => {
    const responses = [];

    (async () => {
      while (batches.length > 0) {
        try {
          const batch = batches.shift()
          const response = await getBlocksHashByHeight(batch)
          responses.push(response)
        } catch (e) {
          return reject(e)
        }
      }

      return (resolve(responses))
    })()
  })
}

module.exports = CheckpointHelper
