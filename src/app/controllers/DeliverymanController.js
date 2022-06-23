import * as Yup from 'yup';
import { Op } from 'sequelize';
import Deliveryman from '../models/Deliveryman';
import Delivery from '../models/Delivery';
import File_avatar from '../models/File_avatar';

class DeliverymanController {
  // método para adicionar entregador
  // method to add delivery person
  async store(req, res) {
    // validado dados de entrada
    // validated input data
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string().email().required(),
      avatar_id: Yup.string(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ Erro: 'Falha na validação!' });
    }

    const { name, email, avatar_id } = req.body;

    // Verificar se ID do avatar é valido / Check if avatar ID is valid

    const avatarExist = await File_avatar.findByPk(avatar_id);
    if (avatar_id != null) {
      if (!avatarExist) {
        return res.status(400).json({ Erro: 'O ID do avatar é inválido!' });
      }
    }

    // verificando se o entregador já exste / checking if the courier already exists

    const deliverymanExist = await Deliveryman.findOne({
      where: { email },
    });

    if (deliverymanExist) {
      return res.status(400).json({ Erro: 'Usuário já cadastrado!' });
    }

    // adicionando dados na tabela e pegando o id por desestruturação
    // adding data in table and getting id by destructuring

    const { id } = await Deliveryman.create({ name, email, avatar_id });

    return res.json({ id, name, email, avatar_id });
  }

  // Método para listar entregadores
  // Method to list couriers

  async index(req, res) {
    // recebendo filtros dos query /  getting query filters
    const { page, nameFilter } = req.query;
    // utilizando operação ternaria para utilizar ou não o filtro do query
    // using ternary operation to use or not the query filter
    const deliverymen = nameFilter
      ? await Deliveryman.findAll({
          where: {
            name: {
              [Op.iLike]: `${nameFilter}%`,
            },
          },

          // pegando os dados que queremos trabalhar da tabela deliveryman
          // getting the data we want to work with from the deliveryman table

          attributes: ['id', 'name', 'email', 'status'],
          order: ['id'],
          limit: page ? 5 : null,
          offset: page ? (page - 1) * 5 : null,
          // pegando os dados que iremos utilizar das tabelas relacionadas
          // getting the data that we will use from the related tables
          include: [
            {
              model: File_avatar,
              as: 'avatar',
              attributes: ['id', 'name', 'path', 'url'],
            },
          ],
        })
      : await Deliveryman.findAll({
          attributes: ['id', 'name', 'email', 'status'],
          order: ['id'],
          limit: page ? 5 : null,
          offset: page ? (page - 1) * 5 : null,
          include: [
            {
              model: File_avatar,
              as: 'avatar',
              attributes: ['id', 'name', 'path', 'url'],
            },
          ],
        });

    return res.json(deliverymen);
  }

  // Método para mostrar entregador por id / Method to show delivery person by id

  async show(req, res) {
    const { id } = req.params;

    const deliveryman = await Deliveryman.findByPk(id, {
      paranoid: false,
      attributes: [
        'id',
        'name',
        'email',
        'avatar_id',
        'status',
        'created_at',
        'deleted_at',
      ],
      include: [
        {
          model: File_avatar,
          as: 'avatar',
          attributes: ['name', 'path', 'url'],
        },
      ],
    });

    // verificando se entregador existe / checking if deliveryman exists

    if (!deliveryman) {
      return res.status(400).json({
        Erro: 'O entregador não existe no banco de dados, verifique o ID!',
      });
    }
    return res.json(deliveryman);
  }

  // método para realizar update nos entregadores / method to perform update on delivery people

  async update(req, res) {
    const schema = Yup.object().shape({
      id: Yup.number(),
      name: Yup.string(),
      email: Yup.string().email(),
      avatar_id: Yup.number().nullable(),
      statuSituation: Yup.number().min(1).max(2),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ Erro: 'Falha na validação!' });
    }

    const { id } = req.params;

    const { name, email, avatar_id, statuSituation } = req.body;

    // verificar se ID foi informado / check if ID has been provided

    if (!id) {
      return res
        .status(400)
        .json({ Erro: 'Digite o ID para atualizar o entregador!' });
    }

    // Verificar se entregador existe / Check if deliveryman exists

    const deliveryman = await Deliveryman.findByPk(id, {
      paranoid: false,
      attributes: ['id', 'name', 'email', 'avatar_id', 'deleted_at', 'status'],
      include: [
        {
          model: File_avatar,
          as: 'avatar',
          attributes: ['path', 'url'],
        },
      ],
    });

    if (!deliveryman) {
      return res.status(400).json({
        Erro: 'O entregador não existe no banco de dados, verifique o ID',
      });
    }

    // Verificar se ID do avatar é valido / Check if avatar ID is valid

    const avatarExist = await File_avatar.findByPk(avatar_id);
    if (avatar_id != null) {
      if (!avatarExist) {
        return res.status(400).json({ Erro: 'O ID do avatar é inválido' });
      }
    }

    // verificar se o e-mail esta vinculado com outro usuário
    // check if the email is linked to another user

    if (email && email !== deliveryman.email) {
      const emailExist = await Deliveryman.findOne({ where: { email } });

      if (emailExist) {
        return res
          .status(400)
          .json({ Erro: 'O e-mail já está vinculado a outro usuário!' });
      }
    }
    let { status } = deliveryman;
    // verificar status / check status
    if (statuSituation) {
      const response = await Delivery.findAll({
        where: {
          deliveryman_id: id,
        },
      });

      if (response.length !== 0 && statuSituation === 2) {
        return res.status(400).json({
          Erro: 'Entregador ainda possui entregas cadastradas, não é possivel desativar! ',
        });
      }
      switch (statuSituation) {
        case 1:
          status = 'Ativo';
          break;

        case 2:
          status = 'Desativado';
          break;

        default:
          return res.status(400).json({
            Erro: 'Informe a situação de 1 para ativo e 2 para desativado!',
          });
      }
    }
    // ajustando o campo deleted_at conforme o status
    // adjusting deleted_at field according to status

    const deleted_at =
      status === 'Ativo'
        ? (deliveryman.deleted_at = null)
        : (deliveryman.deleted_at = new Date());

    await deliveryman.update({ name, email, avatar_id, deleted_at, status });

    return res.json(deliveryman);
  }

  // Método para deletar um entregador /  Method to delete a deliveryman

  async delete(req, res) {
    const { id } = req.params;

    const deliveryman = await Deliveryman.findByPk(id, {
      paranoid: false,
      attributes: ['id', 'name', 'email', 'avatar_id', 'deleted_at', 'status'],
      include: [
        {
          model: File_avatar,
          as: 'avatar',
          attributes: ['path', 'url'],
        },
      ],
    });

    // verificar se usuario existe / check if user exists
    if (!deliveryman) {
      return res.status(400).json({
        ERRO: 'Entregador não encontrado, verifique o ID e tente novamente!',
      });
    }

    const response = await Delivery.findAll({
      where: {
        deliveryman_id: id,
      },
    });

    if (response.length !== 0) {
      return res.status(400).json({
        Erro: 'Entregador ainda possui entregas cadastradas, não é possivel desativar! ',
      });
    }

    if (deliveryman.status === 'Desativado') {
      return res.status(400).json({
        Erro: 'Entregador já está desativado! ',
      });
    }

    deliveryman.status = 'Desativado';

    await deliveryman.destroy();

    return res.json(
      `Entregador de ID ${id} ${deliveryman.name} foi ${deliveryman.status}`
    );
  }
}

export default new DeliverymanController();
