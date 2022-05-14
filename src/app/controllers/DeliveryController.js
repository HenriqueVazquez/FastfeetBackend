import * as Yup from 'yup';
import { parseISO, isAfter, isBefore, setHours, startOfHour } from 'date-fns';
import { Op } from 'sequelize';

import Delivery from '../models/Delivery';
import Deliveryman from '../models/Deliveryman';
import Recipient from '../models/Recipient';
import File_signature from '../models/File_signature';
import File_avatar from '../models/File_avatar';
import CancellationDeliveryMail from '../jobs/CancellationDeliveryMail';
import CreationDeliveryMail from '../jobs/CreationDeliveryMail';
import Queue from '../../lib/Queue';

class DeliveryController {
  // método para adicionar entrega
  // method to add delivery
  async store(req, res) {
    // validado dados de entrada
    // validated input data
    const schema = Yup.object().shape({
      product: Yup.string().required(),
      recipient_id: Yup.number().required(),
      deliveryman_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ erro: ' Erro na validação!' });
    }

    const { product, recipient_id, deliveryman_id } = req.body;

    // Checar se entregador existe / Check if courier exists
    const deliveryman = await Deliveryman.findByPk(deliveryman_id);

    if (!deliveryman) {
      return res.status(400).json({
        Erro: ' Entregador não localizado, verifique o ID e tente novamente!',
      });
    }

    // checar se endereço existe / check if address exists

    const recipient = await Recipient.findByPk(recipient_id);

    if (!recipient) {
      return res.status(400).json({
        Erro: ' Endereço não localizado, verifique o ID ou cadastre o endereço!',
      });
    }

    // criando entrega e gerando status de postado / creating delivery and generating posted status

    const { id, signature_id, start_date, end_date, canceled_at, created_at } =
      await Delivery.create({
        product,
        recipient_id,
        deliveryman_id,
        status: 'Postado',
      });

    // Adicionando entrega para o envio de email /  Adding delivery to email sending

    await Queue.add(CreationDeliveryMail.key, {
      deliveryman,
      recipient,
      product,
      created_at,
    });

    return res.json({
      id,
      product,
      recipient_id,
      deliveryman_id,
      signature_id,
      start_date,
      end_date,
      canceled_at,
    });
  }

  // método para listar entrega
  // method to list deliveries

  async index(req, res) {
    // recebendo filtros dos query /  getting query filters

    const { page, productFilter, situation } = req.query;
    let situatioName = '';

    switch (situation) {
      case '1':
        // filtrando entregas com status de postado / filtering deliveries with posted status
        situatioName = 'Postado';
        break;
      case '2':
        // filtrando entregas com status de Retirado / filtering deliveries with status of Picked Up
        situatioName = 'Retirado';
        break;
      case '3':
        // filtrando entregas com status de entregue / filtering deliveries with status of Delivered
        situatioName = 'Entregue';
        break;
      case '4':
        // filtrando entregas com status de cancelado / filtering deliveries with status of Canceled
        situatioName = 'Cancelado';
        break;
      default:
        situatioName = '';
        break;
    }

    const deliveries = productFilter
      ? await Delivery.findAll({
          where: {
            product: {
              [Op.iLike]: `${productFilter}%`,
            },
            status: {
              [Op.iLike]: `${situatioName}%`,
            },
          },
          order: ['id'],
          paranoid: false,
          limit: page ? 5 : null,
          offset: page ? (page - 1) * 5 : null,
          attributes: [
            // pegando os dados que queremos trabalhar da tabela delivery
            // getting the data we want to work with from the delivery table
            'id',
            'product',
            'status',
            'start_date',
            'end_date',
            'canceled_at',
          ],
          include: [
            // pegando os dados que iremos utilizar das tabelas relacionadas
            // getting the data that we will use from the related tables
            {
              model: File_signature,
              as: 'signature',
              attributes: ['id', 'path', 'url'],
            },
            {
              model: Deliveryman,
              as: 'deliveryman',
              paranoid: false,
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
        })
      : await Delivery.findAll({
          where: {
            status: {
              [Op.iLike]: `${situatioName}%`,
            },
          },
          order: ['id'],
          paranoid: false,
          limit: page ? 5 : null,
          offset: page ? (page - 1) * 5 : null,
          attributes: [
            // pegando os dados que queremos trabalhar da tabela delivery
            // getting the data we want to work with from the delivery table
            'id',
            'product',
            'status',
            'start_date',
            'end_date',
            'canceled_at',
          ],
          include: [
            // pegando os dados que iremos utilizar das tabelas relacionadas
            // getting the data that we will use from the related tables
            {
              model: File_signature,
              paranoid: false,
              as: 'signature',
              attributes: ['id', 'path', 'url'],
            },
            {
              model: Deliveryman,
              paranoid: false,
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
    if (deliveries.length === 0) {
      return res.status(400).json({ Erro: ' Nenhuma entrega encontrada!' });
    }

    return res.json(deliveries);
  }

  // método para mostrar entrega por id
  // method to show delivery by id

  async show(req, res) {
    // Buscando encomenda por id /  Searching for order by id
    const { id } = req.params;

    const delivery = await Delivery.findByPk(id, {
      attributes: [
        'id',
        'product',
        'status',
        'start_date',
        'end_date',
        'canceled_at',
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

    // Checar se a encomenda existe / Check if the order exists

    if (!delivery) {
      return res.status(400).json({
        Erro: ' Encomenda não existe, verifique o ID e tente novamente!',
      });
    }

    return res.json(delivery);
  }

  // método para atualizar entrega
  // method to update delivery

  async update(req, res) {
    const schema = Yup.object().shape({
      id: Yup.number(),
      product: Yup.string(),
      recipient_id: Yup.number(),
      deliveryman_id: Yup.number(),
      signature_id: Yup.number().nullable(),
      start_date: Yup.date().nullable(),
      end_date: Yup.date().nullable(),
      canceled_at: Yup.date().nullable(),
      situationStatus: Yup.number().min(1).max(4),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ Erro: 'Falha na validação!' });
    }

    const { id } = req.params;

    const { product, recipient_id, deliveryman_id, situationStatus } = req.body;

    let { signature_id } = req.body;

    // verificar se ID foi informado / check if ID has been provided

    if (!id) {
      return res
        .status(400)
        .json({ Erro: 'Informe o ID para atualizar a entrega desejada!' });
    }

    const delivery = await Delivery.findByPk(id, {
      attributes: [
        // pegando os dados que queremos trabalhar da tabela delivery
        // getting the data we want to work with from the delivery table
        'id',
        'product',
        'status',
        'start_date',
        'end_date',
        'canceled_at',
        'deleted_at',
      ],
      include: [
        {
          model: File_signature,
          as: 'signature',
          attributes: ['id', 'path', 'url'],
        },
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['id', 'name', 'email'],
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
      paranoid: false,
    });

    // Verificar se entrega existe / Check if delivery exists

    if (!delivery) {
      return res.status(400).json({
        Erro: 'Entrega não existe na base de dados, verifique o ID!',
      });
    }

    // Verificar se ID do avatar da assinatura é valido / Check if the subscription avatar ID is valid

    const signatureExist = await File_avatar.findByPk(signature_id);
    if (signature_id != null) {
      if (!signatureExist) {
        return res.status(400).json({ Erro: 'O ID da assinatura é invalido!' });
      }
    }

    // verificar se o entregador existe / check if the courier exists

    const deliveryman = await Deliveryman.findByPk(deliveryman_id);
    if (!deliveryman) {
      return res.status(400).json({ Erro: 'O ID do entregador é invalido!' });
    }

    // verificar se o endereço existe / check if the address exists

    const recipient = await Recipient.findByPk(recipient_id);
    if (!recipient) {
      return res.status(400).json({ Erro: 'O ID do entregador é invalido!' });
    }
    // Desestruturando os dados que iremos utilizar / Destructuring the data we will use

    let { status, end_date, start_date, canceled_at, deleted_at } = delivery;
    const { startDate } = req.body;

    // Ajustando datas informadas para o padrao desejado
    // Adjusting informed dates to the desired pattern

    const startDateISO = startOfHour(parseISO(startDate));

    // realizando a contagem de entregas retiradas por um entregador
    // performing the count of deliveries picked up by a courier

    const { count } = await Delivery.findAndCountAll({
      where: {
        deliveryman_id,
        status: 'Retirado',
        signature_id: null,
      },
    });

    // caso 1 realiza o ajuste da entrega para postagem
    // case 1 performs the delivery adjustment for postage

    switch (situationStatus) {
      case 1:
        // verificando se a encomenda já foi entregue
        // checking if the order has already been delivered

        if (delivery.status === 'Entregue' && delivery.end_date != null) {
          return res
            .status(400)
            .json({ Erro: 'Entregas finalizadas, não podem ser alterada!' });
        }

        // verificando se a entrega já foi postanda
        // checking if the delivery has already been posted

        if (delivery.status === 'Postado') {
          return res.status(400).json({ Erro: 'Entrega já Postada!' });
        }
        status = 'Postado';
        deleted_at = null;
        signature_id = null;
        start_date = null;
        end_date = null;
        canceled_at = null;
        break;

      // caso 2 realiza o ajuste da entrega para retirado
      // case 2 performs the adjustment of delivery to withdrawn

      case 2:
        // verificando se a encomenda já foi entregue
        // checking if the order has already been delivered
        if (delivery.status === 'Entregue' && delivery.end_date != null) {
          return res
            .status(400)
            .json({ Erro: 'Entregas finalizadas, não podem ser alterada!' });
        }
        // verificando se a entrega  foi cancelada / checking if the delivery has been canceled

        if (delivery.status === 'Cancelado' && delivery.canceled_at != null) {
          return res.status(400).json({
            Erro: 'Entrega canceladas, precisam ser postadas para retirada!',
          });
        }

        // Verificando se a entrega já foi retirado / Checking if the delivery has already been picked up

        if (delivery.status === 'Retirado' && delivery.start_date != null) {
          return res.status(400).json({ Erro: 'Entrega já Retirada!' });
        }

        // verificando se a data não é futura / checking that the date is not future

        if (isAfter(startDateISO, new Date())) {
          return res.status(400).json({
            Erro: 'Não é permitido retirar encomendas em datas futuras!',
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

        // Verificando se o entregador já retirou o máximo permitido
        // Checking if the delivery person has already withdrawn the maximum allowed

        if (count === 5) {
          return res.status(400).json({
            Erro: 'Cada entregador pode retirar no máximo de 5 entregas!',
          });
        }

        status = 'Retirado';
        start_date = startDateISO;
        deleted_at = null;
        signature_id = null;
        end_date = null;
        canceled_at = null;
        break;

      // caso 3 realiza o ajuste da entrega para entregue
      // case 3 performs the adjustment from delivery to delivered

      case 3:
        // verificando se a entrega  foi cancelada / checking if the delivery has been canceled

        if (delivery.status === 'Cancelado' && delivery.canceled_at != null) {
          return res.status(400).json({
            Erro: 'Entrega canceladas, precisam ser postadas!',
          });
        }

        // Verificar se a encomenda já foi entregue / Check if the order has already been delivered
        if (delivery.status === 'Entregue' && delivery.end_date != null) {
          return res.status(400).json({ Erro: 'Entrega já finalizada!' });
        }

        // verificando se a assinatura do entregador foi informada
        // checking if the delivery person's signature was informed

        if (signature_id == null) {
          return res.status(400).json({
            Erro: 'Informe a assinatura do entregador!',
          });
        }

        // verificando se a encomenda foi retirada para poder entregar
        // checking if the order has been picked up to be able to deliver

        if (delivery.status !== 'Retirado' || delivery.start_date == null) {
          return res.status(400).json({
            Erro: 'Entrega só pode ser finalizada, após a retirada!',
            description: 'Entrega só pode ser finalizada, após a retirada!',
          });
        }

        status = 'Entregue';
        deleted_at = null;
        end_date = new Date();
        canceled_at = null;
        break;

      // caso 4 realiza o ajuste da entrega para cancelado
      // case 4 performs the delivery adjustment to canceled

      case 4:
        // verificando se a encomenda já foi entregue
        // checking if the order has already been delivered

        if (delivery.status === 'Entregue' && delivery.end_date != null) {
          return res
            .status(400)
            .json({ Erro: 'Entregas finalizadas, não podem ser canceladas!' });
        }

        // verificando se entrega já foi cancelada
        // checking if delivery has already been canceled

        if (delivery.status === 'Cancelado' && delivery.canceled_at != null) {
          return res.status(400).json({ Erro: 'Entrega já cancelada!' });
        }

        status = 'Cancelado';
        signature_id = null;
        start_date = null;
        end_date = null;
        canceled_at = new Date();

        // adicionando entrega para enviar email de cancelamento
        // adding delivery to send cancellation email

        await Queue.add(CancellationDeliveryMail.key, {
          deliveryman,
          recipient,
          product: delivery.product,
          canceled_at,
        });
        break;

      // default realiza algumas verificações padrões antes da atualização
      // default performs some standard checks before the update

      default:
        // verificando se a encomenda já foi entregue
        // checking if the order has already been delivered

        if (delivery.status === 'Entregue' && delivery.end_date != null) {
          return res
            .status(400)
            .json({ Erro: 'Entregas finalizadas, não podem ser alterada!' });
        }
        // verificando se a assinatura foi informada em entrega não finalizada
        // checking if the signature was reported in unfinished delivery

        if (signature_id != null) {
          return res.status(400).json({
            Erro: 'Assinatura só pode ser informada em entregas finalizadas!',
          });
        }

        // Verificando se houve alteração em entrega cancelada sem alterar o status
        // Checking for a change in canceled delivery without changing the status

        if (delivery.status === 'Cancelado' && delivery.canceled_at != null) {
          return res.status(400).json({
            Erro: 'Entregas canceladas, só podem ser alteradas se o status for alterado!',
          });
        }

        break;
    }

    await delivery.update({
      id,
      product,
      recipient_id,
      deliveryman_id,
      signature_id,
      status,
      start_date,
      end_date,
      canceled_at,
      deleted_at,
    });

    return res.json(delivery);
  }

  // método para cancelar uma entrega
  // method to cancel a delivery

  async delete(req, res) {
    const { id } = req.params;

    const delivery = await Delivery.findByPk(id, {
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
          attributes: ['id', 'name', 'email', 'status'],
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

    // Checar se a encomenda existe / Check if the order exists

    if (!delivery) {
      return res.status(400).json({
        Erro: 'Encomenda não existe, verifique o ID e tente novamente!',
      });
    }

    let { status, end_date, canceled_at } = delivery;

    // verificando se a encomenda já foi entregue
    // checking if the order has already been delivered

    if (delivery.status === 'Entregue' && delivery.end_date != null) {
      return res.status(400).json({
        Erro: 'Encomenda já entregue, não é possivel cancelar encomenda!',
      });
    }

    // verificando se a encomenda já foi cancelada
    // checking if the order has already been canceled

    if (delivery.status === 'Cancelado' && delivery.canceled_at != null) {
      return res.status(400).json({
        Erro: 'Encomenda já Cancelada!',
      });
    }

    status = 'Cancelado';

    end_date = null;
    canceled_at = new Date();

    await delivery.update({
      id,
      status,
      end_date,
      canceled_at,
    });

    // adicionando entrega para enviar email de cancelamento
    // adding delivery to send cancellation email
    await Queue.add(CancellationDeliveryMail.key, {
      delivery,
      canceled_at,
    });

    return res.json(delivery);
  }
}

export default new DeliveryController();
