class BucketUsageSyncJob < ApplicationJob
  queue_as :default

  def perform
    Rails.logger.info "Starting BucketUsageSyncJob at #{Time.current}"

    begin
      if Time.current.day == 1
        # It's the 1st of the month - sync previous month and reset
        handle_monthly_reset
      else
        # Normal daily sync
        handle_daily_sync
      end

      Rails.logger.info "BucketUsageSyncJob completed successfully"
    rescue => e
      Rails.logger.error "BucketUsageSyncJob failed: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      raise e
    end
  end

  private

  def handle_monthly_reset
    Rails.logger.info "Performing monthly reset for #{Time.current.strftime('%Y-%m')}"

    # Sync previous month data to database
    previous_month = 1.month.ago.strftime("%Y%m")
    sync_month_to_db(previous_month)

    # Reset Redis for new month
    BucketUsageService.reset_redis_for_new_month

    Rails.logger.info "Monthly reset completed. Previous month (#{previous_month}) synced to DB, Redis reset for new month"
  end

  def handle_daily_sync
    Rails.logger.info "Performing daily sync for #{Time.current.strftime('%Y-%m-%d')}"

    # Sync current month data to database
    current_month = Time.current.strftime("%Y%m")
    sync_month_to_db(current_month)

    Rails.logger.info "Daily sync completed for month #{current_month}"
  end

  def sync_month_to_db(month)
    Rails.logger.info "Syncing month #{month} to database"

    # Sync write requests
    write_synced = sync_request_type_to_db(month, "write")

    # Sync read requests
    read_synced = sync_request_type_to_db(month, "read")

    # Count total synced records for logging
    period_start = Date.parse(month + "01").beginning_of_month
    total_synced = BucketUsage.where(period_start: period_start, period_type: "month").count

    Rails.logger.info "Synced #{total_synced} usage records for month #{month} (Write: #{write_synced}, Read: #{read_synced})"
  end

  def sync_request_type_to_db(month, request_type)
    Rails.logger.info "Syncing #{request_type} requests for month #{month}"

    synced_count = 0
    BucketUsageService.sync_request_type_to_db(month, request_type)

    # Count synced records for this request type
    period_start = Date.parse(month + "01").beginning_of_month
    if request_type == "write"
      synced_count = BucketUsage.where(period_start: period_start, period_type: "month")
                                .where("write_requests_count > 0").count
    else
      synced_count = BucketUsage.where(period_start: period_start, period_type: "month")
                                .where("read_requests_count > 0").count
    end

    Rails.logger.info "Synced #{synced_count} #{request_type} usage records for month #{month}"
    synced_count
  end
end
