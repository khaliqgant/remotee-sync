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
    _ = require('../lib/settings').set(), //settings are store in the _ object
    methods = require('../lib/methods');

//callback to make sure all config info is filled
fillConfig(function(success){
    //make sure connection details are filled end, or else exit
    dbCheck();

    fillCommands();

    //run it!
    run(function(success){
        if (success) {
            console.log(success('Database export & import run successfully'));
        }
    });
});


/**
 * Run
 * @use download and import database
 * @return {boolean} callback
 */
function run(callback) {
    var status = _.save ? 'Exporting database and saving as '+_.dumpName :
                        'Exporting & Importing database';
    var silent = _.verbose.trim() === '-v' ? false : true;

    //update the user
    console.log(_.success(status));

    //start commands
    shell.exec(_.command, {silent:silent}, function(code,output) {
        if (code !== 0) {
            console.log(_.error('There was an issue importing your database'));
            if (_.debug) {
                console.log(_.inform('DEBUG: the error output is '+ output +
                                        'and the error code is ' + code));
            }
            process.exit(0);
        }

        if (code === 0 && !_.save && typeof callback === 'function') {
            callback(true);
        }

        //now import the database now that it has been saved
        if (code === 0 && _.save) {
            console.log(_.success('Importing database'));
            var cmd = _.importCmd + ' < '+ _.location + '/' + _.dumpName;
            if (_.verbose || _.debug) {
                console.log(_.inform('The following command will be run now: '+
                                  cmd));
            }
            shell.exec(cmd, {silent:silent}, function(code,output) {
                if (code === 0 && typeof callback === 'function') {
                    callback(true);
                }
                if (code !== 0) {
                    console.log(_.error('There was an issue importing '+
                                        'your database'));
                    if (_.debug) {
                        console.log(_.inform('DEBUG: the error output is '+
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
    _.debug = args.d || args.debug ? true : false;
    _.verbose = args.v || args.verbose ? '-v ' : '';

    //make sure MAMP exists
    if (!shell.test('-d', _.mampPath)) {
        console.log(_.error('It appears you don\'t have MAMP PRO intalled. '+
                            'RemotEE Sync will exit now'));
        if (_.debug) {
            console.log(_.inform('DEBUG: Expected MAMP location is '+
                                    _.mampPath));
        }
        process.exit(0);
    }

    _.config = methods.parseConfig(_);
    _.ssh = methods.parseSSH(_, args);

    _.location = args.location || args.l || _.config.location ?
                args.location || args.l || _.config.location :
                '';
    //unescape double slashes if it had to be valid json vs unix escape
    if (_.location !== '') {
        _.location = _.location.replace(/\/\//g,'\/');
    }

    _.save = args.save || args.s || _.config.save === 'yes' ?
        args.save || args.s || _.config.save :
        false;
    if (_.save && _.location === '') {
        console.log(_.warning('You set for the database to save but didn\'t '+
                             'specify a location to save the db. '+
                    'DB dump will be saved in the root of the project'));
        _.location = '.';
    }

    _.dumpName = args.file || _.config.file ? args.file || _.config.file :
        'temp.sql';

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
    if (_.multiple === undefined && !_.connection.database) {
        console.log(_.error('Unable to find the database credentials. '+
                            'Please add a config file and name it '+
                            _.configFile));
        process.exit(0);
    }

    if (_.multiple && !_.connection[_.env].database) {
        console.log(_.error('Unable to find the database credentials. '+
                            'Please add a config file and name it '+
                            _.configFile));
        process.exit(0);
    }
}

/**
 * Fill Commands
 * @use fill the command variables based on connection types
 * @return void -- modify program variables
 */
function fillCommands() {
    var sshCmd = 'ssh '+ _.verbose + _.ssh + ' mysqldump '+
        '--default-character-set=utf8 '+ _.verbose;
    var mampCmd = _.mampPath + 'mysql '+ _.verbose;
    if (_.multiple === undefined) {
        //set base and import commands
        _.baseCmd = sshCmd + '-h '+ _.connection.hostname +
            ' -u '+ _.connection.username +' -p'+ _.connection.password + ' ' +
            _.connection.database;
        _.importCmd = _.mampCmd + '-h '+ _.connection.hostname +
            ' -u '+ _.connection.username +' -p'+ _.connection.password + ' ' +
            _.connection.database;

    }

    if (_.multiple) {
        _.baseCmd = sshCmd + '-h '+ _.connection[_.env].hostname +
            ' -u '+ _.connection[_.env].username +
            ' -p'+ _.connection[_.env].password + ' ' +
            _.connection[_.env].database;
        _.importCmd = mampCmd + '-h '+ _.connection.local.hostname +
            ' -u '+ _.connection.local.username +
            ' -p'+ _.connection.local.password + ' ' +
            _.connection.local.database;
    }

    //chain save command and run import later, or run right away
    _.command = _.save ? _.baseCmd + ' > '+ _.location + '/' + _.dumpName :
        _.baseCmd + ' | '+ _.importCmd;

    if (_.verbose || _.debug) {
        console.log(_.inform('The following command will be run now: '+
                             _.command));
    }

}

/**
 * Parse DB
 * @use find the database settings in the config or find it in the database file
 * @return void --modifies connection object
 */
function parseDB(callback) {
    if (_.verbose || _.debug) {
        console.log(_.inform('Attempting to locate a database.php file'));
    }
    _.database = _.config.database ? _.config.database : false;
    //add ability to handle multiple environments in config since that
    //is the first lookup
    if (!_.database) {
        var dbName = 'database.php';
        _.database = shell.exec('find . -maxdepth 4 -name ' +
                      dbName, {silent:true}).output.replace(/[\n\t\r]/g,'') ?
                    shell.exec('find . -maxdepth 4 -name ' +
                       dbName, {silent:true}).output.replace(/[\n\t\r]/g,'') :
                    false;
        findDB(function(data){
            _.connection = data;
            if (typeof callback === 'function'){
                callback(true);
            }
        });
    } else {
        _.connection.username = _.config.database.username;
        _.connection.password = _.config.database.password;
        _.connection.database = _.config.database.database;
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
        'php -r \'define("BASEPATH",""); include("'+ _.database +
        '"); print json_encode($db);\'',
        function (err, stdout, stderr) {
            try {
                //are there multiple environments here?
                if (JSON.parse(stdout).production ||
                    JSON.parse(stdout).staging) {
                    _.multiple = true;
                }
                if (_.multiple && _.env) {
                    //set env creds
                    _.connection[_.env] = {};
                    _.connection[_.env].hostname =
                        JSON.parse(stdout)[_.env].hostname;
                    _.connection[_.env].username =
                        JSON.parse(stdout)[_.env].username;
                    _.connection[_.env].password =
                        JSON.parse(stdout)[_.env].password;
                    _.connection[_.env].database =
                        JSON.parse(stdout)[_.env].database;

                    //set local creds
                    _.connection.local = {};
                    _.connection.local.hostname =
                        JSON.parse(stdout).expressionengine.hostname;
                    _.connection.local.username =
                        JSON.parse(stdout).expressionengine.username;
                    _.connection.local.password =
                        JSON.parse(stdout).expressionengine.password;
                    _.connection.local.database =
                        JSON.parse(stdout).expressionengine.database;

                }
                if (_.multiple && !_.env) {
                    console.log(_.error('You need to specify which env '+
                                       'to read the database.php file '+
                                       'correctly'));
                }
                if (_.multiple === undefined){
                    _.connection.hostname =
                        JSON.parse(stdout).expressionengine.hostname;
                    _.connection.username =
                        JSON.parse(stdout).expressionengine.username;
                    _.connection.password =
                        JSON.parse(stdout).expressionengine.password;
                    _.connection.database =
                        JSON.parse(stdout).expressionengine.database;
                }
            } catch(e) {
                console.log(_.error('There was an issue parsing your '+
                                    'database.php file. Please add a '+
                                    _.configFile));
                if (_.debug) {
                    console.log(_.inform('DEBUG: the error output is '+ e));
                }
                process.exit(0);
            }
            if (typeof callback === 'function') {
                callback(_.connection);
            }
        }
    );
}
