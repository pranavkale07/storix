Rails.logger.info "OmniAuth initializer loaded"
Rails.logger.info "GOOGLE_CLIENT_ID: #{ENV['GOOGLE_CLIENT_ID']}"
Rails.logger.info "GOOGLE_CLIENT_SECRET: #{ENV['GOOGLE_CLIENT_SECRET']}"

begin
  Rails.application.config.middleware.use OmniAuth::Builder do
    callback_host = ENV.fetch("DEPLOYED_DOMAIN", "http://localhost:3000")

    provider :google_oauth2,
      ENV["GOOGLE_CLIENT_ID"],
      ENV["GOOGLE_CLIENT_SECRET"],
      {
        scope: "email,profile",
        prompt: "select_account",
        access_type: "offline",
        skip_jwt: true,
        redirect_uri: "#{callback_host}/auth/google_oauth2/callback"
      }

    provider :github,
      ENV["GITHUB_CLIENT_ID"],
      ENV["GITHUB_CLIENT_SECRET"],
      {
        scope: "user:email",
        redirect_uri: "#{callback_host}/auth/github/callback"
      }
  end
  Rails.logger.info "OmniAuth strategies: #{OmniAuth.strategies.map(&:to_s)}"
rescue => e
  Rails.logger.error "OmniAuth initializer error: #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}"
end

OmniAuth.config.full_host = lambda do |env|
  scheme         = env['rack.url_scheme']
  local_host     = env['HTTP_HOST']
  forwarded_host = env['HTTP_X_FORWARDED_HOST']
  forwarded_host.blank? ? "#{scheme}://#{local_host}" : "#{scheme}://#{forwarded_host}"
end

OmniAuth.config.allowed_request_methods = [:get, :post]

# Enable OmniAuth debugging in development
if Rails.env.development?
  OmniAuth.config.logger = Rails.logger
  OmniAuth.config.allowed_request_methods = [:get, :post]
  OmniAuth.config.silence_get_warning = true
end
