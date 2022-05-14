import { Op } from 'sequelize';
import * as Yup from 'yup';
import { parseISO, isAfter, isBefore, setHours, startOfHour } from 'date-fns';

import Deliveryman from '../models/Deliveryman';
import Delivery from '../models/Delivery';
import Recipient from '../models/Recipient';
import File_avatar from '../models/File_avatar';
import File_signature from '../models/File_signature';

// método para entregadores verificarem suas entregas
// method for deliveryman to verify their deliveries
class DeliverymanDeliveryController {
  async index(req, res) {
    // buscando id do entregador /  looking for deliveryman man id

    const { id: deliveryman_id } = req.params;

    // buscando id da entrega nas query / looking for delivery id in the query

    const { delivered, page = 1 } = req.query;

    const deliveryman = await Deliveryman.findByPk(deliveryman_id, {
      attributes: ['id', 'name'],
      include: [
        {
          model: File_avatar,
          as: 'avatar',
          attributes: ['id', 'path', 'url'],
        },
      ],
    });

    if (!deliveryman) {
      return res
        .status(400)
        .json({ Erro: 'Entregador não localizado, verifique o ID informado!' });
    }

    // se existir a query delivered e for igual a true, só vai trazer entregas realizadas
    // if there is a query delivered and it is equal to true, it will only bring deliveries made

    if (delivered && delivered === 'true') {
      const deliveries = await Delivery.findAll({
        where: {
          deliveryman_id,
          signature_id: { [Op.not]: null },
          canceled_at: null,
        },
        order: ['id'],
        limit: 5,
        offset: (page - 1) * 5,
        attributes: [
          // pegando os dados que queremos trabalhar da tabela deliveryman
          // getting the data we want to work with from the deliveryman table
          'id',
          'deliveryman_id',
          'product',
          'status',
          'start_date',
          'end_date',
          'canceled_at',
        ],
        include: [
          {
            model: File_signature,
            as: 'signature',
            attributes: ['id', 'path', 'url'],
          },
          {
            model: Recipient,
            as: 'recipient',
            paranoid: false,
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
      const deliverymanDeliveries = [];
      deliverymanDeliveries.push(deliveryman);
      deliverymanDeliveries.push(deliveries);

      return res.json(deliverymanDeliveries);
    }

    // trazendo para entregador todas entregas ainda não finalizadas
    // bringing to delivery person all deliveries not yet completed

    const deliveries = await Delivery.findAll({
      where: {
        deliveryman_id,
        signature_id: null,
        canceled_at: null,
      },
      order: ['id'],
      limit: 5,
      offset: (page - 1) * 5,
      attributes: [
        'id',
        'deliveryman_id',
        'product',
        'status',
        'start_date',
        'end_date',
        'canceled_at',
      ],
      include: [
        {
          model: File_signature,
          as: 'signature',
          attributes: ['id', 'path', 'url'],
        },
        {
          model: Recipient,
          as: 'recipient',
          paranoid: false,
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

    const deliverymanDeliveries = [];
    deliverymanDeliveries.push(deliveryman);
    deliverymanDeliveries.push(deliveries);

    return res.json(deliverymanDeliveries);
  }

  // método atualizar entrega para status retirado e informando a data de retirada
  // update delivery method to withdrawn status and informing the withdrawal date
  async update(req, res) {
    const schema = Yup.object().shape({
      id: Yup.number().required(),
      start_date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ Erro: 'Erro na validação!' });
    }

    // buscando do body o id da entrega e a data inicial
    // searching from the body the delivery id and the start date

    const { id: delivery_id, start_date } = req.body;
    // buscando o id do entregador do params
    // fetching the delivery id from params
    const { id: deliveryman_id } = req.params;

    const deliveryman = await Deliveryman.findByPk(deliveryman_id);

    // verificando se o deliveryman existe
    // checking if deliveryman exists
    if (!deliveryman) {
      return res
        .status(400)
        .json({ Erro: 'Entregador não localizado, verifique o ID informado!' });
    }

    // ajustando o formato das datas / adjusting date format
    const startDateISO = startOfHour(parseISO(start_date));

    const delivery = await Delivery.findByPk(delivery_id, {
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

    // Verificar se a a entrega existe / Check if delivery exists
    if (!delivery) {
      return res
        .status(400)
        .json({ Erro: 'Entrega não localizada, verifique o ID!' });
    }
    // verificando se a entrega esta cadastrada para o entregador informado
    // checking if the delivery is registered for the informed delivery person
    // eslint-disable-next-line eqeqeq
    if (delivery.deliveryman.id != deliveryman_id) {
      return res.status(400).json({
        Erro: 'Entrega não cadastrada para o ID do entregador informado!',
      });
    }
    // verificando se entrega já foi finalizada
    // checking if delivery has already been completed
    if (delivery.status === 'Entregue' && delivery.end_date != null) {
      return res.status(400).json({ Erro: 'Entrega já finalizadas!' });
    }
    // verificando se entrega foi cancelado
    // checking if delivery has been canceled
    if (
      delivery.status === 'Cancelado' &&
      delivery.canceled_at != null &&
      delivery.deleted_at != null
    ) {
      return res.status(400).json({
        Erro: 'Entrega canceladas, precisam ser postadas para retirada!',
      });
    }
    // verificando se a retirada já foi realizado /  checking if the withdrawal has already been carried out
    if (delivery.status === 'Retirado' && delivery.start_date != null) {
      return res.status(400).json({ Erro: 'Entrega já retirada!' });
    }

    // Verificando se o entregador já retirou o máximo permitido
    // Checking if the delivery person has already withdrawn the maximum allowed
    const { count } = await Delivery.findAndCountAll({
      where: {
        deliveryman_id,
        status: 'Retirado',
        signature_id: null,
      },
    });

    if (count === 5) {
      return res.status(400).json({
        Erro: 'Cada entregador pode retirar no máximo de 5 entregas!',
      });
    }
    // verificando se a hora informada esta dentro do horarios estipulados para retirada
    // checking if the time informed is within the stipulated hours for withdrawal
    if (
      isBefore(startDateISO, setHours(startDateISO, 7)) ||
      isAfter(startDateISO, setHours(startDateISO, 17))
    ) {
      return res.status(400).json({
        Erro: 'Informe uma data de retirada, entre as 08:00 até as 19:59!',
      });
    }

    await delivery.update({
      status: 'Retirado',
      start_date: startDateISO,
    });

    return res.json([{ Info: 'Entrega retirada!' }, delivery]);
  }
}

export default new DeliverymanDeliveryController();
