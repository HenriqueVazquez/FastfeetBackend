import nodemailer from 'nodemailer';
import { resolve } from 'path';
import exphbs from 'express-handlebars';
import nodemailerhbs from 'nodemailer-express-handlebars';
import mailConfig from '../config/mail';

class Mail {
  constructor() {
    // desestruturando os dados do mailConfig
    // desestruturando os dados do mailConfig
    const { host, port, secure, auth } = mailConfig;

    // definindo os dados de conexão
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: auth.user ? auth : null,
    });

    this.configureTemplates();
  }

  // configurando template par envio do email, lembrando que só funciona dessa forma ate express-handlebars  versão < 6^
  // configuring template for sending the email, remembering that it only works that way in express-handlebars version < 6^
  configureTemplates() {
    // Definindom caminho até  a pasta email do views usando o viewPath
    // Definindom caminho até  a pasta email do views usando o viewPath
    const viewPath = resolve(__dirname, '..', 'app', 'views', 'emails');

    this.transporter.use(
      'compile',
      nodemailerhbs({
        viewEngine: exphbs.create({
          // caminhos para a pastas layout e partials / paths to layout and partials folders
          layoutsDir: resolve(viewPath, 'layouts'),
          partialsDir: resolve(viewPath, 'partials'),
          defaultLayout: 'default', // define o layout padrão / sets the default layout
          extname: '.hbs', // extensão a ser usada / extension to use
        }),
        viewPath,
        extName: '.hbs',
      })
    );
  }

  // método para realizar o envio do email com destinatario padrao e menssagem com o layout definido
  // method to send the email with default recipient and message with the defined layout
  sendMail(message) {
    return this.transporter.sendMail({
      ...mailConfig.default,
      ...message,
    });
  }
}

export default new Mail();
