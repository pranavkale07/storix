class JwtService
  def self.encode(user, extra_payload = {})
    payload = { user_id: user.id, exp: 24.hours.from_now.to_i }
    payload.merge!(extra_payload) if extra_payload.present?
    JWT.encode(
      payload,
      Rails.application.credentials.secret_key_base,
      'HS256'
    )
  end
end 