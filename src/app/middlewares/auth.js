import jwt from 'jsonwebtoken';
import { promisify } from 'util';

import authConfig from '../../config/auth';

// middleware responsavel por verificar e o token jwt está presente e liberando acesso caso conhenha o token
// middleware responsible for verifying and the jwt token is present and releasing access if it knows the token

export default async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ Erro: 'Token não enviado, faça o login!' });
  }

  const [, token] = authHeader.split(' ');

  try {
    // verificando se token é valido / checking if token is valid
    const decoded = await promisify(jwt.verify)(token, authConfig.secret);
    // passando como parametro o id do usuário para o req
    // passing as a parameter the user id to the req
    req.userId = decoded.id;

    return next();
  } catch (err) {
    return res.status(401).json({ Erro: 'O token é inválido!' });
  }
};
