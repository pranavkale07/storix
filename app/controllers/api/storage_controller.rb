class Api::StorageController < ApplicationController
  include BucketUsageTrackable
  
  before_action :authenticate_user!
  before_action :set_storage_credential, except: [ :create_credential ]
  before_action :track_request, except: [ :create_credential, :usage ]

  # POST /api/storage_credentials
  def create_credential
    @storage_credential = current_user.storage_credentials.build(storage_credential_params)

    if @storage_credential.save
      render json: {
        message: "Storage credentials created successfully",
        id: @storage_credential.id
      }, status: :created
    else
      render json: { errors: @storage_credential.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # POST /api/start_upload
  def start_upload
    begin
      s3_client = S3ClientBuilder.new(@storage_credential).client

      response = s3_client.create_multipart_upload(
        bucket: @storage_credential.bucket,
        key: params[:key],
        content_type: params[:content_type]
      )

      render json: {
        upload_id: response.upload_id,
        key: params[:key]
      }
    rescue Aws::S3::Errors::ServiceError => e
      render json: { error: "Failed to start upload: #{e.message}" }, status: :unprocessable_entity
    end
  end

  # POST /api/presign_chunk
  def presign_chunk
    begin
      s3_client = S3ClientBuilder.new(@storage_credential).client

      presigner = Aws::S3::Presigner.new(client: s3_client)

      url = presigner.presigned_url(
        :upload_part,
        bucket: @storage_credential.bucket,
        key: params[:key],
        upload_id: params[:upload_id],
        part_number: params[:part_number],
        expires_in: 3600 # 1 hour
      )

      render json: {
        presigned_url: url,
        part_number: params[:part_number]
      }
    rescue Aws::S3::Errors::ServiceError => e
      render json: { error: "Failed to generate presigned URL: #{e.message}" }, status: :unprocessable_entity
    end
  end

  # POST /api/complete_upload
  def complete_upload
    begin
      s3_client = S3ClientBuilder.new(@storage_credential).client

      # Transform parts array to AWS format
      parts = params[:parts].map do |part|
        {
          part_number: part[:part_number],
          etag: part[:etag]
        }
      end

      response = s3_client.complete_multipart_upload(
        bucket: @storage_credential.bucket,
        key: params[:key],
        upload_id: params[:upload_id],
        multipart_upload: { parts: parts }
      )

      render json: {
        message: "Upload completed successfully",
        location: response.location,
        etag: response.etag
      }
    rescue Aws::S3::Errors::ServiceError => e
      render json: { error: "Failed to complete upload: #{e.message}" }, status: :unprocessable_entity
    end
  end

  # GET /api/files
  def list_files
    begin
      s3_client = S3ClientBuilder.new(@storage_credential).client

      response = s3_client.list_objects_v2(
        bucket: @storage_credential.bucket,
        max_keys: 1000
      )

      files = response.contents.map do |object|
        {
          key: object.key,
          size: object.size,
          last_modified: object.last_modified,
          etag: object.etag
        }
      end

      # Filter by extension if filter_category is present
      if params[:filter_category].present?
        exts = params[:filter_category].split(",").map { |e| e.strip.downcase }
        files.select! do |file|
          ext = File.extname(file[:key]).delete(".").downcase
          exts.include?(ext)
        end
      end

      render json: { files: files }
    rescue Aws::S3::Errors::ServiceError => e
      render json: { error: "Failed to list files: #{e.message}" }, status: :unprocessable_entity
    end
  end

  # DELETE /api/files
  def delete_file
    begin
      s3_client = S3ClientBuilder.new(@storage_credential).client

      s3_client.delete_object(
        bucket: @storage_credential.bucket,
        key: params[:key]
      )

      render json: { message: "File deleted successfully" }
    rescue Aws::S3::Errors::ServiceError => e
      render json: { error: "Failed to delete file: #{e.message}" }, status: :unprocessable_entity
    end
  end

  # GET /api/storage/usage - Add usage statistics endpoint
  def usage
    bucket_name = extract_bucket_name_from_credential
    stats = get_bucket_usage_stats(bucket_name)
    
    if stats
      render json: {
        bucket_name: bucket_name,
        stats: stats,
        timestamp: Time.current.iso8601
      }
    else
      render json: { error: 'No usage data available' }, status: :not_found
    end
  end

  private

  def set_storage_credential
    @storage_credential = current_user.storage_credentials.find(params[:credential_id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Storage credential not found" }, status: :not_found
  end

  def storage_credential_params
    params.require(:storage_credential).permit(:access_key_id, :secret_access_key, :region, :endpoint, :bucket)
  end

  # Automatically track requests based on action type
  def track_request
    track_request_by_action(action_name)
  end
end
