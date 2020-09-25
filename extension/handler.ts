import * as voteban from './index'

import { Message, MessageEmbed, GuildMember, EmbedFieldData } from "discord.js"
import { TwitchPrivateMessage } from "twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage";
import { VotebanWsReason } from './types';

export function handleDiscord(msg: Message): void {
    const message = msg.content.trim()
    const lmessage = message.toLowerCase()
    if (lmessage.startsWith('!voteban') || lmessage.startsWith('/voteban')
        || lmessage.startsWith('!mostbanned') || lmessage.startsWith('/mostbanned')
        || lmessage.startsWith('!whobanned') || lmessage.startsWith('/whobanned')) {

        if (lmessage.startsWith('!voteban') || lmessage.startsWith('/voteban')) {
            var data = message.substring(8).trim()
        } else if (lmessage.startsWith('!mostbanned') || lmessage.startsWith('/mostbanned')) {
            var data = message.substring(11).trim()
        } else if (lmessage.startsWith('!whobanned') || lmessage.startsWith('/whobanned')) {
            var data = message.substring(10).trim()
        } else {
            return
        }

        if (data == '') {
            if (lmessage.startsWith('!voteban') || lmessage.startsWith('/voteban')) {
                sendEmbed('Voteban failed', 'No target specified.', null)
            } else if (lmessage.startsWith('!mostbanned') || lmessage.startsWith('/mostbanned')) {
                sendMostBanned(null, null)
            } else if (lmessage.startsWith('!whobanned') || lmessage.startsWith('/whobanned')) {
                sendWhoBanned(null, null)
            }
            return
        }
        if (data.includes(' ')) {
            var target = data.substring(0, data.indexOf(' ')).trim()
        } else {
            var target = data
        }

        if (voteban.discordChannel != null) {
            if (!voteban.discordChannel.members.has(msg.author.id)) {
                return
            }
            const sourceId = msg.author.id
            const source = voteban.discordChannel.members.get(msg.author.id)?.displayName as string

            if (target.startsWith('<@')) {
                var targetId = target.substring(2, target.length - 1)
                if (!voteban.discordChannel.members.has(targetId)) {
                    sendEmbed('Voteban failed', 'The user could not be found', null)
                    return
                }
                target = voteban.discordChannel.members.get(targetId)?.displayName as string
            } else {
                const matches: Array<GuildMember> = []
                let exactMatch: GuildMember | undefined | null = undefined
                const lowerTarget = target.toLowerCase()
                voteban.discordChannel.members.forEach(member => {
                    if (member.displayName == targetId) {
                        if (exactMatch === undefined) {
                            exactMatch = member
                        } else {
                            exactMatch = null
                        }
                    } else if (member.displayName.toLowerCase().includes(lowerTarget) && lowerTarget != '') {
                        matches.push(member)
                    }
                })
                if (exactMatch != undefined && exactMatch != null) {
                    var targetId = (exactMatch as GuildMember).id
                    var target = (exactMatch as GuildMember).displayName
                } else if (matches.length == 1) {
                    var targetId = matches[0].id
                    var target = matches[0].displayName
                } else if (matches.length == 0) {
                    sendEmbed('Voteban failed', 'No matching user found.', null)
                    return
                } else {
                    const usersMatched: Array<EmbedFieldData> = []
                    matches.forEach(user => {
                        usersMatched.push({
                            name: user.displayName,
                            value: `(id: \`${user.id}\`)`,
                            inline: true
                        })
                    })
                    sendEmbedList('Voteban failed', 'There were multiple users matching your request.', null, usersMatched)
                    return
                }
            }

            if (lmessage.startsWith('!mostbanned') || lmessage.startsWith('/mostbanned')) {
                sendMostBanned(target, targetId)
                return
            } else if (lmessage.startsWith('!whobanned') || lmessage.startsWith('/whobanned')) {
                sendWhoBanned(target, targetId)
                return
            }

            if (data.includes(' ')) {
                var reason: VotebanWsReason = { text: data.substring(data.indexOf(' ')).trim(), imageURL: null }
            } else {
                var reason = randomReason(true, source, target)
            }

            incrementBan("discord", sourceId, targetId)

            let desc = ''
            desc += `**${source} banned ${target}**  ${dn(getBans("discord", sourceId, targetId))} times\n`
            desc += `**${source} has banned others**  ${dn(getBans("discord", sourceId, null))} times\n`
            desc += `**${target} was banned**  ${dn(getBans("discord", null, targetId))} times\n\n`
            desc += `**Ban Reason:**`
            if (reason.text != null) {
                desc += `\n${reason.text}`
            }

            sendEmbed(`${source} banned ${target}`, desc, reason.imageURL)
            voteban.notifyBan({
                origin: "discord",
                time: Date.now(),
                amount: getBans("discord", sourceId, targetId),
                source: {
                    name: source,
                    id: sourceId,
                    peopleBanned: getBans("discord", sourceId, null),
                    bansReceived: getBans("discord", null, sourceId),
                },
                target: {
                    name: target,
                    id: targetId,
                    peopleBanned: getBans("discord", targetId, null),
                    bansReceived: getBans("discord", null, targetId),
                },
                reason: reason
            })
        } else {
            return
        }
    } else if (lmessage.startsWith('/mybans') || lmessage.startsWith('!mybans')) {
        if (voteban.discordChannel != null) {
            if (!voteban.discordChannel.members.has(msg.author.id)) {
                return
            }
            const sourceId = msg.author.id
            const source = voteban.discordChannel.members.get(msg.author.id)?.displayName as string
            let message = ''
            message += `**Was banned**  ${dn(getBans('discord', null, sourceId))} times\n`
            message += `**Banned others**  ${dn(getBans('discord', sourceId, null))} times`
            sendEmbed(source, message, null)
        }
    } else if (lmessage.startsWith('/totalbans') || lmessage.startsWith('!totalbans')) {
        if (voteban.discordChannel != null) {
            if (!voteban.discordChannel.members.has(msg.author.id)) {
                return
            }
            let message = `**Launched in total**  ${dn(getBans('discord', null, null))} bans`
            sendEmbed('All bans', message, null)
        }
    }
}

function dn(number: number) {
    return String(number)
        .replace('0', ':zero:')
        .replace('1', ':one:')
        .replace('2', ':two:')
        .replace('3', ':three:')
        .replace('4', ':four:')
        .replace('5', ':five:')
        .replace('6', ':six:')
        .replace('7', ':seven:')
        .replace('8', ':eight:')
        .replace('9', ':nine:')
}

function sendEmbed(title: string, description: string | null, image: string | null) {
    sendEmbedList(title, description, image, [])
}

function sendEmbedList(title: string, description: string | null, image: string | null, fields: Array<EmbedFieldData>) {
    if (voteban.discordChannel != null) {
        const embed = new MessageEmbed()
        embed.setTitle(title)
        if (description != null) {
            embed.setDescription(description)
        }
        if (image != null) {
            embed.setImage(image)
        }
        if (fields.length != 0) {
            embed.addFields(fields)
        }
        embed.setColor('#FFFF00')
        embed.setTimestamp()
        embed.setFooter('Voteban-io', 'https://raw.githubusercontent.com/joblo2213/Voteban/master/voteban.png');

        voteban.discordChannel.send({ embed: embed })
    }
}

function sendMostBanned(source: string | null, sourceId: string | null) {
    let desc = ''
    let idx = 0
    if (voteban.discordChannel != null) {
        if (source == null) {
            var title = 'Wall of shame'
        } else {
            var title = `${source}'s most hated people`
        }

        getMostBanned('discord', sourceId).forEach(elem => {
            if (voteban.discordChannel != null) {
                if (voteban.discordChannel.members.has(elem[0])) {
                    idx += 1
                    desc += `${dn(idx)}  **${voteban.discordChannel.members.get(elem[0])?.displayName}** was banned **${elem[1]}** times.\n`
                }
            }
        })
        sendEmbed(title, desc, null)
    }
}

function sendWhoBanned(target: string | null, targetId: string | null) {
    let desc = ''
    let idx = 0
    if (voteban.discordChannel != null) {
        if (target == null) {
            var title = 'Voteban top users'
        } else {
            var title = `Top haters of ${target}`
        }

        getWhoBanned('discord', targetId).forEach(elem => {
            if (voteban.discordChannel != null) {
                if (voteban.discordChannel.members.has(elem[0])) {
                    idx += 1
                    desc += `${dn(idx)}  **${voteban.discordChannel.members.get(elem[0])?.displayName}** banned **${elem[1]}** times.\n`
                }
            }
        })
        sendEmbed(title, desc, null)
    }
}

export function handleTwitch(source: string, message: string, msg: TwitchPrivateMessage): void {
    if (message.trim().startsWith('!voteban') || message.trim().startsWith('/voteban')) {
        const data = message.trim().substring(8).trim()
        if (data == '') {
            if (voteban.twitchChannel != null) {
                voteban.twitchChannel[0].say(voteban.twitchChannel[1], `@${source} Please tell me who you want to ban.`)
            }
        }
        if (data.includes(' ')) {
            var target = data.substring(0, data.indexOf(' ')).trim()
            var reason = data.substring(data.indexOf(' ')).trim()
        } else {
            var target = data
            var reason = ''
        }

        if (target.startsWith('@')) {
            target = target.substring(1)
        }

        if (target == '') {
            if (voteban.twitchChannel != null) {
                voteban.twitchChannel[0].say(voteban.twitchChannel[1], `@${source} Please tell me who you want to ban.`)
            }
        } else {
            if (reason == '') {
                reason = randomReason(false, source, target)
            }
            if (voteban.twitchChannel != null) {
                incrementBan('twitch', source, target)
                voteban.twitchChannel[0].say(voteban.twitchChannel[1], `${target} was banned by ${source}. Reason: ${reason}`)
                voteban.notifyBan({
                    origin: "twitch",
                    time: Date.now(),
                    amount: getBans("twitch", source, target),
                    source: {
                        name: source,
                        id: source,
                        peopleBanned: getBans("twitch", source, null),
                        bansReceived: getBans("twitch", null, source),
                    },
                    target: {
                        name: target,
                        id: target,
                        peopleBanned: getBans("twitch", target, null),
                        bansReceived: getBans("twitch", null, target),
                    },
                    reason: {
                        text: reason,
                        imageURL: null
                    }
                })
            }
        }
    }
}

function incrementBan(where: "discord" | "twitch", source: string, target: string) {
    if (where == 'discord') {
        var bans = voteban.votebanBans.value.discordBans
    } else {
        var bans = voteban.votebanBans.value.twitchBans
    }
    if (!(source in bans)) {
        bans[source] = {}
    }
    if (!(target in bans[source])) {
        bans[source][target] = 0
    }
    bans[source][target] += 1
}

function getBans(where: "discord" | "twitch", source: string | null, target: string | null): number {
    if (where == 'discord') {
        var bans = voteban.votebanBans.value.discordBans
    } else {
        var bans = voteban.votebanBans.value.twitchBans
    }
    if (source == null) {
        if (target == null) {
            let amount = 0
            for (const s in bans) {
                for (const t in bans[s]) {
                    amount += bans[s][t]
                }
            }
            return amount
        } else {
            let amount = 0
            for (const s in bans) {
                if (target in bans[s]) {
                    amount += bans[s][target]
                }
            }
            return amount
        }
    } else {
        if (target == null) {
            if (source in bans) {
                let amount = 0
                for (const t in bans[source]) {
                    amount += bans[source][t]
                }
                return amount
            } else {
                return 0
            }
        } else {
            if (source in bans && target in bans[source]) {
                return bans[source][target]
            } else {
                return 0
            }
        }
    }
}

function getWhoBanned(where: "discord" | "twitch", target: string | null): Array<[string, number]> {
    if (where == 'discord') {
        var bans = voteban.votebanBans.value.discordBans
    } else {
        var bans = voteban.votebanBans.value.twitchBans
    }
    const map: Record<string, number> = {}
    if (target == null) {
        for (const s in bans) {
            if (!(s in map)) {
                map[s] = 0
            }
            for (const t in bans[s]) {
                map[s] += bans[s][t]
            }
        }
    } else {
        for (const s in bans) {
            if (target in bans[s]) {
                if (!(s in map)) {
                    map[s] = 0
                }
                map[s] += bans[s][target]
            }
        }
    }
    let array: Array<[string, number]> = []
    for (const key in map) {
        array.push([key, map[key]])
    }
    array = array.sort((e1, e2) => { return e2[1] - e1[1] })
    return array.slice(0, 10)
}

function getMostBanned(where: "discord" | "twitch", source: string | null): Array<[string, number]> {
    if (where == 'discord') {
        var bans = voteban.votebanBans.value.discordBans
    } else {
        var bans = voteban.votebanBans.value.twitchBans
    }
    const map: Record<string, number> = {}
    if (source == null) {
        for (const s in bans) {
            for (const t in bans[s]) {
                if (!(t in map)) {
                    map[t] = 0
                }
                map[t] += bans[s][t]
            }
        }
    } else {
        if (source in bans) {
            for (const t in bans[source]) {
                map[t] += bans[source][t]
            }
        }
    }
    let array: Array<[string, number]> = []
    for (const key in map) {
        array.push([key, map[key]])
    }
    array = array.sort((e1, e2) => { return e2[1] - e1[1] })
    return array.slice(0, 10)
}

function randomReason(includePictures: false, source: string, target: string): string;
function randomReason(includePictures: true, source: string, target: string): VotebanWsReason;
function randomReason(includePictures: boolean, source: string, target: string): string | VotebanWsReason {
    if (includePictures) {
        const idx = Math.floor(Math.random() * (voteban.votebanSettings.value.reasonsText.length + voteban.votebanSettings.value.reasonsImage.length))
        if (idx < voteban.votebanSettings.value.reasonsImage.length) {
            return {
                text: null,
                imageURL: voteban.votebanSettings.value.reasonsImage[idx]
            }
        } else {
            return {
                text: randomReason(false, source, target),
                imageURL: null
            }
        }
    } else {
        return voteban.votebanSettings.value.reasonsText[Math.floor(Math.random() * voteban.votebanSettings.value.reasonsText.length)].replace('${source}', source).replace('${target}', target)
    }

}