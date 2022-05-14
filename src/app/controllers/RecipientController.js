import * as Yup from 'yup';
import { Op } from 'sequelize';
import Recipient from '../models/Recipient';
import Delivery from '../models/Delivery';

class RecipientsController {
  // Cadastro de destinatario / recipient registration
  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      street: Yup.string().required(),
      number: Yup.number().required(),
      complement: Yup.string().notRequired(),
      uf: Yup.string().required().length(2),
      city: Yup.string().required(),
      zip_code: Yup.string().required().length(8),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ Erro: 'Falha na validação!' });
    }

    // Desestruturando dados da requisição que vem do body e adicionando no banco de dados
    // Destructuring data from the request that comes from the body and adding it to the database

    const { name, street, number, complement, uf, city, zip_code } = req.body;

    const { id } = await Recipient.create({
      name,
      street,
      number,
      complement,
      uf,
      city,
      zip_code,
    });

    return res.json({
      id,
      name,
      street,
      number,
      complement,
      uf,
      city,
      zip_code,
    });
  }

  // criar o update de dados do destinatário / create recipient data update
  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      street: Yup.string(),
      number: Yup.number(),
      complement: Yup.string(),
      uf: Yup.string().length(2),
      city: Yup.string(),
      zip_code: Yup.string().length(8),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ Erro: 'Falha na validação!' });
    }

    // verificando se destinatário existe / checking if recipient exists
    const { id } = req.params;

    const recipient = await Recipient.findByPk(id, { paranoid: false });

    if (!recipient) {
      return res
        .status(400)
        .json({ Error: 'Destinatário não existe, verifique o id!' });
    }

    // Realizando a desestruturação e atualizando os dados / Destructuring and updating the data

    const { name, street, number, complement, uf, city, zip_code } = req.body;

    await recipient.update({
      name,
      street,
      number,
      complement,
      uf,
      city,
      zip_code,
    });
    return res.json({
      name,
      street,
      number,
      complement,
      uf,
      city,
      zip_code,
    });
  }

  // Listando todos endereços / Listing all addresses

  async index(req, res) {
    const { page, recipientName } = req.query;
    const recipient = recipientName
      ? await Recipient.findAll({
          where: {
            name: {
              [Op.iLike]: `${recipientName}%`,
            },
          },
          attributes: [
            'id',
            'name',
            'street',
            'number',
            'complement',
            'uf',
            'city',
            'zip_code',
          ],
          order: ['id'],
          limit: page ? 5 : null,
          offset: page ? (page - 1) * 5 : null,
        })
      : await Recipient.findAll({
          attributes: [
            'id',
            'name',
            'street',
            'number',
            'complement',
            'uf',
            'city',
            'zip_code',
          ],
          order: ['id'],
          limit: page ? 5 : null,
          offset: page ? (page - 1) * 5 : null,
        });
    if (recipient.length === 0) {
      return res.status(400).json({ Erro: 'Destinatário não existe!' });
    }
    return res.json(recipient);
  }

  async show(req, res) {
    const { id } = req.params;

    const recipient = await Recipient.findByPk(id, {
      paranoid: false,
      attributes: [
        'name',
        'street',
        'number',
        'complement',
        'uf',
        'city',
        'zip_code',
        'deleted_at',
      ],
    });

    if (!recipient) {
      return res.status(400).json({
        Erro: 'O endereço não existe no banco de dados, verifique o ID!',
      });
    }

    return res.json(recipient);
  }

  async delete(req, res) {
    const { id } = req.params;

    const recipient = await Recipient.findByPk(id);

    const response = await Delivery.findAll({
      where: {
        recipient_id: id,
      },
    });

    if (response.length !== 0) {
      return res.status(400).json({
        Erro: 'Endereço possui entregas cadastradas, não é possivel desativar! ',
      });
    }

    // verificar se usuario existe / check if the user exists
    if (!recipient) {
      return res.status(400).json({
        ERRO: 'O endereço não existe no banco de dados, verifique o ID e tente novamente!',
      });
    }

    await recipient.destroy();

    return res.json(`A endereço com id ${id} foi desativado`);
  }
}

export default new RecipientsController();
