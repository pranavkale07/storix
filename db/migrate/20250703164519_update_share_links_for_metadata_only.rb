class UpdateShareLinksForMetadataOnly < ActiveRecord::Migration[8.0]
  def change
    # Remove presigned_url if it exists
    remove_column :share_links, :presigned_url, :string if column_exists?(:share_links, :presigned_url)

    # Add token if it doesn't exist
    unless column_exists?(:share_links, :token)
      add_column :share_links, :token, :string, null: false
      add_index :share_links, :token, unique: true
    end

    # Add expires_at if it doesn't exist
    add_column :share_links, :expires_at, :datetime unless column_exists?(:share_links, :expires_at)

    # Add revoked if it doesn't exist
    add_column :share_links, :revoked, :boolean, default: false unless column_exists?(:share_links, :revoked)
  end
end
