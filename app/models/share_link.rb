class ShareLink < ApplicationRecord
  belongs_to :user
  belongs_to :storage_credential

  validates :key, :expires_at, presence: true
  validates :token, presence: true, uniqueness: true

  before_validation :generate_token, on: :create

  def expired?
    expires_at.present? && expires_at < Time.current
  end

  private

  def generate_token
    self.token ||= SecureRandom.hex(16)
  end
end
