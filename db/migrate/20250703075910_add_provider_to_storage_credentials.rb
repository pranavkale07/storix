class AddProviderToStorageCredentials < ActiveRecord::Migration[8.0]
  def change
    add_column :storage_credentials, :provider, :string, default: 's3', null: false
  end
end
