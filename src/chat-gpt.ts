import { SSE } from "sse.js";
import { logger } from "./logger";

type SSE = typeof SSE

export interface Message {
	role: string,
	content: string,
	name?: string
}

interface RequestData {
	endpoint: string,
	token: string,
	model: string,
	messages: Array<Message>,
	onMessage: (text: string) => void,
	onConnecting?: () => void,
	onStart?: () => void,
	onEnd?: () => void,
	onError?: (text: string) => void,
}

export class ChatGPT {
	sse: SSE

	request(request: RequestData) {

		const data = {
			model: request.model,
			messages: request.messages,
			stream: true,
		}

		if (this.sse) {
			this.abort()
		}

		this.sse = new SSE(request.endpoint, {
			headers: {
				Authorization: `Bearer ${request.token}`,
				"Content-Type": "application/json",
			},
			method: "POST",
			payload: JSON.stringify(data),
		});


		this.sse.addEventListener('message', function (e: any) {
			try {
				if (e.data == '[DONE]') return;

				const json = JSON.parse(e.data)
				const content = json.choices[0].delta.content

				if (content) {
					request.onMessage(content)
				}

			} catch (e) {
				request.onError?.(e.toString())
			}
		});

		this.sse.addEventListener("error", (e: any) => {
			try {
				logger.info("error data: " + e.data)
				const json = JSON.parse(e.data)
				request.onError?.(json.error.message)
			} catch (e) {
				logger.error(e)
				request.onError?.("On error occurred. Please check the console for more details.")
			}
		});

		this.sse.addEventListener("readystatechange", (e: any) => {
			logger.debug("sse ready state = " + e.readyState)
			switch (e.readyState) {
				case 1:
					request.onStart?.()
					break;
				case 2:
					request.onEnd?.()
					break;
				case 0:
					request.onConnecting?.()
					break;
			}
		});
		this.sse.stream()
	}

	abort() {
		if (this.sse && this.sse.readyState != -1) {
			this.sse.close()
		}
	}
}
