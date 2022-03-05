import Sequelize, { Model } from 'sequelize';

class Deliveryman extends Model {
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        email: Sequelize.STRING,
        status: Sequelize.STRING,
        deleted_at: Sequelize.DATE,
        situationStatus: Sequelize.VIRTUAL,
      },
      {
        sequelize,
        tableName: 'deliverymen',
        paranoid: true,
      }
    );

    return this;
  }

  static associate(models) {
    this.belongsTo(models.File_avatar, {
      foreignKey: 'avatar_id',
      as: 'avatar',
    });
  }
}

export default Deliveryman;
