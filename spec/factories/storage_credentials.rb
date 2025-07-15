FactoryBot.define do
  factory :storage_credential do
    association :user
    access_key_id { Faker::Alphanumeric.alphanumeric(number: 20) }
    secret_access_key { Faker::Alphanumeric.alphanumeric(number: 40) }
    region { 'us-east-1' }
    bucket { Faker::Internet.domain_word }
    provider { %w[s3 do_spaces].sample }
    endpoint { provider == 'do_spaces' ? "https://#{region}.digitaloceanspaces.com" : nil }
  end
end 