'use strict';
const {
    Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Relatorio extends Model {
    }

    Relatorio.init({
        nome : DataTypes.STRING,
        titulo : DataTypes.STRING,
        conteudo : DataTypes.TEXT,
        data_criacao : DataTypes.DATE
    }, {
        sequelize,
        modelName: 'Relatorio',
        tableName: 'report',
        timestamps: false
    });
    return Relatorio;
};