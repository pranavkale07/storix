# Configure OmniAuth for Google and GitHub OAuth
Rails.application.config.middleware.use OmniAuth::Builder do
  provider :google_oauth2,
    ENV["GOOGLE_CLIENT_ID"],
    ENV["GOOGLE_CLIENT_SECRET"],
    {
      scope: "email,profile",
      prompt: "select_account",
      access_type: "offline",
      skip_jwt: true
    }

  provider :github,
    ENV["GITHUB_CLIENT_ID"],
    ENV["GITHUB_CLIENT_SECRET"],
    {
      scope: "user:email"
    }
end

# Enable OmniAuth debugging in development
if Rails.env.development?
  OmniAuth.config.logger = Rails.logger
  OmniAuth.config.allowed_request_methods = [ :get, :post ]
  OmniAuth.config.silence_get_warning = true
end
