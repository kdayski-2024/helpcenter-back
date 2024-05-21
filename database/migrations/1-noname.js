'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * createTable "Articles", deps: []
 * createTable "Managers", deps: []
 * createTable "ManagerDocBlocks", deps: []
 * createTable "ManagerLogs", deps: []
 * createTable "ManagerRoles", deps: []
 * createTable "ManagerSessions", deps: []
 * createTable "Translations", deps: []
 *
 **/

var info = {
    "revision": 1,
    "name": "noname",
    "created": "2024-05-15T06:59:09.645Z",
    "comment": ""
};

var migrationCommands = function(transaction) {
    return [{
            fn: "createTable",
            params: [
                "Articles",
                {
                    "id": {
                        "type": Sequelize.INTEGER,
                        "field": "id",
                        "autoIncrement": true,
                        "primaryKey": true,
                        "allowNull": false
                    },
                    "title": {
                        "type": Sequelize.STRING,
                        "field": "title"
                    },
                    "desc": {
                        "type": Sequelize.TEXT,
                        "field": "desc"
                    },
                    "content": {
                        "type": Sequelize.TEXT,
                        "field": "content"
                    },
                    "managerId": {
                        "type": Sequelize.INTEGER,
                        "field": "managerId"
                    },
                    "createdAt": {
                        "type": Sequelize.DATE,
                        "field": "createdAt",
                        "allowNull": false
                    },
                    "updatedAt": {
                        "type": Sequelize.DATE,
                        "field": "updatedAt",
                        "allowNull": false
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "createTable",
            params: [
                "Managers",
                {
                    "id": {
                        "type": Sequelize.INTEGER,
                        "field": "id",
                        "autoIncrement": true,
                        "primaryKey": true,
                        "allowNull": false
                    },
                    "active": {
                        "type": Sequelize.BOOLEAN,
                        "field": "active",
                        "defaultValue": true,
                        "allowNull": false
                    },
                    "login": {
                        "type": Sequelize.STRING,
                        "field": "login"
                    },
                    "name": {
                        "type": Sequelize.STRING,
                        "field": "name"
                    },
                    "password": {
                        "type": Sequelize.STRING,
                        "field": "password"
                    },
                    "role": {
                        "type": Sequelize.ARRAY(Sequelize.STRING),
                        "field": "role"
                    },
                    "langs": {
                        "type": Sequelize.ARRAY(Sequelize.INTEGER),
                        "field": "langs"
                    },
                    "createdAt": {
                        "type": Sequelize.DATE,
                        "field": "createdAt",
                        "allowNull": false
                    },
                    "updatedAt": {
                        "type": Sequelize.DATE,
                        "field": "updatedAt",
                        "allowNull": false
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "createTable",
            params: [
                "ManagerDocBlocks",
                {
                    "id": {
                        "type": Sequelize.INTEGER,
                        "field": "id",
                        "autoIncrement": true,
                        "primaryKey": true,
                        "allowNull": false
                    },
                    "managerId": {
                        "type": Sequelize.INTEGER,
                        "field": "managerId"
                    },
                    "table": {
                        "type": Sequelize.STRING,
                        "field": "table"
                    },
                    "docId": {
                        "type": Sequelize.INTEGER,
                        "field": "docId"
                    },
                    "lang": {
                        "type": Sequelize.STRING,
                        "field": "lang"
                    },
                    "createdAt": {
                        "type": Sequelize.DATE,
                        "field": "createdAt",
                        "allowNull": false
                    },
                    "updatedAt": {
                        "type": Sequelize.DATE,
                        "field": "updatedAt",
                        "allowNull": false
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "createTable",
            params: [
                "ManagerLogs",
                {
                    "id": {
                        "type": Sequelize.INTEGER,
                        "field": "id",
                        "autoIncrement": true,
                        "primaryKey": true,
                        "allowNull": false
                    },
                    "managerId": {
                        "type": Sequelize.INTEGER,
                        "field": "managerId"
                    },
                    "type": {
                        "type": Sequelize.STRING,
                        "field": "type"
                    },
                    "route": {
                        "type": Sequelize.STRING,
                        "field": "route"
                    },
                    "data": {
                        "type": Sequelize.TEXT,
                        "field": "data"
                    },
                    "createdAt": {
                        "type": Sequelize.DATE,
                        "field": "createdAt",
                        "allowNull": false
                    },
                    "updatedAt": {
                        "type": Sequelize.DATE,
                        "field": "updatedAt",
                        "allowNull": false
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "createTable",
            params: [
                "ManagerRoles",
                {
                    "id": {
                        "type": Sequelize.INTEGER,
                        "field": "id",
                        "autoIncrement": true,
                        "primaryKey": true,
                        "allowNull": false
                    },
                    "name": {
                        "type": Sequelize.STRING,
                        "field": "name"
                    },
                    "key": {
                        "type": Sequelize.STRING,
                        "field": "key"
                    },
                    "data": {
                        "type": Sequelize.TEXT,
                        "field": "data"
                    },
                    "createdAt": {
                        "type": Sequelize.DATE,
                        "field": "createdAt",
                        "allowNull": false
                    },
                    "updatedAt": {
                        "type": Sequelize.DATE,
                        "field": "updatedAt",
                        "allowNull": false
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "createTable",
            params: [
                "ManagerSessions",
                {
                    "id": {
                        "type": Sequelize.INTEGER,
                        "field": "id",
                        "autoIncrement": true,
                        "primaryKey": true,
                        "allowNull": false
                    },
                    "managerId": {
                        "type": Sequelize.INTEGER,
                        "field": "managerId"
                    },
                    "roles": {
                        "type": Sequelize.TEXT,
                        "field": "roles"
                    },
                    "permissions": {
                        "type": Sequelize.TEXT,
                        "field": "permissions"
                    },
                    "accessToken": {
                        "type": Sequelize.STRING,
                        "field": "accessToken"
                    },
                    "refreshToken": {
                        "type": Sequelize.STRING,
                        "field": "refreshToken"
                    },
                    "accessExpired": {
                        "type": Sequelize.STRING,
                        "field": "accessExpired"
                    },
                    "refreshExpired": {
                        "type": Sequelize.STRING,
                        "field": "refreshExpired"
                    },
                    "createdAt": {
                        "type": Sequelize.DATE,
                        "field": "createdAt",
                        "allowNull": false
                    },
                    "updatedAt": {
                        "type": Sequelize.DATE,
                        "field": "updatedAt",
                        "allowNull": false
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "createTable",
            params: [
                "Translations",
                {
                    "id": {
                        "type": Sequelize.INTEGER,
                        "field": "id",
                        "autoIncrement": true,
                        "primaryKey": true,
                        "allowNull": false
                    },
                    "docId": {
                        "type": Sequelize.INTEGER,
                        "field": "docId"
                    },
                    "table": {
                        "type": Sequelize.STRING,
                        "field": "table"
                    },
                    "field": {
                        "type": Sequelize.STRING,
                        "field": "field"
                    },
                    "value": {
                        "type": Sequelize.TEXT,
                        "field": "value"
                    },
                    "lang": {
                        "type": Sequelize.STRING,
                        "field": "lang"
                    },
                    "createdAt": {
                        "type": Sequelize.DATE,
                        "field": "createdAt",
                        "allowNull": false
                    },
                    "updatedAt": {
                        "type": Sequelize.DATE,
                        "field": "updatedAt",
                        "allowNull": false
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        }
    ];
};
var rollbackCommands = function(transaction) {
    return [{
            fn: "dropTable",
            params: ["Articles", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["Managers", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["ManagerDocBlocks", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["ManagerLogs", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["ManagerRoles", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["ManagerSessions", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["Translations", {
                transaction: transaction
            }]
        }
    ];
};

module.exports = {
    pos: 0,
    useTransaction: true,
    execute: function(queryInterface, Sequelize, _commands)
    {
        var index = this.pos;
        function run(transaction) {
            const commands = _commands(transaction);
            return new Promise(function(resolve, reject) {
                function next() {
                    if (index < commands.length)
                    {
                        let command = commands[index];
                        console.log("[#"+index+"] execute: " + command.fn);
                        index++;
                        queryInterface[command.fn].apply(queryInterface, command.params).then(next, reject);
                    }
                    else
                        resolve();
                }
                next();
            });
        }
        if (this.useTransaction) {
            return queryInterface.sequelize.transaction(run);
        } else {
            return run(null);
        }
    },
    up: function(queryInterface, Sequelize)
    {
        return this.execute(queryInterface, Sequelize, migrationCommands);
    },
    down: function(queryInterface, Sequelize)
    {
        return this.execute(queryInterface, Sequelize, rollbackCommands);
    },
    info: info
};
