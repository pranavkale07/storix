class ApplicationController < ActionController::Base
  include JwtAuthenticatable

  # Handle CORS
  before_action :cors_preflight_check
  after_action :cors_set_access_control_headers

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
    headers["Access-Control-Allow-Origin"] = "*"
    headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS"
    headers["Access-Control-Allow-Headers"] = "Origin, Content-Type, Accept, Authorization, X-Requested-With"
    headers["Access-Control-Max-Age"] = "1728000"
  end

  def cors_preflight_check
    if request.method == "OPTIONS"
      headers["Access-Control-Allow-Origin"] = "*"
      headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS"
      headers["Access-Control-Allow-Headers"] = "Origin, Content-Type, Accept, Authorization, X-Requested-With"
      headers["Access-Control-Max-Age"] = "1728000"
      render plain: "", content_type: "text/plain"
    end
  end
end
