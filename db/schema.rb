# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_07_20_044258) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "bucket_limits", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "bucket_name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "write_requests_per_month"
    t.integer "read_requests_per_month"
    t.index ["bucket_name"], name: "index_bucket_limits_on_bucket_name"
    t.index ["user_id", "bucket_name"], name: "index_bucket_limits_on_user_id_and_bucket_name", unique: true
    t.index ["user_id"], name: "index_bucket_limits_on_user_id"
  end

  create_table "bucket_usages", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "bucket_name"
    t.datetime "period_start"
    t.string "period_type"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "write_requests_count"
    t.integer "read_requests_count"
    t.index ["period_start"], name: "index_bucket_usages_on_period_start"
    t.index ["period_type"], name: "index_bucket_usages_on_period_type"
    t.index ["user_id", "bucket_name", "period_start", "period_type"], name: "index_bucket_usages_on_user_bucket_period", unique: true
    t.index ["user_id", "bucket_name"], name: "index_bucket_usages_on_user_id_and_bucket_name"
    t.index ["user_id"], name: "index_bucket_usages_on_user_id"
  end

  create_table "share_links", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.uuid "storage_credential_id", null: false
    t.string "key"
    t.datetime "expires_at"
    t.boolean "revoked", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "token", null: false
    t.index ["storage_credential_id"], name: "index_share_links_on_storage_credential_id"
    t.index ["token"], name: "index_share_links_on_token", unique: true
    t.index ["user_id"], name: "index_share_links_on_user_id"
  end

  create_table "storage_credentials", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "access_key_id"
    t.string "secret_access_key"
    t.string "region"
    t.string "endpoint"
    t.string "bucket"
    t.string "provider", default: "s3", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_storage_credentials_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email"
    t.string "password_digest"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "provider"
    t.string "uid"
    t.string "name"
    t.string "avatar_url"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["provider", "uid"], name: "index_users_on_provider_and_uid", unique: true
  end

  add_foreign_key "bucket_limits", "users"
  add_foreign_key "bucket_usages", "users"
  add_foreign_key "share_links", "storage_credentials", on_delete: :cascade
  add_foreign_key "share_links", "users"
  add_foreign_key "storage_credentials", "users"
end
