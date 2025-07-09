class Api::Storage::StorageController < ApplicationController
  before_action :authenticate_user!
  before_action :set_storage_credential, except: [:create_credential, :validate_credential, :list_credentials, :show_credential, :update_credential, :destroy_credential]
  
  # POST /api/storage_credentials
  def create_credential
    @storage_credential = current_user.storage_credentials.build(storage_credential_params)
    # Validate the credential before saving
    begin
      client = S3ClientBuilder.new(@storage_credential).client
      client.list_objects_v2(bucket: @storage_credential.bucket, max_keys: 1)
    rescue Aws::S3::Errors::InvalidAccessKeyId, Aws::S3::Errors::SignatureDoesNotMatch
      render json: { errors: ["Credential validation failed: Invalid access key or secret."] }, status: :unprocessable_entity
      return
    rescue Aws::S3::Errors::NoSuchBucket
      render json: { errors: ["Credential validation failed: The specified bucket does not exist."] }, status: :unprocessable_entity
      return
    rescue => e
      render json: { errors: ["Credential validation failed: Unable to connect to the storage provider."] }, status: :unprocessable_entity
      return
    end
    if @storage_credential.save
      # Generate a new token with this credential as active
      token = JwtService.encode(current_user, active_credential_id: @storage_credential.id)
      render json: {
        message: 'Storage credentials created successfully',
        id: @storage_credential.id,
        token: token,
        active_credential_id: @storage_credential.id
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
        message: 'Upload completed successfully',
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
      prefix = params[:prefix] || ""
      response = s3_client.list_objects_v2(
        bucket: @storage_credential.bucket,
        prefix: prefix,
        delimiter: "/",
        max_keys: 1000
      )

      folders = (response.common_prefixes || []).map do |cp|
        {
          name: cp.prefix.sub(prefix, '').chomp('/'),
          prefix: cp.prefix
        }
      end

      files = (response.contents || []).reject { |obj| obj.key == prefix }.map do |object|
        {
          key: object.key,
          size: object.size,
          last_modified: object.last_modified,
          etag: object.etag
        }
      end

      # Filtering by file extension
      if params[:filter_type].present?
        ext = params[:filter_type].downcase
        files = files.select { |f| File.extname(f[:key]).downcase == ".#{ext}" }
      end

      # Filtering by min/max size
      if params[:min_size].present?
        files = files.select { |f| f[:size] >= params[:min_size].to_i }
      end
      if params[:max_size].present?
        files = files.select { |f| f[:size] <= params[:max_size].to_i }
      end

      # Search by substring in key
      if params[:search].present?
        search = params[:search].downcase
        files = files.select { |f| f[:key].downcase.include?(search) }
      end

      # Sorting
      sort_by = params[:sort_by].presence_in(%w[key size last_modified]) || 'key'
      order = params[:order] == 'desc' ? -1 : 1
      files = files.sort_by { |f| f[sort_by.to_sym] }
      files.reverse! if order == -1

      render json: { folders: folders, files: files }
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
      
      render json: { message: 'File deleted successfully' }
    rescue Aws::S3::Errors::ServiceError => e
      render json: { error: "Failed to delete file: #{e.message}" }, status: :unprocessable_entity
    end
  end
  
  # POST /api/storage/presign_upload
  def presign_upload
    begin
      s3_client = S3ClientBuilder.new(@storage_credential).client
      presigner = Aws::S3::Presigner.new(client: s3_client)
      url = presigner.presigned_url(
        :put_object,
        bucket: @storage_credential.bucket,
        key: params[:key],
        content_type: params[:content_type],
        expires_in: 3600
      )
      render json: { presigned_url: url }
    rescue Aws::S3::Errors::ServiceError => e
      render json: { error: "Failed to generate presigned upload URL: #{e.message}" }, status: :unprocessable_entity
    end
  end

  # POST /api/storage/presign_download
  def presign_download
    begin
      s3_client = S3ClientBuilder.new(@storage_credential).client
      presigner = Aws::S3::Presigner.new(client: s3_client)
      expires_in = params[:expires_in].presence || 3600
      
      # Extract filename from the key for the Content-Disposition header
      filename = params[:key].split('/').last
      
      # Determine content disposition based on parameters
      disposition = params[:inline] == 'true' ? 'inline' : 'attachment'
      content_disposition = "#{disposition}; filename=\"#{filename}\""
      
      url = presigner.presigned_url(
        :get_object,
        bucket: @storage_credential.bucket,
        key: params[:key],
        expires_in: expires_in.to_i,
        response_content_disposition: content_disposition
      )
      render json: { presigned_url: url }
    rescue Aws::S3::Errors::ServiceError => e
      render json: { error: "Failed to generate presigned download URL: #{e.message}" }, status: :unprocessable_entity
    end
  end

  # POST /api/storage/rename_file
  def rename_file
    begin
      s3_client = S3ClientBuilder.new(@storage_credential).client
      source_key = params[:key]
      destination_key = params[:new_key]
      # Copy the object
      s3_client.copy_object(
        bucket: @storage_credential.bucket,
        copy_source: File.join(@storage_credential.bucket, source_key),
        key: destination_key
      )
      # Delete the original object
      s3_client.delete_object(
        bucket: @storage_credential.bucket,
        key: source_key
      )
      render json: { message: 'File renamed successfully' }
    rescue Aws::S3::Errors::ServiceError => e
      render json: { error: "Failed to rename file: #{e.message}" }, status: :unprocessable_entity
    end
  end
  
  # POST /api/storage/create_folder
  def create_folder
    begin
      s3_client = S3ClientBuilder.new(@storage_credential).client
      folder_key = params[:prefix].to_s.chomp('/') + '/'
      s3_client.put_object(
        bucket: @storage_credential.bucket,
        key: folder_key,
        body: ''
      )
      render json: { message: 'Folder created successfully' }
    rescue Aws::S3::Errors::ServiceError => e
      render json: { error: "Failed to create folder: #{e.message}" }, status: :unprocessable_entity
    end
  end

  # POST /api/storage/delete_folder
  def delete_folder
    begin
      s3_client = S3ClientBuilder.new(@storage_credential).client
      prefix = params[:prefix].to_s.chomp('/') + '/'
      objects = s3_client.list_objects_v2(
        bucket: @storage_credential.bucket,
        prefix: prefix
      ).contents
      if objects.empty?
        render json: { message: 'Folder is already empty or does not exist' }
        return
      end
      s3_client.delete_objects(
        bucket: @storage_credential.bucket,
        delete: {
          objects: objects.map { |obj| { key: obj.key } }
        }
      )
      render json: { message: 'Folder and its contents deleted successfully' }
    rescue Aws::S3::Errors::ServiceError => e
      render json: { error: "Failed to delete folder: #{e.message}" }, status: :unprocessable_entity
    end
  end
  
  # POST /api/storage/share_link
  def share_link
    expires_in = params[:expires_in].presence || 3600
    key = params[:key]
    begin
      # Generate presigned URL but do not store it
      s3_client = S3ClientBuilder.new(@storage_credential).client
      presigner = Aws::S3::Presigner.new(client: s3_client)
      # url = presigner.presigned_url(:get_object, bucket: @storage_credential.bucket, key: key, expires_in: expires_in.to_i)
      share_link = ShareLink.create!(
        user: current_user,
        storage_credential: @storage_credential,
        key: key,
        expires_at: Time.current + expires_in.to_i.seconds
      )
      render json: { share_link: share_link.slice(:id, :key, :token, :expires_at, :revoked) }
    rescue => e
      render json: { error: "Failed to create share link: #{e.message}" }, status: :unprocessable_entity
    end
  end

  # GET /api/storage/share_links
  def share_links
    links = ShareLink.where(user: current_user, storage_credential: @storage_credential).order(created_at: :desc)
    render json: {
      share_links: links.map { |l| {
        id: l.id,
        key: l.key,
        token: l.token,
        created_at: l.created_at,
        expires_at: l.expires_at,
        revoked: l.revoked,
        expired: l.expired?
      } }
    }
  end

  # POST /api/storage/revoke_share_link
  def revoke_share_link
    link = ShareLink.find_by(id: params[:id], user: current_user, storage_credential: @storage_credential)
    if link.nil?
      render json: { error: 'Share link not found' }, status: :not_found
    elsif link.revoked?
      render json: { error: 'Share link already revoked' }, status: :unprocessable_entity
    else
      link.update(revoked: true)
      render json: { message: 'Share link revoked', id: link.id }
    end
  end

  # DELETE /api/storage/share_links/:id
  def destroy_share_link
    link = ShareLink.find_by(id: params[:id], user: current_user, storage_credential: @storage_credential)
    if link.nil?
      render json: { error: 'Share link not found' }, status: :not_found
    else
      link.destroy
      render json: { message: 'Share link deleted', id: link.id }
    end
  end

  # GET /api/storage/usage
  def usage
    begin
      s3_client = S3ClientBuilder.new(@storage_credential).client
      total_size = 0
      file_count = 0
      continuation_token = nil
      loop do
        resp = s3_client.list_objects_v2(
          bucket: @storage_credential.bucket,
          continuation_token: continuation_token
        )
        files = resp.contents || []
        total_size += files.sum { |f| f.size }
        file_count += files.size
        break unless resp.is_truncated
        continuation_token = resp.next_continuation_token
      end
      render json: { total_size: total_size, file_count: file_count }
    rescue Aws::S3::Errors::ServiceError => e
      render json: { error: "Failed to get usage: #{e.message}" }, status: :unprocessable_entity
    end
  end
  
  # POST /api/storage/dev_upload
  if Rails.env.development?
    def dev_upload
      file = params[:file]
      key = params[:key]
      unless file && key
        render json: { error: 'file and key are required' }, status: :bad_request
        return
      end
      begin
        s3_client = S3ClientBuilder.new(@storage_credential).client
        s3_client.put_object(
          bucket: @storage_credential.bucket,
          key: key,
          body: file.respond_to?(:read) ? file.read : file,
          content_type: file.respond_to?(:content_type) ? file.content_type : 'application/octet-stream'
        )
        render json: { message: 'File uploaded successfully', key: key }
      rescue Aws::S3::Errors::ServiceError => e
        render json: { error: "Failed to upload file: #{e.message}" }, status: :unprocessable_entity
      end
    end
  end
  
  # GET /api/storage/credentials
  def list_credentials
    active_id = current_active_credential_id
    credentials = current_user.storage_credentials.select(:id, :provider, :bucket, :region, :endpoint, :created_at, :updated_at)
    render json: {
      credentials: credentials.map { |cred| cred.as_json.merge(active: cred.id == active_id) }
    }
  end

  # GET /api/storage/credentials/:id
  def show_credential
    credential = current_user.storage_credentials.find_by(id: params[:id])
    if credential
      render json: credential.slice(:id, :provider, :bucket, :region, :endpoint, :created_at, :updated_at)
    else
      render json: { error: 'Credential not found' }, status: :not_found
    end
  end

  # PUT/PATCH /api/storage/credentials/:id
  def update_credential
    credential = current_user.storage_credentials.find_by(id: params[:id])
    if credential.nil?
      render json: { error: 'Credential not found' }, status: :not_found
      return
    end
    # Validate the new attributes before updating
    new_attrs = storage_credential_params.to_h
    temp_credential = credential.dup
    temp_credential.assign_attributes(new_attrs)
    begin
      client = S3ClientBuilder.new(temp_credential).client
      client.list_objects_v2(bucket: temp_credential.bucket, max_keys: 1)
    rescue Aws::S3::Errors::InvalidAccessKeyId, Aws::S3::Errors::SignatureDoesNotMatch
      Rails.logger.error('Credential update validation failed: Invalid access key or secret.')
      render json: { errors: ['Credential validation failed: Invalid access key or secret.'] }, status: :unprocessable_entity
      return
    rescue Aws::S3::Errors::NoSuchBucket
      Rails.logger.error('Credential update validation failed: The specified bucket does not exist.')
      render json: { errors: ['Credential validation failed: The specified bucket does not exist.'] }, status: :unprocessable_entity
      return
    rescue Seahorse::Client::NetworkingError => e
      Rails.logger.error("Credential update validation Seahorse::Client::NetworkingError: #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}")
      render json: { errors: ['Credential validation failed: Unable to connect to the storage provider.'] }, status: :unprocessable_entity
      return
    rescue => e
      Rails.logger.error("Credential update validation generic rescue: #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}")
      render json: { errors: ['Credential validation failed: Unable to connect to the storage provider.'] }, status: :unprocessable_entity
      return
    end
    if credential.update(new_attrs)
      # Set as active and return new JWT
      token = JwtService.encode(current_user, active_credential_id: credential.id)
      render json: credential.slice(:id, :provider, :bucket, :region, :endpoint, :created_at, :updated_at).merge(token: token, active_credential_id: credential.id)
    else
      render json: { errors: credential.errors.full_messages }, status: :unprocessable_entity
    end
  end
  
  # POST /api/storage/move_files
  def move_files
    process_bulk_file_operation(:move)
  end

  # POST /api/storage/copy_files
  def copy_files
    process_bulk_file_operation(:copy)
  end

  # POST /api/storage/move_folders
  def move_folders
    process_bulk_folder_operation(:move)
  end

  # POST /api/storage/copy_folders
  def copy_folders
    process_bulk_folder_operation(:copy)
  end
  
  # DELETE /api/storage/credentials/:id
  def destroy_credential
    credential = current_user.storage_credentials.find_by(id: params[:id])
    if credential.nil?
      render json: { error: 'Credential not found' }, status: :not_found
      return
    end
    was_active = (credential.id.to_s == current_active_credential_id.to_s)
    credential.destroy!
    # If the deleted credential was active, update the JWT with a new active credential (if any)
    if was_active
      next_credential = current_user.storage_credentials.order(updated_at: :desc).first
      token = JwtService.encode(current_user, active_credential_id: next_credential&.id)
      render json: {
        message: 'Credential deleted',
        active_credential_id: next_credential&.id,
        token: token
      }
    else
      render json: { message: 'Credential deleted' }
    end
  end
  
  # POST /api/storage/credentials/validate
  def validate_credential
    cred_params = params.require(:storage_credential).permit(:provider, :access_key_id, :secret_access_key, :region, :bucket, :endpoint)
    credential = if params[:credential_id].present?
      current_user.storage_credentials.find_by(id: params[:credential_id])
    else
      StorageCredential.new(cred_params.merge(user: current_user))
    end
    unless credential
      render json: { error: 'Credential not found' }, status: :not_found
      return
    end
    begin
      client = S3ClientBuilder.new(credential).client
      # Try to list the bucket (limit 1)
      client.list_objects_v2(bucket: credential.bucket, max_keys: 1)
      render json: { valid: true, message: 'Credential is valid' }
    rescue Aws::S3::Errors::InvalidAccessKeyId, Aws::S3::Errors::SignatureDoesNotMatch
      Rails.logger.error('Credential validation failed: Invalid access key or secret.')
      render json: { valid: false, error: 'Credential validation failed: Invalid access key or secret.' }, status: :unprocessable_entity
    rescue Aws::S3::Errors::NoSuchBucket
      Rails.logger.error('Credential validation failed: The specified bucket does not exist.')
      render json: { valid: false, error: 'Credential validation failed: The specified bucket does not exist.' }, status: :unprocessable_entity
    rescue Seahorse::Client::NetworkingError => e
      Rails.logger.error("validate_credential Seahorse::Client::NetworkingError: #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}")
      render json: { valid: false, error: 'Credential validation failed: Unable to connect to the storage provider.' }, status: :unprocessable_entity
    rescue => e
      Rails.logger.error("validate_credential generic rescue: #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}")
      render json: { valid: false, error: 'Credential validation failed: Unable to connect to the storage provider.' }, status: :unprocessable_entity
    end
  end
  
  # PATCH /api/storage/share_links/:id
  def update_share_link
    link = ShareLink.find_by(id: params[:id], user: current_user, storage_credential: @storage_credential)
    unless link
      render json: { error: 'Share link not found' }, status: :not_found
      return
    end
    if params[:expires_at].present?
      link.expires_at = Time.parse(params[:expires_at]) rescue nil
    end
    if link.save
      render json: {
        id: link.id,
        key: link.key,
        created_at: link.created_at,
        expires_at: link.expires_at,
        revoked: link.revoked,
        expired: link.expired?
      }
    else
      render json: { error: link.errors.full_messages }, status: :unprocessable_entity
    end
  end
  
  private
  
  def set_storage_credential
    if current_active_credential_id.blank?
      render json: { error: 'No active storage credential set' }, status: :unprocessable_entity
      return
    end
    @storage_credential = current_user.storage_credentials.find_by(id: current_active_credential_id)
    if @storage_credential.nil?
      render json: { error: 'Active storage credential not found' }, status: :not_found
      return
    end
  end
  
  def storage_credential_params
    params.require(:storage_credential).permit(:access_key_id, :secret_access_key, :region, :endpoint, :bucket, :provider)
  end

  def process_bulk_file_operation(action)
    src_cred = find_credential_by_id(params[:source_credential_id]) || @storage_credential
    dst_cred = find_credential_by_id(params[:destination_credential_id]) || @storage_credential
    files = params[:files] || []
    results = files.map do |file|
      src_key = file[:source_key] || file["source_key"]
      dst_key = file[:destination_key] || file["destination_key"]
      begin
        src_client = S3ClientBuilder.new(src_cred).client
        dst_client = S3ClientBuilder.new(dst_cred).client
        # Copy
        src_bucket = src_cred.bucket
        dst_bucket = dst_cred.bucket
        src_client.copy_object(
          bucket: dst_bucket,
          copy_source: File.join("/", src_bucket, src_key),
          key: dst_key
        )
        # Move: delete original
        if action == :move
          src_client.delete_object(bucket: src_bucket, key: src_key)
        end
        { source_key: src_key, destination_key: dst_key, status: 'success' }
      rescue => e
        { source_key: src_key, destination_key: dst_key, status: 'error', error: e.message }
      end
    end
    render json: { results: results }
  end

  def process_bulk_folder_operation(action)
    src_cred = find_credential_by_id(params[:source_credential_id]) || @storage_credential
    dst_cred = find_credential_by_id(params[:destination_credential_id]) || @storage_credential
    folders = params[:folders] || []
    results = []
    folders.each do |folder|
      src_prefix = folder[:source_prefix] || folder["source_prefix"]
      dst_prefix = folder[:destination_prefix] || folder["destination_prefix"]
      begin
        src_client = S3ClientBuilder.new(src_cred).client
        dst_client = S3ClientBuilder.new(dst_cred).client
        src_bucket = src_cred.bucket
        dst_bucket = dst_cred.bucket
        # List all objects under the source prefix
        continuation_token = nil
        loop do
          resp = src_client.list_objects_v2(
            bucket: src_bucket,
            prefix: src_prefix,
            continuation_token: continuation_token
          )
          (resp.contents || []).each do |object|
            rel_key = object.key.sub(/^#{Regexp.escape(src_prefix)}/, "")
            dst_key = File.join(dst_prefix, rel_key)
            begin
              dst_client.copy_object(
                bucket: dst_bucket,
                copy_source: File.join("/", src_bucket, object.key),
                key: dst_key
              )
              src_client.delete_object(bucket: src_bucket, key: object.key) if action == :move
              results << { source_key: object.key, destination_key: dst_key, status: 'success' }
            rescue => e
              results << { source_key: object.key, destination_key: dst_key, status: 'error', error: e.message }
            end
          end
          break unless resp.is_truncated
          continuation_token = resp.next_continuation_token
        end
      rescue => e
        results << { source_prefix: src_prefix, destination_prefix: dst_prefix, status: 'error', error: e.message }
      end
    end
    render json: { results: results }
  end

  def find_credential_by_id(id)
    return nil if id.blank?
    current_user.storage_credentials.find_by(id: id)
  end

end
