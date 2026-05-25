import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Message, StringSelectMenuBuilder, StringSelectMenuComponentData, PermissionsBitField, SnowflakeUtil } from "discord.js";
import Command from "../structures/Command";
import ClientInterface from "../interfaces/ClientInterface";

interface StoredText {
    id: string;
    author: string;
    text: string;
};

export default class DeleteTextsCommand extends Command {
    constructor(client: ClientInterface) {
        super(
            client,
            "commands.deleteTexts.command.name",
            "commands.deleteTexts.command.description",
            [
                {
                    type: ApplicationCommandOptionType.User,
                    name: "commands.deleteTexts.command.options.0.name",
                    description: "commands.deleteTexts.command.options.0.description"
                }
            ]
        );
    }

    async run(interaction: ChatInputCommandInteraction) {
        let currentPage = 0;
        const itemsPerPage = 25;

        const lng = { lng: interaction.locale };
        const database = await this.client.database.fetch(interaction.guildId);
        const dbTexts = await database.getTexts();

        let member = interaction.options.getUser(this.options[0].name)?.id;
        let deletePermission = false;
        if (member == interaction.user.id) {
            deletePermission = true;
        } else if (typeof interaction.member.permissions != "string") {
            deletePermission = interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages);
        }

        let texts = member ? dbTexts.filter((v) => member ? v.author == member : true) : dbTexts;
        if (texts.length < 1) {
            return interaction.reply({
                content: this.t("commands.deleteTexts.texts.noTexts", lng),
                ephemeral: true
            });
        }

        let components = this.getPageComponents(interaction.user.id, texts, !!member, currentPage, itemsPerPage, interaction.locale);

        const replyMessage = await interaction.reply({ fetchReply: true, components }) as Message;
        const collector = replyMessage.createMessageComponentCollector({
            idle: 120000,
            filter: (i) => i.user.id == interaction.user.id
        });

        collector.on("collect", async (i) => {
            if (i.isButton()) {
                if (i.customId == "deleteall") {
                    if (!deletePermission) {
                        await i.reply({
                            content: this.t("commands.deleteTexts.texts.noPermission", lng),
                            ephemeral: true
                        });
                        return;
                    }

                    const confirmRow = new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId("confirm")
                                .setLabel(this.t("commands.deleteTexts.texts.confirmButton", lng))
                                .setStyle(ButtonStyle.Success)
                        );

                    const confirmMessage = await i.reply({
                        content: this.t("commands.deleteTexts.texts.confirmation", { ...lng, textsLength: texts.length }),
                        ephemeral: true,
                        fetchReply: true,
                        components: [ confirmRow ]
                    }) as Message;

                    confirmMessage.createMessageComponentCollector({ idle: 60000 })
                        .on("collect", async (confirmInteraction) => {      
                            try {
                                if (!member) await database.deleteAllTexts();
                                else         await database.deleteUserTexts(member);

                                await confirmInteraction.update({
                                    content: this.t("commands.deleteTexts.texts.successAll", { ...lng, textsLength: texts.length }),
                                    components: []
                                });

                                texts = [];
                                currentPage = 0;

                                components = this.getPageComponents(interaction.user.id, texts, !!member, currentPage, itemsPerPage, interaction.locale);

                                try {
                                    await replyMessage.edit({ components });
                                } catch {};
                            } catch(e) {
                                await confirmInteraction.update({
                                    content: this.t("vars.error", lng)
                                });
                            }
                        })
                } else if (i.customId == "mytexts") {
                    member = interaction.user.id;
                    texts = texts.filter((v) => v.author == member);
                    if (texts.length < 1) {
                        await i.reply({
                            content: this.t("commands.deleteTexts.texts.noTexts", lng),
                            ephemeral: true
                        });
                        return;
                    }

                    currentPage = 0;
                    deletePermission = true;

                    components = this.getPageComponents(interaction.user.id, texts, true, currentPage, itemsPerPage, interaction.locale);
                    await i.update({ components });
                } else if (/first|last|previous|next/.test(i.customId)) {
                    if (i.customId == "first")         currentPage = 0;
                    else if (i.customId == "last")     currentPage = Math.ceil(texts.length / itemsPerPage) - 1;
                    else if (i.customId == "next")     currentPage++;
                    else if (i.customId == "previous") currentPage--;

                    components = this.getPageComponents(interaction.user.id, texts, !!member, currentPage, itemsPerPage, interaction.locale);
                    await i.update({ components });
                }
            } else if (i.isSelectMenu()) {
                const id = i.values[0];
                const text = texts.find((v) => v.id == id);
                if (!text) {
                    return i.reply({
                        content: this.t("commands.deleteTexts.texts.notFound", lng),
                        ephemeral: true
                    });
                }

                const infoRow = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId("infou")
                            .setLabel(text.author)
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji("👤")
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId("infot")
                            .setLabel(new Date(SnowflakeUtil.timestampFrom(text.id)).toLocaleString(i.locale))
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji("📆")
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setLabel(this.t("commands.deleteTexts.texts.messageButton", lng))
                            .setStyle(ButtonStyle.Link)
                            .setEmoji("💬")
                            .setURL(`https://discord.com/channels/${i.guildId}/${await database.getChannel()}/${id}`)
                    );

                const buttonsRow = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`delete-${id}`)
                            .setLabel(this.t("commands.deleteTexts.texts.deleteButton", lng))
                            .setStyle(ButtonStyle.Danger)
                            .setDisabled(text.author != i.user.id && !deletePermission)
                    );

                if (text.text.length > 2000) text.text = text.text.slice(0, 2000 -3) + "...";

                const m = await i.reply({
                    content: text.text,
                    ephemeral: true,
                    fetchReply: true,
                    components: [ infoRow, buttonsRow ]
                }) as Message;

                const collector = m.createMessageComponentCollector({
                    max: 1,
                    idle: 120000
                });

                collector.on("collect", async (b) => {
                    const id = b.customId.split("-")[1];

                    try {
                        await database.deleteText(id);
                        await b.update({
                            content: this.t("commands.deleteTexts.texts.success", { ...lng, id }),
                            components: []
                        });

                        const idx = texts.findIndex((v) => v.id == id);
                        if (idx != -1) texts.splice(idx, 1);
                        
                        components = this.getPageComponents(interaction.user.id, texts, !!member, currentPage, itemsPerPage, interaction.locale);

                        try {
                            await replyMessage.edit({ components });
                        } catch {};
                    } catch(e) {
                        console.error(`[Commands] Failed to reply the interaction:\n`, e);

                        await b.reply({
                            content: this.t("vars.error", lng),
                            ephemeral: true
                        });
                    }
                });
            }
        });

        collector.on("end", async (_, reason) => {
            if (reason == "idle") {
                const rows = replyMessage.components;
                for (let row of rows) {
                    for (let component of row.components) {
                        component.disabled = true;
                    }
                }

                try {
                    await replyMessage.edit({
                        content: this.t("commands.deleteTexts.texts.expired", lng),
                        components: rows
                    });
                } catch {};
            }
        });
    }

    private getPageComponents(author: string, texts: StoredText[], hasMember: boolean, page: number, itemsPerPage: number, locale: string): ActionRowBuilder<any>[] {
        texts.sort((a, b) => SnowflakeUtil.timestampFrom(a.id) - SnowflakeUtil.timestampFrom(b.id));

        const items = texts.slice(page * itemsPerPage, page * itemsPerPage + itemsPerPage);
        const options: StringSelectMenuComponentData[] = [];

        items.forEach((v) => {
            const label = v.text.slice(0, 100);
            if (label.length < 0 || options.findIndex((opt) => opt.value == v.id) != -1) return;

            const addedAt = new Date(SnowflakeUtil.timestampFrom(v.id));

            options.push({
                label,
                description: this.t("commands.deleteTexts.texts.textInfo", { lng: locale, author: v.author ?? "???", date: addedAt.toLocaleString(locale) }),
                value: v.id,
                default: false,
                emoji: null
            });
        });

        const menu = new StringSelectMenuBuilder()
            .setCustomId("menu")
            .setOptions(options);

        if (texts.length < 1) {
            menu.setDisabled(true);
            menu.setOptions([
               {
                   label: "Random text just to API don't tell it's an error.",
                   value: "0"
               }
            ]);
        }

        const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(menu);

        let pages = Math.ceil(texts.length / itemsPerPage);
        pages     = pages < 1 ? 1 : pages;
        const buttonsRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("first")
                    .setLabel("<<")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page + 1 <= 1),
                new ButtonBuilder()
                    .setCustomId("previous")
                    .setLabel("<")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page + 1 <= 1),
                new ButtonBuilder()
                    .setCustomId("pages")
                    .setLabel(`${page + 1}/${pages}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId("next")
                    .setLabel(">")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page + 1 == pages),
                new ButtonBuilder()
                    .setCustomId("last")
                    .setLabel(">>")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page + 1 == pages)
            );

        const deleteRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("deleteall")
                    .setLabel(this.t("commands.deleteTexts.texts.deleteAllButton", { lng: locale }))
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(texts.length < 1)
            );

        if (!hasMember) {
            deleteRow.addComponents(
                new ButtonBuilder()
                    .setCustomId("mytexts")
                    .setLabel(this.t("commands.deleteTexts.texts.myMessages", { lng: locale }))
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(texts.filter((v) => v.author == author).length < 1)
            );
        }

        return [ menuRow, buttonsRow, deleteRow ];
    }
}