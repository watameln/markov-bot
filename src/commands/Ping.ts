import Command from "../structures/Command";

import { ChatInputCommandInteraction } from "discord.js";
import ClientInterface from "../interfaces/ClientInterface";

export default class PingCommand extends Command {
    public skipBan: boolean = true;
    public allowedDm: boolean = true;

    constructor(client: ClientInterface) {
        super(
            client,
            "ping",
            "commands.ping.command.description"
        );
    }

    async run(interaction: ChatInputCommandInteraction) {
        return interaction.reply(`🏓 **Ping:** ${this.client.ws.ping} ms.`);
    }
}