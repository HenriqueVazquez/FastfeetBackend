<h1 align="center">
  <img alt="Fastfeet" title="Fastfeet" src=".github/logo.png" width="300px" />
</h1>

<h3 align="center">
  Desafio 2: FastFeet empresa de entrega de encomendas!
</h3>

<h3 align="center">
  :warning: Etapa 2/4 do Desafio Final :warning:
</h3>

<p align="center">
  <img alt="GitHub language count" src="https://img.shields.io/github/languages/count/HenriqueVazquez/Desafio-2---inicio-fastfeet?color=blueviolet">
  
  <a href="www.linkedin.com/in/henrique-vazquez">
    <img alt="Made by Henrique Vazquez" src="https://img.shields.io/badge/made%20by-Henrique%20Vazquez-blueviolet">
  </a>

  <img alt="License" src="https://img.shields.io/badge/license-MIT-blueviolet">

  <a href="https://github.com/HenriqueVazquez/FastfeetBackend/stargazers">
    <img alt="Stargazers" src="https://img.shields.io/github/stars/HenriqueVazquez/FastfeetBackend?style=social">
  </a>
</p>

<p>Termino back-end do fastfeet, empresa que gerencia entrega e entregadores de produtos, contendo ainda banco de dados com dados da entrega, entregador, endereços e imagens com avatar e assinatura da conclusão da entrega</p>

<p>Finished the back-end of fastfeet, a company that manages delivery and delivery of products, also containing a database with delivery data, delivery person, addresses and images with avatar and signature of delivery completion</p>


  
## Tecnologias :rocket:

Esse projeto foi desenvolvido com as seguintes tecnologias:

- [Node.js](https://nodejs.org/en/)
- [PostgreSQL](https://www.postgresql.org/)
- [Bcryptjs](https://www.npmjs.com/package/bcryptjs)
- [Jsonwebtoken](https://jwt.io/introduction/)
- [Sequelize](https://sequelize.org/)
- [Yup](https://github.com/jquense/yup)
- [express](https://github.com/expressjs/express)
- [eslint](https://eslint.org/)
- [prettier](https://eslint.org/)
- [nodemon](http://nodemon.io/)
- [sucrase](https://github.com/alangpierce/sucrase#readme)
- [MongoDB](https://www.mongodb.com/)
- [Sentry](https://sentry.io/)
- [Multer](https://github.com/expressjs/multer)
- [Redis](https://redis.io/)
- [Bee-queue](https://github.com/bee-queue/bee-queue)
- [Nodemailer](https://nodemailer.com/about/)
- [handlebars](https://handlebarsjs.com/)
- [youch](https://github.com/poppinss/youch)
- [Date-fns](https://date-fns.org/)
- [insomnia](https://insomnia.rest/download)



## Instalação, execução e desenvolvimento  🤔

Importe o arquivo `fastfeet.json` no Insomnia ou clique no botão [Run in Insomnia](#insomniaButton)

<p align="center" id="insomniaButton">
  <a href="https://insomnia.rest/run/?label=FastFeet-Backend&uri=https%3A%2F%2Fgithub.com%2FHenriqueVazquez%2FFastfeetBackend%2Fblob%2Fmain%2FFastFeet.json" target="_blank"><img src="https://insomnia.rest/images/run.svg" alt="Run in Insomnia"></a>
  </p>
  
  ### Pré-requisitos

**Faça um clone desse repositório**

###  Backend 🍳

- A partir da raiz do projeto`;
- Execute `yarn` para instalar as dependências;
- [Instale o docker](https://docs.docker.com/)
- Execute `docker run --name fastfeet -e POSTGRES_PASSWORD=docker -p 5432:5432 -d postgres` para montar o banco conforme o projeto, (Se precisar troque a porta conforme o seu ambiente);
- Execute `yarn sequelize db:migrate` para executar as migrations;
- Execute `yarn sequelize db:seed:all` para executar a seed;
- Para executar somente a migration de `admin-user` execute o comando `yarn sequelize db:seed --seed 20200504181041-admin-user.js`
- Execute `yarn dev` para iniciar o servidor;

## Como contribuir🤔

- **Faça um fork deste repositório**

```bash
# Fork via GitHub official command line
# Caso não tenha o GitHub CLI, realize o fork pelo site.

$ gh repo fork HenriqueVazquez/FastfeetBackend
```

```bash
# Clone o seu fork
$ git clone url-do-seu-fork && cd FastFeet

# Crie uma branch com sua feature
$ git checkout -b minha-feature

# Faça o commit das suas alterações
$ git commit -m 'feat: Minha nova feature'

# Faça o push para a sua branch
$ git push origin minha-feature
```

Depois que o merge da sua pull request for feito, você pode deletar a sua branch.



<p align="center">
Feito por <a href="https://www.linkedin.com/in/henrique-vazquez-11905ab6" target="_blank"> Henrique Vazquez</a> :wink:
  </p>


