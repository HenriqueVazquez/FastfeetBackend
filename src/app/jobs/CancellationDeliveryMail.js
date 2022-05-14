import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/Mail';

class CancellationDeliveryMail {
  // ajustando elemento key, para poder acessar a propriedades sem chamar o método
  // adjusting key element, to be able to access properties without calling the method
  get key() {
    // para cada job precisamos de uma chave única
    // for each job we need a unique key
    return 'CancellationDeliveryMail';
  }

  // Método que sera chamado toda vez que foi enviado um email
  // Method that will be called every time an email is sent
  async handle({ data }) {
    // Desestruturando informações necessarias para preencher o email
    // Destructuring information needed to fill the email
    const { product, deliveryman, recipient, canceled_at } = data;

    // Método que preenche os dados do email e efetivamente faz o envio
    // Method that fills in the email data and effectively sends it
    await Mail.sendMail({
      to: `${deliveryman.name} <${deliveryman.email}>`,
      subject: `Uma encomenda foi cancelada!`,
      template: 'CancellationDelivery',
      context: {
        deliveryman: deliveryman.name,
        date: format(
          parseISO(canceled_at),
          "'dia 'dd' de 'MMMM', às 'H:mm'h'",
          {
            locale: pt,
          }
        ),
        product,
        recipient: recipient.name,
        city: recipient.city,
        uf: recipient.uf,
        street: recipient.street,
        number: recipient.number,
        zip_code: recipient.zip_code,
      },
    });
  }
}

export default new CancellationDeliveryMail();
