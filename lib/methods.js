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
methods.parseConfig = function(_)
{
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
methods.parseSSH = function(_, args)
{
    if (_.verbose) {
        console.log(_.inform('Attemtping to parse SSH settings'));
    }
    //grab cli ssh argument
    if (args.ssh) {
        _.ssh = args.ssh;

        return _.ssh;
    }
    _.env = args.env ? args.env : false;
    if (!_.env || !_.config.ssh) {
        console.log(_.error('You must provide ssh information to correctly '+
                            'connect to a remote server'));
        process.exit(0);
    }
    _.ssh = config.ssh[_.env];

    return _.ssh;
};

