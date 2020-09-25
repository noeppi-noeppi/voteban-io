import { NodeCG, Replicant } from "nodecg/types/server";
import { VotebanSettings, VotebanBans, VotebanRuntime, VotebanWsMessage } from "./types"
import * as config from "./configImpl"
import * as handler from "./handler"

import { requireService } from "nodecg-io-core/extension/serviceClientWrapper";
import { TwitchServiceClient } from "nodecg-io-twitch/extension";
import { DiscordServiceClient } from "nodecg-io-discord/extension";
import { WSServerServiceClient } from "nodecg-io-websocket-server/extension";

import { TextChannel } from "discord.js"
import ChatClient from "twitch-chat-client";
import * as WebSocket from "ws";


let discordClient: DiscordServiceClient | null = null
let twitchClient: TwitchServiceClient | null = null

export let twitchChannel: [ChatClient, string] | null = null
export let discordChannel: TextChannel | null = null
export let wsServer: WebSocket.Server | null = null

export let votebanSettings: Replicant<VotebanSettings>
export let votebanBans: Replicant<VotebanBans>


let currentDiscordHandlerId = 0 // Due to nodecg-io bug #9 we save the current handler id
let currentTwitchHandlerId = 0  // to ignore messages to older handlers.

module.exports = function (nodecg: NodeCG): void {

    votebanSettings = nodecg.Replicant<VotebanSettings>("votebanSettings", { persistent: true, defaultValue: config.createDefaultConfig() });
    votebanBans = nodecg.Replicant<VotebanBans>("votebanBans", {
        persistent: true, defaultValue: {
            discordBans: {},
            twitchBans: {}
        }
    });
    const votebanRuntime = nodecg.Replicant<VotebanRuntime>("votebanRuntime", {
        persistent: false, defaultValue: {
            discordAvailable: false,
            twitchAvailable: false,
            discordValid: false,
            discordVoice: false,
            twitchValid: false,
            wsAvailable: false
        }
    });

    nodecg.listenFor('votebanExport', 'voteban-io', (_data: unknown) => {
        nodecg.sendMessageToBundle('votebanExportReceived', 'voteban-io', config.exportConfig(votebanSettings.value, votebanBans.value), (error: any, ...args: any[]) => {
            nodecg.log.info('ERROR :( ' + String(error))
        })
    })

    nodecg.listenFor('votebanImport', 'voteban-io', (data: unknown) => {
        const [settings, bans] = config.importConfig(data)
        votebanSettings.value = settings
        votebanBans.value = bans
    })

    votebanSettings.on('change', (_newValue, _oldValue, _operationQueue) => {
        updateDiscord()
        updateTwitch()
    })

    const discord = requireService<DiscordServiceClient>(nodecg, "discord")

    discord?.onAvailable((client) => {
        discordClient = client
        updateDiscord()
    })
        
    discord?.onUnavailable(() => {
        discordClient = null
        updateDiscord()
    })

    function updateDiscord(): void {
        if (discordClient != null) {
            const channel = votebanSettings.value.discordChannel
            if (channel != null && channel != '') {
                discordClient.getNativeClient().channels.fetch(channel).then((dc) => {
                    if (dc.type != 'text') {
                        discordChannel = null
                        votebanRuntime.value.discordAvailable = true
                        votebanRuntime.value.discordValid = false
                        votebanRuntime.value.discordVoice = true
                    } else {
                        discordChannel = dc as TextChannel
                        votebanRuntime.value.discordAvailable = true
                        votebanRuntime.value.discordValid = true
                        votebanRuntime.value.discordVoice = false
                        currentDiscordHandlerId += 1 // Invalidate all old handlers.
                        const currentHandlerId = currentDiscordHandlerId
                        const userId = discordClient?.getNativeClient().user?.id // Don't react to our own messages
                        discordClient?.getNativeClient().on('message', (msg) => {
                            if (currentDiscordHandlerId == currentHandlerId && discordChannel != null
                                && msg.channel.id == discordChannel.id && msg.author.id != userId) {
                                handler.handleDiscord(msg)
                            }
                        })
                    }
                }).catch((_err) => {
                    discordChannel = null
                    votebanRuntime.value.discordAvailable = true
                    votebanRuntime.value.discordValid = false
                    votebanRuntime.value.discordVoice = false
                })
            } else {
                discordChannel = null
                votebanRuntime.value.discordAvailable = true
                votebanRuntime.value.discordValid = false
                votebanRuntime.value.discordVoice = false
            }
        } else {
            discordChannel = null
            votebanRuntime.value.discordAvailable = false
            votebanRuntime.value.discordValid = false
            votebanRuntime.value.discordVoice = false
        }
    }

    const twitch = requireService<TwitchServiceClient>(nodecg, "twitch")

    twitch?.onAvailable((client) => {
        twitchClient = client
        updateTwitch()
    })

    twitch?.onUnavailable(() => {
        twitchClient = null
        updateTwitch()
    })

    function updateTwitch(): void {
        if (twitchClient != null) {
            const channel = votebanSettings.value.twitchChannel
            if (channel != null && channel != '') {
                const client = twitchClient
                client.getNativeClient().join(channel).then(() => {
                    twitchChannel = [client.getNativeClient(), channel]
                    votebanRuntime.value.twitchAvailable = true
                    votebanRuntime.value.twitchValid = true
                    currentTwitchHandlerId += 1 // Invalidate all old handlers.
                    const currentHandlerId = currentTwitchHandlerId
                    client.getNativeClient().onPrivmsg((chan, user, messageText, message) => {
                        if (currentTwitchHandlerId == currentHandlerId && twitchChannel != null
                            && chan.toLowerCase() == twitchChannel[1].toLowerCase()) {
                            handler.handleTwitch(user, messageText, message)
                        }
                    });
                }).catch((_err) => {
                    twitchChannel = null
                    votebanRuntime.value.twitchAvailable = true
                    votebanRuntime.value.twitchValid = false
                })
            } else {
                twitchChannel = null
                votebanRuntime.value.twitchAvailable = true
                votebanRuntime.value.twitchValid = false
            }
        } else {
            twitchChannel = null
            votebanRuntime.value.twitchAvailable = false
            votebanRuntime.value.twitchValid = false
        }
    }

    const webSocketServer = requireService<WSServerServiceClient>(nodecg, "websocket-server")

    webSocketServer?.onAvailable((client) => {
        wsServer = client.getNativeClient()
        votebanRuntime.value.wsAvailable = true
    })
        
    webSocketServer?.onUnavailable(() => {
        wsServer = null
        votebanRuntime.value.wsAvailable = false
    })
}

export function notifyBan(ban: VotebanWsMessage): void {
    if (wsServer != null) {
        const json = JSON.stringify(ban)
        wsServer.clients.forEach(client => {
            client.send(json)
        })
    }
}