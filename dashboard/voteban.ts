/// <reference types="nodecg/types/browser" />

import { VotebanSettings, VotebanRuntime } from "../extension/types";

const votebanSettings = nodecg.Replicant<VotebanSettings>("votebanSettings");
const votebanRuntime = nodecg.Replicant<VotebanRuntime>("votebanRuntime");

document.addEventListener("DOMContentLoaded", () => {
    votebanSettings.on('change', (newValue, _oldValue, _dataOperations: any[]) => {
        updateGUI(newValue, undefined)
    })
    votebanRuntime.on('change', (newValue, _oldValue, _dataOperations: any[]) => {
        updateGUI(undefined, newValue)
    })
});
votebanSettings.on('declared', value => {
    if (!('revision' in value)) {
        updateGUI(value, undefined)
    }
})
votebanRuntime.on('declared', value => {
    if (!('revision' in value)) {
        updateGUI(undefined, value)
    }
})

nodecg.listenFor('votebanExportReceived', (message: unknown) => {
    const link = document.createElement('a');
    link.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(message, undefined, 2)));
    link.setAttribute('download', 'voteban.json');

    link.style.display = 'none';
    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
})

function updateGUI(settings: VotebanSettings | undefined, runtime: VotebanRuntime | undefined): void {
    if (settings !== undefined) {
        if (settings.discordChannel != null && settings.discordChannel != '') {
            (document.getElementById('voteban-discord-channel') as HTMLInputElement).value = settings.discordChannel
        } else {
            (document.getElementById('voteban-discord-channel') as HTMLInputElement).value = ""
        }

        if (settings.twitchChannel != null && settings.twitchChannel != '') {
            (document.getElementById('voteban-twitch-channel') as HTMLInputElement).value = settings.twitchChannel
        } else {
            (document.getElementById('voteban-twitch-channel') as HTMLInputElement).value = ""
        }

        const textReasons = document.getElementById('text-ban-reasons') as HTMLTextAreaElement
        let textReasonsValue = ''
        settings.reasonsText.forEach(reason => {
            textReasonsValue += (reason + '\n')
        })
        textReasons.value = textReasonsValue

        const imageReasons = document.getElementById('image-ban-reasons') as HTMLTextAreaElement
        let imageReasonsValue = ''
        settings.reasonsImage.forEach(reason => {
            imageReasonsValue += (reason + '\n')
        })
        imageReasons.value = imageReasonsValue
    }

    if (runtime !== undefined) {
        let canRun = false

        if (runtime.discordAvailable && runtime.discordValid) {
            canRun = true;
            (document.getElementById('voteban-discord-status') as HTMLElement).classList.remove('red');
            (document.getElementById('voteban-discord-status') as HTMLElement).classList.add('green');
            (document.getElementById('voteban-discord-status') as HTMLElement).textContent = '⬤ Available'
        } else {
            (document.getElementById('voteban-discord-status') as HTMLElement).classList.remove('green');
            (document.getElementById('voteban-discord-status') as HTMLElement).classList.add('red');
            if (runtime.discordVoice) {
                (document.getElementById('voteban-discord-status') as HTMLElement).textContent = '⬤ Voice channel'
            } else if (runtime.discordAvailable) {
                (document.getElementById('voteban-discord-status') as HTMLElement).textContent = '⬤ Invalid channel'
            } else {
                (document.getElementById('voteban-discord-status') as HTMLElement).textContent = '⬤ Not available'
            }
        }

        if (runtime.twitchAvailable && runtime.twitchValid) {
            canRun = true;
            (document.getElementById('voteban-twitch-status') as HTMLElement).classList.remove('red');
            (document.getElementById('voteban-twitch-status') as HTMLElement).classList.add('green');
            (document.getElementById('voteban-twitch-status') as HTMLElement).textContent = '⬤ Available'
        } else {
            (document.getElementById('voteban-twitch-status') as HTMLElement).classList.remove('green');
            (document.getElementById('voteban-twitch-status') as HTMLElement).classList.add('red');
            if (runtime.twitchAvailable) {
                (document.getElementById('voteban-twitch-status') as HTMLElement).textContent = '⬤ Invalid channel'
            } else {
                (document.getElementById('voteban-twitch-status') as HTMLElement).textContent = '⬤ Not available'
            }
        }

        if (runtime.wsAvailable) {
            (document.getElementById('voteban-ws-status') as HTMLElement).classList.remove('red');
            (document.getElementById('voteban-ws-status') as HTMLElement).classList.add('green');
            (document.getElementById('voteban-ws-status') as HTMLElement).textContent = '⬤ Available'
        } else {
            (document.getElementById('voteban-ws-status') as HTMLElement).classList.remove('green');
            (document.getElementById('voteban-ws-status') as HTMLElement).classList.add('red');
            (document.getElementById('voteban-ws-status') as HTMLElement).textContent = '⬤ Not available'
        }

        if (canRun && (document.getElementById('voteban-hint') as HTMLElement).textContent == 'No discord and no twitch provided. Voteban is not able to run.') {
            (document.getElementById('voteban-hint') as HTMLElement).textContent = ''
        } else if (!canRun) {
            (document.getElementById('voteban-hint') as HTMLElement).textContent = 'No discord and no twitch provided. Voteban is not able to run.'
        }
    }
}

function unsavedChanges() {
    (document.getElementById('voteban-hint') as HTMLElement).textContent = 'You have unsaved changes.'
}

function saveGUI() {
    const textReasonsStr = (document.getElementById('text-ban-reasons') as HTMLTextAreaElement).value
    const textReasons: Array<string> = []
    if (textReasonsStr != null && textReasonsStr != '') {
        textReasonsStr.split('\n').forEach(line => {
            if (line.trim() != '') {
                textReasons.push(line.trim())
            }
        })
    }

    const imageReasonsStr = (document.getElementById('image-ban-reasons') as HTMLTextAreaElement).value
    const imageReasons: Array<string> = []
    if (imageReasonsStr != null && imageReasonsStr != '') {
        imageReasonsStr.split('\n').forEach(line => {
            if (line.trim() != '') {
                imageReasons.push(line.trim())
            }
        })
    }

    const settings: VotebanSettings = {
        reasonsText: textReasons,
        reasonsImage: imageReasons,
        discordChannel: ((document.getElementById('voteban-discord-channel') as HTMLInputElement).value.trim()),
        twitchChannel: ((document.getElementById('voteban-twitch-channel') as HTMLInputElement).value.trim())
    }

    votebanSettings.value = settings

    const runtime = votebanRuntime.value

    if (runtime !== undefined && (runtime.discordAvailable || runtime.twitchAvailable)) {
        (document.getElementById('voteban-hint') as HTMLElement).textContent = ''
    } else {
        (document.getElementById('voteban-hint') as HTMLElement).textContent = 'No discord and no twitch provided. Voteban is not able to run.'
    }
}

function exportConfig() {
    nodecg.sendMessage('votebanExport')
}

function importConfig() {
    const file = document.getElementById('voteban-file-input') as HTMLInputElement
    const files = file.files
    if (files == null || files.length == 0) {
        (document.getElementById('voteban-hint') as HTMLElement).textContent = 'No file selected.'
    } else if (files.length > 1) {
        (document.getElementById('voteban-hint') as HTMLElement).textContent = 'You can only import one file.'
    } else {
        const val = files.item(0)
        val?.text().then(text => {
            try {
                nodecg.sendMessage('votebanImport', JSON.parse(text))
            } catch (err) {
                (document.getElementById('voteban-hint') as HTMLElement).textContent = 'Could not import settings: ' + String(err)
            }
        })
    }
}
