class CreateShareLinks < ActiveRecord::Migration[8.0]
  def change
    create_table :share_links do |t|
      t.references :user, null: false, foreign_key: true
      t.references :storage_credential, null: false, foreign_key: true
      t.string :key
      t.string :presigned_url
      t.datetime :expires_at
      t.boolean :revoked, default: false, null: false

      t.timestamps
    end

    add_index :share_links, :presigned_url, unique: true
  end
end
