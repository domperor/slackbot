/* eslint-disable no-undef */
import noop from 'lodash/noop';
// @ts-ignore
import MockFirebase from 'mock-cloud-firestore';
// @ts-ignore
import Slack from '../lib/slackMock.js';

import achievements from './index_production';

let slack: Slack = null;

jest.mock('../lib/slackUtils');

jest.mock('../lib/firestore', () => {
	const firebase = new MockFirebase({});
	const db = firebase.firestore();
	db.runTransaction = noop;
	return db;
});

beforeEach(() => {
	slack = new Slack();
	process.env.CHANNEL_SANDBOX = slack.fakeChannel;
	achievements(slack);
});

describe('achievements', () => {
	it('unlock chat achievement when chat is posted', async () => {
		const {text, username} = await slack.getResponseTo('hoge');
		expect(username).toBe('achievements');
		expect(text).toContain('はじめまして!');
	});
});
