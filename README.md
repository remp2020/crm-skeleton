# CRM Skeleton

This is a pre-configured skeleton of CRM application with simple installation.

[![Translation status @ Weblate](https://hosted.weblate.org/widgets/remp-crm/-/svg-badge.svg)](https://hosted.weblate.org/engage/remp-crm/)

CRM is currently available in _sk_SK_, _cs_CZ_, _en_US_ and partially _hu_HU_ locales. If you're interested in translating the open-source modules to your language, you can approach us and contribute via [Weblate](https://hosted.weblate.org/engage/remp-crm/).

## Installation

### CRM Skeleton

To create skeleton application which will be run directly on the host machine, use:

   ```
   composer create-project remp/crm-skeleton path/to/install
   ```

If you plan to use our Docker Compose appliance to run application, skip vendor installation as you might not have
all extensions installed on your host machine.

   ```
   composer create-project --no-install remp/crm-skeleton path/to/install
   ```

   ```
   cd path/to/install
   ```

### Docker

Simplest posible way is to run this application in docker containers. Docker Compose is used for orchestrating. Except of these two application, there is no need to install anything on host machine.

Recommended _(tested)_ versions are:

- [Docker](https://www.docker.com/products/docker-engine) - 24.0.4
- [Docker Compose](https://docs.docker.com/compose/overview/) - 2.19.1

#### Steps to install application within docker

1. Prepare environment & configuration files

    ```
    cp .env.example .env
    ```

    ```
    cp app/config/config.local.example.neon app/config/config.local.neon
    ```

    ```
    cp docker compose.override.example.yml docker compose.override.yml
    ```

    No changes are required if you want to run application as it is.

2. Setup host 

    Default host used by application is `http://crm.press`. It should by pointing to localhost (`127.0.0.1`).

3. Start docker compose

    ```
    docker compose up
    ```

    You should see log of starting containers.

4. Enter application docker container

    ```
    docker compose exec crm /bin/bash
    ```

    Following commands will be run inside container. 

5. Update permissions for docker application

    Owner of folders `temp`, `log` and `content` is user on host machine. Application needs to have right to write there.

    ```
    chmod -R a+rw temp log content
    ```

6. Install composer packages.

    ```
    composer install
    ```

7. Initialize and migrate database.

    ```
    php bin/command.php phinx:migrate
    ```

8. Initialize random application key (`CRM_KEY` value) in your `.env` file.

    ```
    php bin/command.php application:generate_key
    ```

9. Generate user access resources to control access rights to features in CRM admin.

    ```
    php bin/command.php user:generate_access
    ```

10. Generate API access resources to control access rights of API tokens to specific endpoints.

    ```
    php bin/command.php api:generate_access
    ```

11. Seed database with required data

    ```
    php bin/command.php application:seed
    ```

12. Copy module's assets to your `www` folder. This is part of [composer.json](./composer.json) and it's handled automatically for you in subsequent updates.

    ```
    php bin/command.php application:install_assets
    ```

13. All done

    Access application via web browser. Default configuration:

    - URL: http://crm.press/
    - Users:
        - Admin
            - Username: `admin@crm.press`
            - Password: `password`
        - User
            - Username: `user@crm.press`
            - Password: `password`

**IMPORTANT:** Please update steps 7-11 every time you update the CRM - every time you run `composer update`.

## Available modules

Not all the modules that we open sourced are directly included in this repository. You can [explore other modules](https://github.com/remp2020?q=crm-&type=&language=) and see, whether there are some scratching your itch.

Or you can dive into the docs below and extend the CRM with your own module.

## Custom module implementation

### Definition of the module

All modules have to implement `Crm\ApplicationModule\ApplicationModuleInterface` and therefore all are dependent on an application module we provide.

We have prepared abstract class `CrmModule` to extend that implements this interface. It includes all extension points the `ApplicationManager` can work with. This section will help you to understand each integration point - what it its purpose and how to use it. You can always use any of the provided modules as a referece for how to structure the code.

Your module implementation should be placed within `app/modules` folder. To create `DemoModule` you'd need to:

* Create folder `app/modules/DemoModule`
* Create class `Crm\DemoModule\DemoModule` within the created folder with the definition of module, extending `Crm\ApplicationModule\CrmModule`.

    ```php
    <?php

    namespace Crm\DemoModule;

    class DemoModule extends \Crm\ApplicationModule\CrmModule
    {
        // register your extension points based on the documentation below
    }
    ```

* Register the module definition to be used by application in your `app/config/config.neon` file.

    ```neon
    services:
        moduleManager:
            setup:
                - addModule(Crm\DemoModule\DemoModule())
    ```

#### Presenter mapping

By default the configuration uses wildcard presenter mapping to ease the learning curve of working with the CRM. You can find this snippet in [config.neon](app/config/config.neon).

```neon
application:
	mapping:
		*: Crm\*Module\Presenters\*Presenter
```

This configuration means, that all scanned classes mapping the pattern will be used as presenters - even if the module is not enabled. This occasionally creates unwanted side effects.

If you want to have full control over the presenter mapping, for each enabled custom module replace the `mapping` entry with explicit mapping:

```neon
application:
	mapping:
		Demo: Crm\DemoModule\Presenters\*Presenter
```

_Note: All modules installed as packages are already mapped explicitly._

#### Configuration ready

Your module is now ready and registered within application. You can start extending the application via following extension points or by implementing your own presenters.

### Implementing presenters

#### Frontend presenters

One of the main reasons to create your own module is to present/receive new information from/by user. This section provides brief introduction of the dummy presenter creation in Nette within CRM. If you're not familiar with Nette framework, it's highly recommended to read about presenters and components on official [Nette documentation page](https://doc.nette.org/en/2.4/presenters).

The application by default scans the source code and match all presenters matching the mapping configured in `config.neon`. You're free to extend the mapping as needed:

```neon
application:
    mapping:
        *: Crm\*Module\Presenters\*Presenter
    scanComposer: yes
```

The definition will include all presenters whose fully resolved class name matches the pattern above (asterisk standing for wildcard). See that the application doesn't care where the files are stored - the namespace and class name is important.

The standard we used for storing files is to store Presenters within one subdirectory of each module, Templates within their own directory and Components within their own directory. This might be the structure of your new `DemoModule`. We recommend to follow this standard just to keep the code easily browsable.

```
app/
    modules/
        DemoModule/
            presenters/
                DemoPresenter.php
            templates/
                DemoPresenter/
                    default.latte
            DemoModule.php
```

Frontend (end-user-facing) presenters should always extend `Crm\ApplicationModule\Presenters\FrontendPresenter` which provides extra variables to the layout, sets the layout based on the application configuration and does unified execution that's common for all frontend presenters - feel free to explore the code or extend it further.

```php
class DemoPresenter extends \Crm\ApplicationModule\Presenters\FrontendPresenter
{
    public function startup()
    {
        // in this example we want DemoPresenter be available only to logged in users
        $this->onlyLoggedIn();

        parent::startup();
    }

    public function renderDefault()
    {
        $this->template->userId = $this->getUser()->getUserId();
    }
}
```

In the example we created the minimal version of Presenter (without any extra external dependencies) and passed `userId` parameter to the template. Let's see how `app/modules/DemoModule/templates/DemoPresenter/default.latte` might look like:

```latte
{block title}{_demo.default.title}{/block}

{block #content}

{control 'simpleWidget', 'frontend.demo.top'}

<div class="page-header">
  <h1>Demo default</h1>
</div>

<div n:ifset="$userId" class="row">
  <div class="col-md-12">
    Hello {$userId}
  </div>
</div>
```

Couple of things happened in the example template:

* We used `_` helper function for translating the content. See [Translations](#Translations) section for more information.
* We rendered data into different blocks of layout: `title` and `content`.
  * The `title` is usually placed within `<head>` tag of the layout. The default frontend layout provided by CRM render it this way:

    ```latte
        <title>{ifset #title}{include title|striptags} | {/ifset}{$siteTitle}</title>
    ```

  * The `content` should include default content of the page. All templates should write into the `#content` block.
  * If you use your own layout, you can utilize these blocks further more, this serves as a simple example to point the direction and to explain that the `#content` block needs to be used in the default setting. You can read more about blocks at [the official documentation page](https://latte.nette.org/en/macros#toc-blocks)
* We used `simpleWidget` component to prepare placeholder for widget from other modules to be included in our template. See section [registerWidgets](#registerWidgets) to read more about widgets.
* We used latte-specific condition `n:ifset` to render the `div` block only when the `$userId` variable is present. If you're not familiar with Latte, please check the documentation at [latte.nette.org](https://latte.nette.org/en/) and macros that are available.

As the presenters are being scanned and matched by the wildcard pattern, there's no need to register them further in your `config.neon` file. The DI container is able to provide any dependencies to the Presenters either via constructor or via [`@inject` annotation](https://doc.nette.org/en/2.4/di-usage#toc-passing-by-an-inject-method).

If the action should be accessible within fronted menu, don't forget to [registerFrontendMenuItems](#registerFrontendMenuItems).

#### Admin presenter (extra steps)

Administration presenters are similar to [Frontend presenters](#frontend-presenters), however they provide some extra features - mainly ACL.

All administration presenters should extend `Crm\AdminModule\Presenters\AdminPresenter`. The rest works the same way as frontend presenters.

```php
class DemoAdminPresenter extends \Crm\AdminModule\Presenters\AdminPresenter
{
    public function renderDefault()
    {
        // in Admin presenters even empty render methods are necessary
    }
}
```

Nette by default allows you not to include `render*` method if it doesn't do anything and will directly pass the execution to the template. In Admin presenters that's not the case. Due to the way how ACL works - it scans `render*` methods in classes inheriting from `AdminPresenter` - all access points should have their `render` method implemented even if it should be empty.

When you create new Admin presenter or even new action within Admin presenter, you need to refresh the ACL rules to include the new action:

```bash
# refreshing ACL will create new ACL rule matching new admin actions
php bin/command.php user:generate_access

# seeding will assign access right to the newly generated action to superadmin role
php bin/command.php application:seed
```

You can then assign the access to admin actions to specific roles (and create new roles) at `/users/admin-group-admin/`.

If the action should be accessible within admin menu, don't forget to [registerAdminMenuItems](#registerAdminMenuItems).

#### Translations

*to be delivered in the near future*


### Module configuration

Module configuration is kept in `app/config/config.neon` and `app/config/config.local.neon` files.
The second file provides a local configuration (only applied for `local` environment) which overrides global configuration defined in `config.neon`.

`config.neon` contains a configuration of modules loaded by your module and basic configuration values such as as database connection strings.
In addition, if you want your class to be managed and injected by dependency injection container, you need to specify it in `services` section here. Example:

```
services:
    - Crm\DemoModule\ExampleClass
```

`ExampleClass` will be instantiated as a singleton instance and can injected to other classes by requiring it in their constructor functions (for more details, see [Nette DI documentation](https://doc.nette.org/en/3.0/dependency-injection)).
 
#### Custom repositories 

Here is an example of how to use `config.neon` file to override default implementation of repository file used by UsersModule. 
UsersModule registers its repository service in `config.neon` file like this:
``` 
usersRepository: Crm\UsersModule\Repository\UsersRepository
```

When a service registration is prefixed with a key (`usersRepository`), you can refer to this key in your configuration file and provide your own implementation of the service. 
Your repository should extend the original repository (since other services may rely on functions defined there) plus implement your custom functionality. 
Next step is to re-register your repository with the same key:

``` 
usersRepository: Crm\DemoModule\MyUsersRepository
```
Following this, `MyUsersRepository` will be injected in all services instead of `UsersRepository`.
 
### Integration with the application

Each of the following subheadings represent method of `ApplicationModuleInterface` that can be extended by your module. Example snippets in this section display the primary usage of the integration points, you're free to explore and use other parameters of the call.

#### registerAdminMenuItems

CRM provides you with two separate user interfaces - one for end users and one for administrators of the system (CRM admin). Each module can register its own items which are then injected into the top menu.

Usually each module registers it's own main menu item and inserts all its features as subitems of this main menu item. It is also possible to inject submenu items to other main menu items if they're present.

When you register the menu item, you can provide the label, Nette route link (you can read more about [Nette routing here](https://doc.nette.org/en/2.4/routing), CSS class to be used to prefix the label (primarily for using Font Awesome icons) and the sorting index to control the order of items.

```php
class DemoModule extends \Crm\ApplicationModule\CrmModule
{
    // ...
    public function registerAdminMenuItems(\Crm\ApplicationModule\Menu\MenuContainerInterface $menuContainer)
    {
        $mainMenu = new \Crm\ApplicationModule\Menu\MenuItem('', '#', 'fa fa-link', 800);

        $menuItem = new \Crm\ApplicationModule\Menu\MenuItem($this->translator->translate('api.menu.api_tokens'), ':Api:ApiTokensAdmin:', 'fa fa-unlink', 200);
        $mainMenu->addChild($menuItem);

        $menuContainer->attachMenuItem($mainMenu);
    }
    // ...
}
```

If any of the items are restricted to currently logged user by ACL, the menu items will not be shown for them.

#### registerFrontendMenuItems

CRM allows each module to register main menu and submenu items on frontend side of the application - available to end users. It works the same way `registerAdminMenuItems` does, it just affects different part of the system.

As there's no ACL on the frontend side, each registered item will be shown to the end user.

```php
class DemoModule extends \Crm\ApplicationModule\CrmModule
{
    // ...
    public function registerFrontendMenuItems(\Crm\ApplicationModule\Menu\MenuContainerInterface $menuContainer)
    {
        $menuItem = new \Crm\ApplicationModule\Menu\MenuItem($this->translator->translate('payments.menu.payments'), ':Payments:Payments:My', '', 100);
        $menuContainer->attachMenuItem($menuItem);
    }
    // ...
}

```

#### registerEventHandlers

Each module is able to trigger any avaiable implementation of League's `\League\Event\AbstractEvent` during the execution throught League's *Emitter*. These are all synchronous events and all handlers are executed immediatelly when the event is emitted.

Application lets you add the listener to any event type. As the event type is essentially only the string (even when we use full class name for that), it's safe to listen to other module events - if the target module containing execution code emitting the event won\t be registered in `config.neon`, your listeners will not be triggered, but the rest of your module will remain unaffected.

Here's the example of registering the listener to one of the events provided by `UsersModule`.

```php
class DemoModule extends \Crm\ApplicationModule\CrmModule
{
    // ...
    public function registerEventHandlers(\League\Event\Emitter $emitter)
    {
        $emitter->addListener(
            \Crm\UsersModule\Events\UserMetaEvent::class,
            $this->getInstance(\Crm\ApplicationModule\Events\RefreshUserDataTokenHandler::class)
        );
    }
    // ...
}
```

To emit your own events, you need to create an event class - possibly holding any arbitrary data that could be interesting for listeners. For example if you're emitting user-related event, you probably want to include reference to the user into the event you emit. Here's the example of event class:

```php
class DemoUserEvent extends \League\Event\AbstractEvent
{
    private $userId;

    public function __construct(int $userId, $value)
    {
        $this->userId = $userId;
    }

    public function getUserId(): int
    {
        return $this->userId;
    }
}
```

You can then emit the event anywhere in your code - for example in Presenters (when handling user actions), Repositories (when updating the database) or success handlers of your forms:

```php
class DemoRepository extends \Crm\ApplicationModule\Repository
{
    private $emitter;

    protected $tableName = 'demo';

    public function __construct(
        \Nette\Database\Context $database,
        \League\Event\Emitter $emitter,
        \Nette\Caching\IStorage $cacheStorage = null
    ) {
        parent::__construct($database, $cacheStorage);
        $this->emitter = $emitter;
    }

    public function save(\Nette\Database\Table\ActiveRow $user, string $demoValue)
    {
        $result = $this->insert([
            'value' => $demoValue,
        ]);
        if ($result) {
            // HERE'S THE EXAMPLE OF EMITTING YOUR EVENT
            $this->emitter->emit(new DemoUserEvent($user->id, $demoValue));
        }
        return $result;
    }
}
```

Once the event is emitted, the listeners will pick it up. Here's the example implementation of handler that gets to listen to events:

```php
class DemoHandler extends \League\Event\AbstractListener
{
    public function handle(\League\Event\EventInterface $event)
    {
        $userId = $event->getUserId();
        // do whathever handling you want to do
    }
}
```

See, that at no point the application checked whether the handler did really receive the event it expects to receive - whether the event really has `getUserId()` method. It's up to your implementation to decide whether and when to check this.

Nette provides you with DI in the constructor to include any dependencies you need. Due to that, don't forget to register your listener class in the `config.neon` file.

For more information about Event's implementation possibilities, please visit [documentation page](https://event.thephpleague.com/2.0/emitter/basic-usage/) of ThePhpLeague.

#### registerWidgets

Widgets are placeholders in the application layout and within the templates of presenter actions. Module can provide widget placeholders for other modules to display any kind of arbitrary content that might be interesting in the viewing context.

The base example is the detail page of the user owned by `UsersModule`. By default, it displays primary information about user (email, addresses), but other modules can register their own widgets to provide data they store about the users: `SubscriptionsModule` displays list of subscriptions with links for their management, `PaymentsModule` displays list of actual users payments and also total amount of money user spent within the system.

As a module developer, you're free to provide as many placeholders for widgets and register as many widgets as you want. Then, by simply enabling and disabling modules, whole blocks of website can be displayed/removed without affecting the rest of the application.

When registering a widget, you specify a placeholder where the widget will be shown and the implementation of your widget class. Optionally you can pass the priority of the widget which affects which widgets will be rendered sooner and which later. Here's the example of registering the widget in your module class:

```php
class DemoModule extends \Crm\ApplicationModule\CrmModule
{
    // ...
    public function registerLazyWidgets(\Crm\ApplicationModule\Widget\LazyWidgetManagerInterface $widgetManager)
    {
        $widgetManager->registerWidget(
            'admin.users.header',
            \Crm\SubscriptionsModule\Components\MonthSubscriptionsSmallBarGraphWidget::class
        );
    }
    // ...
}
```

Providing a placeholder for widgets is straight-forward. In your `.latte` template file, include the `control` macro to the space where you want the widgets to be displayed:

```latte
<div class="row">
  <div class="col-md-12">
    <h1>
      Widget Demo
    </h1>

    <!-- THIS IS THE MACRO TO INCLUDE >
    {control simpleWidget 'admin.users.header'}
  </div>
</div>
```

Now for the actual implementation of widgets. In it's simplest form, the widget implementation is similar to presenters and actions. The widget's responsibility is to either render the output (usually by using `.latte` template) or decide that there's nothing to display and return nothing. Here's the example implementation of the bare widget:

```php
class DemoWidget extends \Crm\ApplicationModule\Widget\BaseLazyWidget
{
    private $templateName = 'demo.latte';

    public function identifier()
    {
        return 'demowidget';
    }

    public function render()
    {
        $this->template->setFile(__DIR__ . DIRECTORY_SEPARATOR . $this->templateName);
        $this->template->render();
    }
}
```

The widget referred to `demo.latte` placed within the same folder. Here's how it might look like:

```latte
<div style="font-size:0.8em; margin-left:1em; display:inline">
    HELLO WORLD
</div>
```

Nette provides you with DI in the constructor to include any dependencies you need. Due to that, don't forget to register your widget class in the `config.neon` file.

#### registerCommands

Console commands are used to run scheduled or one-time tasks from the CLI. They're primarily targeted to be run by system's scheduler (CRON) or by service managing running of system services (systemd, Supervisor).

All command classes should extend `Symfony\Component\Console\Command\Command` class and override `configure()` and `execute()` methods. We're using [`Crm\ApplicationModule\Commands\CacheCommand` command](https://github.com/remp2020/crm-application-module/blob/master/src/commands/CacheCommand.php) as the example class in the following snippets.

Configure method serves to define command namespace, name, arguments and options (and whether they're mandatory or not).

```php
class CacheCommand extends \Symfony\Component\Console\Command\Command
{
    // ...
    protected function configure()
    {
        $this->setName('application:cache')
            ->setDescription('Resets application cache (per-module)')
            ->addOption(
                'tags',
                null,
                \Symfony\Component\Console\Input\InputOption::VALUE_OPTIONAL | \Symfony\Component\Console\Input\InputOption::VALUE_IS_ARRAY,
                'Tag specifies which group of cache values should be reset.'
            );
    }
    // ...
}
```

When you have the definition ready, you can start implementing the handler. See that any input is readable from `InputInterface $input` and any of your output writable to `OutputInterface $output` provided by the `execute` method.

```php
class CacheCommand extends \Symfony\Component\Console\Command\Command
{
    // ...
    protected function execute(\Symfony\Component\Console\Input\InputInterface $input, \Symfony\Component\Console\Output\OutputInterface $output)
    {
        $tags = $input->getOption('tags');

        foreach ($this->moduleManager->getModules() as $module) {
            $className = get_class($module);
            $output->writeln("Caching module <info>{$className}</info>");
            $module->cache($output, $tags);
        }
    }
    // ...
}
```

You can color your output or use completely custom output formatting if you want. See additional information about outputting at [Symfony's documentation](https://symfony.com/doc/current/console/coloring.html).

Nette provides you with DI in the constructor to include any dependencies you need. Due to that, don't forget to register your command execution class in the `config.neon` file. Afterwards you need to register it in your Module class.

```php
class DemoModule extends \Crm\ApplicationModule\CrmModule
{
    // ...
    public function registerCommands(\Crm\ApplicationModule\Commands\CommandsContainerInterface $commandsContainer)
    {
        $commandsContainer->registerCommand($this->getInstance(\Crm\ApplicationModule\Commands\CacheCommand::class));
    }
    // ...
}
```

When it's registered, you can either list all commands by running `php bin/command.php` or execute the command directly by using the name you defined in the `configure` method:

```bash
php bin/command.php application:cache
```

#### registerApiCalls

API calls provide a way how external application or your frontend can reach your system's backend. Each API call handler has a separate class implementation. Following is an example implementation of API handler:

```php
class FooHandler extends \Crm\ApiModule\Api\ApiHandler
{
    // ...
    public function params()
    {
        return [
            new \Crm\ApiModule\Params\InputParam(\Crm\ApiModule\Params\InputParam::TYPE_POST, 'email', \Crm\ApiModule\Params\InputParam::REQUIRED),
            new \Crm\ApiModule\Params\InputParam(\Crm\ApiModule\Params\InputParam::TYPE_POST, 'type', \Crm\ApiModule\Params\InputParam::OPTIONAL),
        ];
    }
    // ...
}
```

The `params()` method allows you to define GET/POST params and to flag them whether they should be required or not. These parameters can be later validated by `Crm\ApiModule\Params\ParamsProcessor`.

```php
class FooHandler extends \Crm\ApiModule\Api\ApiHandler
{
    // ...
    public function handle(\Crm\ApiModule\Authorization\ApiAuthorizationInterface $authorization)
    {
        // read provided params
        $paramsProcessor = new \Crm\ApiModule\Params\ParamsProcessor($this->params());
        $error = $paramsProcessor->isError();
        if ($error) {
            $response = new \Crm\ApiModule\Api\JsonResponse(['status' => 'error', 'message' => $error]);
            $response->setHttpCode(\Nette\Http\Response::S400_BAD_REQUEST);
            return $response;
        }
        $params = $paramsProcessor->getValues();

        // read provided token
        $tokenParser = new \Crm\ApiModule\Authorization\TokenParser();
        if (!$tokenParser->isOk()) {
            $this->errorMessage = $tokenParser->errorMessage();
            $response = new \Crm\ApiModule\Api\JsonResponse(['status' => 'error', 'message' => $tokenParser->errorMessage()]);
            $response->setHttpCode(\Nette\Http\Response::S400_BAD_REQUEST);
            return $response;
        }
        $token = $this->userData->getUserToken($tokenParser->getToken());
        if (!$token) {
            $response = new \Crm\ApiModule\Api\JsonResponse(['status' => 'error', 'message' => 'Token not found']);
            $response->setHttpCode(\Nette\Http\Response::S404_NOT_FOUND);
            return $response;
        }

        // generate sample response
        $response = new \Crm\ApiModule\Api\JsonResponse([
            "token" => $token,
            "email" => $params["email"]
        ]);
        $response->setHttpCode(\Nette\Http\Response::S200_OK);
        return $response;
    }
    // ...
}
```

The `handle()` method allows you to implement your business logic and return the output. By default all API handlers return text output. We used `Crm\ApiModule\Api\JsonResponse` in our example to indicate `application/json` header and automatic JSON encoding of response by application.

You might want to use JSON input instead of GET/POST parameters. To read JSON input, we advise to put following snippet to the beginning of `handle()` method:

```php
$request = file_get_contents("php://input");
if (empty($request)) {
    $response = new \Crm\ApiModule\Api\JsonResponse(['status' => 'error', 'message' => 'Empty request body, JSON expected']);
    $response->setHttpCode(\Nette\Http\Response::S400_BAD_REQUEST);
    return $response;
}

try {
    $params = \Nette\Utils\Json::decode($request, \Nette\Utils\Json::FORCE_ARRAY);
} catch (\Nette\Utils\JsonException $e) {
    $response = new \Crm\ApiModule\Api\JsonResponse(['status' => 'error', 'message' => "Malformed JSON: " . $e->getMessage()]);
    $response->setHttpCode(\Nette\Http\Response::S400_BAD_REQUEST);
    return $response;
}

// use $params as necessary
```

Nette provides you with DI in the constructor to include any dependencies you need. Due to that, don't forget to register your API handler class in the `config.neon` file. Afterwards you need to register it in your Module class.

When you create new handler, you should call console command to refresh ACL rules so they include this new API handler:

```bash
php bin/command.php api:generate_access
```

Created handlers are not assigned to any API key by default, you need to whitelist them manually by visiting `/api/api-access-admin/`.

This implementation then has to be linked to the specific API route in your Module class.

```php
class DemoModule extends \Crm\ApplicationModule\CrmModule
{
    // ...
    public function registerApiCalls(\Crm\ApiModule\Api\ApiRoutersContainerInterface $apiRoutersContainer)
    {
        $apiRoutersContainer->attachRouter(new \Crm\ApiModule\Router\ApiRoute(
            new \Crm\ApiModule\Router\ApiIdentifier('1', 'demo', 'foo'),
            \Crm\DemoModule\Api\FooHandler::class,
            \Crm\ApiModule\Authorization\NoAuthorization::class
        ));
    }
    // ...
}
```

The definition will make an endpoint accessible at `/api/v3/demo/foo`. The `NoAuthorization` class will allow everyone to use the API call.

By default the API module provides these type of authorizations:

* `AdminLoggedAuthorization`. Used primarily for API endpoints that should be accessible only from within CRM admin. It checks, whether user has an access to the administration part of the CRM and if he/she does, handler will be executed. Authorization is primarily read from the Nette session of logged user.
* `UserTokenAuthorization`. Used primarily for user-related API calls (user data, list of subscriptions). Authorization expects token that was generated during login process:

    * If the user was logged directly via username and password within CRM, the token is stored within `n_token` cookie.
    * If the user was logged in via API call, the token was returned within the success response.

    Once authorized, API call handler will get access to the token and to the user owning the token. The token should be provided within `Authorization: Bearer XXX` header.
* `BearerTokenAuthorization`. Used for server-server communication. You can generate API tokens in CRM admin (`/api/api-tokens-admin/`) and assign them access to the specific endpoints (`/api/api-access-admin/`). The token should be provided within `Authorization: Bearer XXX` header.
* `NoAuthorization`. Used for API calls that should be publicly available - for example for tracking statistics from frontend.

You can always make your own implementation of `Crm\ApiModule\Authorization\ApiAuthorizationInterface` and use that in your Module class when registering API handler to the route.

All registered API endpoints are listed at `/api/api-calls-admin/`.

Requests to API are logged to `api_logs` MySQL table. The logging can be disabled in application configuration page, Other section (`/admin/config-admin/?categoryId=6`).


#### registerCleanupFunction

`ApplicationModule` provides a console command to clean up unnecessary data from within the system by running:
```
php bin/command.php application:cleanup
```

It's supposed to be run periodically by your system scheduler (CRON).

Each module can register its own cleanup function with the cleanup implementation. See what `UsersModule` gets to clean up:

```php
class UsersModule extends \Crm\ApplicationModule\CrmModule
{
    // ...
    public function registerCleanupFunction(\Crm\ApplicationModule\CallbackManagerInterface $cleanUpManager)
    {
        $cleanUpManager->add(function (\Nette\DI\Container $container) {
            /** @var \Crm\UsersModule\Repository\ChangePasswordsLogsRepository $changePasswordLogsRepository */
            $changePasswordLogsRepository = $container->getByType(\Crm\UsersModule\Repository\ChangePasswordsLogsRepository::class);
            $changePasswordLogsRepository->removeOldData('-12 months');
        });
        $cleanUpManager->add(function (\Nette\DI\Container $container) {
            /** @var \Crm\UsersModule\Repository\UserActionsLogRepository $changePasswordLogsRepository */
            $userActionsLogRepository = $container->getByType(\Crm\UsersModule\Repository\UserActionsLogRepository::class);
            $userActionsLogRepository->removeOldData('-12 months');
        });
    }
    // ...
}
```

In the example we requested the instance of `ChangePasswordsLogsRepository` and `UserActionsLogRepository` from the DI container and executed prepared method to remove old data from the database.

#### registerHermesHandlers

Hermes is a tool (console command) for asynchronous processing of events. The application can generate an event with any arbitrary payload to be processed by registered handlers later.

The asynchronous event processor is a console worker that should be run once and keep running forever (until the code changes). It automatically checks for new tasks and perform them. To run the worker, execute:
```
php bin/command.php application:hermes_worker
```

You can start listening to other module's events by adding following definition to your module:

```php
class DemoModule extends \Crm\ApplicationModule\CrmModule
{
    // ...
    public function registerHermesHandlers(\Tomaj\Hermes\Dispatcher $dispatcher)
    {
        $dispatcher->registerHandler(
            'dummy-event',
            $this->getInstance(\Crm\DemoModule\Hermes\FooHandler::class)
        );
    }
    // ...
}
```

Every time the application (effectively any module) emits the `dummy-event` event, your `FooHandler` will get executed. To emit such event, you need to call `emit()` method on the instance of `Tomaj\Hermes\Emitter`:

```php
<?php

class DemoPresenter extends \Crm\ApplicationModule\Presenters\FrontendPresenter
{
    /** @var Tomaj\Hermes\Emitter @inject */
    public $hermesEmitter;

    public function renderDefault($id)
    {
        $this->emitter->emit(new \Crm\ApplicationModule\Hermes\HermesMessage('dummy-event', [
            'fooId' => $id,
            'userId' => $this->getUser()->getId(),
        ]));
    }
}
```

The `DemoPresenter` created a new HermesMessage that will get stored in the storage and picked by the console worker later.

By default, the messages are being processed in the same order as they're emitted, however it's possible to delay the execution of message to the specified time - see optional parameters of `HermesMessage` constructor.

The Handler is implemented as a standalone class that gets the `Tomaj\Hermes\MessageInterface` as an input:

```php
class FooHandler implements \Tomaj\Hermes\Handler\HandlerInterface
{
    public function handle(\Tomaj\Hermes\MessageInterface $message): bool
    {
        $payload = $message->getPayload();

        // your processing code

        // return true if the execution went correctly, false other
        return true;
    }
}
```

The handler can get the array payload from the message and do the processing. Handler is responsible for returning result value indicating whether the processing was done or not. If the handler returns `true`, processing is marked as OK. If the handler returns `false` or doesn't return a value, processing is marked as failed.

Nette provides you with DI in the constructor to include any dependencies you need. Due to that, don't forget to register your handler class in the `config.neon` file.

##### Restarting the worker

Remember that you should restart the worker(s) when the code changes, otherwise it would still use the old version of code that's loaded in the memory.

If you use *systemd* or *supervisor* you can configure the tools to start the worker automatically when it stops and trigger the graceful stop of worker. There are two configuration options:

- By writing to Redis (default). Once everything is deployed and ready, write current unix timestamp to the configured Redis instance (DB 0) under the `hermes_shutdown` key. If performed manually, the steps are:

  ```
  user@server:~$ redis-cli 
  redis:6379> TIME
  1) "1624433747"
  2) "775575"
  redis:6379> SET hermes_restart 1624433747
  OK
  ```

  If the worker was started before the provided timestamp, it will shutdown. It is expected that systemd or supervisor will start it back as the latest version.

- By touching `/tmp/hermes_restart` file. If you want to use different path of file to touch, you can override the setting in `config.neon`:

    ```neon
    hermesShutdown: Tomaj\Hermes\Restart\SharedFileRestart('/var/www/html/tmp/hermes_shutdown')
    ```

#### registerAuthenticators

Application allows you to authenticate via custom channels to complement standard email-password authentication. User might be authenticated by a cookie set by some other service, by a special one-time token in URL that was sent to you in an email or by an email and password verified against 3rd party API.

CRM is shipped only with the standard `Crm\UsersModule\Authenticator\UsersAuthenticator`. You can register your own authenticator if necessary:

```php
class DemoModule extends \Crm\ApplicationModule\CrmModule
{
    // ...
    public function registerAuthenticators(\Crm\ApplicationModule\Authenticator\AuthenticatorManagerInterface $authenticatorManager)
    {
        $authenticatorManager->registerAuthenticator(
            $this->getInstance(\Crm\DemoModule\Authenticator\FooAuthenticator::class)
        );
    }
    // ...
}
```

Here the `DemoModule` registers its own authenticator. For the sake of example, let's pretend that `FooAuthenticator` will authenticate people based on the `fooQuery` parameter, that was source from the GET parameter in the URL.

```php
class FooAuthenticator extends \Crm\ApplicationModule\Authenticator\BaseAuthenticator
{
    // ...
    private $token;

    public function setCredentials(array $credentials) : \Crm\ApplicationModule\Authenticator\AuthenticatorInterface
    {
        parent::setCredentials($credentials);
        $this->token = $credentials['fooQuery'] ?? null;
        return $this;
    }

    public function authenticate()
    {
        if ($this->token === null) {
            return false;
        }

        $email = $this->tokenChecker->getEmailFromToken($this->token);
        if (!$email) {
            throw new \Nette\Security\AuthenticationException('invalid token', , \Crm\UsersModule\Auth\UserAuthenticator::IDENTITY_NOT_FOUND);
        }

        $user = $this->userManager->loadUserByEmail($email);
        if (!$user) {
            throw new \Nette\Security\AuthenticationException('invalid token', , \Crm\UsersModule\Auth\UserAuthenticator::IDENTITY_NOT_FOUND);
        }

        $this->addAttempt($user->email, $user, $this->source, \Crm\UsersModule\Repository\LoginAttemptsRepository::STATUS_TOKEN_OK);
        return $user;
    }
    // ...
}
```

The `FooAuthenticator` extracted the necessary `fooQuery` value from `$credentials` parameter. When the `authenticate()` method is then called, authentication is based on this token (or halted if the token is not present). If the authentication is OK, `$user` should be returned.

You can prioritize authenticators when registering them in Module classes by using optional parameter of `registerAuthenticator` call.

Nette provides you with DI in the constructor to include any dependencies you need. Due to that, don't forget to register your authenticator class in the `config.neon` file.

You might wonder who's responsible for populating `$credentials` parameter so that your parameter is included there. The data can come from different parts of the system, but mainly it's:

* `Crm\UsersModule\Auth\UserAuthenticator` which is set as a default authenticator for Nette application.
* `Crm\ApplicationModule\Presenters\FrontendPresenter` which extracts any relevant GET parameters and cookies and passes them to the `$credentials` parameter to be used by authenticators.

The idea is that the application will populate `$credentials` array with any relevant values and each authenticator implementation will read only values that it understands. If the values are not there, the authenticator should pass the execution to the next authenticator in the queue.


#### registerUserData

Due to GDPR compliance, system is required to provide user with any kind of user-related data that's stored within the system and also be able to delete it if requested. If your module works with / stores user data (if your data has reference to `user`), you must implement a `UserDataProviderInterface` and register the implementation here.

The purpose of each method within the interface is described within the PHPDoc of an `UserDataProviderInterface`, following are implementation excerpts with their descriptions:

```php
class UserMetaUserDataProvider implements \Crm\ApplicationModule\User\UserDataProviderInterface
{
    // ...
    public function data($userId)
    {
        $result = [];
        foreach ($this->userMetaRepository->userMetaRows($userId)->where(['is_public' => true]) as $row) {
            $result[] = [$row->key => $row->value];
        }
        return $result;
    }
    // ...
}
```

The `data` method returns array of public user data usable by the third party applications or services. We recommend to put here any often-accessed user-related data that might be cached for faster future access.

```php
class UserMetaUserDataProvider implements \Crm\ApplicationModule\User\UserDataProviderInterface
{
    // ...
    public function download($userId)
    {
        $result = [];
        foreach ($this->userMetaRepository->userMetaRows($userId) as $row) {
            $result[] = [$row->key => $row->value];
        }
        return $result;
    }
    // ...
}
```

The `download` method returns array of all related user data. In general, return value of `data` is always subset of `download`.

```php
class PaymentsUserDataProvider implements \Crm\ApplicationModule\User\UserDataProviderInterface
{
    // ...
    public function downloadAttachments($userId)
    {
        $payments = $this->paymentsRepository->userPayments($userId)->where('invoice_id IS NOT NULL');

        $files = [];
        foreach ($payments as $payment) {
            $invoiceFile = tempnam(sys_get_temp_dir(), 'invoice');
            $this->invoiceGenerator->renderInvoicePDFToFile($invoiceFile, $payment->user, $payment);
            $fileName = $payment->invoice->invoice_number->number . '.pdf';
            $files[$fileName] = $invoiceFile;
        }

        return $files;
    }
    // ...
}
```

The `downloadAttachments` method returns list of paths to files to include. In the example the `PaymentUserDataProvider` generates user invoices into the temporary files and returns list of paths to the caller.

```php
class OrdersUserDataProvider implements \Crm\ApplicationModule\User\UserDataProviderInterface
{
    // ...
    public function protect($userId): array
    {
        $exclude = [];
        foreach ($this->ordersRepository->getByUser($userId)->fetchAll() as $order) {
            $exclude[] = $order->shipping_address_id;
            $exclude[] = $order->licence_address_id;
            $exclude[] = $order->billing_address_id;
        }

        return [\Crm\UsersModule\User\AddressesUserDataProvider::identifier() => array_unique(array_filter($exclude), SORT_NUMERIC)];
    }
    // ...
}
```

The `protect` method returns IDs of protected instances and targets this information to the *UserDataProvider* responsible for possible deletion of those instances. The implementation implies the dependency between the protector and protectee. In this example the *UserDataProvider* of `ProductsModule` (our internal module) protects addresses related to the orders for future claim possibilities.

```php
class SubscriptionsUserDataProvider implements \Crm\ApplicationModule\User\UserDataProviderInterface
{
    // ...
    public function canBeDeleted($userId): array
    {
        $threeMonthsAgo = DateTime::from(strtotime('-3 months'));
        if ($this->subscriptionsRepository->hasSubscriptionEndAfter($userId, $threeMonthsAgo)) {
            return [false, $this->translator->translate('subscriptions.data_provider.delete.three_months_active')];
        }

        return [true, null];
    }
    // ...
}
```

The `canBeDeleted` returns information whether the user can be deleted or not. There might be cases, where it's not possible (e.g. due to active subscription) and manual intervention is needed before the deletion of user can happen. This method returns such flag also with information "why" the user cannot be yet deleted. In this case, his last active subscription ended within the last three months.

```php
class AddressChangeRequestsUserDataProvider implements \Crm\ApplicationModule\User\UserDataProviderInterface
{
    // ...
    public function delete($userId, $protectedData = [])
    {
        $this->addressChangeRequestsRepository->deleteAll($userId);
    }
    // ...
}
```

The `delete` method non-reversibly deletes or anonymizes everything related to the user.

#### registerSegmentCriteria

The `SegmentsModule` allows admin users to create segments of user based on specified set of conditions that are selectable in a user-friendly UI. Each module can add its own criteria and parameters that get registered to this UI. These criteria with parameters should be translatable to the query, that gets generated and executed by the `SegmentsModule`.

To register your own criteria implementation to application, call:

```php
class DemoModule extends \Crm\ApplicationModule\CrmModule
{
    // ...
    public function registerSegmentCriteria(\Crm\ApplicationModule\Criteria\CriteriaStorage $criteriaStorage)
    {
        $criteriaStorage->register(
            'users',
            'foo_criteria',
            $this->getInstance(\Crm\DemoModule\Segment\FooCriteria::class)
        );
    }
    // ...
}
```

When registering the criteria, you have to provide target table on which you do the selection (the first parameter) - in the most cases it's segments of `users`. The implementation has to honor this selection and always select unique list of users with arbitrary fields.

The implementation class should implement `Crm\ApplicationModule\Criteria\CriteriaInterface`. The methods are documented within the interface, but we include the brief description of the most important methods also here based on a Criteria implementation we use:

```php
class ActiveSubscriptionCriteria implements \Crm\ApplicationModule\Criteria\CriteriaInterface
{
    // ...
    public function params(): array
    {
        return [
            new \Crm\SegmentModule\Params\DateTimeParam(
                "active_at",
                "Active at", 
                "Filter only subscriptions active within selected period", 
                false
            ),
            new \Crm\SegmentModule\Params\StringArrayParam(
                "contains",
                "Content types", 
                "Users who have access to selected content types", 
                false, 
                null, 
                null, 
                $this->contentAccessRepository->all()->fetchPairs(null, 'name')
            ),
            new \Crm\SegmentModule\Params\StringArrayParam(
                "type", 
                "Types of subscription", 
                "Users who have access to selected types of subscription", 
                false, 
                null, 
                null, 
                array_keys($this->subscriptionsRepository->availableTypes())
            ),
            new \Crm\SegmentModule\Params\NumberArrayParam(
                "subscription_type", 
                "Subscription types", 
                "Users who have access to selected subscription types", 
                false, 
                null, 
                null, 
                $this->subscriptionTypesRepository->all()->fetchPairs("id", "name")
            ),
            new \Crm\SegmentModule\Params\BooleanParam(
                "is_recurrent", 
                "Recurrent subscriptions", 
                "Users who had at least one recurrent subscription"
            ),
        ];
    }
    // ...
}
```

The `params` method defined list of available parameters for `ActiveSubscriptionCriteria` - parametrized condition based on a subset of users having active subscription. The parameters can further descibe "when" the user had an active subscription, filter only users with access to specific content type, with specific type of subscription or with recurrent payment.

```php
class ActiveSubscriptionCriteria implements \Crm\ApplicationModule\Criteria\CriteriaInterface
{
    // ...
    public function join(\Crm\SegmentModule\Params\ParamsBag $params): string
    {
        $where = [];

        if ($params->has('active_at')) {
            $where = array_merge($where, $params->datetime('active_at')->escapedConditions('subscriptions.start_time', 'subscriptions.end_time'));
        }

        if ($params->has('contains')) {
            $values = $params->stringArray('contains')->escapedString();
            $where[] = " content_access.name IN ({$values}) ";
        }

        if ($params->has('type')) {
            $values = $params->stringArray('type')->escapedString();
            $where[] = " subscriptions.type IN ({$values}) ";
        }

        if ($params->has('subscription_type')) {
            $values = $params->numberArray('subscription_type')->escapedString();
            $where[] = " subscription_types.id IN ({$values}) ";
        }

        if ($params->has('is_recurrent')) {
            $where[] = " subscriptions.is_recurrent = {$params->boolean('is_recurrent')->number()} ";
        }

        return "SELECT DISTINCT(subscriptions.user_id) AS id, " . \Crm\SegmentModule\Criteria\Fields::formatSql($this->fields()) . "
          FROM subscriptions
          INNER JOIN subscription_types ON subscription_types.id = subscriptions.subscription_type_id
          INNER JOIN subscription_type_content_access ON subscription_type_content_access.subscription_type_id = subscription_types.id
          INNER JOIN content_access ON content_access.id = subscription_type_content_access.content_access_id
          WHERE " . implode(" AND ", $where);
    }
    // ...
}
```

The `join` method generates actual subquery, that will be used to join on by the master segment query generator. You can see that each parameter defined previously should alter the final query in its own way and it's up to developer to handle the conditions and their values correctly.

You can check the rest of the implementation of [`Crm\SubscriptionsModule\Segment\ActiveSubscriptionCriteria` here](https://github.com/remp2020/crm-subscriptions-module/blob/master/src/segment/ActiveSubscriptionCriteria.php) to get full picture.

Nette provides you with DI in the constructor to include any dependencies you need. Due to that, don't forget to register your criteria class in the `config.neon` file.

When the implementation is ready, you can check your new Criteria in action at `/segment/stored-segments/new`.

#### registerRoutes

CRM by default uses couple of default route patterns provided `Crm\ApplicationModule\Router\RouterFactory`. The very default route - `<module>/<presenter>/<action>[/<id>]` - is matching module/presenter/action in the URL and passing any string provided after the action as an `$id` parameter to action handler.

If no `action` is provided, `default` action is executed (`renderDefault` method of matched presenter), if no `presenter` is provided, `DefaultPresenter` is used. For any other caveats, please see the [Nette framework routing documentation](https://doc.nette.org/en/application/routing).

Each module can register its own routes that would be matched before the default ones. Custom routes can be used for nice URLs of special promotions or just so the most used paths of the system have a URL that's not generated from module/presenter/action combination. See the route defined by `UsersModule`:

```php
class DemoModule extends \Crm\ApplicationModule\CrmModule
{
    // ...
    public function registerRoutes(\Nette\Application\Routers\RouteList $router)
    {
        $router->prepend('/sign/in/', 'Users:Sign:in'); // use "prepend" to have your route resolved early and possibly override our routes
        $router->addRoute('/promo', 'Foo:Promo:default'); // use "addRoute" to to have your route resolve regularly
    }
    // ...
}
```

It has registered `sign/in/` route to be forwarded to `UsersModule` / `SignPresenter` / `renderIn()` method. All URLs generated by framework to this specific action (in the `latte` templates) will be now rendered as `sign/in` instead of default `users/sign/in`.

#### cache

`ApplicationModule` provides a console command to periodically cache any kind of data the module would wanted to have cached (`php bin/command.php application:cache`). It can be temporary data that gets refreshed periodically (e.g. statistical pre-calculations) or persistent data that should be cached only after the release (e.g. application routes).

```php
class DemoModule extends \Crm\ApplicationModule\CrmModule
{
    // ...
    public function cache(\Symfony\Component\Console\Output\OutputInterface $output, array $tags = [])
    {
        $output->writeln("<info>Refreshing user stats cache</info>");
        $repository = $container->getByType(\Crm\UsersModule\Repository\UsersRepository::class);
        $repository->totalCount(true, true);
    }
    // ...
}
```

You can use `$tags` to filter different type of cached data or different periodicallity. If you for example wanted to have your data cached only once in an hour, you could run the cache in your CRON with `hourly` tag (`php bin/command.php application:cache --tags=hourly`) and then search for this tag in `$tags` parameter.

#### registerLayouts

Modules can register multiple layouts, that are used when rendering the customer-facing frontend. CRM ships with the very simple `frontend` layout registered by `ApplicationModule`. You're free to register new layouts (created based on the `frontend` as reference implementation) and use them across the application.

```php
class DemoModule extends \Crm\ApplicationModule\CrmModule
{
    // ...
    public function registerLayouts(\Crm\ApplicationModule\LayoutManager $layoutManager)
    {
        $layoutManager->registerLayout('frontend', realpath(__DIR__ . '/templates/@frontend_layout.latte'));
    }
    // ...
}
```

The default application layout can be changed in application configuration (`/admin/config-admin/?categoryId=1`). Be aware that using layout that's not registered will cause application to crash immediatelly.

Any action or presenter can use their own layout and override default layout if necessary. You can force the change by calling `$this->setLayout('foo_layout');` within your presenter. You might want to use custom layouts for views that are supposed to be displayed in iframes or modal windows and you don't want to render full header/footer that gets usually rendered.

Every layout should includ `content` snippet, that gets replaced by the content rendered by executed action. See `@frontend_layout_plain.latte` for reference:

```latte
<html lang="sk-SK" prefix="og: http://ogp.me/ns# fb: http://ogp.me/ns/fb#">
<head>
    <title>{ifset #title}{include title|striptags} | {/ifset}DennikN</title>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <script type='text/javascript' src='{$basePath}/layouts/default/js/jquery-1.11.2.js'></script>
    <link rel="stylesheet" href="{$basePath}/layouts/default/css/bootstrap.min.css">
    <link rel="stylesheet" href="{$basePath}/layouts/default/js/jquery-ui.css">
    <link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css">
    <link href='//fonts.googleapis.com/css?family=Source+Sans+Pro:400,600,300&subset=latin,latin-ext' rel='stylesheet' type='text/css'>
    <style type="text/css">
        html, body { font-family: 'Source Sans Pro'; }
    </style>
</head>
<body>

<!-- RENDERED CONTENT -->
{include content}

</body>
</html>
```

#### registerSeeders

Seeders provide application with data necessary running the system. This data is usually stored in the database. Each module can seed its own data into the database or extend already existing data (of modules, that your module will depend on) - for example `MailModule` can seed the default templates and layouts, `ApiModule` can seed extra configuration options to the existing application config.

Each seeder has to be implemented as a separate class implementing `\Crm\ApplicationModule\Seeders\ISeeder` interface.

See the `ConfigsSeeder` of `ApiModule` as an example:

```php
// ...
public function seed(\Symfony\Component\Console\Output\OutputInterface $output)
{
    $category = $this->configCategoriesRepository->loadByName('Other');
    if (!$category) {
        $category = $this->configCategoriesRepository->add('Other', 'fa fa-tag', 900);
        $output->writeln('  <comment>* config category <info>Other</info> created</comment>');
    } else {
        $output->writeln(' * config category <info>Other</info> exists');
    }

    $name = 'enable_api_log';
    $config = $this->configsRepository->loadByName($name);
    if (!$config) {
        $this->configBuilder->createNew()
            ->setName($name)
            ->setDisplayName('API logs')
            ->setDescription('Enable API logs in database')
            ->setType(\Crm\ApplicationModule\Config\ApplicationConfig::TYPE_BOOLEAN)
            ->setAutoload(true)
            ->setConfigCategory($category)
            ->setSorting(500)
            ->setValue(true)
            ->save();
        $output->writeln("<comment>  * config item <info>$name</info> created</comment>");
    } else {
        $output->writeln("  * config item <info>$name</info> exists");
    }
}
// ...
```

The implementation checks whether the config category already exists or not. If it doesn't, it creates it and retrieves the reference. Afterwards it creates new `enable_api_log` config option that can be used within the application to check whether the API calls should be logged or not - see the usage in `\Crm\ApiModule\Presenters\ApiPresenter`. Every step is written to the `$output` just for the sake of logging and visibility of changes.

Nette provides you with DI in the constructor to include any dependencies you need. Due to that, don't forget to register your seeder class in the `config.neon` file. Afterwards you need to register it in your Module class.

#### registerAccessProvider

*to be delivered in the future*

#### registerDataProviders

Idea of data providers is similar to widgets. Instead of displaying the data (like widgets do) they only "provide" the data to the execution function which can process them further. It's main purpose is to provide a way for extending modules to pass data to one of the generic modules without generic modules knowing something about the data.

For example the form for listing the users in admin provided by `AdminForm` has by default filtering fields directly related to the user. By using data providers, `SubscriptionModule` (if enabled) can extend this form and add additional filteing fields to the form and then also use the values to alter the results of the filtering query.

The other nice example are charts. Generic implementation of chart can contain line chart with number of all registered users. When `PaymentsModule` is included, it can provide another dataset for the chart - number of "paying users". `UsersModule` will receive this data (without any semantic knowledge of what they consist of) and display them within the chart.

Here's the example of registering data provider within your module class:

```php
class DemoModule extends \Crm\ApplicationModule\CrmModule
{
    // ...
    public function registerDataProviders(\Crm\ApplicationModule\DataProvider\DataProviderManager $dataProviderManager)
    {
        $dataProviderManager->registerDataProvider(
            'subscriptions.dataprovider.ending_subscriptions',
            $this->getInstance(DemoDataProvider::class)
        );
    }
    // ...
}
```

Here's the example of data provider extension point - the itegration part where the provided data is eventually consumed:

```php
public function createComponentGoogleSubscriptionsEndGraph(\Crm\ApplicationModule\Components\Graphs\GoogleLineGraphGroupControlFactoryInterface $factory)
{
    $items = [];

    // THE DEFAULT CHART ITEM PROVIDED BY GENERIC MODULE
    $graphDataItem = new \Crm\ApplicationModule\Graphs\GraphDataItem();
    $graphDataItem->setCriteria((new Criteria())
        ->setTableName('subscriptions')
        ->setTimeField('end_time')
        ->setValueField('count(*)')
        ->setStart($this->dateFrom)
        ->setEnd($this->dateTo));

    $graphDataItem->setName($this->translator->translate('dashboard.subscriptions.ending.now.title'));

    $items[] = $graphDataItem;

    // CHART ITEMS PROVIDED BY OTHER MODULES
    $providers = $this->dataProviderManager->getProviders('subscriptions.dataprovider.ending_subscriptions');
    foreach ($providers as $sorting => $provider) {
        $items[] = $provider->provide(['dateFrom' => $this->dateFrom, 'dateTo' => $this->dateTo]);
    }

    // ...
}
```

The extension points can provide any arbitrary data to providers - such as parameters for date filtering so that the data provider can return chart data to the same period of time as the original chart.

Here's the example of implementation of the data provider.

```php
class DemoDataProvider
{
    public function provide(array $params): \Crm\ApplicationModule\Graphs\GraphDataItem
    {
        if (!isset($params['dateFrom'])) {
            throw new \Crm\ApplicationModule\DataProvider\DataProviderException('dateFrom param missing');
        }
        if (!isset($params['dateTo'])) {
            throw new \Crm\ApplicationModule\DataProvider\DataProviderException('dateTo param missing');
        }

        $graphDataItem = new \Crm\ApplicationModule\Graphs\GraphDataItem();
        $graphDataItem->setCriteria((new \Crm\ApplicationModule\Graphs\Criteria())
            ->setTableName('subscriptions')
            ->setJoin('LEFT JOIN payments ON payments.subscription_id=subscriptions.id
                        LEFT JOIN recurrent_payments ON payments.id = recurrent_payments.parent_payment_id')
            ->setWhere('  AND next_subscription_id IS NULL AND (recurrent_payments.id IS NULL OR recurrent_payments.state != \'active\' or recurrent_payments.status is not null or recurrent_payments.retries = 0)')
            ->setTimeField('end_time')
            ->setValueField('count(*)')
            ->setStart($params['dateFrom'])
            ->setEnd($params['dateTo']));

        $graphDataItem->setName($this->translator->translate('dashboard.subscriptions.ending.nonext.title'));

        return $graphDataItem;
    }
}
```

Nette provides you with DI in the constructor to include any dependencies you need. Due to that, don't forget to register your widget class in the `config.neon` file.
