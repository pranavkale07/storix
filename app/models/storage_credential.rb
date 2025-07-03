class StorageCredential < ApplicationRecord
  self.primary_key = :id
  belongs_to :user
  has_many :share_links, dependent: :destroy

  # Encrypt sensitive credentials using Rails 7+ encrypts
  encrypts :access_key_id
  encrypts :secret_access_key

  validates :access_key_id, presence: true
  validates :secret_access_key, presence: true
  validates :region, presence: true
  validates :bucket, presence: true
  validates :provider, presence: true, inclusion: { in: %w[s3 do_spaces] }

  # Custom validation for endpoint URL format, only if present
  validate :endpoint_format, if: -> { endpoint.present? }

  private

  def endpoint_format
    uri = URI.parse(endpoint)
    unless uri.is_a?(URI::HTTPS) || uri.is_a?(URI::HTTP)
      errors.add(:endpoint, "must be a valid HTTP or HTTPS URL")
    end
  rescue URI::InvalidURIError
    errors.add(:endpoint, "must be a valid URL")
  end
end
