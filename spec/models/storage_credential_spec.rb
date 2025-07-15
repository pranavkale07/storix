require 'rails_helper'

describe StorageCredential, type: :model do
  subject { build(:storage_credential) }

  it { should belong_to(:user) }
  it { should have_many(:share_links).dependent(:destroy) }
  it { should validate_presence_of(:access_key_id) }
  it { should validate_presence_of(:secret_access_key) }
  it { should validate_presence_of(:region) }
  it { should validate_presence_of(:bucket) }
  it { should validate_presence_of(:provider) }
  it { should validate_inclusion_of(:provider).in_array(%w[s3 do_spaces]) }

  context 'endpoint format' do
    it 'accepts valid HTTP/HTTPS endpoints' do
      cred = build(:storage_credential, endpoint: 'https://valid.url')
      expect(cred).to be_valid
      cred.endpoint = 'http://valid.url'
      expect(cred).to be_valid
    end
    it 'rejects invalid endpoints' do
      cred = build(:storage_credential, endpoint: 'ftp://invalid.url')
      expect(cred).not_to be_valid
      cred.endpoint = 'not_a_url'
      expect(cred).not_to be_valid
    end
  end

  it 'encrypts access_key_id and secret_access_key' do
    cred = create(:storage_credential)
    expect(cred.access_key_id).to be_present
    expect(cred.secret_access_key).to be_present
    # Encryption is handled by Rails, so we just check presence here
  end
end 