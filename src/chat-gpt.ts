import { log } from "console";
import { SSE } from "sse.js";


export class ChatGPT {
	static request(
		endpoint: string,
		token: string,
		model: string,
		messages: Array<any>,
		newline: boolean,
		onMessage: (text: string) => void,
		onError: (text: string) => void,
	) {

		const data = {
			model: model,
			messages: messages,
			stream: true,
		}

		const sse = new SSE(endpoint, {
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			method: "POST",
			payload: JSON.stringify(data),
		});


		sse.addEventListener('message', function (e: any) {
			try {
				if (e.data == '[DONE]') return;

				const json = JSON.parse(e.data)
				const content = json.choices[0].delta.content

				if (content) {
					onMessage(content)
				}

			} catch (e) {
				onError(e.toString())
			}
		});

		sse.addEventListener("error", (e: any) => {
			try {
				console.log("error data: " + e.data)
				const json = JSON.parse(e.data)
				onError(json.error.message)
			} catch (e) {
				onError("On error occurred. Please check the console for more details.")
			}
		});

		sse.addEventListener("readystatechange", (e: any) => {
			console.log("sse ready state = " + e.readyState)
			if (e.readyState == SSE.OPEN) {
				if (newline) {
					onMessage('\n')
				}
			}
		});
		sse.stream()
	}
}
