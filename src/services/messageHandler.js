import whatsappService from './whatsappService.js';
import appendToSheet from './googleSheetsService.js';
import openAIService from './openAIService.js';

class MessageHandler {

  constructor() {
    this.appointmentState = {};
    this.assistantState = {};
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
        } else if (this.assistantState[phoneNumber]) {
          await this.handleAssistantFlow(phoneNumber, incomingMessage);
        } else {
          await this.handleMenuOption(phoneNumber, incomingMessage);
        }
        await whatsappService.markAsRead(message.id);
    } else if (message?.type === 'interactive'){
      const option = message?.interactive?.button_reply?.id;
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
        { type: 'reply', reply:{id: 'schedule', title: 'Agendar'} },
        { type: 'reply', reply:{id: 'advise', title: 'Consultar'}},
        { type: 'reply', reply:{id: 'location', title: 'Ubicación'} }
    ];
    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }

  async handleMenuOption(to, option){
    let response;
    switch(option){
        case 'schedule':
          this.appointmentState[to] = { step: 'name' };
            response = 'Por favor, ingresa tu nombre';
            break;
        case 'advise':
          this.assistantState[to] = { step: 'question' };
            response = 'Por favor, ingresa tu pregunta';
            break;
        case 'location':
            response = 'Te esperamos en nuestra iglesia. Aquí tienes la ubicación';
            await this.sendLocation(to);
            break;
        case 'emergency':
          response = 'Por favor, llama a nuestra linea de atencion';
          await this.sendContact(to);  
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

  async handleAssistantFlow(to, message){
    const state = this.assistantState[to];
    let response;
    const menuMessage = '¿La respuesta fue de tu ayuda?';
    const buttons = [
      { type: 'reply', reply:{id: 'ok', title: 'Sí'} },
      { type: 'reply', reply:{id: 'query2', title: 'Hacer otra pregunta'}},
      { type: 'reply', reply:{id: 'emergency', title: 'Emergencia'} }
    ];

    if (state.step === 'question') {
      response = await openAIService(message);
    }
    
    delete this.assistantState[to];
    await whatsappService.sendMessage(to, response);
    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }

  async sendContact(to) {
    const contact = {
      addresses: [
        {
          street: "Calle 21 de marzo",
          city: "Xoxocotla",
          state: "Morelos",
          zip: "62680",
          country: "Mexico",
          country_code: "MX",
          type: "WORK"
        }
      ],
      emails: [
        {
          email: "xoxoiasd16@gmail.com",
          type: "WORK"
        }
      ],
      name: {
        formatted_name: "Iglesia Adventista Xoxo 8",
        first_name: "Iglesia Adventista",
        last_name: "Xoxocotla 8",
        middle_name: "",
        suffix: "",
        prefix: ""
      },
      org: {
        company: "Iglesia Adventista del Séptimo Día",
        department: "Atención al Cliente",
        title: "Representante"
      },
      phones: [
        {
          phone: "+527341022196",
          wa_id: "5273410221960",
          type: "WORK"
        }
      ],
      urls: [
        {
          url: "https://iasd-umi.org/",
          type: "WORK"
        }
      ]
    };

    await whatsappService.sendContactMessage(to, contact);
  }

  async sendLocation(to){
    const location = {
      latitude: 18.6767005,
      longitude: -99.2464595,
      name: 'Iglesia Adventista del Séptimo Día Xoxocotla 8',
      address: 'Calle 21 de marzo, Xoxocotla, Morelos'
    };
    await whatsappService.sendLocationMessage(to, location);
  }
}

export default new MessageHandler();