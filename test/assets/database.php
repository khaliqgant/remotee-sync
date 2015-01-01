<?php  if ( ! defined('BASEPATH')) exit('No direct script access allowed');

switch (ENV)
{
    case 'prod':
    case 'dev':
        $active_group = 'expressionengine';
        break;

    default:
        $active_group = 'expressionengine';
        break;
}

$active_record = TRUE;

$db['expressionengine']['hostname'] = "localhost";
$db['expressionengine']['username'] = "test_eeuser";
$db['expressionengine']['password'] = "voAt1oOwv";
$db['expressionengine']['database'] = "test_eedb";
$db['expressionengine']['dbdriver'] = "mysql";
$db['expressionengine']['dbprefix'] = "exp_";
$db['expressionengine']['pconnect'] = FALSE;
$db['expressionengine']['swap_pre'] = "exp_";
$db['expressionengine']['db_debug'] = ENV !== 'prod'; #disable in production
$db['expressionengine']['cache_on'] = FALSE;
$db['expressionengine']['autoinit'] = FALSE;
$db['expressionengine']['char_set'] = "utf8";
$db['expressionengine']['dbcollat'] = "utf8_general_ci";
$db['expressionengine']['cachedir'] = "";

/* End of file database.php */
/* Location: ./system/expressionengine/config/database.php */
