import * as Yup from 'yup';
import jwt from 'jsonwebtoken';

import User from '../models/User';
import authConfig from '../../config/auth';

// Login da aplicação / application login

class SessionController {
  async store(req, res) {
    const schema = Yup.object().shape({
      email: Yup.string().email().required(),
      password: Yup.string().required(),
    });
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ Erro: 'Falha na validação!' });
    }

    // Desestruturando os dados e fazendo as checagens para realizar login
    // Destructuring the data and doing the checks to login

    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ Erro: 'Usuário não encontrado!' });
    }

    if (!(await user.checkPassword(password))) {
      return res.status(401).json({ erro: 'A senha não está correta' });
    }

    const { id, name } = user;

    // Criando token jwt  com o id para mandar junto com o login do usuário liberando acesso a outros pontos da aplicação
    // Creating jwt token with the id to send along with the user login releasing access to other points of the application

    const token = jwt.sign({ id }, authConfig.secret, {
      expiresIn: authConfig.expiresIn,
    });

    return res.json({
      user: {
        id,
        name,
      },
      token,
    });
  }
}

export default new SessionController();
