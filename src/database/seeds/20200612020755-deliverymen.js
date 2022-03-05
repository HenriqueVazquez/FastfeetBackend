// eslint-disable-next-line import/no-extraneous-dependencies
const { faker } = require('@faker-js/faker');

faker.locale = 'pt_BR';

// eslint-disable-next-line no-unused-vars
const deliverymen = [...Array(10)].map((deliveryman) => ({
  name: faker.name.findName(),
  email: faker.internet.email(),
  created_at: new Date(),
  updated_at: new Date(),
}));

module.exports = {
  up: (queryInterface) =>
    queryInterface.bulkInsert('deliverymen', deliverymen, {}),

  down: (queryInterface) => queryInterface.bulkDelete('deliverymen', null, {}),
};
