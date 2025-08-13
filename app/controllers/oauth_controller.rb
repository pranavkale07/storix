class OauthController < ApplicationController
  skip_before_action :authenticate_user!

  # Whitelist of allowed error messages to prevent open redirect
  ALLOWED_ERROR_MESSAGES = %w[oauth_failed user_creation_failed server_error access_denied].freeze

  def callback
    auth = request.env["omniauth.auth"]

    if auth.nil?
      redirect_to "#{oauth_redirect_base_url}/auth/error?message=oauth_failed"
      return
    end

    user = User.from_oauth(auth)

    if user.save
      token = JwtService.encode(user)
      redirect_to "#{oauth_redirect_base_url}/auth/callback?token=#{token}&user_id=#{user.id}"
    else
      # Log the validation errors for debugging
      Rails.logger.error "User creation failed: #{user.errors.full_messages}"
      redirect_to "#{oauth_redirect_base_url}/auth/error?message=user_creation_failed&errors=#{user.errors.full_messages.join(', ')}"
    end
  rescue => e
    Rails.logger.error "OAuth callback error: #{e.message}"
    redirect_to "#{oauth_redirect_base_url}/auth/error?message=server_error"
  end

  def failure
    # Validate the message parameter to prevent open redirect
    message = params[:message]
    if message.present? && ALLOWED_ERROR_MESSAGES.include?(message)
      redirect_to "#{oauth_redirect_base_url}/auth/error?message=#{message}"
    else
      # Default to a safe error message
      redirect_to "#{oauth_redirect_base_url}/auth/error?message=access_denied"
    end
  end

  private

  def oauth_redirect_base_url
    ENV.fetch("OAUTH_REDIRECT_BASE_URL", "http://localhost:3000")
  end
end
