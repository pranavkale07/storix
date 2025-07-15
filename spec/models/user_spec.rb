require 'rails_helper'
require 'ostruct'

describe User, type: :model do
  subject { build(:user) }

  it { should validate_presence_of(:email) }
  it { should validate_uniqueness_of(:email) }
  it { should allow_value('test@example.com').for(:email) }
  it { should validate_presence_of(:provider) }
  it { should validate_inclusion_of(:provider).in_array(%w[google_oauth2 github]) }
  it { should validate_presence_of(:uid) }
  it { should validate_uniqueness_of(:uid).scoped_to(:provider) }

  describe '.from_oauth' do
    let(:auth) do
      OpenStruct.new(
        provider: 'google_oauth2',
        uid: '12345',
        info: OpenStruct.new(email: 'oauth@example.com', name: 'OAuth User', image: 'http://avatar.url'),
        extra: OpenStruct.new(raw_info: OpenStruct.new(avatar_url: 'http://avatar.url'))
      )
    end

    it 'creates a new user if none exists' do
      user = described_class.from_oauth(auth)
      expect(user.email).to eq('oauth@example.com')
      expect(user.provider).to eq('google_oauth2')
      expect(user.uid).to eq('12345')
      expect(user.name).to eq('OAuth User')
      expect(user.avatar_url).to eq('http://avatar.url')
    end

    it 'updates an existing user with same email' do
      existing = create(:user, email: 'oauth@example.com', provider: 'github', uid: 'old')
      user = described_class.from_oauth(auth)
      expect(user).to eq(existing)
      expect(user.provider).to eq('google_oauth2')
      expect(user.uid).to eq('12345')
      expect(user.name).to eq('OAuth User')
    end

    it 'updates name and avatar_url on login' do
      user = create(:user, provider: 'google_oauth2', uid: '12345', email: 'oauth@example.com', name: 'Old', avatar_url: 'old')
      auth.info.name = 'New Name'
      auth.info.image = 'http://new.avatar'
      result = described_class.from_oauth(auth)
      expect(result.name).to eq('New Name')
      expect(result.avatar_url).to eq('http://new.avatar')
    end
  end
end 