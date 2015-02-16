'use strict';

var shell = require('shelljs'),
    fs = require('fs'),
    config,
    methods = module.exports;


/**
 * Parse Config
 * @use find a config file and try and parse it if available
 * @params  _ {object} settings object
 * @return {object} || {boolean}
 */
methods.parseConfig = function(_) {
    if (_.verbose || _.debug) {
        console.log(_.inform('Attempting to parse a remotee-sync.json '+
                           'config file'));
    }
    //is there is a config file or command line args
    var configLocation = shell.exec('find . -maxdepth 4 -name ' +
                    _.configFile, {silent:true}).output ?
                    shell.exec('find . -maxdepth 4 -name ' +
                    _.configFile,
                    {silent:true}).output.replace(/[\n\t\r]/g,'') :
                    false;
    if (configLocation) {
        try {
            config = JSON.parse(fs.readFileSync(configLocation));
        } catch(e) {
            console.log(_.error('There was an issue reading your config file.'+
                        ' Please ensure it is proper JSON'));
            if (_.debug) {
                console.log(_.inform('DEBUG: the error output is '+ e));
            }
            process.exit(0);
        }
    } else{
        config = false;
        if (_.verbose || _.debug) {
            console.log(_.inform('No remotee-sync.json file was found'));
        }
    }

    return config;
};

/**
 * Parse SSH
 * @use gather ssh info given env or ssh cli or config.ssh object, required
 * @params  _ {object} settings object
 *          args {object}
 * @return {string} ssh login creds, sends back the modified _ object
 */
methods.parseSSH = function(_, args) {
    if (_.verbose) {
        console.log(_.inform('Attemtping to parse SSH settings'));
    }
    //grab cli ssh argument
    if (args.ssh) {
        _.ssh = args.ssh;

        return _.ssh;
    }
    _.env = args.env ? args.env : false;
    //check if only one ssh login in the config
    var oneSSH = Object.keys(_.config.ssh).length === 1 ?
        Object.keys(_.config.ssh)[0]:
        false;
    if ((!_.env || !_.config.ssh) && !oneSSH) {
        console.log(_.error('You must provide ssh information to correctly '+
                            'connect to a remote server'));
        process.exit(0);
    }

    _.ssh = oneSSH ? config.ssh[oneSSH] : config.ssh[_.env];

    return _.ssh;
};


/**
 * Fill Commands
 * @use fill the command variables based on connection types
 * @return void -- modify program variables
 */
methods.fillCommands = function(_) {
    var sshCmd = 'ssh '+ _.verbose + _.ssh + ' mysqldump '+
        '--default-character-set=utf8 --hex-blob '+ _.verbose;
    var mampCmd = _.mampPath + 'mysql '+ _.verbose;
    if (_.multiple === undefined) {
        //set base and import commands
        _.baseCmd = sshCmd + '-h '+ _.connection.hostname +
            ' -u '+ _.connection.username +' -p'+ _.connection.password + ' ' +
            _.connection.database;
        _.importCmd = mampCmd + '-h '+ _.connection.hostname +
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

    return _.command;
};

/**
 * Parse DB
 * @use find the database settings in the config or find it in the database file
 * @return void --modifies connection object
 */
methods.parseDB = function(_, callback) {
    if (_.verbose || _.debug) {
        console.log(_.inform('Attempting to locate a database.php file'));
    }

    _.database = _.config.database ? _.config.database : false;

    if (!_.database) {
        var dbName = 'database.php';
        _.database = shell.exec('find . -maxdepth 4 -name ' +
                      dbName, {silent:true}).output.replace(/[\n\t\r]/g,'') ?
                    shell.exec('find . -maxdepth 4 -name ' +
                       dbName, {silent:true}).output.replace(/[\n\t\r]/g,'') :
                    false;
        methods.findDB(_, function(data){
            _.connection = data;
            if (typeof callback === 'function'){
                callback(true);
            }
        });
    } else {
        if (_.config.database.production || _.config.database.staging) {
            _.multiple = true;
        }

        if (_.multiple && _.env) {
            //set env creds
            _.connection[_.env] = {};
            _.connection[_.env].hostname =
                _.config.database[_.env].hostname;
            _.connection[_.env].username =
                _.config.database[_.env].username;
            _.connection[_.env].password =
                _.config.database[_.env].password;
            _.connection[_.env].database =
                _.config.database[_.env].database;

            //set local creds
            _.connection.local = {};
            _.connection.local.hostname =
                _.config.database.local.hostname;
            _.connection.local.username =
                _.config.database.local.username;
            _.connection.local.password =
                _.config.database.local.password;
            _.connection.local.database =
                _.config.database.local.database;
        } else {
            _.connection.username = _.config.database.username;
            _.connection.password = _.config.database.password;
            _.connection.database = _.config.database.database;
        }

        if (typeof callback === 'function'){
            callback(true);
        }
    }

    return _.connection;
};

/**
 * Find DB
 * @use parse a PHP file for database information
 * @reference: https://gist.github.com/sirkitree/5129947
 * @return {object} callback with connection
 */
methods.findDB = function(_, callback) {
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
};
