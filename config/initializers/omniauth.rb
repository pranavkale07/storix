# Configure OmniAuth for Google and GitHub OAuth
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

# Enable OmniAuth debugging in development
if Rails.env.development?
  OmniAuth.config.logger = Rails.logger
  OmniAuth.config.allowed_request_methods = [:get, :post]
  OmniAuth.config.silence_get_warning = true
end
