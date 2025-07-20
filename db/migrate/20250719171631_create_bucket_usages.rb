class CreateBucketUsages < ActiveRecord::Migration[8.0]
  def change
    create_table :bucket_usages do |t|
      t.references :user, null: false, foreign_key: true
      t.string :bucket_name
      t.datetime :period_start
      t.string :period_type
      t.integer :requests_made

      t.timestamps
    end

    # Add unique index to prevent duplicate usage records per user per bucket per period
    add_index :bucket_usages, [ :user_id, :bucket_name, :period_start, :period_type ],
              unique: true, name: 'index_bucket_usages_on_user_bucket_period'

    # Add indexes for common queries
    add_index :bucket_usages, [ :user_id, :bucket_name ]
    add_index :bucket_usages, :period_start
    add_index :bucket_usages, :period_type
  end
end
