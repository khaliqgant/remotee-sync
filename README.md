[![NPM](https://nodei.co/npm/remotee-sync.png)](https://nodei.co/npm/remotee-sync/)

[![Build Status](https://travis-ci.org/khaliqgant/remotee-sync.svg)](https://travis-ci.org/khaliqgant/remotee-sync)
[![Supported Nodejs Version](https://img.shields.io/badge/node-%3E%3D0.10-blue.svg)](https://www.npmjs.com/package/remotee-sync)

#RemotEE Sync
```remotee-sync``` is a CLI tool that imports remote ExpressionEngine databases into your local. It assumes you are using MAMP to control your environments. 

## TL;DR
* Just want to get start right away because, who needs documentation?!
* Install globally
```
npm install -g remotee-sync
```
* In your project in the root, run ```remotee-sync --ssh=project-staging``` 
project-staging in this example would be your ssh-config alias. You could also 
use staging@server.com if you don't have an ssh-config set up.
* That's it! See below for more options and configurations


## Command Line Options
```
--ssh           Pass in an ssh config identify or pass in an username@server.
                Either this or an --env is required. Example: --ssh=test-client
--env           Pass in an environment specified in your remotee-sync.json file in an
                ssh object. Example: --env=production. Either this or --ssh is
                required. Note: this is required when you have multiple environments
                More on that below
-s, --save      Specify that the file should be saved in addition to being imported
--location      Pass in a location for the database sql file to be saved if the
                -s flag is enabled or if save is set to yes in the remotee-sync.json
                file. Example: --location=~/Documents/Sites/Test-Project.
                If there are spaces are in the folder name ensure that it is
                escaped properly: ~/Location\\ \\(Far\\ Far\\ Away\\)/
--file          Pass in a name for the file that will be saved with passing in
                -s flag or specifying save to yes in the remotee.json file
--dry           Does a dry run of the remotee-sync process, but doesn’t actually
                perform the operation. Is best combined with the -v (verbose)
                flag. Set only the flag, no need for a --dry=
--sync          Allows the ability to sync the database into your local or not.
                Set this to --sync=no to run an export of a remote database
                but to not import it into your local. This must be combined with
                the -s or --save flag. Otherwise if you set --sync=no
                remoteee-sync will error out. You should also specify a location
                to save by the location flag or in a remotee-sync.json file.
-v, --verbose   Verbose mode.
--notifications Set to ‘no’ if you do not want system notifications for
                remotee-sync when the process ends because of a successful sync
                or because of an error. Ex: --notifications=no

```

## Remotee Config File
* You can also set an optional remotee-sync.json config file to specify options 
when exporting and importing. It is important to note that
command line arguments always override config file settings. The name of the
file must be remotee-sync.json
* An multiple environment config example file would look like this:

```
{
  "ssh" : {
      "staging" : "test-staging",
      "production" : "test-prod"
  },
  "location": "~/Location\\ \\(Far\\ Far\\ Away\\)/",
  "file" : "test-db.sql",
  "save" : "yes",
  "database" : {
      "local" : {
          "hostname" : "localhost",
          "username" : "test_eeuser",
          "password" : "voAt1oOwv",
          "database" : "test_eedb"
      },
      "production" : {
          "hostname" : "123.456.789",
          "username" : "prod_eeuser",
          "password" : "voAt1oOwv",
          "database" : "prod_eedb"
      }
  }
}
```
* This is optional. If you do set a remotee-sync.json file, it should be in the root or one level deep in the
project. I usually put it within a build directory. However if you do add in a database object, it is recommended
to not commit this file so that it is sitting on your server for security concerns.
* The keys in the remotee-sync.json file are the same as the command line arguments.
* A single environment remotee-sync.json file can be found [here](https://github.com/khaliqgant/remotee-sync/blob/master/test/assets/remotee-sync.json)

## Q&A
**Q**: Remote is spelled with one E right?

**A**: Yessss. However since this was built with ExpressionEngine in mind, I used the EE naming convention used with other plugins and tools associated with EE.


**Q**: What makes this tailored to ExpressionEngine?

**A**: When looking for the database information RemotEE Sync looks for a database.php file and parses out a PHP file for credentials. It looks for formatting specific to ExpressionEngine. You could just specify the database information in a remotee-sync.json file, but if you do so, it is recommended to not commit that file and add it to your git ignore.

**Q**: Couldn't I just do this from the command line as this [Stack Overflow answer](http://stackoverflow.com/questions/4888604/syncing-remote-database-to-local) prescribes?

**A** Yes, that is essentially what this does, but it packages it all together for you. This makes it so you don't have to type in the user name, database name, and password every time and also allows you to drop this into any project and run one command to sync.

**Q** This seems like a lot for a relatively simple thing that I could do manually

**A** Perhaps... However, I know I'm always nervous when importing a database that I won't import over a production database or delete production on accident. Why not #AutomateAllTheThings? If you're looking to get started quickly, jump to the TL;DR section.

## Development
- To run tests run ````npm run test````

## Installation
* To install run
```
npm install -g remotee-sync
```

## Who are you?
* Seriously, before I put my database credentials in a remotee-sync.json file, who do you think you are?!
* I’m [Khaliq Gant](https://twitter.com/khaliqgant), a developer with [Vector Media Group](http://www.vectormediagroup.com/), and I have been working with ExpressionEngine and node.js for a few years now
* Rest assured no information is stored from the remotee-sync.json file or any other processes

## Roadmap

* ~~Add better mocha.js tests~~
* ~~Add in better documentation around setting multiple environment credentials in remotee-sync config file~~
* Add ability to import a production database to a staging database
* Add support for Laravel dataphase.php file
* ~~Add ability to perform a database dump only and no import~~
* Add in ability to set gzip flag
* Any requests? Add in a Github Improvement Issue!



## License
RemotEE Sync is released under the MIT License.

