import Twitter from 'twitter';
import dotenv from 'dotenv';
import moment from 'moment';
import type { MessageCreateEvent, User } from '../lib/twitter';
import type { SlackInterface } from '../lib/slack';
dotenv.config();

const twitterClient = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY!,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET!,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY!,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
});

const getDMs = async (options: { after?: string; count: number; } = { count: 50 }) => {
    const { after, count } = options;
    const response = await twitterClient.get('direct_messages/events/list', { count });
    const events = response.events as MessageCreateEvent[];
    return after ? events.filter(event => event.id > after) : events;
};

interface UserInfo {
    id: string;
    name: string;
    screen_name: string;
    profile: string;
    iconImageUrl: string;
    isProtected: boolean;
}

const getUserInfo = async (id: string) => {
    const user = await twitterClient.get('users/show', { user_id: id }) as User;
    return {
        id: user.id_str,
        name: user.name,
        screen_name: user.screen_name,
        profile: user.description,
        iconImageUrl: user.profile_image_url_https,
        isProtected: user.protected,
    } as UserInfo;
};

export default async ({ webClient }: SlackInterface) => {
    const job = async () => {
        const dms = await getDMs();
        const newDMs = dms.filter(dm =>
            moment(dm.created_timestamp, 'x') > moment().subtract(2, 'minutes')
        ).reverse();
        let latestUser: UserInfo | undefined;
        for (const dm of newDMs) {
            const userId = dm.message_create.sender_id;
            const isUserUpdated = latestUser?.id !== userId;
            const user = isUserUpdated ? await getUserInfo(dm.message_create.sender_id) : latestUser;
            latestUser = user;
            let text = dm.message_create.message_data.text;
            for (const url of dm.message_create.message_data.entities.urls) {
                text = text.replace(url.url, url.expanded_url);
            }
            const blocks: any = [{
                type: 'section',
                text: {
                    type: 'plain_text',
                    text: text,
                },
            }];
            const userDescription = (user.isProtected ? ':lock:' : '')
                + `<https://twitter.com/${user.screen_name}|@${user.screen_name}>`;
            if (isUserUpdated) {
                blocks.unshift(
                    {
                        type: 'context',
                        elements: [
                            {
                                type: 'image',
                                image_url: user.iconImageUrl,
                                alt_text: `@${user.screen_name}'s icon`,
                            },
                            {
                                type: 'mrkdwn',
                                text: userDescription + '\n' + user.profile,
                            },
                        ],
                    },
                );
            }
            await webClient.chat.postMessage({
                channel: process.env.CHANNEL_PUBLIC_OFFICE,
                username: 'Direct message to @tsg_ut',
                icon_emoji: ':twitter:',
                text: dm.message_create.message_data.text,
                blocks,
            });
        }
    };

    setInterval(job, 2 * 60 * 1000);
};