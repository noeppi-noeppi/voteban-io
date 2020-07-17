import { VotebanSettings, VotebanBans } from './types'

export const CONFIG_VERSION: number = 1

export function createDefaultConfig(): VotebanSettings {
    return {
        reasonsText: [
            "You're Out!",
            "You'll _NOT_ be back!",
            "Haha rip lol",
            "Game Over",
            "You're not allowed to exist anymore",
            "The ban is a lie",
            "No u",
            "The ban hammer has spoken!",
            "Flying is not enabled on this server!",
            "I wish I could ban you more than once",
            "I am the Law",
            "Not even a kiss from a prince will bring you back",
            "See you later, alligator!",
            "User in your channel was banned from the server!",
            "An apple a day keeps ${target} away",
            "Voteban was successful. Subject is no longer on this Server.",
            "${source} hates him"
        ],
        reasonsImage: [
            "https://uploads.disquscdn.com/images/4eac8fe4b6eb396346f3315cf458c068271554bc97116212be69bd2693f02a9c.jpg",
            "https://cdn.discordapp.com/attachments/594231720371421261/594257520051355664/wasted.png",
            "https://cdn.discordapp.com/attachments/594231720371421261/594258655130550307/wumpus.png",
            "https://cdn.discordapp.com/attachments/594231720371421261/594258906499514383/0x00000050.png",
            "https://i.imgur.com/LuPXZKX.png",
            "https://cdn.discordapp.com/attachments/317773585173184513/594258103852072960/i-have-a-vote-i-have-a-ban-uhhhh-i-have-a-voteban-for-you.png"
        ],
        discordChannel: null,
        twitchChannel: null,
    }
}

export function exportConfig(settings: VotebanSettings, bans: VotebanBans): any {
    return {
        CONFIG_VERSION: CONFIG_VERSION,
        settings: settings,
        bans: bans
    }
}

export function importConfig(config: any): [VotebanSettings, VotebanBans] {
    try {
        if ('CONFIG_VERSION' in config) {
            // A voteban.io config
            switch (config.CONFIG_VERSION) {
                case 1: {
                    return [ config.settings as VotebanSettings, config.bans as VotebanBans ]
                }
                default: {
                    return [ createDefaultConfig(), {
                        discordBans: {},
                        twitchBans: {} 
                    } ]
                }
            }
        } else {
            return [ createDefaultConfig(), {
                discordBans: {},
                twitchBans: {} 
            } ]
        }
    } catch (err) {
        return [ createDefaultConfig(), {
            discordBans: {},
            twitchBans: {} 
        } ]
    }
}