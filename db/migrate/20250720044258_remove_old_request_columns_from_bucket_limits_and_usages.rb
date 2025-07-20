class RemoveOldRequestColumnsFromBucketLimitsAndUsages < ActiveRecord::Migration[8.0]
  def change
    # Remove old columns from bucket_limits table
    remove_column :bucket_limits, :max_requests_per_month

    # Remove old columns from bucket_usages table
    remove_column :bucket_usages, :requests_made
  end
end
