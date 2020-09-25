# voteban-io

What is this? (Copied from [here](https://github.com/joblo2213/Voteban))
```
Disclaimer: This README and the associated bot is one big sarcastic shitpost.
No one will ever be banned or kicked by the bot.
We believe that talking to each other and explaining misbehaviour is better than just voting to ban people.
/voteban is a meme that now has been used in our community for a long time to show disagreement but at the same time have a great laugh all together.
If you are looking for a real moderation tool this is propably not the right bot.
Also be aware if using the bot that it sadly has the potential to be misused or misunderstood.

There are so meany reasons why you would need /voteban:

Trojaner posts screenshots with light theme - /voteban trojaner!
MelanX is telling incredibly bad jokes - /voteban melan!
kegelsknight is trolling again - /voteban kegelsknight!
skate702 is piling up open TODOs - /voteban skate702!
felixletsplay is using eclipse - /voteban felixletsplay!
ungefroren isn't merging my PR - /voteban ungefroren!
derNiklaas is to blame - /voteban derNiklaas!
Sireisenblut is existing - /voteban Sireisenblut!
```

## How to use

Voteban-io is a [nodecg](https://nodecg.com) module. You need a working nodecg installation with [nodecg-io](https://nodecg.io) installed.

Head over to the [releases](https://github.com/noeppi-noeppi/voteban-io/releases) section and download the latest release. Hint: the `shaded` files contain all dependencies of voteban-io. If you use this, you don't need to build it afterwards.

Unzip the downloaded file into the `bundles` directory of nodecg. If you haven't downloaded the shaded variant, run
```
npm install
npm run bootstrap
npm run build
```
(You'll see two errors about `node_modules/nodecg-io-core/extension/persistenceManager.ts`, ignore them for now)

Now start nodecg. You'll see a new tab:

![Screenshot](screenshot.png)

Here you can adjust the settings of voteban-io. To make it work put in a discord channel, a twitch channel or both. Then assign it the required instances in the nodecg-io tab.

The WebSocket-Server may be used to add a listener to a ban. It'll send a message to every connected client whenever a ban occurs. The message looks like this:

```json
{
  "origin": "string: either 'discord' or 'twitch', depending on where the ban was initiated.",
  "time": "number: Value of Date.now() when the ban happened.",
  "amount": "number: How often has this source banned this target already.",
  "source": {
    "name": "string: The name of the user who banned",
    "id": "string: The ID ofthe user who banned.",
    "peopleBanned": "number: How many bans has this user launched?",
    "bansReceived": "number: How often did this user get banned?"
  },
  "target": {
    "name": "string: The name of the user who was banned",
     "id": "string: The ID ofthe user who was banned.",
     "peopleBanned": "number: How many bans has this user launched?",
     "bansReceived": "number: How often did this user get banned?"
  },
  "reason": {
    "text": "string or null: The reason as a text. Exactly one of `text` and `imageURL``is null.",
    "imageURL": "string or null: The reason as an image. Exactly one of `text` and `imageURL``is null."
  }
}
```