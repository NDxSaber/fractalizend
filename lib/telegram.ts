const BOT_TOKEN = '8128395110:AAEOWzMKhKYkWsrWFY2rBqxsWcKOu8nWBM8';
const CHAT_ID = '460256491';

export async function sendTelegramNotification(message: string) {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    throw error;
  }
} 