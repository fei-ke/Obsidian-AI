export interface Command {
	//unique id for the command
	id: string,

	//https://lucide.dev
	icon?: string

	//name for the command
	name: string,

	messages: { role: string, content: string, name?: string }[],

	//response format
	format?: string

	//default all
	type?: string,
}

export const DEFAULT_COMMANDS: Array<Command> = [
	{
		id: 'ask',
		icon: 'rocket',
		name: 'Ask AI anything',
		messages: [
			{
				role: 'system',
				content: 'You are a helpful assistant. Respond using markdown. Current date is "{{DATE}} {{TIME}}"',
			},
			{
				role: 'user',
				content: '{{INPUT}}',
			}
		]
	},
	{
		id: 'ask-selecetion',
		icon: 'rocket',
		name: 'Ask AI based on selection',
		messages: [
			{
				role: 'system',
				content: 'User are writting a ducument, the ducument file name is {{FILE_NAME}}, You are trying to help user writting document. Respond using markdown. Current date is "{{DATE}} {{TIME}}"',
			},
			{
				role: 'user',
				content: 'a piece of content is "{{SELECTION|LINE}}", request is "{{INPUT}}"',
			}
		]
	},
	{
		id: 'continue-writting',
		icon: 'edit-3',
		name: 'Continue writing for the current selection or line',
		messages: [
			{
				role: 'system',
				content: "User are writting a ducument, the ducument file name is {{FILE_NAME}}, You are trying to continue to complete the user's content. Use user's language to response. Write only the completion and nothing else. Respond using markdown.",
			},
			{
				role: 'user',
				content: '{{SELECTION|LINE}}',
			}
		],
		format: ''
	},
	{
		id: 'outline',
		icon: 'list',
		name: 'Generate outline base on selection or title',
		messages: [
			{
				role: 'system',
				content: "Help writing a brife outline for a document, formatted in markdown and do not include title. Use the user's language to response.",
			},
			{
				role: 'user',
				content: '{{SELECTION|TITLE}}',
			}
		]
	},
	{
		id: 'summary',
		icon: 'book',
		name: 'Generate summary base on selection or full documennt',
		messages: [
			{
				role: 'system',
				content: "Help writing a brief summary for a document, do not include a title, Use the user's language to response, Respond using markdown.",
			},
			{
				role: 'user',
				content: '{{SELECTION|BODY}}',
			}
		]
	},
]