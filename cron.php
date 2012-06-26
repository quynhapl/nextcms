<?php
/**
 * NextCMS
 * 
 * @author		Nguyen Huu Phuoc <thenextcms@gmail.com>
 * @copyright	Copyright (c) 2011 - 2012, Nguyen Huu Phuoc
 * @license		http://nextcms.org/license.txt	(GNU GPL version 2 or later)
 * @link		http://nextcms.org
 * @category	cron
 * @since		1.0
 * @version		2012-06-26
 */

if (version_compare(phpversion(), '5.2.4', '<') === true) {
    die('ERROR: Your PHP version is ' . phpversion() . '. The app requires PHP 5.2.4 or newer.');
}

define('DS', 		   DIRECTORY_SEPARATOR);
define('PS', 		   PATH_SEPARATOR);

define('APP_ROOT_DIR', dirname(__FILE__));
define('APP_TEMP_DIR', APP_ROOT_DIR . DS . 'temp');

// Version of Dojo and jQuery libraries
define('APP_DOJO_VER',   '1.6.1');
define('APP_JQUERY_VER', '1.7.2');

define('APP_VALID_REQUEST', true);
define('APP_ENV', getenv('APP_ENV') ? getenv('APP_ENV') : 'pro');

// Set the level of error reporting based on the environment
switch (APP_ENV) {
	case 'dev':
	case 'test':
		error_reporting(E_ALL);
		break;
	case 'pro':
	default:
		error_reporting(0);
		break;
}

define('APP_LIB_DIR', APP_ROOT_DIR . DS . 'libraries');
set_include_path(PS . APP_LIB_DIR . PS . get_include_path());

// Define the configuration file
if (PHP_SAPI === 'cli' || !isset($_SERVER['SERVER_NAME'])) {
	// Run in CLI mode
	define('APP_HOST_CONFIG', 'application');
} else {
	$hostName = $_SERVER['SERVER_NAME'];
	$hostName = (substr($hostName, 0, 3) == 'www') ? substr($hostName, 4) : $hostName;
	$default  = APP_ROOT_DIR . DS . 'configs' . DS . 'application.' . strtolower(APP_ENV) . '.php';
	$host     = APP_ROOT_DIR . DS . 'configs' . DS . $hostName . '.' . strtolower(APP_ENV) . '.php';
	define('APP_HOST_CONFIG', file_exists($host) ? $hostName : 'application');
}

// Allow to run a given task by its module and name
$module = isset($_GET['module']) ? $_GET['module'] : null;
$name   = isset($_GET['name']) ? $_GET['name'] : null;

// Continue to run if the last execution time is more than one minute ago
$startTime = time();
$lock	   = ($module && $name)
			 ? APP_TEMP_DIR . DS . '.cronlock_' . $module . '_' . $name
			 : APP_TEMP_DIR . DS . '.cronlock';
if (file_exists($lock) && $startTime - filemtime($lock) < 60) {
//	die('The cron tasks were already executed less than one minute ago');
}
@unlink($lock);
touch($lock);

$image = isset($_GET['image']) ? $_GET['image'] : 'false';
if ($image == 'false') {
	header('Location: ' . $_SERVER['SCRIPT_NAME'] . '?image=true');
	exit();
}

// Display a transparent gif
header('Cache-Control: no-cache');
header('Content-type: image/gif');
header('Content-length: 43');
echo base64_decode('R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==');
flush();

// Register autoload
require_once 'Zend/Loader.php';
require_once 'Zend/Loader/Autoloader.php';
$autoloader = Zend_Loader_Autoloader::getInstance();

require_once APP_ROOT_DIR . DS . 'modules/core/base/Autoloader.php';
require_once APP_ROOT_DIR . DS . 'modules/core/base/File.php';
$modules = Core_Base_File::getSubDirectories(APP_ROOT_DIR . DS . 'modules');
foreach ($modules as $module) {
	new Core_Base_Autoloader(array(
		'basePath'  => APP_ROOT_DIR . DS . 'modules' . DS . $module,
		'namespace' => ucfirst($module) . '_',
	));
}

// Init view because I need to access the $view->url() in some cases
$view = new Core_Base_View();
$view->addHelperPath(APP_ROOT_DIR . DS . 'modules/core/views/helpers', 'Core_View_Helper');
$viewRenderer = Zend_Controller_Action_HelperBroker::getStaticHelper('viewRenderer');
$viewRenderer->setView($view);

// Get the list of installed tasks
Core_Services_Db::connect('master');

$criteria = ($module && $name) ? array('module' => $module, 'name' => $name) : array();
$tasks	  = Core_Services_Task::getInstalledTasks($criteria);
if (count($tasks) == 0) {
	echo 'Not found any tasks' . "\n";
	exit();
}

foreach ($tasks as $task) {
	Core_Services_Task::execute($task);
}

echo 'Cron tasks executed successfully!';
exit();
