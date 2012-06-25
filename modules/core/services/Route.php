<?php
/**
 * NextCMS
 * 
 * @author		Nguyen Huu Phuoc <thenextcms@gmail.com>
 * @copyright	Copyright (c) 2011 - 2012, Nguyen Huu Phuoc
 * @license		http://nextcms.org/license.txt	(GNU GPL version 2 or later)
 * @link		http://nextcms.org
 * @category	modules
 * @package		core
 * @subpackage	services
 * @since		1.0
 * @version		2012-06-25
 */

defined('APP_VALID_REQUEST') || die('You cannot access the script directly.');

class Core_Services_Route
{
	/**
	 * Allow user to change the default prefix of all the back-end URLs
	 * from admin to anything else.
	 * The prefix is stored in the database settings under the key "admin_prefix".
	 * Below is example of route configuration:
	 * 
	 * <code>
	 * 		$routes['core_user_list']['type']  = "Zend_Controller_Router_Route_Static";
	 * 		$routes['core_user_list']['route'] = "{adminPrefix}/core/user/list";
	 * </code>
	 * @var string
	 */
	private static $_adminPrefix = null;
	
	/**
	 * Sets the admin prefix
	 * 
	 * @param string $prefix
	 * @return void
	 */
	public static function setAdminPrefix($prefix = 'admin')
	{
		self::$_adminPrefix = $prefix;
	}
	
	/**
	 * Gets the admin prefix
	 * 
	 * @return string
	 */
	public static function getAdminPrefix()
	{
		if (self::$_adminPrefix == null || self::$_adminPrefix == '') {
			Core_Services_Db::connect('master');
			self::$_adminPrefix = Core_Services_Config::get('core', 'admin_prefix', 'admin');
		}
		return self::$_adminPrefix;
	}
	
	/**
	 * Loads all routes configured in each modules
	 * 
	 * @return void
	 */
	public static function loadRoutes()
	{
		// Cache routes definitions
		$file = self::_getRoutesCacheFile();
		if (!file_exists($file)) {
			self::cacheRoutes();
			return;
		}
		
		$fp = fopen($file, 'r');
		flock($fp, LOCK_SH);
		$routes = file_get_contents($file);
		flock($fp, LOCK_UN);
		fclose($fp);
		$routes = @unserialize($routes);
		
		if (is_array($routes)) {
			Zend_Controller_Front::getInstance()->getRouter()
												->addRoutes($routes);
		}
	}
	
	/**
	 * Caches routes definitions
	 * 
	 * @return void
	 */
	public static function cacheRoutes()
	{
		$modules = Core_Services_Module::getBootstrapModules();
		$routes  = array();
		foreach ($modules as $module) {
			$routes = array_merge($routes, self::_getModuleRoutes($module));
		}
		Zend_Controller_Front::getInstance()->getRouter()
											->addConfig(new Zend_Config($routes));
		self::_cacheRoutes();
	}
	
	/**
	 * Adds module routes to cache
	 * 
	 * @param string $module The name of module
	 * @return void
	 */
	public static function addRoutesToCache($module)
	{
		$routes = self::_getModuleRoutes($module);
		Zend_Controller_Front::getInstance()->getRouter()
											->addConfig(new Zend_Config($routes));
		self::_cacheRoutes();
	}
	
	/**
	 * Removes module routes from cache
	 * 
	 * @param string $module The name of module
	 * @return void
	 */
	public static function removeRoutesFromCache($module)
	{
		$router = Zend_Controller_Front::getInstance()->getRouter();
		$routes = self::_getModuleRoutes($module);
		foreach ($routes as $name => $settings) {
			if ($router->hasRoute($name)) {
				$router->removeRoute($name);
			}
		}
		self::_cacheRoutes();
	}
	
	/**
	 * Caches all routes
	 * 
	 * @return void
	 */
	private static function _cacheRoutes()
	{
		$router = Zend_Controller_Front::getInstance()->getRouter();
		$data	= serialize($router->getRoutes());
		$file	= self::_getRoutesCacheFile();
		$fp		= fopen($file, 'w+');
		flock($fp, LOCK_EX);
		fwrite($fp, $data);
		flock($fp, LOCK_UN);
		fclose($fp);
	}
	
	/**
	 * Cleans the routes cache
	 * 
	 * @return void
	 */
	public static function cleanCache()
	{
		$file = self::_getRoutesCacheFile();
		if (file_exists($file)) {
			@unlink($file);
		}
	}
	
	/**
	 * Gets all routes of given module
	 * 
	 * @param string $module The module name
	 * @return array
	 */
	private static function _getModuleRoutes($module)
	{
		$dir = APP_ROOT_DIR . DS . 'modules' . DS . $module . DS . 'configs' . DS . 'routes';
		if (!is_dir($dir)) {
			return array();
		}
		
		$iterator	 = new DirectoryIterator($dir);
		$routes		 = array();
		$adminPrefix = self::getAdminPrefix();
		
		foreach ($iterator as $file) {
			if ($file->isDot() || $file->isDir()) {
				continue;
			}
			// Check the extension of file (accept PHP file only)
			$fileName = $file->getFilename();
			$pathInfo = pathinfo($fileName);
			if ($pathInfo['extension'] == 'php') {
				$config = include ($dir . DS . $fileName);
				
				foreach ($config as $name => $settings) {
					$settings['route'] = str_replace('{adminPrefix}', $adminPrefix, $settings['route']);
					if (isset($settings['reverse'])) {
						$settings['reverse'] = str_replace('{adminPrefix}', $adminPrefix, $settings['reverse']);
					}
					$routes[$name] = $settings;
				}
			}
		}
		
		return $routes;
	}
	
	/**
	 * Gets the caching routes file
	 * 
	 * @return string
	 */
	private static function _getRoutesCacheFile()
	{
		return APP_TEMP_DIR . DS . 'cache' . DS . APP_HOST_CONFIG . '_routes.tmp';
	}
}
