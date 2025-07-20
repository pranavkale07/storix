class CreateBucketLimits < ActiveRecord::Migration[8.0]
  def change
    create_table :bucket_limits do |t|
      t.references :user, null: false, foreign_key: true
      t.string :bucket_name
      t.integer :max_requests_per_month

      t.timestamps
    end

    # Add unique index to prevent duplicate limits per user per bucket
    add_index :bucket_limits, [ :user_id, :bucket_name ], unique: true

    # Add index on bucket_name for queries
    add_index :bucket_limits, :bucket_name
  end
end
