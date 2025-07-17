require 'rails_helper'

describe ShareLink, type: :model do
  subject { build(:share_link) }

  it { should belong_to(:user) }
  it { should belong_to(:storage_credential) }
  it { should validate_presence_of(:key) }
  it { should validate_presence_of(:expires_at) }
  it { should validate_uniqueness_of(:token) }

  it 'generates a token on create' do
    link = build(:share_link, token: nil)
    link.valid?
    expect(link.token).to be_present
  end

  describe '#expired?' do
    it 'returns true if expires_at is in the past' do
      link = build(:share_link, expires_at: 1.hour.ago)
      expect(link).to be_expired
    end
    it 'returns false if expires_at is in the future' do
      link = build(:share_link, expires_at: 1.hour.from_now)
      expect(link).not_to be_expired
    end
  end
end
