module JwtAuthenticatable
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_user!
  end

  def authenticate_user!
    render json: { error: 'Unauthorized' }, status: :unauthorized unless current_user
  end

  def current_user
    header = request.headers['Authorization']
    token = header.split(' ').last if header.present?
    begin
      decoded = JWT.decode(token, Rails.application.credentials.secret_key_base, true, { algorithm: 'HS256' })
      user_id = decoded[0]['user_id']
      @jwt_payload = decoded[0]
      @current_user ||= User.find_by(id: user_id)
    rescue JWT::DecodeError, JWT::ExpiredSignature, JWT::VerificationError
      nil
    end
  end

  def current_active_credential_id
    # Ensure current_user is called so @jwt_payload is set
    current_user unless defined?(@jwt_payload)
    @jwt_payload && @jwt_payload['active_credential_id']
  end

  # Optionally, add current_user method or other helpers
end 