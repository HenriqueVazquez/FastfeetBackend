import Sequelize, { Model } from 'sequelize';

class Delivery extends Model {
  static init(sequelize) {
    super.init(
      {
        product: Sequelize.STRING,
        canceled_at: Sequelize.DATE,
        start_date: Sequelize.DATE,
        end_date: Sequelize.DATE,
        created_at: Sequelize.DATE,
        deleted_at: Sequelize.DATE,
        status: Sequelize.STRING,
        situationStatus: Sequelize.VIRTUAL,
      },
      {
        sequelize,
        tableName: 'deliveries',
        paranoid: true,
      }
    );

    return this;
  }

  static associate(models) {
    this.belongsTo(models.Recipient, {
      foreignKey: 'recipient_id',
      as: 'recipient',
    });
    this.belongsTo(models.Deliveryman, {
      foreignKey: 'deliveryman_id',
      as: 'deliveryman',
    });

    this.belongsTo(models.File_signature, {
      foreignKey: 'signature_id',
      as: 'signature',
    });
  }
}

export default Delivery;
