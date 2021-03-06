'use strict'

const request = require('https')
const qs = require('querystring')

/**
 * DEBUG (optional) - allows debug information logging
 * ERROR (optional) - allows error information logging
 * SLACK_URL        - Slack endpoint to send messages to
 * ACCESS_TOKEN     - Access token generated by Slack to grant permission to post message
 */
const {DEBUG, ERROR, SLACK_URL, ACCESS_TOKEN} = process.env

const debug = (...args) => (DEBUG) ? console.log.apply(null, args) : null
const error = (...args) => (ERROR) ? console.error.apply(null, args) : null

const getMessage = (data) => {
  const messageExists = data && data.Records && data.Records[0] && data.Records[0].Sns && data.Records[0].Sns.Message
  return (messageExists) ? data.Records[0].Sns.Message : null
}

exports.main = (data, aws, cb) => {
  debug(`Records from SNS: ${JSON.stringify(data, null, 2)}`)

  const message = getMessage(data)
  debug(`Processing result message: ${message}`)

  // it also includes empty String
  if (!message) {
    cb()
    return
  }

  let notification = null
  try {
    notification = JSON.parse(message)
  } catch (e) {
    cb(e)
    return
  }

  exports._sendNotificationToSlack(notification, cb)
}

exports._sendNotificationToSlack = (notification, cb) => {
  debug(`Notification for Slack: ${JSON.stringify(notification, null, 2)}`)

  const {eventId, channel, err, file, meta} = notification

  let text = `Event ${eventId} process ${(err) ? 'FAILURE' : 'SUCCESS'}\n`
  text += (err) ? err : `File URI: ${file}, metadata: ${meta}`

  const query = qs.stringify({token: ACCESS_TOKEN, channel, text})

  debug(`Sending message to Slack: ${text}`)

  // TODO: call cb as early as it possible
  request.get(`${SLACK_URL}?${query}`, (res) => {
    debug(res)
    cb()
  }).on('error', (err) => {
    error(err)
    cb()
  })
}
