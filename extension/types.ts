//                       Only known on discord  Only known on twitch   Known on discord and twitch
export type VotebanUser = [string, undefined] | [undefined | string] | [string, string]

export interface VotebanBans {
    discordBans: Record<string, Record<string, number>> // First string = who banned , second string = who was banned
    twitchBans: Record<string, Record<string, number>> // First string = who banned , second string = who was banned
}

export interface VotebanSettings { // Just so we don't need to transfer the `bans` enty in the replicant.
    reasonsText: Array<string>
    reasonsImage: Array<string>
    discordChannel: string | null
    twitchChannel: string | null
}

export interface VotebanRuntime {
    discordAvailable: boolean
    twitchAvailable: boolean
    discordValid: boolean
    discordVoice: boolean
    twitchValid: boolean
    wsAvailable: boolean
}

export interface VotebanWsUser {
    name: string
    id: string
    peopleBanned: number // How many bans has this user launched?
    bansReceived: number // How often did this user get banned?
}

export type VotebanWsReason = {text: string, imageURL: null} | {text: null, imageURL: string}

export interface VotebanWsMessage {
    origin: "discord" | "twitch"
    time: number
    amount: number // How often has this source banned this target already?
    source: VotebanWsUser
    target: VotebanWsUser
    reason: VotebanWsReason
}