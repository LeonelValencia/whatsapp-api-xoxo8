import whatsappService from './whatsappService.js';

class MessageHandler {
  async handleIncomingMessage(message, senderInfo) {
    const phoneNumber = this.cleanPhoneNumber(message.from);
    if (message?.type === 'text') {
        const incomingMessage = message.text.body.toLowerCase().trim();

        if(this.isGreeting(incomingMessage)){
            await this.sendWelcomeMessage(phoneNumber, message.id, senderInfo);
            await this.sendWelcomeMenu(phoneNumber);
        } else if(incomingMessage === 'media') {
            await this.sendMedia(phoneNumber);
        } else {
            const response = `Echo: ${message.text.body}`;
            await whatsappService.sendMessage(phoneNumber, response, message.id);
        }
        await whatsappService.markAsRead(message.id);
    } else if (message?.type === 'interactive'){
      const option = message?.interactive?.button_reply?.title.toLowerCase().trim();
      await this.handleMenuOption(phoneNumber, option);
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

  isMediaRequest(message) {
    const mediaTypes = ['audio', 'imagen', 'video', 'documento'];
  }
  getSenderName(senderInfo) {
    return senderInfo.profile?.name?.split(' ')[0] || senderInfo.wa_id ||'hermano(a)';
  }

  async sendWelcomeMessage(to, messageId, senderInfo) {
    const name = this.getSenderName(senderInfo);
    const response = `Hola ${name}! Bienvenido a nuestro servicio de atención al cliente. ¿En qué puedo ayudarte?`;
    await whatsappService.sendMessage(to, response, messageId);
  }

  async sendWelcomeMenu(to){
    const menuMessage = 'Por favor selecciona una opción:';
    const buttons = [
        { type: 'reply', reply:{id: 'option_1', title: 'Agendar'} },
        { type: 'reply', reply:{id: 'option_2', title: 'Ora por mi'}},
        { type: 'reply', reply:{id: 'option_3', title: 'Ubicacion'} }
    ];
    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }

  async handleMenuOption(to, option){
    let response;
    switch(option){
        case 'agendar':
            response = 'Por favor selecciona una fecha y hora para agendar tu cita';
            break;
        case 'ora por mi':
            response = 'Por favor comparte tu petición de oración';
            break;
        case 'ubicacion':
            response = 'Nuestra dirección es: Calle Falsa 123, Springfield';
            break;
        default:
            response = 'Opción no válida. Por favor selecciona una opción del menú';
    }
    await whatsappService.sendMessage(to, response);
  }
  async sendMedia(to){
    const mediaUrl = 'https://static.platzi.com/media/user_upload/image-2a137e93-ad8f-424d-a4c5-c8e0492de891.jpg';
    const caption = 'Aquí tienes tu imagen';
    const type = 'image';
    await whatsappService.sendMediaMessage(to, type, mediaUrl, caption);
  }
}

export default new MessageHandler();