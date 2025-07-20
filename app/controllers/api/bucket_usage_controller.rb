class Api::BucketUsageController < Api::BaseController
  include BucketUsageTrackable

  # GET /api/bucket_usage/:credential_id/stats
  def stats
    credential_id = params[:credential_id]
    user = current_user

    # Find the credential and verify ownership
    credential = user.storage_credentials.find_by(id: credential_id)
    unless credential
      render json: { error: "Credential not found" }, status: :not_found
      return
    end

    stats = get_bucket_usage_stats(credential.bucket)

    if stats
      render json: {
        credential_id: credential_id,
        bucket_name: credential.bucket,
        stats: stats,
        timestamp: Time.current.iso8601
      }
    else
      render json: { error: "Bucket not found or no limits set" }, status: :not_found
    end
  end

  # GET /api/bucket_usage/:credential_id/limits
  def get_limits
    credential_id = params[:credential_id]
    user = current_user

    # Find the credential and verify ownership
    credential = user.storage_credentials.find_by(id: credential_id)
    unless credential
      render json: { error: "Credential not found" }, status: :not_found
      return
    end

    # Find bucket limit for this user and bucket
    bucket_limit = BucketLimit.find_by(user: user, bucket_name: credential.bucket)

    if bucket_limit
      render json: {
        credential_id: credential_id,
        bucket_name: credential.bucket,
        limits: {
          write_requests_per_month: bucket_limit.write_requests_per_month,
          read_requests_per_month: bucket_limit.read_requests_per_month
        }
      }
    else
      # Return default limits if none set
      render json: {
        credential_id: credential_id,
        bucket_name: credential.bucket,
        limits: {
          write_requests_per_month: BucketLimit::DEFAULT_WRITE_REQUESTS_PER_MONTH,
          read_requests_per_month: BucketLimit::DEFAULT_READ_REQUESTS_PER_MONTH
        }
      }
    end
  end

  # POST /api/bucket_usage/:credential_id/limits
  def update_limits
    credential_id = params[:credential_id]
    user = current_user

    # Find the credential and verify ownership
    credential = user.storage_credentials.find_by(id: credential_id)
    unless credential
      render json: { error: "Credential not found" }, status: :not_found
      return
    end

    # Validate input parameters
    validation_errors = validate_limit_params(params)
    if validation_errors.any?
      render json: {
        error: "Invalid limit values",
        errors: validation_errors
      }, status: :unprocessable_entity
      return
    end

    # Find or create bucket limit
    bucket_limit = BucketLimit.find_or_create_for_user_and_bucket(user, credential.bucket)

    # Update limits if provided
    if params[:write_requests_per_month].present?
      # Handle unlimited (empty string or "unlimited")
      if params[:write_requests_per_month].to_s.strip.empty? ||
         params[:write_requests_per_month].to_s.downcase == "unlimited"
        bucket_limit.write_requests_per_month = nil
      else
        bucket_limit.write_requests_per_month = params[:write_requests_per_month].to_i
      end
    end

    if params[:read_requests_per_month].present?
      # Handle unlimited (empty string or "unlimited")
      if params[:read_requests_per_month].to_s.strip.empty? ||
         params[:read_requests_per_month].to_s.downcase == "unlimited"
        bucket_limit.read_requests_per_month = nil
      else
        bucket_limit.read_requests_per_month = params[:read_requests_per_month].to_i
      end
    end

    if bucket_limit.save
      # Invalidate Redis cache for this user and bucket
      BucketUsageService.invalidate_limit_cache(user, credential.bucket)

      render json: {
        credential_id: credential_id,
        bucket_name: credential.bucket,
        limits: {
          write_requests_per_month: bucket_limit.write_requests_per_month,
          read_requests_per_month: bucket_limit.read_requests_per_month
        },
        message: "Limits updated successfully"
      }
    else
      render json: {
        error: "Failed to update limits",
        errors: bucket_limit.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # Example of how to track requests in your existing controllers
  def example_file_upload
    bucket_name = extract_bucket_name(request)

    # Track the write request before processing
    track_write_request(bucket_name)

    # Your existing file upload logic here
    # ...

    render json: { message: "File uploaded successfully" }
  end

  def example_file_download
    bucket_name = extract_bucket_name(request)

    # Track the read request before processing
    track_read_request(bucket_name)

    # Your existing file download logic here
    # ...

    render json: { message: "File download initiated" }
  end

  private

  # Validate limit parameters
  def validate_limit_params(params)
    errors = []

    # Validate write requests limit
    if params[:write_requests_per_month].present?
      write_limit = params[:write_requests_per_month].to_s.strip
      unless write_limit.empty? || write_limit.downcase == "unlimited"
        begin
          value = write_limit.to_i
          if value <= 0
            errors << "Write requests limit must be greater than 0 or leave empty for unlimited"
          elsif value > 2_147_483_647
            errors << "Write requests limit cannot exceed 2,147,483,647"
          end
        rescue ArgumentError, RangeError
          errors << "Write requests limit must be a valid number"
        end
      end
    end

    # Validate read requests limit
    if params[:read_requests_per_month].present?
      read_limit = params[:read_requests_per_month].to_s.strip
      unless read_limit.empty? || read_limit.downcase == "unlimited"
        begin
          value = read_limit.to_i
          if value <= 0
            errors << "Read requests limit must be greater than 0 or leave empty for unlimited"
          elsif value > 2_147_483_647
            errors << "Read requests limit cannot exceed 2,147,483,647"
          end
        rescue ArgumentError, RangeError
          errors << "Read requests limit must be a valid number"
        end
      end
    end

    errors
  end

  # Override the extract_bucket_name method for this controller
  def extract_bucket_name(request)
    params[:bucket_name]
  end
end
