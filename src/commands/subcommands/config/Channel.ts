import SubCommand from "../../../structures/SubCommand";

import { ChatInputCommandInteraction, ApplicationCommandOptionType, ChannelType } from "discord.js";
import ClientInterface from "../../../interfaces/ClientInterface";

export default class ChannelSubCommand extends SubCommand {
    constructor(client: ClientInterface) {
        super(
            client,
            "commands.channel.command.name",
            "commands.channel.command.description",
            [
                {
                    type: ApplicationCommandOptionType.Channel,
                    name: "commands.channel.command.options.0.name",
                    description: "commands.channel.command.options.0.description",
                    channelTypes: [ ChannelType.GuildText, ChannelType.GuildPublicThread, ChannelType.GuildPrivateThread ],
                    required: true
                }
            ]
        );
    }

    async run(interaction: ChatInputCommandInteraction) {
        const lng = { lng: interaction.locale };
        const channel = interaction.options.getChannel(this.options[0].name);
        const database = await this.client.database.fetch(interaction.guildId);

        try {
            await database.configChannel(channel.id);

            return await interaction.reply(this.t("commands.channel.text", { ...lng, channel: `<#${channel.id}>` }));
        } catch (e) {
            return await interaction.reply(this.t("vars.error", lng));
        }
    }
}