require "aws-sdk-s3"

class S3ClientBuilder
  def initialize(storage_credential)
    @storage_credential = storage_credential
  end

  def client
    Aws::S3::Client.new(client_config)
  end

  def resource
    Aws::S3::Resource.new(client: client)
  end

  private

  attr_reader :storage_credential

  def client_config
    config = {
      region: storage_credential.region,
      credentials: Aws::Credentials.new(
        storage_credential.access_key_id,
        storage_credential.secret_access_key
      )
    }

    if storage_credential.provider == "do_spaces"
      # Use provided endpoint or default to DigitalOcean Spaces endpoint
      config[:endpoint] = storage_credential.endpoint.presence || "https://#{storage_credential.region}.digitaloceanspaces.com"
      config[:force_path_style] = true
    end
    # For AWS S3, do not set endpoint (let SDK use default)

    config
  end
end
