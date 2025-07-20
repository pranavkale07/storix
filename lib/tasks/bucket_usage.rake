namespace :bucket_usage do
  desc "Sync bucket usage data from Redis to database"
  task sync: :environment do
    BucketUsageSyncJob.perform_now
  end

  desc "Reset Redis keys for new month (run on 1st of month)"
  task reset_monthly: :environment do
    BucketUsageResetJob.perform_now
  end

  desc "Recover from Redis crash using database data"
  task recover: :environment do
    BucketUsageRecoveryJob.perform_now
  end

  desc "Show current usage statistics"
  task stats: :environment do
    BucketUsageStatsJob.perform_now
  end
end 