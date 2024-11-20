import sendToWhatsApp from '../services/httpRequest/sendToWhatsApp.js';

class WhatsAppService {
  async sendMessage(to, body, messageId) {
    const data = {
      messaging_product: 'whatsapp',
      to,
      text: {
        body,
      },
    }
    await sendToWhatsApp(data);
  }

  async markAsRead(messageId) {
    const data = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    }
    await sendToWhatsApp(data);
  }

  async sendInteractiveButtons(to, BodyText, buttons) {
    const data = {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: BodyText },
        action: {
          buttons: buttons
        }
      },
    }
    await sendToWhatsApp(data);
  }

  async sendMediaMessage(to, type, mediaUrl, caption) {
    const mediaObject = {};

    switch (type) {
      case 'image':
        mediaObject.image = { link: mediaUrl, caption };
        break;
      case 'audio':
        mediaObject.audio = { link: mediaUrl };
        break;
      case 'video':
        mediaObject.video = { link: mediaUrl, caption };
        break;
      case 'document':
        mediaObject.document = { link: mediaUrl, caption, filename: 'iasd.pdf' };
        break;
      default:
        throw new Error('Invalid media type');
    }
    const data = {
      messaging_product: 'whatsapp',
      to,
      type: type,
      ...mediaObject,
    }
    await sendToWhatsApp(data);
  }

  async sendContactMessage(to, contact) {
    const data = {
      messaging_product: 'whatsapp',
      to,
      type: 'contacts',
      contacts: [contact],
    }
    await sendToWhatsApp(data);
  }

  async sendLocationMessage(to, location) {
    const data = {
      messaging_product: 'whatsapp',
      to,
      type: 'location',
      location,
    }
    await sendToWhatsApp(data);
  }
}

export default new WhatsAppService();