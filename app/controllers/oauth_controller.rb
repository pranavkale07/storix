class OauthController < ApplicationController
  skip_before_action :authenticate_user!

  def callback
    auth = request.env["omniauth.auth"]

    if auth.nil?
      redirect_to "#{ENV['FRONTEND_URL'] || 'http://localhost:3000'}/auth/error?message=oauth_failed"
      return
    end

    user = User.from_oauth(auth)

    if user.save
      token = JwtService.encode(user)
      redirect_to "#{ENV['FRONTEND_URL'] || 'http://localhost:3000'}/auth/callback?token=#{token}&user_id=#{user.id}"
    else
      # Log the validation errors for debugging
      Rails.logger.error "User creation failed: #{user.errors.full_messages}"
      redirect_to "#{ENV['FRONTEND_URL'] || 'http://localhost:3000'}/auth/error?message=user_creation_failed&errors=#{user.errors.full_messages.join(', ')}"
    end
  rescue => e
    Rails.logger.error "OAuth callback error: #{e.message}"
    redirect_to "#{ENV['FRONTEND_URL'] || 'http://localhost:3000'}/auth/error?message=server_error"
  end

  def failure
    redirect_to "#{ENV['FRONTEND_URL'] || 'http://localhost:3000'}/auth/error?message=#{params[:message]}"
  end
end
