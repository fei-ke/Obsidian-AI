export interface Variables {
	[key: string]: () => string | Promise<string>
}

export interface Resolved {
	/**
	 * origin plain text
	 */
	text: string,

	/**
	 * variable name in {{xxx}}
	 */
	variable?: string | null
}

const REGEX_PLACEHOLDER = /(\{\{.+?}})/
const REGEX_VARIABLE = /\{{(.+?)}}/

export class PlaceHolder {

	static resolvePlaceholder(text: string): Resolved[] {
		//split by {{xxx}}
		return text.split(REGEX_PLACEHOLDER)
			//ignore empty
			.filter(Boolean)
			//map to Resolved
			.map((value) => {
				return {text: value, variable:  REGEX_VARIABLE.exec(value)?.[1]?.trim()}
			})
	}

	static resolvePlaceholderWithCallback(text: string, onText: (text: string) => void, onVariable: (variable: string) => void) {
		this.resolvePlaceholder(text).forEach(resolved => {
			if (resolved.variable) {
				onVariable(resolved.variable)
			} else {
				onText(resolved.text)
			}
		})
	}

	static async replaceWithVariables(text: string, variables: Variables): Promise<string> {
		let result = ''

		const traversed = this.resolvePlaceholder(text)

		for (const item of traversed) {
			if (!item.variable) {
				result += item.text
				continue
			}

			//else is a variable
			const options = item.variable.split('|');
			let value;
			for (const v of options) {
				if (!(v in variables)) continue

				value = await variables[v]();

				if (value) break;
			}

			result += value ?? text
		}
		return result
	}
}
