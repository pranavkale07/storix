require 'rails_helper'
require 'tempfile'

# Only run these tests if real S3 credentials are present
REAL_S3 = ENV['AK'] && ENV['SK']
BUCKET = ENV['BUCKET']

RSpec.describe 'File Operations (Real S3)', type: :request, if: REAL_S3 do
  let(:user) { create(:user) }
  let(:filename) { "test_file_#{SecureRandom.hex(4)}.txt" }
  let(:file_key) { filename }
  let(:file_content) { "Hello, Storix! #{Time.now}" }
  let(:upload_params) do
    {
      key: file_key,
      content_type: 'text/plain'
    }
  end

  it 'performs the full file flow with real S3' do
    # 1. Create storage credential
    token = JwtService.encode(user)
    headers = { 'Authorization' => "Bearer #{token}", 'Content-Type' => 'application/json' }
    credential_params = {
      storage_credential: {
        access_key_id: ENV['AK'],
        secret_access_key: ENV['SK'],
        region: 'ap-south-1',
        bucket: BUCKET,
        provider: 's3'
      }
    }
    post '/api/storage/credentials', params: credential_params.to_json, headers: headers
    expect(response).to have_http_status(:created)
    json = JSON.parse(response.body)
    active_token = json['token']
    active_headers = { 'Authorization' => "Bearer #{active_token}", 'Content-Type' => 'application/json' }

    # 2. List files (may be empty)
    get '/api/storage/files', headers: active_headers
    expect(response).to have_http_status(:ok)

    # 3. Upload a file using presign_upload
    post '/api/storage/presign_upload', params: upload_params.to_json, headers: active_headers
    expect(response).to have_http_status(:ok)
    url = JSON.parse(response.body)['presigned_url']
    resp = Faraday.put(url, file_content, 'Content-Type' => 'text/plain')
    expect(resp.status).to eq(200)

    # 4. List files (should include uploaded file)
    get '/api/storage/files', headers: active_headers
    expect(response).to have_http_status(:ok)
    files = JSON.parse(response.body)['files']
    expect(files.map { |f| f['key'] }).to include(file_key)

    # 5. Delete the uploaded file
    delete '/api/storage/files', params: { key: file_key }.to_json, headers: active_headers
    expect(response).to have_http_status(:ok)

    # 6. List files (should not include deleted file)
    get '/api/storage/files', headers: active_headers
    expect(response).to have_http_status(:ok)
    files = JSON.parse(response.body)['files']
    expect(files.map { |f| f['key'] }).not_to include(file_key)
  end
end 