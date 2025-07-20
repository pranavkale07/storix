class BucketUsageStatsJob < ApplicationJob
  queue_as :default

  def perform
    Rails.logger.info "Bucket Usage Statistics at #{Time.current}"
    Rails.logger.info "=" * 50

    # Get all users with bucket limits
    users_with_limits = BucketLimit.includes(:user).distinct.pluck(:user_id)

    users_with_limits.each do |user_id|
      user = User.find(user_id)
      Rails.logger.info "User: #{user.email}"

      # Get all buckets for this user
      buckets = BucketLimit.where(user: user).pluck(:bucket_name)

      buckets.each do |bucket_name|
        begin
          stats = BucketUsageService.get_combined_usage_stats(user, bucket_name)
          Rails.logger.info "  Bucket: #{bucket_name}"
          Rails.logger.info "    Write: #{stats[:write][:used]}/#{stats[:write][:limit]} (#{stats[:write][:percentage_used]}%)"
          Rails.logger.info "    Read:  #{stats[:read][:used]}/#{stats[:read][:limit]} (#{stats[:read][:percentage_used]}%)"
          Rails.logger.info "    Total: #{stats[:total_used]}/#{stats[:total_limit]}"
        rescue => e
          Rails.logger.error "  Bucket: #{bucket_name} - Error: #{e.message}"
        end
      end
    end

    Rails.logger.info "=" * 50
  end
end
