FactoryBot.define do
  factory :share_link do
    association :user
    association :storage_credential
    key { "files/#{Faker::File.unique.file_name}" }
    expires_at { 1.day.from_now }
    revoked { false }
    token { SecureRandom.hex(16) }
  end
end 