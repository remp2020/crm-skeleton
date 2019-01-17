# CRM Skeleton

This is a pre-configured skeleton of CRM application with simple installation.


## Modules

### Included

- [Application](https://github.com/remp2020/crm-application-module)
- [Api](https://github.com/remp2020/crm-api-module)
- [Admin](https://github.com/remp2020/crm-admin-module)
- [Users](https://github.com/remp2020/crm-users-module)
- [Subscriptions](https://github.com/remp2020/crm-subscriptions-module)
- [Segments](https://github.com/remp2020/crm-segment-module)

### WIP _(2019)_

- Payments module


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

- [Docker](https://www.docker.com/products/docker-engine) - 18.06.1-ce, build e68fc7a
- [Docker Compose](https://docs.docker.com/compose/overview/) - 1.17.1, build 6d101fb

#### Steps to install application within docker

1. Prepare environment & configuration files

    ```
    cp .env.example .env
    ```
    
    ```
    cp app/config/config.local.example.neon app/config/config.local.neon
    ```
    
    ```
    cp docker-compose.override.example.yml docker-compose.override.yml
    ```
    
    No changes are required if you want to run application as it is.

2. Setup host 

    Default host used by application is `http://crm.press`. It should by pointing to localhost (`127.0.0.1`).
    
3. Start docker-compose
    
    ```
    docker-compose up
    ```
    
    You should see log of starting containers.
    
4. Enter application docker container

    ```
    docker-compose exec crm /bin/bash
    ```
    
    Following commands will be run inside container. 

5. Update permissions for docker application

    Owner of folders `temp` and `log` is user on host machine. Application needs to have right to write there.

    ```
    chmod -R a+rw temp log
    ```

6. Install composer packages

    ```
    composer install
    ```
    
7. Initialize and migrate database

    ```
    php bin/command.php phinx:migrate
    ```
    
8. Generate access resources

    ```
    php bin/command.php user:generate_access
    ```

    _(Optional)_ If you plan to use API, generate also API access resources:
    
    ```
    php bin/command.php api:generate_access
    ```
        
9. Seed database with required data

    ```
    php bin/command.php application:seed
    ```
  
10. All done

    Access application via web browser. Default configuration:
    
    - URL: http://crm.press/
    - Users:
        - Admin
            - Username: `admin@admin.sk`
            - Password: `password`
        - User
            - Username: `user@user.sk`
            - Password: `password`

