import { App, Editor, MarkdownView, Modal, Notice, Plugin } from 'obsidian';
import { PluginSettings, DEFAULT_SETTINGS, ObsidianSettingTab } from './settings'
import { InputModal } from './input-modal';
import { Command as AiCommand, DEFAULT_COMMANDS } from './command';

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

		console.log("system: " + system)
		console.log("user: " + user)
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