class CascadeDeleteShareLinks < ActiveRecord::Migration[8.0]
  def change
    remove_foreign_key :share_links, :storage_credentials
    add_foreign_key :share_links, :storage_credentials, on_delete: :cascade
  end
end
