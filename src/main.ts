import { App, Editor, EditorPosition, EditorTransaction, Notice, Plugin } from 'obsidian';
import { PluginSettings, DEFAULT_SETTINGS, ObsidianSettingTab } from './settings'
import { InputModal } from './input-modal';
import { Command as AiCommand, DEFAULT_COMMANDS } from './command';
import { ChatGPT } from './chat-gpt';


export default class ObsidianPlugin extends Plugin {
	settings: PluginSettings;

	async onload() {
		await this.loadSettings();

		DEFAULT_COMMANDS.forEach((aiCommand) => {
			this.addCommand({
				id: aiCommand.id,
				name: aiCommand.name,
				icon: aiCommand.icon,
				editorCallback: (editor: Editor) => {
					this.processCommand(aiCommand, editor)
				}
			})
		})

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new ObsidianSettingTab(this.app, this));
	}

	async processCommand(command: AiCommand, editor: Editor) {
		const messages: any[] = []

		for (const message of command.messages) {
			messages.push({
				...message,
				content: await this.replacePlaceHolder(message.content, editor)
			})
		}

		this.generateText(editor, messages, command.format)
	}

	generateText(editor: Editor, messages: any[], format: string = '\n{{RESPONSE}}\n') {
		console.log("messages: " + JSON.stringify(messages))
		console.log("format: " + format)

		const selection = editor.listSelections().last();

		let cursorToWrite: EditorPosition
		if (selection) {
			cursorToWrite = selection.anchor.line > selection.head.line ? selection.anchor : selection.head
		} else {
			cursorToWrite = editor.getCursor()
		}

		console.log(`cursorToWrite: line = ${cursorToWrite.line}, ch = ${cursorToWrite.ch}`)

		const split = format.split('{{RESPONSE}}')
		const prefix = split[0]
		const suffix = split[1]

		if (prefix) {
			cursorToWrite = this.writeText(editor, cursorToWrite, prefix)
		}
		if (suffix) {
			this.writeText(editor, cursorToWrite, suffix)
		}

		const plugin = this

		ChatGPT.request(
			this.settings.endpoint,
			this.settings.openApiKey,
			this.settings.model,
			messages,
			(content: string) => {
				cursorToWrite = plugin.writeText(editor, cursorToWrite, content)
			},
			(error: string) => {
				new Notice(error);
			},
			() => {

			},
			() => {

			})
	}

	writeText(editor: Editor, pos: EditorPosition, text: string): EditorPosition {
		const textLines = text.split('\n')

		let line = pos.line
		let ch = pos.ch

		for (let i = 0; i < textLines.length; i++) {
			const t = textLines[i];

			if (t.length > 0) {
				this.write(editor, line, ch, t)
				ch += t.length;
			}

			//has new line
			if (i < textLines.length - 1) {
				this.write(editor, line, ch, '\n')
				line++; ch = 0;
			}
		}

		const newCursor: EditorPosition = {
			line: line,
			ch: ch
		}

		editor.setCursor(newCursor)

		return newCursor
	}

	write(edited: Editor, line: number, ch: number, text: string) {

		const transaction: EditorTransaction = {
			changes: [{
				from: {
					line: line,
					ch: ch
				},
				text: text
			}]
		}
		edited.transaction(transaction)
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}


	async replacePlaceHolder(template: string, editor: Editor) {
		interface Variables {
			[key: string]: () => string | Promise<string>
		}

		function getSelection() {
			const selection = editor.getSelection()

			return selection.length > 0 ? selection : null;
		}

		const variables = {
			TITLE: () => {
				return `${this.app.workspace.getActiveFile()?.basename}`
			},
			FILE_NAME: () => {
				return `${this.app.workspace.getActiveFile()?.name}`;
			},
			SELECTION: () => {
				return getSelection() ?? editor.getLine(editor.getCursor().line)
			},
			LINE: () => {
				return editor.getLine(editor.getCursor().line)
			},
			INPUT: async () => {
				return this.showInputModal()
			},
			BODY: () => {
				return editor.getValue()
			},
			DATE: () => {
				return new Date().toLocaleDateString()
			},
			TIME: () => {
				return new Date().toLocaleTimeString()
			}
		}

		async function replaceWithVariables(text: string, variables: Variables): Promise<string> {
			const regex = /\{{(.+?)}}/g;
			let match;
			let result = text;

			while ((match = regex.exec(text))) {
				const options = match[1].trim().split('|');

				let value = undefined;

				for (const v of options) {
					if (!(v in variables)) continue

					value = await Promise.resolve(variables[v]());

					if (value) break;
				}
				result = result.replace(match[0], value!!);
			}
			return result;
		}

		return replaceWithVariables(template, variables)
	}

	async showInputModal(): Promise<string> {
		return new Promise((resolve, reject) => {

			const onSubmit = (input: string) => {
				resolve(input)
			}

			new InputModal(this.app, onSubmit).open()
		});
	}
}


