import { App, Modal, Platform, Setting, TextAreaComponent } from "obsidian";

export class InputModal extends Modal {
	input: string
	onSubmit: (value: string) => void

	inputField: TextAreaComponent

	constructor(app: App, onSubmit: (value: string) => void) {
		super(app);
		this.onSubmit = onSubmit
	}

	onOpen() {
		const { contentEl } = this;
		const container = contentEl.createDiv()
		container.className = 'input-modal-container'

		this.inputField = new TextAreaComponent(container);
		this.inputField.inputEl.className = 'input-modal-input-field'
		this.inputField.inputEl.focus()
		this.inputField.setPlaceholder("Input your prompts");
		this.inputField.onChange((change) => {
			this.input = change;
		});

		if (!Platform.isMobileApp) {
			this.inputField.inputEl.addEventListener("keydown", (event: KeyboardEvent) => {
				if (event.key === "Enter" && !event.shiftKey) {
					this.onConfirm()
				}
			});
		}

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
		const { contentEl } = this;
		contentEl.empty();
	}
}