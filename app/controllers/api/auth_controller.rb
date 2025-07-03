class Api::AuthController < ApplicationController
  skip_before_action :authenticate_user!, only: [ :register, :login ]

  # POST /api/auth/register
  def register
    user = User.new(user_params)

    if user.save
      token = generate_token(user)
      render json: {
        message: "User registered successfully",
        token: token,
        user: { id: user.id, email: user.email }
      }, status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # POST /api/auth/login
  def login
    user = User.find_by(email: params[:email])

    if user&.authenticate(params[:password])
      token = generate_token(user)
      render json: {
        message: "Login successful",
        token: token,
        user: { id: user.id, email: user.email }
      }
    else
      render json: { error: "Invalid email or password" }, status: :unauthorized
    end
  end

  # GET /api/auth/me
  def me
    render json: {
      user: { id: current_user.id, email: current_user.email }
    }
  end

  private

  def user_params
    params.require(:user).permit(:email, :password, :password_confirmation)
  end

  def generate_token(user)
    JWT.encode(
      { user_id: user.id, exp: 24.hours.from_now.to_i },
      Rails.application.credentials.secret_key_base,
      "HS256"
    )
  end
end
