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
		const system = command.system ? await this.replacePlaceHolder(command.system, editor) : ''
		const user = await this.replacePlaceHolder(command.user, editor)
		this.generateText(editor, system, user, command.newline)
	}

	generateText(editor: Editor, system: string, user: string, newline: boolean = true) {
		console.log("system: " + system)
		console.log("user: " + user)

		const messages = []

		if (system.length > 0) {
			messages.push({
				role: 'system',
				content: system,
			})
		}

		if (user.length > 0) {
			messages.push({
				role: 'user',
				content: user,
			})
		}


		let cursorToWrite = editor.listSelections().last()?.anchor ?? editor.getCursor()

		const plugin = this

		ChatGPT.request(
			this.settings.endpoint,
			this.settings.openApiKey,
			this.settings.model,
			messages,
			newline,
			(content: string) => {
				cursorToWrite = plugin.writeText(editor, cursorToWrite, content)
			},
			(error: string) => {
				new Notice(error);
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
			SELECTION_OR_LINE: () => {
				return getSelection() ?? editor.getLine(editor.getCursor().line)
			},
			INPUT: async () => {
				return this.showInputModal()
			},
			FULL: () => {
				return editor.getValue()
			},
			SELECTION_OR_FULL: () => {
				return getSelection() ?? editor.getValue()
			},
			SELECTION_OR_TITLE: () => {
				return getSelection() ?? `${this.app.workspace.getActiveFile()?.basename}`
			}
		}

		async function replaceWithVariables(text: string, variables: Variables): Promise<string> {
			const regex = /\{{(.+?)}}/g;
			let match;
			let result = text;

			while ((match = regex.exec(text))) {
				const variableName = match[1].trim();

				if (!(variableName in variables)) continue

				const variableValue = await Promise.resolve(variables[variableName]());

				result = result.replace(match[0], variableValue);
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


