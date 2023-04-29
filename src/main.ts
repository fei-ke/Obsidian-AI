import { Editor, EditorPosition, EditorTransaction, Notice, Plugin, setIcon } from 'obsidian';
import { PluginSettings, DEFAULT_SETTINGS, ObsidianSettingTab } from './settings'
import { InputModal } from './input-modal';
import { Command as AiCommand, DEFAULT_COMMANDS, DEFAULT_RESPONSE_FORMAT, RESPONSE_PLACEHOLDER } from './command';
import { ChatGPT, Message } from './chat-gpt';
import { PopupMenu } from './popup-menu';
import { PlaceHolder, Resolved, Variables } from "./placeholder";
import { logger } from "./logger";

interface StatusBarItem {
	icon: HTMLElement,
	text: HTMLElement
}

export default class ObsidianPlugin extends Plugin {
	public settings: PluginSettings;

	private popupMenu: PopupMenu;

	private chatGPT = new ChatGPT()

	private statusBarItem: StatusBarItem

	async onload() {
		await this.loadSettings();

		const customCommands: AiCommand[] = this.loadCustomCommands()

		const mergedCommands = [...customCommands, ...DEFAULT_COMMANDS.filter((item1) => !customCommands.find((item2) => item1.id === item2.id))];

		for (const aiCommand of mergedCommands) {
			try {
				this.addCommand({
					id: aiCommand.id,
					name: aiCommand.name,
					icon: aiCommand.icon,
					editorCallback: (editor: Editor) => {
						this.processCommand(aiCommand, editor)
					}
				})
			} catch (e) {
				new Notice(`Failed to load custom command: ${aiCommand.name}. Please check the console for more details.`)
				logger.error(e)
			}
		}
		this.popupMenu = new PopupMenu(this.app, this, mergedCommands)

		this.registerEditorSuggest(this.popupMenu)

		this.addCommand({
			id: 'show-popup-menu',
			name: 'Show popup menu',
			icon: 'bot',
			hotkeys: [{
				modifiers: ["Mod"],
				key: " ",
			}],
			editorCallback: (editor) => {
				if (!this.popupMenu.isShowing()) {
					this.popupMenu.show(editor)
				} else {
					this.popupMenu.close()
				}
			}
		});

		this.addCommand({
			id: 'abort-generating',
			name: 'Abort Generating',
			icon: 'x-octagon',
			hotkeys: [{
				modifiers: ["Ctrl"],
				key: "c",
			}],
			callback: () => {
				logger.debug("abort generate")
				this.chatGPT.abort()
			}
		});

		this.statusBarItem = this.createStatusBarItem()

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new ObsidianSettingTab(this.app, this));
	}

	private loadCustomCommands(): AiCommand[] {
		if (!this.settings.customCommands) return []

		try {
			return JSON.parse(this.settings.customCommands).filter((item: AiCommand) => item.id && item.name && item.messages)
		} catch (e) {
			new Notice(`Failed to parse custom commands, Please check the console for more details.`)
			logger.error(e)
			return []
		}
	}

	async processCommand(command: AiCommand, editor: Editor) {
		const messages: Message[] = []

		function requestInput() {
			return Promise.resolve(this.showInputModal(command.name))
		}

		for (const message of command.messages) {
			messages.push({
				...message,
				content: await this.replacePlaceHolder(message.content, editor, requestInput.bind(this))
			})
		}

		this.generateText(editor, messages, command.format)
	}

	private generateText(editor: Editor, messages: Message[], responseFormat = DEFAULT_RESPONSE_FORMAT) {
		logger.debug("messages: " + JSON.stringify(messages))
		logger.debug("responseFormat: " + responseFormat)

		const selection = editor.listSelections().last();

		let cursorToWrite: EditorPosition
		if (selection) {
			cursorToWrite = selection.anchor.line > selection.head.line ? selection.anchor : selection.head
		} else {
			cursorToWrite = editor.getCursor()
		}

		logger.debug(`cursorToWrite: line = ${cursorToWrite.line}, ch = ${cursorToWrite.ch}`)


		this.chatGPT.request({
			endpoint: this.settings.endpoint,
			token: this.settings.openApiKey,
			model: this.settings.model,
			messages: messages,
			onMessage: (content: string) => {
				cursorToWrite = this.writeText(editor, cursorToWrite, content)
			},
			onError: (error: string) => {
				new Notice(error);
				this.setStatus()
			},
			onStart: () => {
				this.setStatus('generating')
				cursorToWrite = this.prepareResponseFormat(editor, cursorToWrite, responseFormat)
			},
			onEnd: () => {
				this.setStatus('')
			},
			onConnecting: () => {
				this.setStatus('connecting')
			}
		})
	}

	private prepareResponseFormat(editor: Editor, cursorToWrite: EditorPosition, responseFormat: string): EditorPosition {
		let cursorToResponse = cursorToWrite

		const handleVariable = (item: Resolved) => {
			if (item.variable == RESPONSE_PLACEHOLDER.NEWLINE && editor.getLine(cursorToWrite.line)) {
				cursorToWrite = this.writeText(editor, {
						line: cursorToWrite.line,
						ch: editor.getLine(cursorToWrite.line).length
					}, '\n'
				)
			} else if (item.variable == RESPONSE_PLACEHOLDER.RESPONSE) {
				cursorToResponse = cursorToWrite
			}
		};

		PlaceHolder.resolvePlaceholder(responseFormat).forEach(item => {
			if (item.variable) {
				handleVariable(item);
			} else {
				cursorToWrite = this.writeText(editor, cursorToWrite, item.text)
			}
		})

		return cursorToResponse
	}

	private writeText(editor: Editor, pos: EditorPosition, text: string): EditorPosition {
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
				line++;
				ch = 0;
			}
		}

		const newCursor: EditorPosition = {
			line: line,
			ch: ch
		}

		editor.setCursor(newCursor)

		return newCursor
	}

	private write(edited: Editor, line: number, ch: number, text: string) {

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

	private createStatusBarItem(): StatusBarItem {
		const container = this.addStatusBarItem().createDiv();
		container.className = 'status-bar-container'

		const icon = container.createDiv()
		icon.className = 'status-bar-icon'

		const text = container.createSpan();
		text.className = 'status-bar-text'

		// setIcon(icon, 'arrow-up-down')
		// text.setText("Connecting")

		return {
			icon: icon,
			text: text
		}
	}

	private setStatus(status?: 'connecting' | 'generating' | '') {
		switch (status) {
			case 'connecting':
				this.statusBarItem.text.setText('Connecting...')
				setIcon(this.statusBarItem.icon, 'globe')
				break
			case 'generating':
				this.statusBarItem.text.setText('Generating...')
				setIcon(this.statusBarItem.icon, 'arrow-up-down')
				break
			default:
				this.statusBarItem.text.setText('')
				setIcon(this.statusBarItem.icon, '')
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}


	private async replacePlaceHolder(template: string, editor: Editor, requestInput: () => string) {

		function getSelection(): string {
			return editor.getSelection().trim()
		}

		function getLine(lineNumber: number): string {
			return editor.getLine(lineNumber--)
		}

		function getAbove(lineNumber: number): string {
			while (lineNumber >= 0) {
				const line = getLine(lineNumber--);
				if (line) {
					return line;
				}
			}
			return '';
		}

		const variables: Variables = {
			TITLE: () => {
				return `${this.app.workspace.getActiveFile()?.basename}`
			},
			FILE_NAME: () => {
				return `${this.app.workspace.getActiveFile()?.name}`;
			},
			SELECTION: () => {
				return getSelection()
			},
			LINE: () => {
				return getLine(editor.getCursor().line)
			},
			ABOVE: () => {
				return getAbove(editor.getCursor().line)
			},
			INPUT: async () => {
				return requestInput()
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

		return PlaceHolder.replaceWithVariables(template, variables)
	}

	private async showInputModal(title: string): Promise<string> {
		return new Promise((resolve, reject) => {

			const onSubmit = (input: string) => {
				resolve(input)
			}

			new InputModal(this.app, title, onSubmit).open()
		});
	}
}

