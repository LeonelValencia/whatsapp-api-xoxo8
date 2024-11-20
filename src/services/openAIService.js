import openai from 'openai';
import config from '../config/env.js';

const client = new openai({
    apiKey: config.CHATGPT_API_KEY,
});

const openAIService = async (message) => {
    try {
        const response = await client.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: 'Comportarte como un pastor adventista del septimo dia con mucha experiencia, deberás de resolver las preguntas lo más simple posible. Responde en texto plano, como si fuera una conversación por WhatsApp, no saludes, no generas conversaciones, solo respondes con la pregunta del usuario.' },
                { role: 'user', content: message },
            ],
        });
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error(error);
    }
}

export default openAIService;