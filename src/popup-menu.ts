import {
	App,
	Editor,
	EditorPosition,
	EditorSuggest,
	EditorSuggestContext,
	EditorSuggestTriggerInfo,
	TFile
} from "obsidian";
import { Command } from "./command";
import ObsidianPlugin from "./main";
import { logger } from "./logger";

//a hacky way to show EditorSuggest as popup menu
export class PopupMenu extends EditorSuggest<Command> {
	private commands: Command[]

	private plugin: ObsidianPlugin

	private editor: Editor | null = null;

	private firstTriggerAfterShowing: boolean = false;

	private hasSelections: boolean = false;

	private _isShowing: boolean = false;

	constructor(app: App, plugin: ObsidianPlugin, commands: Command[]) {
		super(app)
		this.plugin = plugin
		this.commands = commands
	}

	show(editor: Editor) {
		logger.debug("show PopupMenu");

		//when has selections, suggest popup will not showing,
		//hacked by temporarily clear selections to bypass this check,
		//and restore selections after showing
		const selection = editor.listSelections().last();

		if (selection) {
			this.hasSelections = selection.anchor.line != selection.head.line || selection.anchor.ch != selection.head.ch
		}

		if (selection && this.hasSelections) {
			logger.debug('clear selections');
			editor.setSelection(selection.head);
		}

		//call internal method to show the popup
		(this as any).trigger(editor, null, true);

		//restore selection and ignore multiple selection
		if (selection && this.hasSelections) {
			editor.setSelection(selection.anchor, selection.head);
		}
	}

	reset() {
		this.editor = null
		this.firstTriggerAfterShowing = false
		this.hasSelections = false
		this._isShowing = false
	}

	close(): void {
		super.close()
		this.reset()

		logger.debug("close PopupMenu");
	}

	isShowing(): boolean {
		return this._isShowing
	}

	onTrigger(cursor: EditorPosition, editor: Editor, file: TFile | null): EditorSuggestTriggerInfo | null {
		const manually = file == null
		if (manually) {
			logger.debug(`onTrigger: manually=${file == null}, firstTriggerAfterShowing=${this.firstTriggerAfterShowing}, hasSelections=${this.hasSelections}`);
		}

		//after a manual showing and without selection, a subsequent of onTrigger will be called, we should ignore this one
		if (this.firstTriggerAfterShowing && !this.hasSelections) {
			this.firstTriggerAfterShowing = false
			return null
		}


		if (this._isShowing) {
			this.close()
		}

		//mark as manual trigger
		if (file == null) {
			this.editor = editor
			this.firstTriggerAfterShowing = true
			this._isShowing = true

			return {start: cursor, end: cursor, query: "",}
		}

		return null
	}

	open(): void {
		super.open()
		this._isShowing = true
		logger.debug("PopupMenu showing");
	}

	getSuggestions(context: EditorSuggestContext): Command[] | Promise<Command[]> {
		logger.debug("getSuggestions")
		return this.commands
	}

	renderSuggestion(value: Command, el: HTMLElement): void {
		logger.debug("renderSuggestion")
		el.setText(value.name)
	}

	selectSuggestion(value: Command, evt: MouseEvent | KeyboardEvent): void {
		logger.debug("selectSuggestion")
		if (this.editor == null) return

		this.plugin.processCommand(value, this.editor)
		this.close()
	}
}
