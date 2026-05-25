import SubCommand from "../../../structures/SubCommand";

import { ChatInputCommandInteraction } from "discord.js";
import ClientInterface from "../../../interfaces/ClientInterface";

export default class DisableSubCommand extends SubCommand {
    constructor(client: ClientInterface) {
        super(
            client,
            "commands.disable.command.name",
            "commands.disable.command.description",
        );
    }

    async run(interaction: ChatInputCommandInteraction) {
        const lng = { lng: interaction.locale };
        const database = await this.client.database.fetch(interaction.guildId);

        try {
            await database.toggleActivity(false);

            return interaction.reply(this.t("commands.disable.text", lng));
        } catch(e) {
            return interaction.reply(this.t("vars.error", lng));
        }
    }
}