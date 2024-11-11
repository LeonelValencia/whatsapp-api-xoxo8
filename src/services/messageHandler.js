import whatsappService from './whatsappService.js';

class MessageHandler {
  async handleIncomingMessage(message, senderInfo) {
    if (message?.type === 'text') {
      const incomingMessage = message.text.body.toLowerCase().trim();
      const phoneNumber = this.cleanPhoneNumber(message.from);

      if(this.isGreeting(incomingMessage)){
        await this.sendWelcomeMessage(phoneNumber, message.id, senderInfo);
      } else {
        const response = `Echo: ${message.text.body}`;
        await whatsappService.sendMessage(phoneNumber, response, message.id);
      }
      await whatsappService.markAsRead(message.id);
    }
  }

  cleanPhoneNumber(number) {
    return number.startsWith('521') ? number.replace("521", "52") : number;
  }

  isGreeting(message) {
    const greetings = ['hi', 'hello', 'hey', 'hola', 'saludos', 'buenos días', 'buenas tardes', 'buenas noches'];
    return greetings.includes(message);
  }

  getSenderName(senderInfo) {
    return senderInfo.profile?.name?.split(' ')[0] || senderInfo.wa_id ||'hermano(a)';
  }

  async sendWelcomeMessage(to, messageId, senderInfo) {
    const name = this.getSenderName(senderInfo);
    const response = `Hola ${name}! Bienvenido a nuestro servicio de atención al cliente. ¿En qué puedo ayudarte?`;
    await whatsappService.sendMessage(to, response, messageId);
  }
}

export default new MessageHandler();