// eslint-disable-next-line import/no-extraneous-dependencies
const { faker } = require('@faker-js/faker');

faker.locale = 'pt_BR';

// eslint-disable-next-line no-unused-vars
const recipients = [...Array(10)].map((recipient) => ({
  name: faker.name.findName(),
  street: faker.address.streetName(),
  number: faker.datatype.number({ min: 1, max: 1000 }),
  uf: 'SP',
  city: faker.address.city(),
  zip_code: faker.address.zipCode(),
  created_at: new Date(),
  updated_at: new Date(),
}));

module.exports = {
  up: (queryInterface) =>
    queryInterface.bulkInsert('recipients', recipients, {}),

  down: (queryInterface) => queryInterface.bulkDelete('recipients', null, {}),
};
