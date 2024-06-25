const DataTypes = require('sequelize');

module.exports = {
    title: DataTypes.STRING,
    desc: DataTypes.TEXT,
    orderId: DataTypes.INTEGER,
    parentId: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
}

