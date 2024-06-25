#!/usr/bin/env node
const commandLineArgs = require('command-line-args');

const pathConfig = require('./lib/pathconfig');

const optionDefinitions = [
    { name: 'rev', alias: 'r', type: Number, description: 'Set migration revision (default: 0)', defaultValue: 0 },
    { name: 'rollback', alias: 'b', type: Boolean, description: 'Rollback to specified revision', defaultValue: false },
    { name: 'pos', alias: 'p', type: Number, description: 'Run first migration at pos (default: 0)', defaultValue: 0 },
    { name: 'no-transaction', type: Boolean, description: 'Run each change separately instead of all in a transaction (allows it to fail and continue)', defaultValue: false },
    { name: 'one', type: Boolean, description: 'Do not run next migrations', defaultValue: false },
    { name: 'list', alias: 'l', type: Boolean, description: 'Show migration file list (without execution)', defaultValue: false },
    { name: 'migrations-path', type: String, description: 'The path to the migrations folder' },
    { name: 'models-path', type: String, description: 'The path to the models folder' },
    { name: 'help', type: Boolean, description: 'Show this message' }
];

const options = commandLineArgs(optionDefinitions);

let {
    databaseDir
} = pathConfig(options);

const { connection, db, dataTypes, queryTypes } = require(databaseDir)
const sequelize = connection;
const queryInterface = sequelize.getQueryInterface();

connection
    .authenticate()
    .then(async () => {
        await queryInterface.createTable('Migrations', {
            id: {
                type: dataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                onDelete: 'CASCADE'
            },
            file: dataTypes.STRING
        })
        const setFilesCount = 110
        console.log("Set Files Count:", setFilesCount);
        for (i = 1; i <= setFilesCount; i++) {
            const file = `${i}-noname.js`
            const sql = `
                        INSERT INTO "Migrations" (file)
                        VALUES ('${file}');
                    `
            await connection.query(sql, { type: queryTypes.INSERT });
        }

    })

