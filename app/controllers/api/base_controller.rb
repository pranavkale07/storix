class Api::BaseController < ApplicationController
  # Skip CSRF protection for API endpoints that use JWT authentication
  skip_before_action :verify_authenticity_token

  # Handle CORS for API requests
  before_action :cors_preflight_check
  after_action :cors_set_access_control_headers

  private

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
      ENV["FRONTEND_URL"] || "https://yourdomain.com"
    else
      # In development, allow localhost
      request.headers["Origin"] || "http://localhost:3000"
    end
  end
end
