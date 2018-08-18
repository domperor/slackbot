/* eslint-env node, jest */

const tahoiya = require('./index.js');
const Slack = require('../lib/slackMock.js');

let slack = null;

beforeEach(async () => {
	slack = new Slack();
	process.env.CHANNEL_SANDBOX = slack.fakeChannel;
	await tahoiya(slack);
});

describe('tahoiya', () => {
	it('responds to "たほいや"', async () => {
		const {username, text, attachments} = await slack.getResponseTo('たほいや');

		expect(username).toBe('tahoiya');
		expect(text).toContain('たほいや');
		expect(attachments).toHaveLength(10);
	});
});