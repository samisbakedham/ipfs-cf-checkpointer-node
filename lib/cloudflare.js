// Copyright (c) 2019, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

'use strict'

const baseUrl = 'https://api.cloudflare.com/client/v4/'
const request = require('request-promise-native')
const util = require('util')

class CloudflareHelper {
  constructor (token) {
    this.token = token
  }

  verifyToken () {
    return get(this.token, 'user/tokens/verify')
  }

  setIPFSDNSLink (zoneId, hostname, hash) {
    const host = util.format('_dnslink.%s', hostname)
    const value = util.format('dnslink=/ipfs/%s', hash)

    return new Promise((resolve, reject) => {
      this.getDNSLinkId(zoneId, hostname).then((recordId) => {
        const promises = []

        if (recordId) {
          promises.push(this.updateTxtRecord(zoneId, host, recordId, value))
        } else {
          promises.push(this.createTxtRecord(zoneId, host, value))
        }

        return Promise.all(promises)
      }).then((results) => {
        if (results.length !== 0) {
          return resolve({ id: results[0], hash: hash })
        }
        return reject(new Error('Could not set record'))
      }).catch((error) => {
        return reject(error)
      })
    })
  }

  createTxtRecord (zoneId, hostname, value) {
    return new Promise((resolve, reject) => {
      post(this.token, util.format('zones/%s/dns_records', zoneId), {
        type: 'TXT',
        name: hostname,
        content: value
      }).then((result) => {
        if (result.success) return resolve(result.result.id)
        return reject(new Error('Could not create record'))
      }).catch((error) => {
        return reject(error)
      })
    })
  }

  updateTxtRecord (zoneId, hostname, recordId, value) {
    return new Promise((resolve, reject) => {
      put(this.token, util.format('zones/%s/dns_records/%s', zoneId, recordId), {
        type: 'TXT',
        name: hostname,
        content: value
      }).then((result) => {
        if (result.success) return resolve(result.result.id)
        return reject(new Error('Could not create record'))
      }).catch((error) => {
        return reject(error)
      })
    })
  }

  getTxtRecordId (zoneId, hostname) {
    return new Promise((resolve, reject) => {
      get(this.token, util.format('zones/%s/dns_records?type=TXT&per_page=100', zoneId)).then((results) => {
        results.result.forEach((record) => {
          if (record.name === hostname) {
            return resolve(record.id)
          }
        })

        return resolve(false)
      }).catch((error) => {
        return reject(error)
      })
    })
  }

  getDNSLinkId (zoneId, hostname) {
    return this.getTxtRecordId(zoneId, util.format('_dnslink.%s', hostname))
  }
}

function get (token, endpoint) {
  return request({
    url: util.format('%s%s', baseUrl, endpoint),
    json: true,
    timeout: 5000,
    headers: {
      Authorization: util.format('Bearer %s', token)
    }
  })
}

function post (token, endpoint, data) {
  return request({
    url: util.format('%s%s', baseUrl, endpoint),
    json: true,
    method: 'post',
    timeout: 5000,
    body: data,
    headers: {
      Authorization: util.format('Bearer %s', token)
    }
  })
}

function put (token, endpoint, data) {
  return request({
    url: util.format('%s%s', baseUrl, endpoint),
    json: true,
    method: 'put',
    timeout: 5000,
    body: data,
    headers: {
      Authorization: util.format('Bearer %s', token)
    }
  })
}

module.exports = CloudflareHelper
