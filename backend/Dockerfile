FROM php:8.4-fpm-alpine

RUN apk add --no-cache \
    nginx \
    supervisor \
    gettext \
    $PHPIZE_DEPS \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libzip-dev \
    oniguruma-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        bcmath \
        gd \
        pcntl \
        pdo_mysql \
        zip \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del $PHPIZE_DEPS

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY composer.json composer.lock ./
RUN mkdir -p bootstrap/cache \
    && composer install --no-dev --no-interaction --no-progress --optimize-autoloader --no-scripts

COPY . .

RUN mkdir -p /var/run/php \
    && chown -R www-data:www-data /var/run/php \
    && { \
        echo "listen = /var/run/php/php8.4-fpm.sock"; \
        echo "listen.owner = www-data"; \
        echo "listen.group = www-data"; \
        echo "listen.mode = 0660"; \
    } > /usr/local/etc/php-fpm.d/zz-listen.conf \
    && { \
        echo "memory_limit = 256M"; \
        echo "upload_max_filesize = 100M"; \
        echo "post_max_size = 100M"; \
        echo "max_execution_time = 600"; \
        echo "max_input_time = 300"; \
    } > /usr/local/etc/php/conf.d/zz-app.ini \
    && mkdir -p \
        storage/framework/cache \
        storage/framework/sessions \
        storage/framework/views \
        storage/framework/testing \
        storage/logs \
        bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

COPY docker/nginx.conf /etc/nginx/http.d/default.conf.template
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
