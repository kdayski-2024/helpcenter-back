const DataTypes = require('sequelize');

module.exports = {
    title: DataTypes.STRING,
    visible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    desc: DataTypes.TEXT,
    content: DataTypes.TEXT,
    managerId: DataTypes.INTEGER,
    categoryId: DataTypes.INTEGER,
    image: DataTypes.ARRAY(DataTypes.STRING)
}

