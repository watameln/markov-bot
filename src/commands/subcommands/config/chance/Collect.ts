import SubCommand from "../../../../structures/SubCommand";

import { ApplicationCommandOptionType, ChatInputCommandInteraction } from "discord.js";
import ClientInterface from "../../../../interfaces/ClientInterface";

export default class CollectSubCommand extends SubCommand {
    constructor(client: ClientInterface) {
        super(
            client,
            "commands.collectChance.command.name",
            "commands.collectChance.command.description",
            [
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: "commands.collectChance.command.options.0.name",
                    description: "commands.collectChance.command.options.0.description",
                    required: true,
                    minValue: 1,
                    maxValue: 50
                }
            ]
        );
    }

    async run(interaction: ChatInputCommandInteraction) {
        const lng = { lng: interaction.locale };

        let chance = interaction.options.getInteger(this.options[0].name);
        if (!chance || chance > 50 || chance < 1) return;

        const database = await this.client.database.fetch(interaction.guildId);

        try {
            await database.setCollectionPercentage(chance / 100);

            return interaction.reply(this.t("commands.collectChance.text", { ...lng, chance }));
        } catch(e) {
            return interaction.reply({ content: this.t("vars.error", lng), ephemeral: true });
        }
    }
}