#!/usr/bin/env node

/**
 * TODO declare dependencies
 */

'use strict';

//TODO take in argument for gzip
//gzip : gzip ? ' | gzip' : '',


var shell = require('shelljs'), //https://github.com/arturadib/shelljs
    path  = require('path'),
    args = require('minimist')(process.argv.slice(2)), //https://github.com/substack/minimist
    fs = require('fs'),
    connection = {},
    ssh, verbose, location, dumpName, save, database, config,
    command;


fillConfig();

//set mamp path
var mampPath = '~/applications/MAMP/library/bin/';

//set base and import commands
var baseCmd = 'ssh '+ verbose + ssh +
    ' mysqldump '+ verbose +
    ' -u '+ connection.username +' -p'+ connection.password + ' ' + connection.database;
var importCmd = mampPath + 'mysql '+ verbose +
    ' -u '+ connection.username +' -p'+ connection.password + ' ' + connection.database;

//chain save command and run import later, or run right away
command = save ? baseCmd + ' > '+ dumpName : baseCmd + ' | '+ importCmd;

//run it!
run(function(success){
    if (success) console.log('Database exprt & import run successfully');
});



/**
 * Run
 * @use download and import database
 * @return {boolean} callback
 */
function run(callback) {
    shell.exec(command, function(code,output){
        console.log('Exit code:', code);
        console.log('Program output:', output);
        console.log('downloading database');
    });

    //import this file, if saved
    if (save) {
        shell.exec(importCmd + ' < '+ dumpName, function(code,output){
            console.log('Exit code:', code);
            console.log('Program output:', output);
            console.log('downloading database');
        });
    }
    if (typeof callback === "function"){
        callback(true);
    }
}


/**
 * Config
 * @use parse cli args or find config file to fill in params
 * @vars ssh, verbose, location, dumpName, save, database, config
 *
 */
function fillConfig() {
    //is there is a config file or command line args
    var configFile = 'remotee-sync.json';
    var configLocation = shell.exec('find . -maxdepth 4 -name ' + configFile, {silent:true}).output ?
                    shell.exec('find . -maxdepth 4 -name ' + configFile, {silent:true}).output.replace(/[\n\t\r]/g,"") :
                    false;
    config = configLocation ? JSON.parse(fs.readFileSync(configLocation)) : false;

    //fill in database configuration object
    parseDB();
    ssh = args.ssh || config.ssh ? args.ssh || config.ssh: false;
    if (!ssh) {}//throw some error

    location = args.location || args.l || config.location ? args.location || args.l || config.location : '';
    save = args.save || args.s || config.save ? args.save || args.s || config.save : false;
    dumpName = args.file || config.dumpName ? args.file || config.dumpName : 'temp.sql';

    verbose = args.v || args.verbose ? '-v ' : '';
}

/**
 * Parse DB
 * @use find the database settings in the config or find it in the database file
 * @return void --modifies connection object
 */
function parseDB() {
    database = config.database ? config.database : false;
    if (!database) {
        var dbName = 'database.php';
        database = shell.exec('find . -maxdepth 4 -name ' + dbName, {silent:true}).output.replace(/[\n\t\r]/g,"") ?
                    shell.exec('find . -maxdepth 4 -name ' + dbName, {silent:true}).output.replace(/[\n\t\r]/g,"") :
                    false;
        findDB(function(data){
            connection = data;
        });
    } else {
        connection.username = config.username;
        connection.password = config.password;
        connection.database = config.database;
    }
}

/**
 * Find DB
 * @use parse a PHP file for database information
 * @reference: https://gist.github.com/sirkitree/5129947
 * @return {object} callback with connection
 */
function findDB(callback) {
    var runner = require('child_process');
    runner.exec(
        'php -r \'define("BASEPATH",""); include("'+ database +'"); print json_encode($db);\'',
        function (err, stdout, stderr) {
        //will need more advanced logic to deal with ENV
            connection.username = JSON.parse(stdout).expressionengine.username;
            connection.password = JSON.parse(stdout).expressionengine.password;
            connection.database = JSON.parse(stdout).expressionengine.database;
            if (typeof callback === "function"){
                callback(connection);
            }
        }
    );
}
