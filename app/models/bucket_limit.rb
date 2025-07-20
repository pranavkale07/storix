class BucketLimit < ApplicationRecord
  belongs_to :user

  validates :bucket_name, presence: true
  validates :write_requests_per_month,
            numericality: {
              greater_than: 0,
              less_than: 2_147_483_647, # Max 32-bit integer
              only_integer: true,
              allow_nil: true,
              message: "must be between 1 and 2,147,483,647 or leave empty for unlimited"
            }
  validates :read_requests_per_month,
            numericality: {
              greater_than: 0,
              less_than: 2_147_483_647, # Max 32-bit integer
              only_integer: true,
              allow_nil: true,
              message: "must be between 1 and 2,147,483,647 or leave empty for unlimited"
            }
  validates :bucket_name, uniqueness: { scope: :user_id }

  # Default limits based on AWS free tier
  DEFAULT_WRITE_REQUESTS_PER_MONTH = 2000
  DEFAULT_READ_REQUESTS_PER_MONTH = 20000

  # Find or create a limit for a user and bucket
  def self.find_or_create_for_user_and_bucket(user, bucket_name)
    find_or_create_by(user: user, bucket_name: bucket_name) do |limit|
      limit.write_requests_per_month ||= DEFAULT_WRITE_REQUESTS_PER_MONTH
      limit.read_requests_per_month ||= DEFAULT_READ_REQUESTS_PER_MONTH
    end
  end

  # Get the write limit for a user and bucket
  def self.get_write_limit_for_user_and_bucket(user, bucket_name)
    limit = find_by(user: user, bucket_name: bucket_name)
    limit&.write_requests_per_month || DEFAULT_WRITE_REQUESTS_PER_MONTH
  end

  # Get the read limit for a user and bucket
  def self.get_read_limit_for_user_and_bucket(user, bucket_name)
    limit = find_by(user: user, bucket_name: bucket_name)
    limit&.read_requests_per_month || DEFAULT_READ_REQUESTS_PER_MONTH
  end

  # Get total limit (for backward compatibility)
  def total_requests_per_month
    write_requests_per_month + read_requests_per_month
  end

  # Check if user has exceeded write limit
  def write_limit_exceeded?(current_write_count)
    return false if write_requests_per_month.nil? # Unlimited
    current_write_count >= write_requests_per_month
  end

  # Check if user has exceeded read limit
  def read_limit_exceeded?(current_read_count)
    return false if read_requests_per_month.nil? # Unlimited
    current_read_count >= read_requests_per_month
  end
end
