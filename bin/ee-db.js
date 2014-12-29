#!/usr/bin/env node

/*
 * References:
 * install npm locally: http://stackoverflow.com/questions/6514621/npm-install-locally
 */

'use strict';

var shell = require('shelljs'), //https://github.com/arturadib/shelljs
    path  = require('path');

//@TODO run this from the root
var database = shell.exec('basename $(find . -maxdepth 4 -name database.php)', {silent:true}).output.replace(/[\n\t\r]/g,"");

var runner = require('child_process');
var connection = {};

/**
 * Parse a PHP file for database information
 * @reference: https://gist.github.com/sirkitree/5129947
 */
runner.exec(
    'php -r \'define("BASEPATH",""); include("'+database+'"); print json_encode($db);\'',
    function (err, stdout, stderr) {
        //will need more advanced logic to deal with ENV
        connection.username = JSON.parse(stdout).expressionengine.username;
        connection.password = JSON.parse(stdout).expressionengine.password;
        connection.database = JSON.parse(stdout).expressionengine.database;

        //run a DB dump
        //https://github.com/digitalcuisine/grunt-mysql-dump/blob/master/tasks/db_dump.js
        //mysqldump -u {user} -p{password} {db} > {dir}/{bkup_db_name}.sql
        shell.exec('ssh typedia@typedia.vmgdev.com && mysqldump -u typedia_eeusr -p 2jlGWpD2qIHoWfXc typedia_eedb > typedia.sql', function(code,output){
            console.log('Exit code:', code);
            console.log('Program output:', output);
        });

        //console.log(connection.database);
        // result botdb
    }
);
