sniff: vendor/autoload.php
	php vendor/bin/phpcs --standard=.phpcs_ruleset.xml app extensions vendor/remp

syntax:
	find app bin extensions -name "*.php" -print0 | xargs -0 -n1 -P8 php -l

phpstan:
	php vendor/bin/phpstan analyse --configuration=.phpstan.neon --level=1 --no-progress --memory-limit=1G extensions app vendor/remp

latte-lint:
	php vendor/bin/latte-lint vendor/remp
	php vendor/bin/latte-lint app
	php vendor/bin/latte-lint extensions