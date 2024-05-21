const DataTypes = require('sequelize');

module.exports = {
    title: DataTypes.STRING,
    desc: DataTypes.TEXT,
    parentId: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
}

