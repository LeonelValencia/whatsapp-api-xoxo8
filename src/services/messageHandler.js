import whatsappService from './whatsappService.js';
import appendToSheet from './googleSheetsService.js';

class MessageHandler {

  constructor() {
    this.appointmentState = {};
  }

  async handleIncomingMessage(message, senderInfo) {
    const phoneNumber = this.cleanPhoneNumber(message.from);
    if (message?.type === 'text') {
        const incomingMessage = message.text.body.toLowerCase().trim();

        if(this.isGreeting(incomingMessage)){
            await this.sendWelcomeMessage(phoneNumber, message.id, senderInfo);
            await this.sendWelcomeMenu(phoneNumber);
        } else if(incomingMessage === 'media') {
            await this.sendMedia(phoneNumber);
        } else if (this.appointmentState[phoneNumber]) {
          await this.handleAppointmentFlow(phoneNumber, incomingMessage);
        } else {
          await this.handleMenuOption(phoneNumber, incomingMessage);
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
          this.appointmentState[to] = { step: 'name' };
            response = 'Por favor, ingresa tu nombre';
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

  completeAppointment(to){
    const appointment = this.appointmentState[to];
    delete this.appointmentState[to];

    const userData = [
      to, 
      appointment.name, 
      appointment.date, 
      appointment.time, 
      appointment.reason,
      appointment.place
    ]
    appendToSheet(userData);

    return `Tu cita ha sido agendada con éxito. Nos vemos el ${appointment.date} a las ${appointment.time}`;
  }

  async handleAppointmentFlow(to, message){
    const state = this.appointmentState[to];
    let response;

    switch (state.step) {
      case 'name':
        state.name = message;
        state.step = 'date';
        response = 'Por favor selecciona una fecha para tu cita';
        break;
      case 'date':
        state.date = message;
        state.step = 'time';
        response = 'Por favor selecciona una hora para tu cita';
        break;
      case 'time':
        state.time = message;
        state.step = 'reason';
        response = 'Quieres estudios biblicos, consejeria, oracion o de que tema (salud, familia, fe de Jesús, etc.)?';
        break;
      case 'reason':
        state.reason = message;
        state.step = 'place';
        response = `Por favor ingresa la dirección donde se llevará a cabo tu cita`;
        break;
      case 'place':
        state.place = message;
        response = this.completeAppointment(to);
        break;
    }
    await whatsappService.sendMessage(to, response);
  }
}

export default new MessageHandler();