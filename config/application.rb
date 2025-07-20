require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module Storix
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 8.0

    # Please, add to the `ignore` list any other `lib` subdirectories that do
    # not contain `.rb` files, or that should not be reloaded or eager loaded.
    # Common ones are `templates`, `generators`, or `middleware`, for example.
    config.autoload_lib(ignore: %w[assets tasks])

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # config.time_zone = "Central Time (US & Canada)"
    # config.eager_load_paths << Rails.root.join("extras")

    # Only loads a smaller set of middleware suitable for API only apps.
    # Middleware like session, flash, cookies can be added back manually.
    # Skip views, helpers and assets when generating a new resource.
    config.api_only = false

    # Add session middleware for OmniAuth
    config.middleware.use ActionDispatch::Session::CookieStore
    config.middleware.use ActionDispatch::Cookies

    # Add Rack::Attack for rate limiting
    config.middleware.use Rack::Attack

    # Load environment variables from .env file
    config.before_configuration do
      env_file = File.join(Rails.root, ".env")
      if File.exist?(env_file)
        File.readlines(env_file).each do |line|
          next if line.strip.empty? || line.start_with?("#")
          key, value = line.split("=", 2)
          ENV[key.strip] = value.strip if key && value
        end
      end
    end
  end
end
