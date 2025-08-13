Rails.logger.info "OmniAuth initializer loaded"
Rails.logger.info "GOOGLE_CLIENT_ID: #{ENV['GOOGLE_CLIENT_ID']}"
Rails.logger.info "GOOGLE_CLIENT_SECRET: #{ENV['GOOGLE_CLIENT_SECRET']}"

begin
  Rails.application.config.middleware.use OmniAuth::Builder do
    # Simple, single environment variable for all OAuth redirects
    oauth_redirect_base_url = ENV.fetch("OAUTH_REDIRECT_BASE_URL", "http://localhost:3000")

    provider :google_oauth2,
      ENV["GOOGLE_CLIENT_ID"],
      ENV["GOOGLE_CLIENT_SECRET"],
      {
        scope: "email,profile",
        prompt: "select_account",
        access_type: "offline",
        skip_jwt: true,
        redirect_uri: "#{oauth_redirect_base_url}/auth/google_oauth2/callback"
      }

    provider :github,
      ENV["GITHUB_CLIENT_ID"],
      ENV["GITHUB_CLIENT_SECRET"],
      {
        scope: "user:email",
        redirect_uri: "#{oauth_redirect_base_url}/auth/github/callback"
      }
  end
  Rails.logger.info "OmniAuth strategies: #{OmniAuth.strategies.map(&:to_s)}"
rescue => e
  Rails.logger.error "OmniAuth initializer error: #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}"
end

# Remove complex full_host logic - not needed with explicit redirect URIs
OmniAuth.config.allowed_request_methods = [:get, :post]

# Enable OmniAuth debugging in development
if Rails.env.development?
  OmniAuth.config.logger = Rails.logger
  OmniAuth.config.allowed_request_methods = [:get, :post]
  OmniAuth.config.silence_get_warning = true
end
