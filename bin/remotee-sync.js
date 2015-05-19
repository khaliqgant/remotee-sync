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



var shell = require('shelljs'),
    args = require('minimist')(process.argv.slice(2)),
    fs = require('fs'),
    clc = require('cli-color'),
    notifier = require('node-notifier'),
    _ = require('../lib/settings').set(), //settings are stored in the _ object
    methods = require('../lib/methods');


//callback to make sure all config info is filled
fillConfig(function(success){
    //make sure connection details are filled end, or else exit
    dbCheck();

    _.command = methods.fillCommands(_);

    //run it!
    run(function(success){
        if (success) {
            console.log(_.success('Database export & import run successfully'));
            if (_.notifications) {
                notifier.notify({
                    'title': _.notify.title,
                    'message': _.notify.success
                });
            }
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

    if (!_.save && !_.sync) {
        console.log(_.error('You set for remotee-sync to not import'+
                             ' the database into your local, but didn\'t set '+
                             'for the dump to be saved with the -s or --save '+
                             'flag or in the config'));
        if (_.notifications) {
            notifier.notify({
                'title': _.notify.title,
                'message': _.notify.error
            });
        }
        process.exit(0);
    }

    //update the user
    console.log(_.success(status));

    //start commands
    if (!_.dryRun) {
        shell.exec(_.command, {silent:silent}, function(code,output) {
            if (code !== 0) {
                console.log(_.error('There was an issue importing your '+
                                    'database'));
                if (_.debug) {
                    console.log(_.inform('DEBUG: the error output is '+ output +
                                         'and the error code is ' + code));
                }
                if (_.notifications) {
                    notifier.notify({
                        'title': _.notify.title,
                        'message': _.notify.error
                    });
                }
                process.exit(0);
            }

            if (code === 0 && !_.save && typeof callback === 'function') {
                callback(true);
            }

            //now import the database now that it has been saved
            if (code === 0 && _.save && _.sync) {
                console.log(_.success('Importing database'));
                var cmd = _.importCmd + ' < '+ _.location + '/' + _.dumpName;
                if (_.verbose || _.debug) {
                    console.log(_.inform('The following command will be '+
                                         'run now: '+ cmd));
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
                        if (_.notifications) {
                            notifier.notify({
                                'title': _.notify.title,
                                'message': _.notify.error
                            });
                        }
                        process.exit(0);
                    }
                });
            }
        });
    }
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
    _.sync = args.sync === 'no' ? false : true;
    _.dryRun = args.dry ? true : false;

    //check the env in case there are multiple environments
    _.env = args.env !== undefined ? args.env : false;

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

    _.notifications = args.notifications === 'no' ||
        _.config.notifications === 'no' ?
        false : true;

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

    _.connection = methods.parseDB(_,function(success){
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
        if (_.notifications) {
            notifier.notify({
                'title': _.notify.title,
                'message': _.notify.error
            });
        }
        process.exit(0);
    }

    if (_.multiple && !_.connection[_.env].database) {
        console.log(_.error('Unable to find the database credentials. '+
                            'Please add a config file and name it '+
                            _.configFile));
        if (_.notifications) {
            notifier.notify({
                'title': _.notify.title,
                'message': _.notify.error
            });
        }
        process.exit(0);
    }
}
