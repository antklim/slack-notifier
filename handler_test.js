const assert = require('assert')
const cloneDeep = require('clone-deep')
const sinon = require('sinon')

const handler = require('./handler')
const snsEventPayload = require('./sns-event-example')

// eventId, err, file, meta

describe('Slack notifier', () => {

  let sandbox = null

  beforeEach(() => sandbox = sinon.sandbox.create())
  afterEach(() => sandbox.restore())

  describe('main', () => {
    it('should send success message to Slack if SNS message does not contain `err` attribute', (done) => {
      const spy = sandbox.spy(handler, '_sendNotificationToSlack')
      // TODO: add stub for POST to Slack

      const payload = cloneDeep(snsEventPayload)
      payload.Records[0].Sns.Message = JSON.stringify({
        eventId: 'Ev1234',
        file: 'test/file.jpg',
        meta: 'test/file.json'
      })

      const expectedNotification = {
        eventId: 'Ev1234',
        file: 'test/file.jpg',
        meta: 'test/file.json'
      }

      handler.main(payload, {}, (err) => {
        assert.ifError(err)
        assert(spy.calledOnce)
        assert.deepEqual(spy.args[0][0], expectedNotification)
        // TODO: add POST options check
        done()
      })
    })

    it('should send error message to Slack if SNS message contains `err` attribute', (done) => {
      const spy = sandbox.spy(handler, '_sendNotificationToSlack')
      // TODO: add stub for POST to Slack

      const payload = cloneDeep(snsEventPayload)
      payload.Records[0].Sns.Message = JSON.stringify({
        eventId: 'Ev1234',
        err: 'Permission denied'
      })

      const expectedNotification = {
        eventId: 'Ev1234',
        err: 'Permission denied'
      }

      handler.main(payload, {}, (err) => {
        assert.ifError(err)
        assert(spy.calledOnce)
        assert.deepEqual(spy.args[0][0], expectedNotification)
        // TODO: add POST options check
        done()
      })
    })

    it('should call error callback if cannot parse message from SNS', (done) => {
      const spy = sandbox.spy(handler, '_sendNotificationToSlack')
      // TODO: add spy for POST to Slack

      const payload = cloneDeep(snsEventPayload)

      handler.main(payload, {}, (err) => {
        assert(err)
        assert(spy.notCalled)
        // TODO: POST not called check
        done()
      })
    })
  })

})
