#!/usr/bin/env node
'use strict';

/**
 * RemotEE Sync
 * @use syncs remote databases to local with ExpressionEngine in mind
 * @author Khaliq Gant (@khaliqgant, github.com/khaliqgant)
 * @dependencies shelljs https://github.com/arturadib/shelljs
 *               minimist https://github.com/substack/minimist
 */


//TODO take in argument for gzip
//gzip : gzip ? ' | gzip' : '',


var shell = require('shelljs'),
    args = require('minimist')(process.argv.slice(2)),
    fs = require('fs'),
    connection = {},
    configFile = 'remotee-sync.json',
    ssh, verbose, location, dumpName, save, database, config, env,
    command, baseCmd, importCmd;


//callback to make sure all config info is filled
fillConfig(function(success){
    if (!connection.database) {
        console.log('Unable to find the database credentials. Please add a '+
                    'config file and name it '+ configFile);
        process.exit(0);
    }
    //set mamp path
    var mampPath = '~/applications/MAMP/library/bin/';

    //set base and import commands
    baseCmd = 'ssh '+ verbose + ssh +
        ' mysqldump '+ verbose +
        ' -u '+ connection.username +' -p'+ connection.password + ' ' + connection.database;
    importCmd = mampPath + 'mysql '+ verbose +
        ' -u '+ connection.username +' -p'+ connection.password + ' ' + connection.database;

    //chain save command and run import later, or run right away
    command = save ? baseCmd + ' > '+ location + '/' + dumpName : baseCmd + ' | '+ importCmd;

    //run it!
    run(function(success){
        if (success) console.log('Database export & import run successfully');
    });
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
 * @vars ssh , verbose , location , dumpName , save , database , config, env
 * @return {boolean} callback
 */
function fillConfig(callback) {
    parseConfig();
    parseSSH();

    location = args.location || args.l || config.location ? args.location || args.l || config.location : '';
    //unescape double slashes if it had to be valid json vs unix escape
    if (location !== '') location = location.replace(/\/\//g,"\/");

    save = args.save || args.s || config.save === "yes" ? args.save || args.s || config.save : false;
    if (save && location === '') {
        console.log("You set for the database to save but didn't specify a location to save the db. "+
                    "DB dump will be saved in the root of the project");
        location = '.';
    }

    dumpName = args.file || config.dumpName ? args.file || config.dumpName : 'temp.sql';

    verbose = args.v || args.verbose ? '-v ' : '';

    parseDB(function(success){
        if (typeof callback === "function"){
            callback(true);
        }
    });
}

/**
 * Parse Config
 * @use find a config file and try and parse it if available
 * @return void
 */
function parseConfig() {
    //is there is a config file or command line args
    var configLocation = shell.exec('find . -maxdepth 4 -name ' + configFile, {silent:true}).output ?
                    shell.exec('find . -maxdepth 4 -name ' + configFile, {silent:true}).output.replace(/[\n\t\r]/g,"") :
                    false;
    if (configLocation) {
        try {
            config = JSON.parse(fs.readFileSync(configLocation));
        } catch(e) {
            console.log('There was an issue reading your config file. '+
                        'Please ensure it is proper JSON');
        }
    } else{
        config = false;
    }
}

/**
 * Parse SSH
 * @use gather ssh info given env or ssh cli or config.ssh object
 * @return void
 */
function parseSSH() {
    //grab cli ssh argument
    if (args.ssh) {
        ssh = args.ssh;
        return;
    }
    env = args.env ? args.env : false;
    if (!env || !config.ssh) {
        console.log('You must provide ssh information to correctly connect to a remote server');
        process.exit(0);
    }
    ssh = config.ssh[env];
}

/**
 * Parse DB
 * @use find the database settings in the config or find it in the database file
 * @return void --modifies connection object
 */
function parseDB(callback) {
    database = config.database ? config.database : false;
    if (!database) {
        var dbName = 'database.php';
        database = shell.exec('find . -maxdepth 4 -name ' + dbName, {silent:true}).output.replace(/[\n\t\r]/g,"") ?
                    shell.exec('find . -maxdepth 4 -name ' + dbName, {silent:true}).output.replace(/[\n\t\r]/g,"") :
                    false;
        findDB(function(data){
            connection = data;
            if (typeof callback === "function"){
                callback(true);
            }
        });
    } else {
        connection.username = config.database.username;
        connection.password = config.database.password;
        connection.database = config.database.database;
        if (typeof callback === "function"){
            callback(true);
        }
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
