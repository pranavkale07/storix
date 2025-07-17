FactoryBot.define do
  factory :user do
    email { Faker::Internet.unique.email }
    provider { %w[google_oauth2 github].sample }
    uid { Faker::Internet.uuid }
    name { Faker::Name.name }
    avatar_url { Faker::Avatar.image }
  end
end
