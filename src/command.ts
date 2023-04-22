export interface Command {
	//unique id for the command
	id: string,

	//https://lucide.dev
	icon?: string

	//name for the command
	name: string,

	//system prompts
	system?: string,

	//user prompts
	user: string,

	//default all
	type?: string

	//response in newline
	newline?: boolean
}

export const DEFAULT_COMMANDS: Array<Command> = [
	{
		id: 'ask',
		icon: 'rocket',
		name: 'Ask AI anything',
		system: 'You are a helpful assistant',
		user: '{{INPUT}}'
	},
	{
		id: 'ask-selecetion',
		icon: 'rocket',
		name: 'Ask AI based on selection',
		system: 'You are a helpful assistant',
		user: '{{INPUT}}:\n "{{SELECTION_OR_LINE}}"',
	},
	{
		id: 'continue-writting',
		icon: 'edit-3',
		name: 'Continue writing for the current selection or line',
		system: "User are writting a ducument, the ducument file name is {{FILE_NAME}}, You are trying to continue to complete the user's content.Use user's language to response. Write only the completion and nothing else.",
		user: '{{SELECTION_OR_LINE}}',
		newline: false
	},
	{
		id: 'outline',
		icon: 'list',
		name: 'Generate outline base on selection or title',
		system: "Help writing a brife outline for a document, formatted in markdown and do not include title. Use the user's language to response",
		user: '{{SELECTION_OR_TITLE}}'
	},
	{
		id: 'summary',
		icon: 'book',
		name: 'Generate summary base on selection or full documennt',
		system: "Help writing a brief summary for a document, formatted in markdown and do not include a title, Use the user's language to response",
		user: '{{SELECTION_OR_FULL}}'
	}
]