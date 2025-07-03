class Api::Auth::AuthController < ApplicationController
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

  # DELETE /api/auth/me
  def destroy
    if current_user.destroy
      render json: { message: "User account deleted successfully" }
    else
      render json: { error: "Failed to delete user account" }, status: :unprocessable_entity
    end
  end

  # POST /api/auth/active_credential
  def active_credential
    credential_id = params[:credential_id]
    credential = current_user.storage_credentials.find_by(id: credential_id)
    if credential
      token = generate_token(current_user, active_credential_id: credential.id)
      render json: { token: token, active_credential_id: credential.id }
    else
      render json: { error: "Credential not found" }, status: :not_found
    end
  end

  # GET /api/auth/profile
  def profile
    render json: {
      id: current_user.id,
      email: current_user.email,
      created_at: current_user.created_at,
      updated_at: current_user.updated_at
    }
  end

  private

  def user_params
    params.require(:user).permit(:email, :password, :password_confirmation)
  end

  def generate_token(user, extra_payload = {})
    payload = { user_id: user.id, exp: 24.hours.from_now.to_i }
    payload.merge!(extra_payload) if extra_payload.present?
    JWT.encode(
      payload,
      Rails.application.credentials.secret_key_base,
      "HS256"
    )
  end
end
