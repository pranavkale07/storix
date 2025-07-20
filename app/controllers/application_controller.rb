class ApplicationController < ActionController::Base
  include JwtAuthenticatable

  # Handle CORS
  before_action :cors_preflight_check
  after_action :cors_set_access_control_headers
  before_action :authenticate_user!
  before_action :set_security_headers

  rescue_from StandardError, with: :log_and_render_error

  private

  def log_and_render_error(exception)
    error_hash = {
      time: Time.current,
      controller: controller_name,
      action: action_name,
      error_class: exception.class.name,
      error_message: exception.message,
      backtrace: exception.backtrace&.take(10),
      params: request.filtered_parameters
    }
    if Rails.env.production? || Rails.env.development?
      BACKEND_ERROR_LOGGER.error(error_hash.to_json)
      Rails.logger.error(error_hash.to_json) # Log to terminal as well
    end
    render json: { error: "Internal Server Error" }, status: :internal_server_error
  end

  def cors_set_access_control_headers
    # Only allow specific origins instead of all origins
    allowed_origin = get_allowed_origin
    headers["Access-Control-Allow-Origin"] = allowed_origin
    headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS"
    headers["Access-Control-Allow-Headers"] = "Origin, Content-Type, Accept, Authorization, X-Requested-With"
    headers["Access-Control-Max-Age"] = "1728000"
  end

  def cors_preflight_check
    if request.method == "OPTIONS"
      allowed_origin = get_allowed_origin
      headers["Access-Control-Allow-Origin"] = allowed_origin
      headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS"
      headers["Access-Control-Allow-Headers"] = "Origin, Content-Type, Accept, Authorization, X-Requested-With"
      headers["Access-Control-Max-Age"] = "1728000"
      render plain: "", content_type: "text/plain"
    end
  end

  def get_allowed_origin
    # In production, only allow your specific frontend domain
    if Rails.env.production?
      ENV['FRONTEND_URL'] || 'https://yourdomain.com'
    else
      # In development, allow localhost
      request.headers['Origin'] || 'http://localhost:3000'
    end
  end

  def set_security_headers
    # Prevent XSS attacks
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    
    # Prevent clickjacking
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
    
    # Prevent MIME type sniffing
    response.headers['X-Content-Type-Options'] = 'nosniff'
    
    # Referrer policy
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
  end
end
