class ShareLinksController < ApplicationController
  skip_before_action :authenticate_user!
  def show
    begin
      share_link = ShareLink.find_by!(token: params[:token], revoked: false)
      if share_link.expired?
        render json: { error: "Share link expired" }, status: :gone
        return
      end

      storage_credential = share_link.storage_credential
      s3_client = S3ClientBuilder.new(storage_credential).client
      presigner = Aws::S3::Presigner.new(client: s3_client)

      # Calculate remaining time (in seconds) until share link expires
      if share_link.expires_at
        remaining = (share_link.expires_at - Time.current).to_i
        expires_in = [3600, remaining].min # 1 hour or less if less time remains
      else
        expires_in = 3600 # Default to 1 hour if no expiry
      end

      if expires_in <= 0
        render json: { error: "Share link expired" }, status: :gone
        return
      end

      url = presigner.presigned_url(
        :get_object,
        bucket: storage_credential.bucket,
        key: share_link.key,
        expires_in: expires_in
      )

      redirect_to url, allow_other_host: true
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Invalid or revoked share link" }, status: :not_found
    end
  end
end