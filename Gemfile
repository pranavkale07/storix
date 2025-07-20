source "https://rubygems.org"

# Bundle edge Rails instead: gem "rails", github: "rails/rails", branch: "main"
gem "rails", "~> 8.0.2"
# Use postgresql as the database for Active Record
gem "pg", "~> 1.1"
# Use the Puma web server [https://github.com/puma/puma]
gem "puma", ">= 5.0"
# Build JSON APIs with ease [https://github.com/rails/jbuilder]
# gem "jbuilder"



# AWS SDK for S3 operations
gem "aws-sdk-s3", "~> 1.0"

# Environment variables management
gem "dotenv-rails", "~> 2.8"

# JWT for API authentication
gem "jwt", "~> 2.7"

# OAuth gems for Google and GitHub authentication
gem "omniauth-google-oauth2", "~> 1.2"
gem "omniauth-github", "~> 2.0"
gem "omniauth-rails_csrf_protection", "~> 1.0"

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem "tzinfo-data", platforms: %i[ windows jruby ]

# Use the database-backed adapters for Rails.cache, Active Job, and Action Cable
gem "solid_cache"
gem "solid_queue"
gem "solid_cable"

# Reduces boot times through caching; required in config/boot.rb
gem "bootsnap", require: false

# Deploy this application anywhere as a Docker container [https://kamal-deploy.org]
gem "kamal", require: false

# Add HTTP asset caching/compression and X-Sendfile acceleration to Puma [https://github.com/basecamp/thruster/]
gem "thruster", require: false

# Use Active Storage variants [https://guides.rubyonrails.org/active_storage_overview.html#transforming-images]
# gem "image_processing", "~> 1.2"

# Use Rack CORS for handling Cross-Origin Resource Sharing (CORS), making cross-origin Ajax possible
gem "rack-cors"

# Rate limiting with Rack::Attack
gem "rack-attack", "~> 6.7"

# Redis for rate limiting storage
gem "redis", "~> 5.0"

# Cron jobs for Rails
gem "whenever", require: false

group :development, :test do
  # See https://guides.rubyonrails.org/debugging_rails_applications.html#debugging-with-the-debug-gem
  gem "debug", platforms: %i[ mri windows ], require: "debug/prelude"

  # Static analysis for security vulnerabilities [https://brakemanscanner.org/]
  gem "brakeman", require: false

  # Omakase Ruby styling [https://github.com/rails/rubocop-rails-omakase/]
  gem "rubocop-rails-omakase", require: false

  # --- Added for testing ---
  gem "rspec-rails", "~> 8.0"
  gem "factory_bot_rails"
  gem "shoulda-matchers"
  gem "faker"
  gem "webmock"
  gem "database_cleaner-active_record"
end

# Vite integration for Rails
gem "vite_rails"

gem "pagy", "~> 9.3", ">= 9.3.5"
