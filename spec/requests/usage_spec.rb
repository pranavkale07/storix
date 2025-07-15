require 'rails_helper'
require 'tempfile'

REAL_S3 = ENV['AK'] && ENV['SK']
BUCKET = ENV['BUCKET']

RSpec.describe 'Usage Reporting (Real S3)', type: :request, if: REAL_S3 do
  let(:user) { create(:user) }
  let(:file1) { "usage_file1_#{SecureRandom.hex(4)}.txt" }
  let(:file2) { "usage_file2_#{SecureRandom.hex(4)}.txt" }
  let(:content1) { 'A' * 1234 }
  let(:content2) { 'B' * 4321 }

  it 'reports correct usage after file operations' do
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

    # 2. Upload two files
    [{ key: file1, content: content1 }, { key: file2, content: content2 }].each do |f|
      post '/api/storage/presign_upload', params: { key: f[:key], content_type: 'text/plain' }.to_json, headers: active_headers
      expect(response).to have_http_status(:ok)
      url = JSON.parse(response.body)['presigned_url']
      resp = Faraday.put(url, f[:content], 'Content-Type' => 'text/plain')
      expect(resp.status).to eq(200)
    end

    # 3. Call usage endpoint
    get '/api/storage/usage', headers: active_headers
    expect(response).to have_http_status(:ok)
    usage = JSON.parse(response.body)
    expect(usage['file_count']).to be >= 2
    expect(usage['total_size']).to be >= (content1.size + content2.size)

    # 4. Delete one file, check usage again
    delete '/api/storage/files', params: { key: file1 }.to_json, headers: active_headers
    expect(response).to have_http_status(:ok)
    get '/api/storage/usage', headers: active_headers
    usage2 = JSON.parse(response.body)
    expect(usage2['file_count']).to be >= 1
    expect(usage2['total_size']).to be >= content2.size

    # 5. Clean up
    delete '/api/storage/files', params: { key: file2 }.to_json, headers: active_headers
  end
end 