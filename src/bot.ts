import { Client, GatewayIntentBits, Collection } from "discord.js";
import * as i18next from "i18next";
import * as i18nbackend from "i18next-fs-backend";

import DatabaseConnection from "./modules/database/DatabaseConnection";
import DatabaseManager from "./modules/database/DatabaseManager";

import EventHandler from "./handlers/EventHandler";
import ClientInterface from "./interfaces/ClientInterface";

/**
 * Bot core.
 */
export default new class Bot {
    private sweeper = {
        interval: 3600,
        filter: () => () => true
    };

    public client: ClientInterface = new Client({
        allowedMentions: { parse: [] },
        failIfNotExists: false,
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages
        ],
        sweepers: {
            users: this.sweeper,
            messages: this.sweeper,
            guildMembers: {
                interval: 3600,
                filter: () => (member) => member.user.id != this.client.user.id
            }
        }
    });

    constructor() {
        const { client } = this;
        
        client.config = {
            admins: [ "442000634716225536" ],
            devGuilds: []
        };
        client.cooldown = new Collection();
        client.commands = new Collection();
        client.database = new DatabaseManager(client);

        this.loadLocales();
        this.connectDatabase()
            .then(() => {
                console.log("[Database]", "Connected to database.");

                this.client.login(process.env.NODE_ENV == "dev" ? process.env.TEST_BOT_TOKEN : process.env.BOT_TOKEN);
            });

        new EventHandler(client);
    }

    private loadLocales(): void {
        i18next
            .use(i18nbackend)
            .init({
                initImmediate: false,
                lng: "en",
                fallbackLng: "en",
                preload: ["en", "pt"],
                backend: {
                    loadPath: "./locales/{{lng}}.json"
                },
                interpolation: {
                    escapeValue: false
                }
            }, (err) => {
                if (err) {
                    throw new Error("[i18n] Failed to load the translations: " + err);
                }
            
                this.client.i18n = i18next;
            });
    }

    private connectDatabase(): Promise<void> {
        const dbConnection = new DatabaseConnection(process.env.DB_PATH);

        return dbConnection.connect();
    }
}