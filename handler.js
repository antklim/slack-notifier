'use strict'

const request = require('request')

/**
 * DEBUG (optional) - allows debug information logging
 * ERROR (optional) - allows error information logging
 * SLACK_URL        - AWS SNS topic name to send Slack message processing information
 */
const {DEBUG, ERROR, SLACK_URL} = process.env

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

  const {eventId, err, file, meta} = notification

  let message = `Event ${eventId} process ${(err) ? 'FAILURE' : 'SUCCESS'}\n`
  message += (err) ? err : `File URI: ${file}, metadata: ${meta}`

  debug(`Sending message to Slack: ${message}`)
  // request.post(SLACK_URL, cb)
  cb()
}
