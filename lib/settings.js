'use strict';

var settings = module.exports,
    clc = require('cli-color');

settings.set = function(){
    var mampPath = '/Applications/MAMP/library/bin/',
    connection = {},
    configFile = 'remotee-sync.json',
    notify = {
        title: 'Remotee-sync',
        error: 'Remotee-sync stopped with an error',
        success: 'Remotee-sync has completed successfully!'
    },
    ssh, verbose, location, dumpName, save, database, config, env, debug,
    sync, dryRun, command, baseCmd, syncCmd, multiple, notifications,
    error = clc.red,
    success = clc.green,
    warning = clc.blue,
    inform = clc.yellowBright;

    return {
        mampPath: mampPath,
        connection : connection,
        configFile : configFile,
        ssh : ssh,
        verbose : verbose,
        location : location,
        dumpName : dumpName,
        save : save,
        dryRun : dryRun,
        database : database,
        config : config,
        env : env,
        debug : debug,
        sync : sync,
        command : command,
        baseCmd : baseCmd,
        syncCmd : syncCmd,
        multiple : multiple,
        error : error,
        success : success,
        warning : warning,
        inform : inform,
        notifications: notifications,
        notify: notify
    };
};


