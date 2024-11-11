import whatsappService from './whatsappService.js';

const cleanPhoneNumber = (number) => {
    return number.startsWith('521') ? number.replace("521", "52") : number;
}

class MessageHandler {
  async handleIncomingMessage(message, senderInfo) {
    if (message?.type === 'text') {
      const incomingMessage = message.text.body.toLowerCase().trim();

      if(this.isGreeting(incomingMessage)){
        await this.sendWelcomeMessage(cleanPhoneNumber(message.from), message.id, senderInfo);
      } else {
        const response = `Echo: ${message.text.body}`;
        await whatsappService.sendMessage(cleanPhoneNumber(message.from), response, message.id);
      }
      await whatsappService.markAsRead(message.id);
    }
  }

  isGreeting(message) {
    const greetings = ['hi', 'hello', 'hey', 'hola', 'saludos', 'buenos días', 'buenas tardes', 'buenas noches'];
    return greetings.includes(message);
  }

  getSenderName(senderInfo) {
    return senderInfo.profile?.name || senderInfo.wa_id ||'hermano(a)';
  }

  async sendWelcomeMessage(to, messageId, senderInfo) {
    const name = this.getSenderName(senderInfo);
    const response = `Hola ${name}! Bienvenido a nuestro servicio de atención al cliente. ¿En qué puedo ayudarte?`;
    await whatsappService.sendMessage(to, response, messageId);
  }
}

export default new MessageHandler();