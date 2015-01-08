#!/usr/bin/env node
'use strict';

/**
 * RemotEE Sync
 * @use syncs remote databases to local with ExpressionEngine in mind
 * @author Khaliq Gant (@khaliqgant, github.com/khaliqgant)
 * @dependencies shelljs https://github.com/arturadib/shelljs
 *               minimist https://github.com/substack/minimist
 *               cli-color https://github.com/medikoo/cli-color
 */


//TODO take in argument for gzip
//gzip : gzip ? ' | gzip' : '',


var shell = require('shelljs'),
    args = require('minimist')(process.argv.slice(2)),
    fs = require('fs'),
    clc = require('cli-color'),
    mampPath = '/Applications/MAMP/library/bin/',
    connection = {},
    configFile = 'remotee-sync.json',
    ssh, verbose, location, dumpName, save, database, config, env, debug,
    command, baseCmd, importCmd, multiple;



//callback to make sure all config info is filled
fillConfig(function(success){
    //make sure connection details are filled end, or else exit
    dbCheck();

    fillCommands();

    //run it!
    run(function(success){
        if (success) {
            console.log(clc.green('Database export & import run successfully'));
        }
    });
});


/**
 * Run
 * @use download and import database
 * @return {boolean} callback
 */
function run(callback) {
    var status = save ? 'Exporting database and saving as '+dumpName :
                        'Exporting & Importing database';
    var silent = verbose.trim() === '-v' ? false : true;

    //update the user
    console.log(clc.green(status));

    //start commands
    shell.exec(command, {silent:silent}, function(code,output) {
        if (code !== 0) {
            console.log(clc.red('There was an issue importing your database'));
            if (debug) {
                console.log(clc.magenta('DEBUG: the error output is '+ output +
                                        'and the error code is ' + code));
            }
            process.exit(0);
        }

        if (code === 0 && !save && typeof callback === 'function') {
            callback(true);
        }

        //now import the database now that it has been saved
        if (code === 0 && save) {
            console.log(clc.green('Importing database'));
            var cmd = importCmd + ' < '+ location + '/' + dumpName;
            shell.exec(cmd, {silent:silent}, function(code,output) {
                if (code === 0 && typeof callback === 'function') {
                    callback(true);
                }
                if (code !== 0) {
                    console.log(clc.red('There was an issue importing '+
                                        'your database'));
                    if (debug) {
                        console.log(clc.magenta('DEBUG: the error output is '+
                                                output + 'and the error code'+
                                                'is ' + code));
                    }
                    process.exit(0);
                }
            });
        }
    });
}

/**
 * Config
 * @use parse cli args or find config file to fill in params
 * @vars ssh , verbose , location , dumpName , save , database , config, env
 * @return {boolean} callback
 */
function fillConfig(callback) {
    debug = args.d || args.debug ? true : false;

    //make sure MAMP exists
    if (!shell.test('-d',mampPath)) {
        console.log(clc.red('It appears you don\'t have MAMP PRO intalled. '+
                            'RemotEE Sync will exit now'));
        if (debug) {
            console.log(clc.magenta('DEBUG: Expected MAMP location is '+
                                    mampPath));
        }
        process.exit(0);
    }

    parseConfig();
    parseSSH();

    location = args.location || args.l || config.location ?
                args.location || args.l || config.location :
                '';
    //unescape double slashes if it had to be valid json vs unix escape
    if (location !== '') {
        location = location.replace(/\/\//g,'\/');
    }

    save = args.save || args.s || config.save === 'yes' ?
        args.save || args.s || config.save :
        false;
    if (save && location === '') {
        console.log(clc.blue('You set for the database to save but didn\'t '+
                             'specify a location to save the db. '+
                    'DB dump will be saved in the root of the project'));
        location = '.';
    }

    dumpName = args.file || config.file ? args.file || config.file : 'temp.sql';

    verbose = args.v || args.verbose ? '-v ' : '';


    parseDB(function(success){
        if (typeof callback === 'function'){
            callback(true);
        }
    });
}

/**
 * DB Check
 * @use make sure connection details are all flushed out or else end the program
 * @return void
 */
function dbCheck() {
    if (multiple === undefined && !connection.database) {
        console.log(clc.red('Unable to find the database credentials. '+
                            'Please add a config file and name it '+
                            configFile));
        process.exit(0);
    }

    if (multiple && !connection[env].database) {
        console.log(clc.red('Unable to find the database credentials. '+
                            'Please add a config file and name it '+
                            configFile));
        process.exit(0);
    }
}

/**
 * Fill Commands
 * @use fill the command variables based on connection types
 * @return void -- modify program variables
 */
function fillCommands() {
    var sshCmd = 'ssh '+ verbose + ssh + ' mysqldump '+
        '--default-character-set=utf8 '+ verbose;
    var mampCmd = mampPath + 'mysql '+ verbose;
    if (multiple === undefined) {
        //set base and import commands
        baseCmd = sshCmd + '-h '+ connection.hostname +
            ' -u '+ connection.username +' -p'+ connection.password + ' ' +
            connection.database;
        importCmd = mampCmd + '-h '+ connection.hostname +
            ' -u '+ connection.username +' -p'+ connection.password + ' ' +
            connection.database;

    }

    if (multiple) {
        baseCmd = sshCmd + '-h '+ connection[env].hostname +
            ' -u '+ connection[env].username +
            ' -p'+ connection[env].password + ' ' +
            connection[env].database;
        importCmd = mampCmd + '-h '+ connection.local.hostname +
            ' -u '+ connection.local.username +
            ' -p'+ connection.local.password + ' ' + connection.local.database;
    }

    //chain save command and run import later, or run right away
    command = save ? baseCmd + ' > '+ location + '/' + dumpName : baseCmd +
        ' | '+ importCmd;
}

/**
 * Parse Config
 * @use find a config file and try and parse it if available
 * @return void
 */
function parseConfig() {
    //is there is a config file or command line args
    var configLocation = shell.exec('find . -maxdepth 4 -name ' +
                    configFile, {silent:true}).output ?
                    shell.exec('find . -maxdepth 4 -name ' +
                    configFile, {silent:true}).output.replace(/[\n\t\r]/g,'') :
                    false;
    if (configLocation) {
        try {
            config = JSON.parse(fs.readFileSync(configLocation));
        } catch(e) {
            console.log(clc.red('There was an issue reading your config file.'+
                        ' Please ensure it is proper JSON'));
            if (debug) {
                console.log(clc.magenta('DEBUG: the error output is '+ e));
            }
            process.exit(0);
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
        console.log(clc.red('You must provide ssh information to correctly '+
                            'connect to a remote server'));
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
        database = shell.exec('find . -maxdepth 4 -name ' +
                      dbName, {silent:true}).output.replace(/[\n\t\r]/g,'') ?
                    shell.exec('find . -maxdepth 4 -name ' +
                       dbName, {silent:true}).output.replace(/[\n\t\r]/g,'') :
                    false;
        findDB(function(data){
            connection = data;
            if (typeof callback === 'function'){
                callback(true);
            }
        });
    } else {
        connection.username = config.database.username;
        connection.password = config.database.password;
        connection.database = config.database.database;
        if (typeof callback === 'function'){
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
        'php -r \'define("BASEPATH",""); include("'+ database +
        '"); print json_encode($db);\'',
        function (err, stdout, stderr) {
            try {
                //are there multiple environments here?
                if (JSON.parse(stdout).production ||
                    JSON.parse(stdout).staging) {
                    multiple = true;
                }
                if (multiple && env) {
                    //set env creds
                    connection[env] = {};
                    connection[env].hostname =
                        JSON.parse(stdout)[env].hostname;
                    connection[env].username =
                        JSON.parse(stdout)[env].username;
                    connection[env].password =
                        JSON.parse(stdout)[env].password;
                    connection[env].database =
                        JSON.parse(stdout)[env].database;

                    //set local creds
                    connection.local = {};
                    connection.local.hostname =
                        JSON.parse(stdout).expressionengine.hostname;
                    connection.local.username =
                        JSON.parse(stdout).expressionengine.username;
                    connection.local.password =
                        JSON.parse(stdout).expressionengine.password;
                    connection.local.database =
                        JSON.parse(stdout).expressionengine.database;

                }
                if (multiple && !env) {
                    console.log(clc.red('You need to specify which env '+
                                       'to read the database.php file '+
                                       'correctly'));
                }
                if (multiple === undefined){
                    connection.hostname =
                        JSON.parse(stdout).expressionengine.hostname;
                    connection.username =
                        JSON.parse(stdout).expressionengine.username;
                    connection.password =
                        JSON.parse(stdout).expressionengine.password;
                    connection.database =
                        JSON.parse(stdout).expressionengine.database;
                }
            } catch(e) {
                console.log(clc.red('There was an issue parsing your '+
                                    'database.php file. Please add a '+
                                    configFile));
                if (debug) {
                    console.log(clc.magenta('DEBUG: the error output is '+ e));
                }
                process.exit(0);
            }
            if (typeof callback === 'function') {
                callback(connection);
            }
        }
    );
}
