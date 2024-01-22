#!/usr/bin/env php
<?php

require_once __DIR__ . '/../vendor/autoload.php';
$application = new Crm\ApplicationModule\Application\Core();
$application->command();
