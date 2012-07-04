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
 * @version		2012-07-04
 */

defined('APP_VALID_REQUEST') || die('You cannot access the script directly.');

/**
 * @see http://framework.zend.com/manual/en/zend.loader.pluginloader.html
 */
class Core_Services_Loader extends Zend_Loader_PluginLoader
{
	/**
	 * The file to cache include_once statements
	 * 
	 * @var string
	 */
	protected static $_appIncludeFileCache;

	/**
	 * @see Zend_Loader_PluginLoader::getIncludeFileCache()
	 */
	public static function getIncludeFileCache()
	{
		return self::$_appIncludeFileCache;
	}
	
	/**
	 * @see Zend_Loader_PluginLoader::setIncludeFileCache()
	 */
	public static function setIncludeFileCache($file)
	{
		self::$_appIncludeFileCache = $file;
	}
	
	/**
	 * Appends include_once statement to the caching file
	 * 
	 * @param string $incFile The included file
	 * @return void
	 */
	protected function _appendIncludeFile($incFile)
	{
		$file = self::getIncludeFileCache();
		if (null == $file) {
			return;
		}
		$content = !file_exists($file) ? '<?php' : file_get_contents($file);
		if (!strstr($content, $incFile)) {
			$content .= "\ninclude_once '$incFile';";
			$fp = fopen($file, 'w+');
			// I need to lock before writing data to file
			// to make it works with concurrent requests
			flock($fp, LOCK_EX);
			ftruncate($fp, 0);
			fwrite($fp, $content);
			// Relese the lock
			flock($fp, LOCK_UN);
			fclose($fp);
		}
	}
	
	/**
	 * Taken from Zend_Loader_PluginLoader::load() because PHP does not
	 * support override protected static method (_appendIncFile in this case)
	 * 
	 * Replaces _appendIncFile() with _appendIncludeFile()
	 * 
	 * @param string $name
	 * @param bool $throwExceptions
	 * @return string
	 */
	protected function _load($name, $throwExceptions = true)
	{
		$name = $this->_formatName($name);
		if ($this->isLoaded($name)) {
			return $this->getClassName($name);
		}

		if ($this->_useStaticRegistry) {
			$registry = self::$_staticPrefixToPaths[$this->_useStaticRegistry];
		} else {
			$registry = $this->_prefixToPaths;
		}

		$registry  = array_reverse($registry, true);
		$found     = false;
		$classFile = str_replace('_', DIRECTORY_SEPARATOR, $name) . '.php';
		$incFile   = self::getIncludeFileCache();
		foreach ($registry as $prefix => $paths) {
			$className = $prefix . $name;

			if (class_exists($className, false)) {
				$found = true;
				break;
			}

			$paths = array_reverse($paths, true);
			foreach ($paths as $path) {
				$loadFile = $path . $classFile;
				if (Zend_Loader::isReadable($loadFile)) {
					include_once $loadFile;
					if (class_exists($className, false)) {
						if (null !== $incFile) {
							$this->_appendIncludeFile($loadFile);
						}
						$found = true;
						break 2;
					}
				}
			}
		}

		if (!$found) {
			if (!$throwExceptions) {
				return false;
			}

			$message = "Plugin by name '$name' was not found in the registry; used paths:";
			foreach ($registry as $prefix => $paths) {
				$message .= "\n$prefix: " . implode(PATH_SEPARATOR, $paths);
			}
			throw new Zend_Loader_PluginLoader_Exception($message);
		}

		if ($this->_useStaticRegistry) {
			self::$_staticLoadedPlugins[$this->_useStaticRegistry][$name]     = $className;
		} else {
			$this->_loadedPlugins[$name]     = $className;
		}
		return $className;
	}
	
	/**
	 * @see Zend_Loader_PluginLoader::load()
	 */
	public function load($name, $throwExceptions = true)
	{
		return $this->_load($name, $throwExceptions);
	}
}
