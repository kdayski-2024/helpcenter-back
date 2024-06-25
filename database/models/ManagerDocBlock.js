const DataTypes = require('sequelize');

module.exports = {
    managerId: DataTypes.INTEGER,
    table: DataTypes.STRING,
    docId: DataTypes.INTEGER,
    lang: DataTypes.STRING,
};