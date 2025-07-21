class BucketUsageService
  class LimitExceededError < StandardError; end
  class RedisConnectionError < StandardError; end

  # Helper method to handle Redis operations with error handling
  def self.with_redis_error_handling
    yield
  rescue Redis::CannotConnectError, Redis::TimeoutError, Redis::ConnectionError => e
    Rails.logger.error "Redis connection error in BucketUsageService: #{e.message}"
    raise RedisConnectionError, "Redis connection failed: #{e.message}"
  rescue => e
    Rails.logger.error "Unexpected error in BucketUsageService: #{e.message}"
    raise e
  end

  # Check if user can make a write request (PUT, COPY, POST, LIST) to the bucket
  def self.check_write_limit(user, bucket_name)
    with_redis_error_handling do
      current_month = Time.current.strftime("%Y%m")
      redis_key = "user:#{user.id}:bucket:#{bucket_name}:month:#{current_month}:write"

      # Get user's write limit (Redis-cached)
      limit = get_user_write_limit(user, bucket_name)

      # Increment Redis counter
      current_count = $redis.incr(redis_key)
      $redis.expire(redis_key, 60.days.to_i) # Expire after 60 days

      # Check if limit exceeded
      if current_count > limit
        # Decrement back since we're rejecting
        $redis.decr(redis_key)
        raise LimitExceededError, "Monthly write limit exceeded for bucket '#{bucket_name}'. Limit: #{limit}, Used: #{current_count - 1}"
      end

      current_count
    end
  end

  # Check if user can make a read request (GET and others) to the bucket
  def self.check_read_limit(user, bucket_name)
    with_redis_error_handling do
      current_month = Time.current.strftime("%Y%m")
      redis_key = "user:#{user.id}:bucket:#{bucket_name}:month:#{current_month}:read"

      # Get user's read limit (Redis-cached)
      limit = get_user_read_limit(user, bucket_name)

      # Increment Redis counter
      current_count = $redis.incr(redis_key)
      $redis.expire(redis_key, 60.days.to_i) # Expire after 60 days

      # Check if limit exceeded
      if current_count > limit
        # Decrement back since we're rejecting
        $redis.decr(redis_key)
        raise LimitExceededError, "Monthly read limit exceeded for bucket '#{bucket_name}'. Limit: #{limit}, Used: #{current_count - 1}"
      end

      current_count
    end
  end

  # Get current month write usage from Redis
  def self.get_current_month_write_usage(user, bucket_name)
    with_redis_error_handling do
      current_month = Time.current.strftime("%Y%m")
      redis_key = "user:#{user.id}:bucket:#{bucket_name}:month:#{current_month}:write"

      count = $redis.get(redis_key)
      count ? count.to_i : 0
    end
  end

  # Get current month read usage from Redis
  def self.get_current_month_read_usage(user, bucket_name)
    with_redis_error_handling do
      current_month = Time.current.strftime("%Y%m")
      redis_key = "user:#{user.id}:bucket:#{bucket_name}:month:#{current_month}:read"

      count = $redis.get(redis_key)
      count ? count.to_i : 0
    end
  end

  # Get user's write limit for a bucket (with Redis caching)
  def self.get_user_write_limit(user, bucket_name)
    with_redis_error_handling do
      redis_key = "user:#{user.id}:bucket:#{bucket_name}:write_limit"

      # Try to get from Redis first
      cached_limit = $redis.get(redis_key)
      if cached_limit
        return cached_limit.to_i
      end

      # If not in Redis, get from database and cache it
      limit = BucketLimit.get_write_limit_for_user_and_bucket(user, bucket_name)
      $redis.set(redis_key, limit)
      $redis.expire(redis_key, 6.hour.to_i) # Cache for 6 hours

      limit
    end
  rescue RedisConnectionError => e
    # Fallback to database if Redis is down
    Rails.logger.warn "Redis unavailable for limit cache, using database: #{e.message}"
    BucketLimit.get_write_limit_for_user_and_bucket(user, bucket_name)
  end

  # Get user's read limit for a bucket (with Redis caching)
  def self.get_user_read_limit(user, bucket_name)
    with_redis_error_handling do
      redis_key = "user:#{user.id}:bucket:#{bucket_name}:read_limit"

      # Try to get from Redis first
      cached_limit = $redis.get(redis_key)
      if cached_limit
        return cached_limit.to_i
      end

      # If not in Redis, get from database and cache it
      limit = BucketLimit.get_read_limit_for_user_and_bucket(user, bucket_name)
      $redis.set(redis_key, limit)
      $redis.expire(redis_key, 1.hour.to_i) # Cache for 1 hour

      limit
    end
  rescue RedisConnectionError => e
    # Fallback to database if Redis is down
    Rails.logger.warn "Redis unavailable for limit cache, using database: #{e.message}"
    BucketLimit.get_read_limit_for_user_and_bucket(user, bucket_name)
  end

  # Sync Redis data to database for a specific month
  def self.sync_month_to_db(month)
    with_redis_error_handling do
      # Sync write requests
      sync_request_type_to_db(month, "write")
      # Sync read requests
      sync_request_type_to_db(month, "read")
    end
  end

  # Sync specific request type to database
  def self.sync_request_type_to_db(month, request_type)
    with_redis_error_handling do
      pattern = "user:*:bucket:*:month:#{month}:#{request_type}"

      $redis.scan_each(match: pattern) do |key|
        count = $redis.get(key).to_i
        next if count == 0 # Skip empty keys

        # Parse key: "user:2:bucket:my-bucket:month:202407:write"
        parts = key.split(":")
        user_id = parts[1]
        bucket_name = parts[3]

        # Find user
        user = User.find_by(id: user_id)
        next unless user

        # Create or update usage record
        period_start = Date.parse(month + "01").beginning_of_month
        usage = BucketUsage.find_or_create_for_user_bucket_period(
          user, bucket_name, period_start, "month"
        )

        # Update the appropriate count
        if request_type == "write"
          usage.update(write_requests_count: count)
        else
          usage.update(read_requests_count: count)
        end
      end
    end
  end

  # Reset Redis for new month
  def self.reset_redis_for_new_month
    with_redis_error_handling do
      pattern = "user:*:bucket:*:month:*"

      $redis.scan_each(match: pattern) do |key|
        $redis.del(key)
      end
    end
  end

  # Recover from Redis crash using database data
  def self.recover_from_redis_crash
    with_redis_error_handling do
      current_month = Time.current.strftime("%Y%m")
      period_start = Date.parse(current_month + "01").beginning_of_month

      # Get all usage records for current month
      BucketUsage.where(period_start: period_start, period_type: "month").each do |usage|
        # Recover write requests
        write_redis_key = "user:#{usage.user_id}:bucket:#{usage.bucket_name}:month:#{current_month}:write"
        $redis.set(write_redis_key, usage.write_requests_count)
        $redis.expire(write_redis_key, 60.days.to_i)

        # Recover read requests
        read_redis_key = "user:#{usage.user_id}:bucket:#{usage.bucket_name}:month:#{current_month}:read"
        $redis.set(read_redis_key, usage.read_requests_count)
        $redis.expire(read_redis_key, 60.days.to_i)
      end
    end
  end

  # Get write usage statistics for a user
  def self.get_write_usage_stats(user, bucket_name)
    limit = get_user_write_limit(user, bucket_name)
    current_usage = get_current_month_write_usage(user, bucket_name)

    {
      limit: limit,
      used: current_usage,
      remaining: [ limit - current_usage, 0 ].max,
      percentage_used: ((current_usage.to_f / limit) * 100).round(2)
    }
  rescue RedisConnectionError => e
    # Return fallback stats if Redis is down
    Rails.logger.warn "Redis unavailable, using fallback stats: #{e.message}"
    {
      limit: limit,
      used: 0,
      remaining: limit,
      percentage_used: 0.0
    }
  end

  # Get read usage statistics for a user
  def self.get_read_usage_stats(user, bucket_name)
    limit = get_user_read_limit(user, bucket_name)
    current_usage = get_current_month_read_usage(user, bucket_name)

    {
      limit: limit,
      used: current_usage,
      remaining: [ limit - current_usage, 0 ].max,
      percentage_used: ((current_usage.to_f / limit) * 100).round(2)
    }
  rescue RedisConnectionError => e
    # Return fallback stats if Redis is down
    Rails.logger.warn "Redis unavailable, using fallback stats: #{e.message}"
    {
      limit: limit,
      used: 0,
      remaining: limit,
      percentage_used: 0.0
    }
  end

  # Get combined usage statistics for a user
  def self.get_combined_usage_stats(user, bucket_name)
    write_stats = get_write_usage_stats(user, bucket_name)
    read_stats = get_read_usage_stats(user, bucket_name)

    {
      write: write_stats,
      read: read_stats,
      total_used: write_stats[:used] + read_stats[:used],
      total_limit: write_stats[:limit] + read_stats[:limit]
    }
  end

  # Invalidate limit cache for a user and bucket (call this when limits are updated)
  def self.invalidate_limit_cache(user, bucket_name)
    with_redis_error_handling do
      write_limit_key = "user:#{user.id}:bucket:#{bucket_name}:write_limit"
      read_limit_key = "user:#{user.id}:bucket:#{bucket_name}:read_limit"

      $redis.del(write_limit_key)
      $redis.del(read_limit_key)
    end
  end
end
