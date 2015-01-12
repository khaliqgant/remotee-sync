#!/usr/bin/env node
'use strict';

/**
 * RemotEE Tests
 * @use run suite of tests simulating cli arguments
 * @author Khaliq Gant (@khaliqgant, github.com/khaliqgant)
 * @dependencies shell https://github.com/arturadib/shelljs
 *               assert http://unitjs.com/guide/assert-node-js.html
 *               mocha http://mochajs.org/
 *
 */

var should = require('should'),
    shell = require('shelljs'),
    assert = require('assert'),
    _ = require('../lib/settings').set(),
    methods = require('../lib/methods'),
    remotee = '../bin/remotee-sync.js';

require('mocha');

describe('RemotEE-Sync Tests', function() {
    it('should pass by throwing an error because no options were passed',
       function(done){
        assert.equal(_.error('You must provide ssh information to '+
                     'correctly connect to a remote server'),
        shell.exec(remotee).output.replace(/[\n\t\r]/g,''));
        done();
    });

    it('should be an object from finding a test config file ' +
       'and have the correct credentials', function(done) {
        var config = methods.parseConfig(_);
        assert.equal(typeof(config), 'object');
        assert.equal(config.ssh.staging, 'test-staging');
        assert.equal(config.ssh.production, 'test-prod');
        assert.equal(config.location, '~/Location\\ \\(Far\\ Far\\ Away\\)/');
        assert.equal(config.dumpName, 'test-db.sql');
        assert.equal(config.save, 'yes');
        assert.equal(config.database.local.hostname, 'localhost');
        assert.equal(config.database.local.username, 'test_eeuser');
        assert.equal(config.database.local.password, 'voAt1oOwv');
        assert.equal(config.database.local.database, 'test_eedb');
        assert.equal(config.database.production.hostname, '123.456.789');
        assert.equal(config.database.production.username, 'prod_eeuser');
        assert.equal(config.database.production.password, 'voAt1oOwv');
        assert.equal(config.database.production.database, 'prod_eedb');
        done();
    });

    it('should check the parse db method by checking the connection '+
       'object', function(done) {
        _.config = methods.parseConfig(_);
        _.env = 'production';
        var connection = methods.parseDB(_);
        assert.equal(connection.local.hostname, 'localhost');
        assert.equal(connection.local.username, 'test_eeuser');
        assert.equal(connection.local.password, 'voAt1oOwv');
        assert.equal(connection.local.database, 'test_eedb');
        assert.equal(connection.production.hostname, '123.456.789');
        assert.equal(connection.production.username, 'prod_eeuser');
        assert.equal(connection.production.password, 'voAt1oOwv');
        assert.equal(connection.production.database, 'prod_eedb');
        done();
    });

    it('should check the find db method by checking the connection '+
       'object', function(done) {
        _.config = methods.parseConfig(_);
        _.database = './assets/database.php';
        _.multiple = undefined;
        methods.findDB(_, function(data){
            var connection = data;
            assert.equal(connection.local.hostname, 'localhost');
            assert.equal(connection.local.username, 'test_eeuser');
            assert.equal(connection.local.password, 'voAt1oOwv');
            assert.equal(connection.local.database, 'test_eedb');
            assert.equal(connection.production.hostname, '123.456.789');
            assert.equal(connection.production.username, 'prod_eeuser');
            assert.equal(connection.production.password, 'voAt1oOwv');
            assert.equal(connection.production.database, 'prod_eedb');
            done();
        });
    });


});
