const DataTypes = require('sequelize');

module.exports = {
    managerId: DataTypes.INTEGER,
    roles: DataTypes.TEXT,
    permissions: DataTypes.TEXT,
    accessToken: DataTypes.STRING,
    refreshToken: DataTypes.STRING,
    accessExpired: DataTypes.STRING,
    refreshExpired: DataTypes.STRING
};