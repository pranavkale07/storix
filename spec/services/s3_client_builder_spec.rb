require 'rails_helper'

describe S3ClientBuilder do
  let(:user) { create(:user) }

  context 'AWS S3 provider' do
    let(:credential) { create(:storage_credential, user: user, provider: 's3', endpoint: nil) }

    it 'builds a client with correct region and credentials' do
      builder = described_class.new(credential)
      client = builder.client
      expect(client.config.region).to eq(credential.region)
      expect(client.config.credentials.access_key_id).to eq(credential.access_key_id)
      expect(client.config.credentials.secret_access_key).to eq(credential.secret_access_key)
      expect(client.config.endpoint.to_s).to eq('https://s3.amazonaws.com')
    end
  end

  context 'DigitalOcean Spaces provider' do
    let(:credential) { create(:storage_credential, user: user, provider: 'do_spaces', endpoint: 'https://nyc3.digitaloceanspaces.com') }

    it 'builds a client with custom endpoint and path style' do
      builder = described_class.new(credential)
      client = builder.client
      expect(client.config.endpoint.to_s).to eq('https://nyc3.digitaloceanspaces.com')
      expect(client.config.force_path_style).to be true
    end
  end
end
