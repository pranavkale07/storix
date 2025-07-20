# frozen_string_literal: true

puts "Loading Rack::Attack configuration..." if Rails.env.development?

class Rack::Attack
  # Configure Memory Store for rate limiting (no external dependencies)
  Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new
  Rails.logger.info "DEBUG: Memory store configured for rate limiting" if Rails.env.development?

  # Helper method to extract user ID from JWT token
  def self.user_id_from_jwt(request)
    auth_header = request.get_header('HTTP_AUTHORIZATION')
    return nil unless auth_header

    token = auth_header.split(' ').last
    return nil unless token

    begin
      payload = JWT.decode(token, Rails.application.credentials.secret_key_base, 'HS256')[0]
      user_id = payload['user_id']
      Rails.logger.info "DEBUG: Extracted user_id: #{user_id}" if Rails.env.development?
      user_id
    rescue JWT::DecodeError, JWT::ExpiredSignature => e
      Rails.logger.info "DEBUG: JWT decode error: #{e.message}" if Rails.env.development?
      nil
    rescue StandardError => e
      Rails.logger.error "DEBUG: Unexpected error in JWT decoding: #{e.message}" if Rails.env.development?
      nil
    end
  end

  # Helper method to get rate limit based on environment
  def self.get_rate_limit(base_limit, endpoint)
    case Rails.env
    when 'development'
      limit = base_limit * 10 # More lenient in development
      Rails.logger.info "DEBUG: Rate limit for #{endpoint}: #{limit} (base: #{base_limit})" if Rails.env.development?
      limit
    when 'test'
      limit = base_limit * 100 # Very lenient in tests
      Rails.logger.info "DEBUG: Rate limit for #{endpoint}: #{limit} (base: #{base_limit})" if Rails.env.development?
      limit
    else
      limit = base_limit
      Rails.logger.info "DEBUG: Rate limit for #{endpoint}: #{limit} (base: #{base_limit})" if Rails.env.development?
      limit
    end
  end

  # === AUTHENTICATION ENDPOINTS (STRICT) ===

  # Login attempts - 5 per minute per IP
  throttle('auth/login', limit: get_rate_limit(5, 'auth/login'), period: 1.minute) do |req|
    req.ip if req.path == '/api/auth/login' && req.post?
  end

  # OAuth callbacks - 10 per minute per IP
  throttle('auth/oauth', limit: get_rate_limit(10, 'auth/oauth'), period: 1.minute) do |req|
    req.ip if req.path.match?(/\/auth\/.*\/callback/) && req.get?
  end

  # Account deletion - 3 per hour per user
  throttle('auth/delete', limit: get_rate_limit(3, 'auth/delete'), period: 1.hour) do |req|
    user_id_from_jwt(req) if req.path == '/api/auth/me' && req.delete?
  end

  # Auth profile endpoint - 60 per minute per user (removed duplicate test throttle)
  throttle('auth/profile', limit: get_rate_limit(60, 'auth/profile'), period: 1.minute) do |req|
    if req.path == '/api/auth/profile' && req.get?
      user_id = user_id_from_jwt(req)
      Rails.logger.info "DEBUG: Profile throttle - user_id: #{user_id}, IP: #{req.ip}" if Rails.env.development?
      user_id
    end
  end

  # Auth me endpoint - 60 per minute per user
  throttle('auth/me', limit: get_rate_limit(60, 'auth/me'), period: 1.minute) do |req|
    user_id_from_jwt(req) if req.path == '/api/auth/me' && req.get?
  end

  # === FILE OPERATIONS (MODERATE) ===

  # File listing - 120 per minute per user
  throttle('files/list', limit: get_rate_limit(120, 'files/list'), period: 1.minute) do |req|
    user_id_from_jwt(req) if req.path == '/api/storage/files' && req.get?
  end

  # File upload presigning - 60 per minute per user
  throttle('files/upload_presign', limit: get_rate_limit(60, 'files/upload_presign'), period: 1.minute) do |req|
    user_id_from_jwt(req) if req.path == '/api/storage/presign_upload' && req.post?
  end

  # File download presigning - 200 per minute per user
  throttle('files/download_presign', limit: get_rate_limit(200, 'files/download_presign'), period: 1.minute) do |req|
    user_id_from_jwt(req) if req.path == '/api/storage/presign_download' && req.post?
  end

  # File deletion - 30 per minute per user
  throttle('files/delete', limit: get_rate_limit(30, 'files/delete'), period: 1.minute) do |req|
    user_id_from_jwt(req) if req.path == '/api/storage/files' && req.delete?
  end

  # File rename - 60 per minute per user
  throttle('files/rename', limit: get_rate_limit(60, 'files/rename'), period: 1.minute) do |req|
    user_id_from_jwt(req) if req.path == '/api/storage/rename_file' && req.post?
  end

  # === UPLOAD OPERATIONS (GENEROUS) ===

  # Multipart upload start - 100 per minute per user
  throttle('upload/start', limit: get_rate_limit(100, 'upload/start'), period: 1.minute) do |req|
    user_id_from_jwt(req) if req.path == '/api/storage/start_upload' && req.post?
  end

  # Chunk presigning - 500 per minute per user
  throttle('upload/chunk', limit: get_rate_limit(500, 'upload/chunk'), period: 1.minute) do |req|
    user_id_from_jwt(req) if req.path == '/api/storage/presign_chunk' && req.post?
  end

  # Upload completion - 60 per minute per user
  throttle('upload/complete', limit: get_rate_limit(60, 'upload/complete'), period: 1.minute) do |req|
    user_id_from_jwt(req) if req.path == '/api/storage/complete_upload' && req.post?
  end

  # === SHARE LINK OPERATIONS ===

  # Create share links - 50 per minute per user
  throttle('shares/create', limit: get_rate_limit(50, 'shares/create'), period: 1.minute) do |req|
    user_id_from_jwt(req) if req.path == '/api/storage/share_link' && req.post?
  end

  # List share links - 100 per minute per user
  throttle('shares/list', limit: get_rate_limit(100, 'shares/list'), period: 1.minute) do |req|
    user_id_from_jwt(req) if req.path == '/api/storage/share_links' && req.get?
  end

  # Revoke share links - 30 per minute per user
  throttle('shares/revoke', limit: get_rate_limit(30, 'shares/revoke'), period: 1.minute) do |req|
    user_id_from_jwt(req) if req.path == '/api/storage/revoke_share_link' && req.post?
  end

  # Update share links - 50 per minute per user
  throttle('shares/update', limit: get_rate_limit(50, 'shares/update'), period: 1.minute) do |req|
    user_id_from_jwt(req) if req.path.match?(/\/api\/storage\/share_links\/\d+/) && req.patch?
  end

  # === CREDENTIAL MANAGEMENT (STRICT) ===

  # Create credentials - 10 per hour per user
  throttle('credentials/create', limit: get_rate_limit(10, 'credentials/create'), period: 1.hour) do |req|
    user_id_from_jwt(req) if req.path == '/api/storage/credentials' && req.post?
  end

  # Update credentials - 20 per hour per user
  throttle('credentials/update', limit: get_rate_limit(20, 'credentials/update'), period: 1.hour) do |req|
    user_id_from_jwt(req) if req.path.match?(/\/api\/storage\/credentials\/\d+/) && (req.put? || req.patch?)
  end

  # Delete credentials - 10 per hour per user
  throttle('credentials/delete', limit: get_rate_limit(10, 'credentials/delete'), period: 1.hour) do |req|
    user_id_from_jwt(req) if req.path.match?(/\/api\/storage\/credentials\/\d+/) && req.delete?
  end

  # Validate credentials - 20 per hour per user
  throttle('credentials/validate', limit: get_rate_limit(20, 'credentials/validate'), period: 1.hour) do |req|
    user_id_from_jwt(req) if req.path == '/api/storage/credentials/validate' && req.post?
  end

  # === FOLDER OPERATIONS ===

  # Create folders - 50 per minute per user
  throttle('folders/create', limit: get_rate_limit(50, 'folders/create'), period: 1.minute) do |req|
    user_id_from_jwt(req) if req.path == '/api/storage/create_folder' && req.post?
  end

  # Delete folders - 50 per minute per user
  throttle('folders/delete', limit: get_rate_limit(50, 'folders/delete'), period: 1.minute) do |req|
    user_id_from_jwt(req) if req.path == '/api/storage/delete_folder' && req.delete?
  end

  # === BULK OPERATIONS ===

  # Move files - 30 per minute per user
  throttle('bulk/move_files', limit: get_rate_limit(30, 'bulk/move_files'), period: 1.minute) do |req|
    user_id_from_jwt(req) if req.path == '/api/storage/move_files' && req.post?
  end

  # Copy files - 30 per minute per user
  throttle('bulk/copy_files', limit: get_rate_limit(30, 'bulk/copy_files'), period: 1.minute) do |req|
    user_id_from_jwt(req) if req.path == '/api/storage/copy_files' && req.post?
  end

  # === GENERAL API PROTECTION ===

  # General API protection for unauthenticated requests - 200 per minute per IP
  throttle('api/general', limit: get_rate_limit(200, 'api/general'), period: 1.minute) do |req|
    req.ip if req.path.start_with?('/api/') && !user_id_from_jwt(req)
  end

  # === RESPONSE CONFIGURATION ===

  # Custom response for rate limited requests
  self.throttled_responder = lambda do |env|
    Rails.logger.info "RATE LIMIT TRIGGERED!" if Rails.env.development?
    [
      429,
      {
        'Content-Type' => 'application/json',
        'Retry-After' => '60'
      },
      [{
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.'
      }.to_json]
    ]
  end

  # === LOGGING ===

  # Log rate limiting events in development
  if Rails.env.development?
    ActiveSupport::Notifications.subscribe('rack.attack') do |name, start, finish, request_id, payload|
      Rails.logger.info "Rate limiting event: #{name}"
    end
  end
end 