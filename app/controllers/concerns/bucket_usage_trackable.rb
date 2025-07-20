module BucketUsageTrackable
  extend ActiveSupport::Concern

  included do
    rescue_from BucketUsageService::LimitExceededError, with: :handle_limit_exceeded
    rescue_from BucketUsageService::RedisConnectionError, with: :handle_redis_error
  end

  private

  # Track write request (PUT, COPY, POST, LIST operations)
  def track_write_request(bucket_name, count = 1)
    user = current_user
    return unless user && bucket_name

    begin
      # Increment by the specified count
      count.times do
        BucketUsageService.check_write_limit(user, bucket_name)
      end
      Rails.logger.info "Write request tracked #{count} times for user #{user.id}, bucket #{bucket_name}"
    rescue BucketUsageService::LimitExceededError => e
      Rails.logger.warn "Write limit exceeded: #{e.message}"
      raise e
    rescue BucketUsageService::RedisConnectionError => e
      Rails.logger.error "Redis error during write tracking: #{e.message}"
      # Continue without tracking if Redis is down
    end
  end

  # Track read request (GET and other operations)
  def track_read_request(bucket_name, count = 1)
    user = current_user
    return unless user && bucket_name

    begin
      # Increment by the specified count
      count.times do
        BucketUsageService.check_read_limit(user, bucket_name)
      end
      Rails.logger.info "Read request tracked #{count} times for user #{user.id}, bucket #{bucket_name}"
    rescue BucketUsageService::LimitExceededError => e
      Rails.logger.warn "Read limit exceeded: #{e.message}"
      raise e
    rescue BucketUsageService::RedisConnectionError => e
      Rails.logger.error "Redis error during read tracking: #{e.message}"
      # Continue without tracking if Redis is down
    end
  end

  # Get usage statistics for a bucket
  def get_bucket_usage_stats(bucket_name)
    user = current_user
    return nil unless user && bucket_name

    begin
      BucketUsageService.get_combined_usage_stats(user, bucket_name)
    rescue BucketUsageService::RedisConnectionError => e
      Rails.logger.error "Redis error getting usage stats: #{e.message}"
      # Return basic stats from database if Redis is down
      get_fallback_usage_stats(user, bucket_name)
    end
  end

  # Fallback method to get stats from database when Redis is down
  def get_fallback_usage_stats(user, bucket_name)
    current_month_start = Time.current.beginning_of_month
    usage = BucketUsage.find_by(
      user: user,
      bucket_name: bucket_name,
      period_start: current_month_start,
      period_type: "month"
    )

    limit = BucketLimit.find_by(user: user, bucket_name: bucket_name)
    return nil unless limit

    write_limit = limit.write_requests_per_month
    read_limit = limit.read_requests_per_month
    write_used = usage&.write_requests_count || 0
    read_used = usage&.read_requests_count || 0

    {
      write: {
        limit: write_limit,
        used: write_used,
        remaining: write_limit ? [ write_limit - write_used, 0 ].max : nil,
        percentage_used: write_limit ? ((write_used.to_f / write_limit) * 100).round(2) : 0.0
      },
      read: {
        limit: read_limit,
        used: read_used,
        remaining: read_limit ? [ read_limit - read_used, 0 ].max : nil,
        percentage_used: read_limit ? ((read_used.to_f / read_limit) * 100).round(2) : 0.0
      },
      total_used: write_used + read_used,
      total_limit: (write_limit || 0) + (read_limit || 0)
    }
  end

  # Handle limit exceeded errors
  def handle_limit_exceeded(exception)
    render json: {
      error: "Rate limit exceeded",
      message: exception.message,
      type: "bucket_usage_limit_exceeded"
    }, status: :too_many_requests
  end

  # Handle Redis connection errors
  def handle_redis_error(exception)
    Rails.logger.error "Redis connection error in controller: #{exception.message}"
    # Continue without tracking - don't block the request
    # You might want to return a warning in the response headers
    response.headers["X-Bucket-Tracking"] = "disabled"
  end

  # Helper method to determine request type and count based on action
  def classify_request_type_and_count(action_name)
    case action_name
    # Direct S3 operations - count as 1
    when "list_files", "create_folder", "delete_folder", "move_files", "copy_files", "move_folders", "copy_folders", "rename_file", "start_upload", "complete_upload", "delete_file"
      { type: classify_action_type(action_name), count: 1 }
    # Presigned URL operations - count as 2 (backend + assumed frontend usage)
    when "presign_upload", "presign_download", "presign_chunk"
      { type: classify_action_type(action_name), count: 2 }
    else
      { type: "read", count: 1 } # Default to read with count 1
    end
  end

  # Helper method to classify action type (write vs read)
  def classify_action_type(action_name)
    case action_name
    when "start_upload", "presign_chunk", "complete_upload", "delete_file", "create_folder", "delete_folder", "move_files", "copy_files", "move_folders", "copy_folders", "rename_file", "presign_upload"
      "write"
    when "list_files", "presign_download", "share_links", "list_credentials", "show_credential"
      "read"
    else
      "read" # Default to read for unknown actions
    end
  end

  # Helper method to extract bucket name from storage credential
  def extract_bucket_name_from_credential
    @storage_credential&.bucket
  end

  # Track request based on action type and count
  def track_request_by_action(action_name)
    bucket_name = extract_bucket_name_from_credential
    return unless bucket_name

    classification = classify_request_type_and_count(action_name)

    if classification[:type] == "write"
      track_write_request(bucket_name, classification[:count])
    else
      track_read_request(bucket_name, classification[:count])
    end
  end
end
