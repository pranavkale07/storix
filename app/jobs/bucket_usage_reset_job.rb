class BucketUsageResetJob < ApplicationJob
  queue_as :default

  def perform
    Rails.logger.info "Starting monthly bucket usage reset at #{Time.current}"
    
    begin
      if Time.current.day == 1
        # It's the 1st of the month - sync previous month and reset
        previous_month = 1.month.ago.strftime('%Y%m')
        Rails.logger.info "Syncing previous month (#{previous_month}) to database..."
        BucketUsageService.sync_month_to_db(previous_month)
        
        Rails.logger.info "Resetting Redis for new month..."
        BucketUsageService.reset_redis_for_new_month
        
        Rails.logger.info "✅ Monthly reset completed successfully"
      else
        Rails.logger.warn "⚠️  Monthly reset should only be run on the 1st of the month"
        Rails.logger.warn "Current day: #{Time.current.day}"
      end
    rescue => e
      Rails.logger.error "❌ Monthly reset failed: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      raise e
    end
  end
end 