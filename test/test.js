#!/usr/bin/env node
'use strict';

/**
 * RemotEE Tests
 * @use run suite of tests simulating cli arguments
 */

var should = require('should'),
    shell = require('shelljs'),
    assert = require('assert'),
    remotee = '../bin/remotee-sync.js';

require('mocha');

describe('RemotEE-Sync Tests', function(){
    it('should pass by throwing an error because no options were passed', function(done){
        assert.equal("You must provide ssh information to correctly connect to a remote server",
        shell.exec(remotee).output.replace(/[\n\t\r]/g,""));
        done();
    });

    it('should pass by throwing an error because no location was set to save the db', function(done){
        assert.equal("You set for the database to save but didn't specify a location to save the db. DB dump will be saved in the root of the project",
        shell.exec(remotee + ' --ssh=test-staging -s').output.replace(/[\n\t\r]/g,""));
        done();
    });
});
