process.env.SLACK_URL = 'https://test.com'
process.env.ACCESS_TOKEN = '123'

const assert = require('assert')
const https = require('https')
const cloneDeep = require('clone-deep')
const sinon = require('sinon')
const qs = require('querystring')

const handler = require('./handler')
const snsEventPayload = require('./sns-event-example')

describe('Slack notifier', () => {

  let sandbox = null

  beforeEach(() => sandbox = sinon.sandbox.create())
  afterEach(() => sandbox.restore())

  describe('main', () => {
    it('should send success message to Slack if SNS message does not contain `err` attribute', (done) => {
      const spy = sandbox.spy(handler, '_sendNotificationToSlack')
      const stub = sandbox.stub(https, 'get')
      stub.yields()

      const payload = cloneDeep(snsEventPayload)
      payload.Records[0].Sns.Message = JSON.stringify({
        eventId: 'Ev1234',
        channel: 'testChannel',
        file: 'test/file.jpg',
        meta: 'test/file.json'
      })

      const expectedNotification = {
        eventId: 'Ev1234',
        channel: 'testChannel',
        file: 'test/file.jpg',
        meta: 'test/file.json'
      }

      const expectedQuery = qs.stringify({
        token: '123',
        channel: 'testChannel',
        text: 'Event Ev1234 process SUCCESS\nFile URI: test/file.jpg, metadata: test/file.json'
      })

      handler.main(payload, {}, (err) => {
        assert.ifError(err)
        assert(spy.calledOnce)
        assert.deepEqual(spy.args[0][0], expectedNotification)

        assert(stub.calledOnce)
        assert.equal(stub.args[0][0], `https://test.com?${expectedQuery}`)

        done()
      })
    })

    it('should send error message to Slack if SNS message contains `err` attribute', (done) => {
      const spy = sandbox.spy(handler, '_sendNotificationToSlack')
      const stub = sandbox.stub(https, 'get')
      stub.yields()

      const payload = cloneDeep(snsEventPayload)
      payload.Records[0].Sns.Message = JSON.stringify({
        eventId: 'Ev1234',
        channel: 'testChannel',
        err: 'Permission denied'
      })

      const expectedNotification = {
        eventId: 'Ev1234',
        channel: 'testChannel',
        err: 'Permission denied'
      }

      const expectedQuery = qs.stringify({
        token: '123',
        channel: 'testChannel',
        text: 'Event Ev1234 process FAILURE\nPermission denied'
      })

      handler.main(payload, {}, (err) => {
        assert.ifError(err)
        assert(spy.calledOnce)
        assert.deepEqual(spy.args[0][0], expectedNotification)

        assert(stub.calledOnce)
        assert.equal(stub.args[0][0], `https://test.com?${expectedQuery}`)

        done()
      })
    })

    it('should call error callback if cannot parse message from SNS', (done) => {
      const spySns = sandbox.spy(handler, '_sendNotificationToSlack')
      const spyGet = sandbox.spy(https, 'get')

      const payload = cloneDeep(snsEventPayload)

      handler.main(payload, {}, (err) => {
        assert(err)
        assert(spySns.notCalled)
        assert(spyGet.notCalled)
        done()
      })
    })
  })

})
