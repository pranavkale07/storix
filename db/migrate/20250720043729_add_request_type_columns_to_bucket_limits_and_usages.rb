class AddRequestTypeColumnsToBucketLimitsAndUsages < ActiveRecord::Migration[8.0]
  def change
    # Add new columns to bucket_limits table
    add_column :bucket_limits, :write_requests_per_month, :integer
    add_column :bucket_limits, :read_requests_per_month, :integer

    # Add new columns to bucket_usages table
    add_column :bucket_usages, :write_requests_count, :integer
    add_column :bucket_usages, :read_requests_count, :integer
  end
end
