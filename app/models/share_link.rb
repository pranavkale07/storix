class ShareLink < ApplicationRecord
  belongs_to :user
  belongs_to :storage_credential

  validates :key, :presigned_url, :expires_at, presence: true
end
