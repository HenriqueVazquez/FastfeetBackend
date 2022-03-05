import * as Yup from 'yup';

import deliveryProblemIntersect from '../../util/ArrayIntersect';

import Delivery from '../models/Delivery';
import Recipient from '../models/Recipient';
import Deliveryman from '../models/Deliveryman';
import File_avatar from '../models/File_avatar';
import File_signature from '../models/File_signature';

import Queue from '../../lib/Queue';
import CancellationProblemDeliveryMail from '../jobs/CancellationProblemDeliveryMail';

import DeliveryProblem from '../schemas/DeliveryProblem';

class DeliveryProblemController {
  // método para cadastrar problemas com a entrega / method to register delivery problems
  async store(req, res) {
    const schema = Yup.object().shape({
      description: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ Erro: 'Falha na validação!' });
    }
    // Pegando dados do params / Getting data from params
    const { id } = req.params;

    const delivery = await Delivery.findByPk(id, { paranoid: false });

    // verificando se entrega existe /  checking if delivery exists
    if (!delivery) {
      return res
        .status(400)
        .json({ Erro: 'Entrega não localizada, verifique o ID!' });
    }

    // verificar se entrega foi cancelada /  check if delivery has been canceled
    if (delivery.canceled_at) {
      return res.status(400).json({ Erro: 'Entrega já foi cancelada!' });
    }

    // Verificar se entrega foi retirada / Check if delivery has been picked up
    if (!delivery.start_date) {
      return res.status(400).json({ Erro: 'Entrega não foi retirada!' });
    }

    // pegando descrição do problema do body /  getting description of the problem from the body
    const { description } = req.body;

    const deliveryProblem = await DeliveryProblem.create({
      delivery_id: id,
      description,
    });

    return res.json(deliveryProblem);
  }

  // Método para listar os problemas / Method for listing the issues
  async index(req, res) {
    const { page = 1 } = req.query;
    // buscando os problemas cadastrados no mongoDB
    // searching the problems registered in mongoDB
    const deliveryProblems = await DeliveryProblem.find()
      .skip((page - 1) * 5)
      .limit(5);
    // pegando id das entregas dos problemas cadastrados no mongoDB
    // getting id of deliveries of problems registered in mongoDB

    const deliveriesId = deliveryProblems.map(
      (delivery) => delivery.delivery_id
    );

    // buscando as entregas com os ids separados
    // looking for deliveries with separate ids
    const deliveries = await Promise.all(
      deliveriesId.map(async (delivery_id) =>
        Delivery.findByPk(delivery_id, {
          attributes: ['product', 'start_date', 'end_date', 'canceled_at'],
          include: [
            {
              model: Recipient,
              as: 'recipient',
              attributes: [
                // pegando os dados que queremos trabalhar da tabela deliveryman
                // getting the data we want to work with from the deliveryman table
                'id',
                'name',
                'street',
                'number',
                'uf',
                'city',
                'zip_code',
              ],
            },
            {
              model: Deliveryman,
              as: 'deliveryman',
              attributes: ['id', 'name'],
              include: [
                // trazendo para entregador todas entregas ainda não finalizadas
                // bringing to delivery person all deliveries not yet completed
                {
                  model: File_avatar,
                  as: 'avatar',
                  attributes: ['id', 'url', 'path'],
                },
              ],
            },
            {
              model: File_signature,
              as: 'signature',
              attributes: ['id', 'url', 'path'],
            },
          ],
        })
      )
    );

    return res.json(deliveryProblemIntersect(deliveryProblems, deliveries));
  }

  // Método para buscar um problema por id / Method to search for a problem by id
  async show(req, res) {
    // pegando o id da entrega pelo params / getting the delivery id from params
    const { id } = req.params;

    const delivery = await Delivery.findByPk(id, {
      attributes: ['product', 'start_date', 'end_date', 'canceled_at'],
      paranoid: false,
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: [
            'id',
            'name',
            'street',
            'number',
            'uf',
            'city',
            'zip_code',
          ],
        },
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['id', 'name'],
          include: [
            {
              model: File_avatar,
              as: 'avatar',
              attributes: ['id', 'url', 'path'],
            },
          ],
        },
        {
          model: File_signature,
          as: 'signature',
          attributes: ['id', 'url', 'path'],
        },
      ],
    });

    // Verificando se entrega existe /  Checking if delivery exists
    if (!delivery) {
      return res
        .status(400)
        .json({ Erro: 'Entrega não localizada, verifique o ID!' });
    }
    // atualizando campo de read para true / updating read field to true
    await DeliveryProblem.updateMany(
      { delivery_id: id },
      { $set: { read: true } },
      { multi: true }
    );
    // buscando todos os problemas cadastrados para o id de uma entrega
    // fetching all problems registered for the id of a delivery

    const deliveryProblem = await DeliveryProblem.find({ delivery_id: id });

    // adicionando no array o produto e suas reclamaçòes para depois exibir
    // adding the product and its complaints to the array and then displaying
    const deliveryProblemInfo = [];
    deliveryProblemInfo.push(delivery, ' Reclamações ', deliveryProblem);

    return res.json(deliveryProblemInfo);
  }

  // Método para deletar uma reclamação
  // Method to delete a complaint
  async delete(req, res) {
    const { id } = req.params;

    // Desestruturando o id da entrega e sua descrição
    // Destructuring the delivery id and its description

    const { delivery_id, description } = await DeliveryProblem.findById(id);

    const delivery = await Delivery.findByPk(delivery_id, {
      include: [
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Recipient,
          as: 'recipient',
        },
      ],
    });

    // Verificando se entrega foi cancelada
    // Checking if delivery was canceled

    if (delivery.status === 'Cancelado' && delivery.canceled_at != null) {
      res.status(400).json({ Erro: 'Encomenda já foi cancelada' });
    }

    // Verificando se encomenda já foi entregue
    // Checking if the order has already been delivered

    if (delivery.status === 'Entregue' && delivery.end_date != null) {
      return res.status(400).json({
        Erro: 'Encomenda já entregue, não é possivel cancelar encomenda!',
      });
    }

    // Realizando cancelamento  da encomenda
    // Canceling the order
    await delivery.update({
      canceled_at: new Date(),
      status: 'Cancelado',
      deleted_at: new Date(),
    });

    // cadastrando para a fila o email de cancelamento
    // registering the cancellation email for the queue
    await Queue.add(CancellationProblemDeliveryMail.key, {
      delivery,
      description,
    });

    // ajustando no mongoDB as informações do campo canceled_at para todas as reclamações com o id da encomenda
    // adjusting the information in the canceled_at field in mongoDB for all complaints with the order id
    await DeliveryProblem.updateMany(
      { delivery_id },
      { $set: { canceled_at: true } },
      { multi: true }
    );

    return res.json({
      info: `entrega com id ${delivery_id} foi cancelada por causa da reclamação com descrição: ${description}`,
    });
  }
}

export default new DeliveryProblemController();
