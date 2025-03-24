'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable("report", {
      id : {type : Sequelize.INTEGER, allowNull : false, autoIncrement : true},
      nome : {type : Sequelize.TEXT, allowNull: true },
      titulo : {type : Sequelize.TEXT, allowNull : false},
      conteudo : {type : Sequelize.TEXT, allowNull : false},
      data_criacao : {type : Sequelize.DATE, allowNull : false}
    })
  },

  async down (queryInterface, Sequelize) {
     await queryInterface.dropTable('report');
  }
};
