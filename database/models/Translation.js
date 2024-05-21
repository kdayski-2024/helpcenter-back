const DataTypes = require('sequelize');

module.exports = {
    docId: DataTypes.INTEGER,
    table: DataTypes.STRING,
    field: DataTypes.STRING,
    value: DataTypes.TEXT,
    lang: DataTypes.STRING
}