class BucketUsageRecoveryJob < ApplicationJob
  queue_as :default

  def perform
    Rails.logger.info "Starting Redis recovery at #{Time.current}"
    
    begin
      BucketUsageService.recover_from_redis_crash
      Rails.logger.info "✅ Redis recovery completed successfully"
    rescue => e
      Rails.logger.error "❌ Redis recovery failed: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      raise e
    end
  end
end 