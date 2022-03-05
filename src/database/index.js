import 'dotenv/config';
import Sequelize from 'sequelize';
import mongoose from 'mongoose';

import databaseConfig from '../config/database';

import User from '../app/models/User';
import Recipient from '../app/models/Recipient';
import FileAvatar from '../app/models/File_avatar';
import FileSignature from '../app/models/File_signature';
import Deliveryman from '../app/models/Deliveryman';
import Delivery from '../app/models/Delivery';

const models = [
  User,
  Recipient,
  FileAvatar,
  FileSignature,
  Deliveryman,
  Delivery,
];

class Database {
  constructor() {
    this.init();
    this.mongo();
  }

  init() {
    this.connection = new Sequelize(databaseConfig);

    models
      .map((model) => model.init(this.connection))
      .map(
        (model) => model.associate && model.associate(this.connection.models)
      );
  }

  mongo() {
    this.mongoConnection = mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
}

export default new Database();
