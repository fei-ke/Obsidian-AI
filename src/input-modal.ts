import { App, Modal, Platform, Setting, TextAreaComponent } from "obsidian";

export class InputModal extends Modal {
	title: string
	onSubmit: (value: string) => void

	input: string
	inputField: TextAreaComponent

	constructor(app: App, title: string, onSubmit: (value: string) => void) {
		super(app);
		this.title = title
		this.onSubmit = onSubmit

		if (!Platform.isMobileApp) {
			this.scope.register([], 'Enter', () => {
				this.onConfirm()
				return false
			})
		}
	}

	onOpen() {
		const {contentEl} = this;

		new Setting(contentEl).setName(this.title)

		const container = contentEl.createDiv()
		container.className = 'input-modal-container'

		this.inputField = new TextAreaComponent(container);
		this.inputField.inputEl.className = 'input-modal-input-field'
		this.inputField.inputEl.focus()
		this.inputField.setPlaceholder("Input your prompts");
		this.inputField.onChange((change) => {
			this.input = change;
		});

		new Setting(contentEl).addButton((btn) =>
			btn.setButtonText("OK")
				.setCta()
				.onClick(() => {
					this.onConfirm()
				})
		);
	}

	onConfirm() {
		this.close();
		this.onSubmit(this.input);
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
