# Obsidian AI

This is a plugin for Obsidian (https://obsidian.md) to use AI power from ChatGPT.

## How to use

- `⌘ + Space` to show popup menu to use AI power
- `Ctrl + c` to abort generating

You can make your own command by providing `Custom Commands` in the settings

Here is a sample:
<details> <summary>Show code</summary>

```json
[
  {
    "id": "translate",
    "icon": "languages",
    "name": "Translate selection text",
    "messages": [
      {
        "role": "system",
        "content": "I want you to act as an English translator, spelling corrector and improver. I will speak to you in any language and you will detect the language, translate it and answer in the corrected and improved version of my text, in English. I want you to replace my simplified A0-level words and sentences with more beautiful and elegant, upper level English words and sentences. Keep the meaning same, but make them more literary. I want you to only reply the correction, the improvements and nothing else, do not write explanations."
      },
      {
        "role": "user",
        "content": "{{SELECTION|LINE|ABOVE}}"
      }
    ],
    "format":"{{NEWLINE}}>{{RESPONSE}}\n"
  }
]
```
</summary>


## How to install

### Install by [BRAT Plugin](https://obsidian.md/plugins?id=obsidian42-brat)

- First install [BRAT Plugin](https://obsidian.md/plugins?id=obsidian42-brat)
- In BRAT Plugin, click `Add Beta plugin`
- Enter https://github.com/fei-ke/obsidian-ai
- Enable `Obsidain AI` in `Community plugins`

### Manually install

- Download latest version in [Releases](https://github.com/fei-ke/Obsidian-AI/releases/latest)
- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/obsidian-ai/`
- Reload plugins in `Community plugins` and enable `Obsidain-AI`

## How to build

- Clone this repo.
- `npm i`  install dependencies
- `npm run dev` to start compilation in watch mode.
- `npm run build`  to build production.