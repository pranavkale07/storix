class CreateStorageCredentials < ActiveRecord::Migration[8.0]
  def change
    create_table :storage_credentials do |t|
      t.references :user, null: false, foreign_key: true
      t.string :access_key_id
      t.string :secret_access_key
      t.string :region
      t.string :endpoint
      t.string :bucket

      t.timestamps
    end
  end
end
