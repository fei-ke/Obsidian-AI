import { App, PluginSettingTab, Setting } from "obsidian";
import ObsidianPlugin from './main'

export interface PluginSettings {
	openApiKey: string;
	openAiOrganization: string,
	endpoint: string;
	model: string;
	customCommands: string
}

export const DEFAULT_SETTINGS: PluginSettings = {
	openApiKey: '',
	endpoint: 'https://api.openai.com/v1/chat/completions',
	openAiOrganization: '',
	model: 'gpt-3.5-turbo',
	customCommands: ''
}

export class ObsidianSettingTab extends PluginSettingTab {
	plugin: ObsidianPlugin;

	constructor(app: App, plugin: ObsidianPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for Obsidian AI.'});

		new Setting(containerEl)
			.setName('OpenAI API key')
			.setDesc('Enter your OpenAI API key')
			.addText(text => text
				.setPlaceholder('sk-xxx')
				.setValue(this.plugin.settings.openApiKey)
				.onChange(async (value) => {
					this.plugin.settings.openApiKey = value.trim();
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Endpoint')
			.setDesc('Custom Endpoint')
			.addText(text => text
				.setPlaceholder(DEFAULT_SETTINGS.endpoint)
				.setValue(this.plugin.settings.endpoint)
				.onChange(async (value) => {
					this.plugin.settings.endpoint = value.trim();
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('OpenAI Organization')
			.setDesc('Enter your OpenAI organization or leave blank if you don\'t have one.')
			.addText(text => text
				.setPlaceholder('org-xxx')
				.setValue(this.plugin.settings.openAiOrganization)
				.onChange(async (value) => {
					this.plugin.settings.openAiOrganization = value.trim();
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Model')
			.setDesc('Select the OpenAI model')
			.addText(text => text
				.setPlaceholder(DEFAULT_SETTINGS.model)
				.setValue(this.plugin.settings.model)
				.onChange(async (value) => {
					this.plugin.settings.model = value.trim();
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Custom Commands')
			.setDesc('Custom your own commands to use Obsidian AI')
			.addTextArea(text => text
				.setPlaceholder('Json format command list')
				.setValue(this.plugin.settings.customCommands)
				.onChange(async (value) => {
					this.plugin.settings.customCommands = value;
					await this.plugin.saveSettings();
				}));

	}
}
