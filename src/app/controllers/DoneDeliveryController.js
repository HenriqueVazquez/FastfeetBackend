import * as Yup from 'yup';
import Deliveryman from '../models/Deliveryman';
import Delivery from '../models/Delivery';
import File_signature from '../models/File_signature';
import File_avatar from '../models/File_avatar';
import Recipient from '../models/Recipient';

class DoneDeliveryController {
  // método para finalizar entrega
  // method to end delivery
  async update(req, res) {
    const schema = Yup.object().shape({
      signature_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ Erro: 'Erro na validação' });
    }
    // pegando id do entregador // getting deliveryman id
    const { deliverymanId, deliveryId } = req.params;
    // pegando id da encomenda e da assinatura
    // getting order and signature id
    const { signature_id } = req.body;

    const deliveryman = await Deliveryman.findByPk(deliverymanId);

    // Verificar se o entregador existe / Check if the courier exists

    if (!deliveryman) {
      return res
        .status(400)
        .json({ Erro: 'Entregador não localizado, verifique o ID!' });
    }

    const delivery = await Delivery.findByPk(deliveryId, {
      attributes: [
        'id',
        'product',
        'status',
        'start_date',
        'end_date',
        'canceled_at',
        'deleted_at',
      ],
      paranoid: false,
      include: [
        {
          model: File_signature,
          as: 'signature',
          attributes: ['id', 'path', 'url'],
        },
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['id', 'name'],
          include: [
            {
              model: File_avatar,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
        {
          model: Recipient,
          as: 'recipient',
          paranoid: true,
          attributes: [
            'id',
            'name',
            'street',
            'number',
            'city',
            'uf',
            'zip_code',
          ],
        },
      ],
    });

    // verificar se a entrega existe / check if the delivery exists
    if (!delivery) {
      return res
        .status(400)
        .json({ Erro: 'Entrega não localizada, verifique o ID!' });
    }
    // verificando se o id do entregador é o mesmo da entrega
    // checking if the delivery id is the same as the delivery
    if (delivery.deliveryman.id !== Number(deliverymanId)) {
      return res.status(400).json({
        Erro: 'Entrega não cadastrada para o ID do entregador informado!',
      });
    }

    // verificando se a entrega foi retirada para liberar entrega
    // checking if the delivery person id is the same as the delivery one

    if (delivery.status === 'Postado' && delivery.start_date === null) {
      return res
        .status(400)
        .json({ Erro: 'Entrega só pode ser finalizada, após a retirada!' });
    }

    // verificar se entrega já foi finalizada /  check if delivery has already been completed

    if (delivery.status === 'Entregue' && delivery.end_date != null) {
      return res.status(400).json({ Erro: 'Entrega já finalizadas!' });
    }

    // Verificar se entrega foi cancelada
    // Check if delivery has been canceled

    if (
      delivery.status === 'Cancelado' ||
      delivery.canceled_at != null ||
      delivery.deleted_at != null
    ) {
      return res.status(400).json({ Erro: 'Entrega cancelada!' });
    }

    const signature = await File_signature.findByPk(signature_id);

    // verificar se assinatura existe
    // check if signature exists

    if (!signature) {
      return res
        .status(400)
        .json({ Erro: 'Assinatura não localizada, verifique o ID!' });
    }

    await delivery.update({
      end_date: new Date(),
      signature_id,
      status: 'Entregue',
    });

    return res.json([{ Info: 'Entrega finalizada' }, delivery]);
  }
}

export default new DoneDeliveryController();
