import { ApplicationCommandOptionType, ChatInputCommandInteraction, ChannelType, PermissionResolvable, PermissionsBitField } from "discord.js";
import Command from "../structures/Command";
import ClientInterface from "../interfaces/ClientInterface";

export default class ScrapeCommand extends Command {
    public skipBan: boolean = true;
    public permissions: PermissionResolvable = "MANAGE_GUILD";

    constructor(client: ClientInterface) {
        super(
            client,
            "scrape",
            "Scrape a channel's recent messages into the bot database.",
            [
                {
                    type: ApplicationCommandOptionType.Channel,
                    name: "channel",
                    description: "The channel to scrape.",
                    channelTypes: [ChannelType.GuildText, ChannelType.GuildPublicThread, ChannelType.GuildPrivateThread],
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: "limit",
                    description: "The number of recent messages to scrape (1-500).",
                    required: false,
                    minValue: 1,
                    maxValue: 500
                }
            ]
        );
    }

    async run(interaction: ChatInputCommandInteraction) {
        const channel = interaction.options.getChannel("channel");
        const limit = interaction.options.getInteger("limit") ?? 100;

        if (!interaction.guild || !channel) {
            return interaction.reply({ content: "Invalid guild or channel.", ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const guildChannel = await interaction.guild.channels.fetch(channel.id);
            const clientMember = await interaction.guild.members.fetchMe();

            if (!guildChannel || !guildChannel.isTextBased() || guildChannel.isDMBased()) {
                return interaction.editReply("That channel type is not supported for scraping.");
            }

            const permissions = clientMember.permissionsIn(guildChannel);
            if (!permissions?.has([PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory])) {
                return interaction.editReply("I need permission to view and read the message history in that channel.");
            }

            const database = await this.client.database.fetch(interaction.guildId);
            const existingIds = new Set((await database.getTexts()).map((item) => item.id));
            const messages = await guildChannel.messages.fetch({ limit: Math.min(Math.max(limit, 1), 500) });
            const sorted = Array.from(messages.values()).reverse();

            let added = 0;
            for (const message of sorted) {
                if (!message.content || message.content.trim().length < 1 || message.author.bot || existingIds.has(message.id)) {
                    continue;
                }

                await database.addText(message.content, message.author.id, message.id);
                added++;
            }

            return interaction.editReply(`Scraped ${messages.size} messages from ${guildChannel.toString()}. Added ${added} new entries to the database.`);
        } catch (error) {
            console.error("[Commands] Failed to scrape channel:", error);
            return interaction.editReply("Failed to scrape the selected channel.");
        }
    }
}
