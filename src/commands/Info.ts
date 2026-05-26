import axios from "axios";
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, version, ChatInputCommandInteraction, TextChannel, PermissionsBitField } from "discord.js";
import Command from "../structures/Command";
import ClientInterface from "../interfaces/ClientInterface";

export default class InfoCommand extends Command {
    public skipBan: boolean = true;

    constructor(client: ClientInterface) {
        super(
            client,
            "info",
            "commands.info.command.description"
        );
    }

    async run(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        const lng = { lng: interaction.locale };
        const locUndefined = this.t("vars.undefined", lng);

        const database = await this.client.database.fetch(interaction.guildId);
        const isBanned = await this.client.database.isBanned(interaction.guildId);
        const isTracking = await this.client.database.isTrackAllowed(interaction.user.id);
        const serverCount = (await this.client.shard.fetchClientValues("guilds.cache.size") as number[])
            .reduce((a, b) => a + b);

        // Basic info
        let description = this.t("commands.info.texts.online", { ...lng, time: `<t:${Math.floor(this.client.readyTimestamp / 1000)}:R>` }) + "\n";
        description    += this.t("commands.info.texts.serverSize", { ...lng, size: serverCount }) + "\n";
        description    += this.t("commands.info.texts.tracking", {
            ...lng,
            state: isTracking ? this.t("vars.enabled", lng) : this.t("vars.disabled", lng)
        });

        const embed = new EmbedBuilder()
            .setTitle("👽 " + this.t("commands.info.texts.title", lng))
            .setColor(Math.floor(Math.random() * 0xFFFFFF))
            .setDescription(description);

        // Server related info
        let channelId = await database.getChannel();

        let webhook = await database.getWebhook();
        let webhookName;
        if (webhook) {
            try {
                let res = await axios.get(webhook);
                if (res.status == 200) {
                    webhookName = res.data.name;
                } else {
                    webhook = null;
                }
            } catch (e) {
                if (e.response.status != 404) {
                    console.error("[Commands]", "Failed to get Webhook info:\n", e);
                } else {
                    webhook = null;
                    await database.configWebhook();
                }
            }
        }

        let channel: TextChannel;
        try {
            if (channelId) {
                channel = await interaction.guild.channels.fetch(channelId) as TextChannel;
            }
        } catch(e) {
            // Unknown channel
            if (e.code == 10003) {
                channelId = null;
                database.configChannel(null);
            }
        }

        const clientMember = channel && await interaction.guild.members.fetchMe();
        const messagePermission = (
            channel &&
            clientMember.permissionsIn(channel)?.has(PermissionsBitField.Flags.SendMessages) &&
            clientMember.permissionsIn(channel)?.has(PermissionsBitField.Flags.ViewChannel)
        );

        let serverInfo;
        if (isBanned) {
            serverInfo = this.t("commands.info.texts.banned", { ...lng, reason: isBanned });
        } else {
            serverInfo = this.t("commands.info.texts.state", {
                ...lng,
                state: database.toggledActivity ? this.t("vars.enabled", lng) : this.t("vars.disabled", lng)
            }) + "\n";
            serverInfo += this.t("commands.info.texts.channel", {
                ...lng,
                channel: channelId ? `<#${channelId}>` : `\`${locUndefined}\``,
                permission: channelId && !messagePermission ? ` (${this.t("commands.info.texts.nopermission", lng)})` : ""
            }) + "\n";
            serverInfo += this.t("commands.info.texts.webhook", {
                ...lng,
                webhook: webhookName?.replace(/[`*\\]+/g, "") ?? locUndefined
            }) + "\n";
            serverInfo += this.t("commands.info.texts.textsLength", { ...lng, length: await database.getTextsLength() }) + "\n";
            serverInfo += this.t("commands.info.texts.textsLimit", { ...lng, limit: await database.getTextsLimit() }) + "\n";
            serverInfo += this.t("commands.info.texts.collectChance", { ...lng, chance: `${await database.getCollectionPercentage() * 100}%` }) + "\n";
            serverInfo += this.t("commands.info.texts.sendingChance", { ...lng, chance: `${await database.getSendingPercentage() * 100}%` }) + "\n";
            serverInfo += this.t("commands.info.texts.replyChance", { ...lng, chance: `${await database.getReplyPercentage() * 100}%` });
        }

        // Software
        let softwareInfo = this.t("commands.info.texts.nodeVersion", { ...lng, version: process.version }) + "\n";
        softwareInfo += this.t("commands.info.texts.djsVersion", { ...lng, version: "v" + version }) + "\n";
        softwareInfo += this.t("commands.info.texts.memUsage", { ...lng, mem: `${Math.floor(process.memoryUsage().heapUsed / 1024 ** 2)} mb` }) + "\n";
        softwareInfo += this.t("commands.info.texts.developer", { ...lng, dev: "Bot owner" });

        embed.addFields(
            {
                name: this.t("commands.info.texts.serverField", lng),
                value: serverInfo
            },
            {
                name: this.t("commands.info.texts.softwareField", lng),
                value: softwareInfo
            }
        );

        const cRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("donate")
                    .setEmoji("🤑")
                    .setLabel(this.t("commands.info.texts.donate", lng))
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId("faq")
                    .setEmoji("🤔")
                    .setLabel(this.t("commands.info.texts.faq", lng))
                    .setStyle(ButtonStyle.Secondary)
            );

        embed.setFooter({
            text: `Shard ${interaction.guild.shardId}`
        });

        return interaction.editReply({ embeds: [ embed ], components: [ cRow ] });
    }
}