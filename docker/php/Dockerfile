FROM php:8.2.14-fpm

# ADD NON-ROOT USER; IF THE VARIABLES ARE NOT SET, DOCKER COMPOSE DEFAULTS TO 1000:1000 "docker"

ARG UID
ARG GID
ARG UNAME

RUN groupadd -g ${GID} -o ${UNAME}

RUN usermod -a -G ${UNAME} www-data

RUN useradd -m -u ${UID} -g ${GID} -o -s /bin/bash ${UNAME}

# INIT

ENV BUILD_DEPS libc-client-dev libicu-dev git libzip-dev zlib1g-dev libkrb5-dev libpng-dev g++ build-essential libssl-dev libsasl2-dev libmagickwand-dev libonig-dev

ENV RUN_DEPS git wget vim curl less gnupg unzip pv

# INSTALL DEPENDENCIES

RUN apt-get update && apt-get install -y ${BUILD_DEPS} ${RUN_DEPS} --no-install-recommends \
    && docker-php-ext-configure intl \
    && docker-php-ext-configure imap --with-kerberos --with-imap-ssl \
    && docker-php-ext-install -j$(nproc) mysqli pdo_mysql bcmath iconv zip intl imap gd soap sockets

# OPCache

RUN docker-php-ext-install opcache

ADD opcache.ini /tmp/opcache.ini

RUN cat /tmp/opcache.ini >> /usr/local/etc/php/conf.d/docker-php-ext-opcache.ini

# XDEBUG

RUN pecl install xdebug && docker-php-ext-enable xdebug

ADD xdebug.ini /tmp/xdebug.ini

RUN cat /tmp/xdebug.ini >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini

# IMAGICK

RUN pecl install imagick && docker-php-ext-enable imagick

ADD log.conf /usr/local/etc/php-fpm.d/zz-log.conf

# COMPOSER

RUN mkdir -p /composer && mkdir -p /composer/bin

ENV COMPOSER_HOME /composer

ENV PATH /composer/bin:/composer/vendor/bin:$PATH

ENV COMPOSER_ALLOW_SUPERUSER 0

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/composer/bin --filename=composer

RUN chown -R ${UID}:${GID} /composer

# VOLUME

VOLUME /var/www/html

RUN chmod 777 /var/www/html