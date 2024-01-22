<?php

require_once __DIR__ . '/../vendor/autoload.php';
$application = new Crm\ApplicationModule\Application\Core(dirname(__DIR__));
return $application->bootstrap();
