'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // await queryInterface.removeColumn("sessao", "dispositivo_id")
  },

  async down (queryInterface, Sequelize) {
    // await queryInterface.addColumn("sessao", "dispositivo_id")
  }
};
