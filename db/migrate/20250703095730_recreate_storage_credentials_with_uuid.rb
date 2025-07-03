class RecreateStorageCredentialsWithUuid < ActiveRecord::Migration[8.0]
  def change
    # Drop share_links first due to FK
    drop_table :share_links, if_exists: true
    drop_table :storage_credentials, if_exists: true
    
    create_table :storage_credentials, id: :uuid do |t|
      t.references :user, null: false, foreign_key: true, type: :bigint
      t.string :access_key_id
      t.string :secret_access_key
      t.string :region
      t.string :endpoint
      t.string :bucket
      t.string :provider, default: "s3", null: false
      t.timestamps
    end

    create_table :share_links do |t|
      t.references :user, null: false, foreign_key: true, type: :bigint
      t.uuid :storage_credential_id, null: false
      t.string :key
      t.string :presigned_url
      t.datetime :expires_at
      t.boolean :revoked, default: false, null: false
      t.timestamps
    end
    add_foreign_key :share_links, :storage_credentials, on_delete: :cascade
    add_index :share_links, :presigned_url, unique: true
    add_index :share_links, :storage_credential_id
  end
end
