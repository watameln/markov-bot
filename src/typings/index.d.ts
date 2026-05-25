declare global {
    namespace NodeJS {
        interface ProcessEnv {
            /** Bot token. */
            BOT_TOKEN: string;
            /** Optional local database path. Defaults to ./data/database.json */
            DB_PATH?: string;
            /** Test bot token. */
            TEST_BOT_TOKEN?: string;
            /** Discord webhook for logs (guild join/leave, shard status...) */
            SERVER_LOG?: string;
        }
    }
}

export {};