<?php

require_once __DIR__ . '/../vendor/autoload.php';
$application = new Crm\ApplicationModule\Core();
return $application->bootstrap();
