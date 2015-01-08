'use strict';

var settings = module.exports,
    clc = require('cli-color');

settings.set = function(){
    var mampPath = '/Applications/MAMP/library/bin/',
    connection = {},
    configFile = 'remotee-sync.json',
    ssh, verbose, location, dumpName, save, database, config, env, debug,
    command, baseCmd, importCmd, multiple,
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
        database : database,
        config : config,
        env : env,
        debug : debug,
        command : command,
        baseCmd : baseCmd,
        importCmd : importCmd,
        multiple : multiple,
        error : error,
        success : success,
        warning : warning,
        inform : inform
    };
};


