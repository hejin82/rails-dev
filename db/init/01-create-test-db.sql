-- The MySQL entrypoint creates MYSQL_DATABASE (railsdev_development) and the
-- MYSQL_USER account. Create the test database and grant the same account
-- access so `rails test` can prepare the test schema.
CREATE DATABASE IF NOT EXISTS railsdev_test
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON railsdev_test.* TO 'rails'@'%';
FLUSH PRIVILEGES;
