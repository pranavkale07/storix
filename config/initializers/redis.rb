# Redis configuration for BucketUsageService
# Always use Redis for bucket usage tracking

if ENV["REDIS_URL"].present?
  require "redis"

  # Configure Redis with better connection handling
  redis_config = {
    url: ENV["REDIS_URL"],
    timeout: 5,
    connect_timeout: 5,
    read_timeout: 5,
    write_timeout: 5,
    reconnect_attempts: 3
  }

  # Add SSL config if needed for Upstash
  if ENV["REDIS_URL"].include?("rediss://")
    redis_config[:ssl] = true
    redis_config[:ssl_params] = { verify_mode: OpenSSL::SSL::VERIFY_NONE }
  end

  $redis = Redis.new(redis_config)

  # Test the connection
  begin
    $redis.ping
    Rails.logger.info "DEBUG: Redis connection successful for BucketUsageService"
  rescue => e
    Rails.logger.error "DEBUG: Redis connection failed: #{e.message}"
    # Fallback to local Redis if Upstash fails
    $redis = Redis.new(host: "localhost", port: 6379, timeout: 5)
    Rails.logger.info "DEBUG: Fallback to local Redis for BucketUsageService"
  end
else
  # Fallback to local Redis if no REDIS_URL
  require "redis"
  $redis = Redis.new(host: "localhost", port: 6379, timeout: 5)
  Rails.logger.info "DEBUG: Using local Redis for BucketUsageService"
end
