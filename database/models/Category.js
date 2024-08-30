const DataTypes = require('sequelize');

module.exports = {
    title: DataTypes.STRING,
    visible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    desc: DataTypes.TEXT,
    orderId: DataTypes.INTEGER,
    parentId: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    visibleLang: DataTypes.ARRAY(DataTypes.STRING)
}

