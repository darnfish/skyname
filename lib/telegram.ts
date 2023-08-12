import axios from 'axios'

export default async function sendTelegramMessage(text: string) {
	if(!process.env.TG_BOT_TOKEN)
		return

	try {
		await fetch(`https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMessage`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				chat_id: parseInt(process.env.TG_CHAT_ID),
				text,
				parse_mode: 'HTML'
			})
		})
	} catch {
		
	}
}
