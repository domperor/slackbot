const {stripIndent} = require('common-tags');
const axios = require('axios');

module.exports = (clients) => {
	const {rtmClient: rtm, webClient: slack} = clients;

	const notify = async ({type, channel, user}) => {
		await axios.post('https://slack.com/api/channels.invite', {
			channel: channel,
			user: process.env.USER_TSGBOT,
		}, {
			headers: {
				Authorization: `Bearer ${process.env.HAKATASHI_TOKEN}`,
			},
		});

		const verb = type === 'create' ? '作成' : 'アーカイブから復元';

		await slack.chat.postMessage({
			channel: process.env.CHANNEL_RANDOM,
			text: stripIndent`
				<@${user}>が<#${channel}>を${verb}しました
			`,
			username: 'channel-notifier',
			// eslint-disable-next-line camelcase
			icon_emoji: ':new:',
		});
	};

	rtm.on('channel_created', (data) => (
		notify({
			type: 'create',
			channel: data.channel.id,
			user: data.channel.creator,
		})
	));

	rtm.on('channel_unarchive', (data) => (
		notify({
			type: 'unarchive',
			channel: data.channel,
			user: data.user,
		})
	));
};
