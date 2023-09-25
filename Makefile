sniff: vendor/autoload.php
	php vendor/bin/phpcs --standard=.phpcs_ruleset.xml app extensions vendor/remp

syntax:
	find app bin extensions -name "*.php" -print0 | xargs -0 -n1 -P8 php -l

phpstan:
	php vendor/bin/phpstan analyse --configuration=.phpstan.neon --no-progress --memory-limit=1G

latte-lint:
	php vendor/bin/latte-lint vendor/remp
	php vendor/bin/latte-lint app
	php vendor/bin/latte-lint extensions

update-dev:
	composer update
	php bin/command.php phinx:migrate
	php bin/command.php user:generate_access
	php bin/command.php api:generate_access
	php bin/command.php application:seed
	php bin/command.php application:cache
	php bin/command.php application:install_assets

update-prod:
	rm -r temp/nette/cache
	composer install --optimize-autoloader --no-dev
	php bin/command.php phinx:migrate
	php bin/command.php user:generate_access
	php bin/command.php api:generate_access
	php bin/command.php application:seed
	php bin/command.php application:cache
	php bin/command.php application:install_assets
