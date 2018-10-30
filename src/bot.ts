import { MatrixClient } from "matrix-js-sdk";
import * as yaml from "js-yaml";
import * as fs from "fs";
import * as request from "request";
import * as cron from "node-cron";

let curAvatarMxcUrl = "";
let yamlConfig;

function getRandomAvatar(): string {
	const newAvatar = yamlConfig.avatars[Math.floor(Math.random() * yamlConfig.avatars.length)];
	if (newAvatar === curAvatarMxcUrl) {
		return getRandomAvatar();
	}
	return newAvatar;
}

async function run() {
	yamlConfig = yaml.safeLoad(fs.readFileSync("config.yaml", "utf-8"));
	const userMxid = `@${yamlConfig.bot.userId}:${yamlConfig.bot.homeserver}`;
	const client = new MatrixClient({
		accessToken: yamlConfig.bot.accessToken,
		baseUrl: yamlConfig.bot.baseUrl,
		request,
		userId: userMxid,
	});
	await client.startClient();
	try {
		curAvatarMxcUrl = (await client.getProfileInfo(userMxid, "avatar_url")).avatar_url;
	} catch (err) {
		console.log(err);
	}
	console.log(`Existing avatar url: ${curAvatarMxcUrl}`);
	cron.schedule(yamlConfig.schedule, async () => {
		try {
			curAvatarMxcUrl = getRandomAvatar();
			console.log(`Setting new avatar ${curAvatarMxcUrl}`);
			await client.setAvatarUrl(curAvatarMxcUrl);
		} catch (err) {
			console.log(`Error setting new avatar ${curAvatarMxcUrl}`);
			console.log(err);
		}
	});
}

run(); // tslint:disable-line no-floating-promises
