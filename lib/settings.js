'use strict';

var settings = module.exports,
    clc = require('cli-color');

settings.set = function(){
    var mysqlPath = '/Applications/MAMP/library/bin/',
    connection = {},
    configFile = 'remotee-sync.json',
    notify = {
        title: 'Remotee-sync',
        error: 'Remotee-sync stopped with an error',
        success: 'Remotee-sync has completed successfully!'
    },
    ssh, verbose, location, dumpName, save, database, config, env, debug, port,
    sync, dryRun, command, baseCmd, syncCmd, multiple, notifications, testing,
    error = clc.red,
    success = clc.green,
    warning = clc.blue,
    inform = clc.yellowBright;

    return {
        mysqlPath: mysqlPath,
        connection: connection,
        configFile: configFile,
        ssh: ssh,
        verbose: verbose,
        location: location,
        dumpName: dumpName,
        save: save,
        dryRun: dryRun,
        database: database,
        config: config,
        env: env,
        debug: debug,
        port: port,
        sync: sync,
        command: command,
        baseCmd: baseCmd,
        syncCmd: syncCmd,
        multiple: multiple,
        error: error,
        success: success,
        warning: warning,
        inform: inform,
        notifications: notifications,
        notify: notify,
        testing: testing
    };
};


