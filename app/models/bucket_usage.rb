class BucketUsage < ApplicationRecord
  belongs_to :user

  validates :bucket_name, presence: true
  validates :period_start, presence: true
  validates :period_type, presence: true, inclusion: { in: %w[month] }
  validates :write_requests_count, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :read_requests_count, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :bucket_name, uniqueness: { scope: [:user_id, :period_start, :period_type] }

  # Find or create usage record for a user, bucket, and period
  def self.find_or_create_for_user_bucket_period(user, bucket_name, period_start, period_type = 'month')
    find_or_create_by(
      user: user,
      bucket_name: bucket_name,
      period_start: period_start,
      period_type: period_type
    ) do |usage|
      usage.write_requests_count ||= 0
      usage.read_requests_count ||= 0
    end
  end

  # Get current month write usage for a user and bucket
  def self.get_current_month_write_usage(user, bucket_name)
    current_month_start = Time.current.beginning_of_month
    usage = find_by(
      user: user,
      bucket_name: bucket_name,
      period_start: current_month_start,
      period_type: 'month'
    )
    usage&.write_requests_count || 0
  end

  # Get current month read usage for a user and bucket
  def self.get_current_month_read_usage(user, bucket_name)
    current_month_start = Time.current.beginning_of_month
    usage = find_by(
      user: user,
      bucket_name: bucket_name,
      period_start: current_month_start,
      period_type: 'month'
    )
    usage&.read_requests_count || 0
  end

  # Update write usage count for current month
  def self.increment_current_month_write_usage(user, bucket_name)
    current_month_start = Time.current.beginning_of_month
    usage = find_or_create_for_user_bucket_period(user, bucket_name, current_month_start, 'month')
    usage.increment!(:write_requests_count)
    usage.write_requests_count
  end

  # Update read usage count for current month
  def self.increment_current_month_read_usage(user, bucket_name)
    current_month_start = Time.current.beginning_of_month
    usage = find_or_create_for_user_bucket_period(user, bucket_name, current_month_start, 'month')
    usage.increment!(:read_requests_count)
    usage.read_requests_count
  end

  # Get total usage (for backward compatibility)
  def total_requests_count
    write_requests_count + read_requests_count
  end

  # Check if write usage is available
  def write_usage_available?(limit)
    write_requests_count < limit.write_requests_per_month
  end

  # Check if read usage is available
  def read_usage_available?(limit)
    read_requests_count < limit.read_requests_per_month
  end
end 