require 'rails_helper'
require 'ostruct'

describe 'StorageCredentials API', type: :request do
  let(:user) { create(:user) }
  let(:token) { JwtService.encode(user) }
  let(:headers) { { 'Authorization' => "Bearer #{token}", 'Content-Type' => 'application/json' } }

  describe 'POST /api/storage/credentials' do
    let(:params) do
      {
        storage_credential: {
          access_key_id: 'AKIAFAKEKEY',
          secret_access_key: 'FAKESECRETKEY',
          region: 'us-east-1',
          bucket: 'test-bucket',
          provider: 's3'
        }
      }
    end

    before do
      # Mock S3 validation for default tests
      allow_any_instance_of(S3ClientBuilder).to receive_message_chain(:client, :list_objects_v2).and_return(OpenStruct.new(contents: []))
    end

    it 'requires authentication' do
      post '/api/storage/credentials', params: params.to_json, headers: { 'Content-Type' => 'application/json' }
      expect(response).to have_http_status(:unauthorized)
    end

    it 'creates a storage credential with valid JWT' do
      post '/api/storage/credentials', params: params.to_json, headers: headers
      expect(response).to have_http_status(:created)
      expect(JSON.parse(response.body)).to include('id')
    end

    context 'real S3 integration', if: ENV['AK'] && ENV['SK'] do
      let(:params) do
        {
          storage_credential: {
            access_key_id: ENV['AK'],
            secret_access_key: ENV['SK'],
            region: 'ap-south-1',
            bucket: ENV['BUCKET'],
            provider: 's3'
          }
        }
      end

      it 'validates and creates a real S3 credential' do
        # Do NOT mock S3 here
        post '/api/storage/credentials', params: params.to_json, headers: headers
        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json['id']).to be_present
        expect(json['active_credential_id']).to eq(json['id'])
      end
    end
  end

  describe 'GET /api/storage/credentials' do
    before { create(:storage_credential, user: user) }

    it 'lists credentials for the user' do
      get '/api/storage/credentials', headers: headers
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)['credentials']).to be_an(Array)
    end
  end

  describe 'DELETE /api/storage/credentials/:id' do
    let!(:credential) { create(:storage_credential, user: user) }

    it 'deletes the credential' do
      delete "/api/storage/credentials/#{credential.id}", headers: headers
      expect(response).to have_http_status(:ok).or have_http_status(:no_content)
    end
  end
end
