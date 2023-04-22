import { App, PluginSettingTab, Setting } from "obsidian";
import ObsidianPlugin from './main'

export interface PluginSettings {
	openApiKey: string;
	endpoint: string;
	model: string;
	customCommands: string
}

export const DEFAULT_SETTINGS: PluginSettings = {
	openApiKey: '',
	endpoint: 'https://api.openai.com/v1/chat/completions',
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
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Settings for Obsidian AI.' });

		new Setting(containerEl)
			.setName('OpenAI API key')
			.setDesc('Input your openai API key')
			.addText(text => text
				.setPlaceholder('sk-xxx')
				.setValue(this.plugin.settings.openApiKey)
				.onChange(async (value) => {
					this.plugin.settings.openApiKey = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Endpoint')
			.setDesc('Custom Endpoint')
			.addText(text => text
				.setPlaceholder(DEFAULT_SETTINGS.endpoint)
				.setValue(this.plugin.settings.endpoint)
				.onChange(async (value) => {
					this.plugin.settings.endpoint = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Model')
			.setDesc('Select the OpenAI model')
			.addText(text => text
				.setPlaceholder(DEFAULT_SETTINGS.model)
				.setValue(this.plugin.settings.model)
				.onChange(async (value) => {
					this.plugin.settings.model = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Custom Commands')
			.setDesc('Custom your own commands to use Obsidian AI')
			.addTextArea(text => text
				.setPlaceholder('json format command list')
				.setValue(this.plugin.settings.customCommands)
				.onChange(async (value) => {
					this.plugin.settings.customCommands = value;
					await this.plugin.saveSettings();
				}));

	}
}
