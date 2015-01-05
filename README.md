#RemotEE Sync
Import remote ExpressionEngine databases into your local

## Command Line Options
```
--ssh           Pass in an ssh config identify or pass in an username@server.
                Either this or an --env is required. Example: --ssh=test-client
--env           Pass in an environment specified in your remotee.json file in an
                ssh object. Example: --env=production. Either this or --ssh is
                required
-s, --save      Specify that the file should be saved in addition to being imported
--location      Pass in a location for the database sql file to be saved if the
                -s flag is enabled or if save is set to yes in the remotee.json
                file. Example: --location=~/Documents/Sites/Test-Project.
                If there are spaces are in the folder name ensure that it is
                escaped properly: ~/Location\\ \\(Far\\ Far\\ Away\\)/
--file          Pass in a name for the file that will be saved with passing in
                -s flag or specifying save to yes in the remotee.json file
-v, --verbose   Verbose mode.

```

## Remotee Config File
* You can also set an optional remotee.json config file to specify options when exporting and importing. It is important to note that
command line arguments always override config file settings.
* An example config file would look like this:

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
      "username" : "test_eeuser",
      "password" : "voAt1oOwv",
      "database" : "test_eedb'"
  }
}
```
* This is optional. If you do set a remotee.json file, it should be in the root or one level deep in the
project. I usually put it within a build directory. However if you do add in a database object, it is recommended
to not commit this file so that it is sitting on your server for security concerns.

## Q&A
**Q**: Remote is spelled with one E right?

**A**: Yessss. However since this was built with ExpressionEngine in mind, I used the EE naming convention used with other plugins and tools associated with EE.


**Q**: What makes this tailored to ExpressionEngine?

**A**: When looking for the database information RemotEE Sync looks for a database.php file and parses out a PHP file for credentials. It looks for formatting specific to ExpressionEngine. You could just specify the database information in a remotee-sync.json file, but if you do so, it is recommended to not commit that file and add it to your git ignore.

**Q**: Couldn't I just do this from the command line as this [Stack Overflow answer](http://stackoverflow.com/questions/4888604/syncing-remote-database-to-local) prescribes?

**A** Yes, that is essentially what this does, but it packages it all together for you. This makes it so you don't have to type in the user name, database name, and password every time and also allows you to drop this into any project and run one command to sync.

## Development
- To run tests run ````mocha test.js````

## License
RemotEE Sync is released under the MIT License.

