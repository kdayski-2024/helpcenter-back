'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * addColumn "visibleLang" to table "Articles"
 * addColumn "visible" to table "Categories"
 * addColumn "visibleLang" to table "Categories"
 *
 **/

var info = {
    "revision": 8,
    "name": "noname",
    "created": "2024-08-30T06:27:40.350Z",
    "comment": ""
};

var migrationCommands = function(transaction) {
    return [{
            fn: "addColumn",
            params: [
                "Articles",
                "visibleLang",
                {
                    "type": Sequelize.ARRAY(Sequelize.STRING),
                    "field": "visibleLang"
                },
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "addColumn",
            params: [
                "Categories",
                "visible",
                {
                    "type": Sequelize.BOOLEAN,
                    "field": "visible",
                    "defaultValue": false,
                    "allowNull": false
                },
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "addColumn",
            params: [
                "Categories",
                "visibleLang",
                {
                    "type": Sequelize.ARRAY(Sequelize.STRING),
                    "field": "visibleLang"
                },
                {
                    transaction: transaction
                }
            ]
        }
    ];
};
var rollbackCommands = function(transaction) {
    return [{
            fn: "removeColumn",
            params: [
                "Articles",
                "visibleLang",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "removeColumn",
            params: [
                "Categories",
                "visible",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "removeColumn",
            params: [
                "Categories",
                "visibleLang",
                {
                    transaction: transaction
                }
            ]
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
