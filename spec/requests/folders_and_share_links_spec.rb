require 'rails_helper'
require 'tempfile'

REAL_S3 = ENV['AK'] && ENV['SK']
BUCKET = ENV['BUCKET']

RSpec.describe 'Folder and Share Link Operations (Real S3)', type: :request, if: REAL_S3 do
  let(:user) { create(:user) }
  let(:folder_name) { "test_folder_#{SecureRandom.hex(4)}" }
  let(:folder_prefix) { "#{folder_name}/" }
  let(:filename) { "#{folder_prefix}test_file_#{SecureRandom.hex(4)}.txt" }
  let(:file_content) { "Hello, Folder & ShareLink! #{Time.now}" }
  let(:upload_params) do
    {
      key: filename,
      content_type: 'text/plain'
    }
  end

  it 'performs folder and share link operations with real S3' do
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

    # 2. Create a folder
    post '/api/storage/create_folder', params: { prefix: folder_prefix }.to_json, headers: active_headers
    expect(response).to have_http_status(:ok)

    # 3. List files/folders to verify folder exists
    get '/api/storage/files', params: { prefix: '' }, headers: active_headers
    expect(response).to have_http_status(:ok)
    folders = JSON.parse(response.body)['folders']
    expect(folders.map { |f| f['prefix'] }).to include(folder_prefix)

    # 4. Upload a file to the folder
    post '/api/storage/presign_upload', params: upload_params.to_json, headers: active_headers
    expect(response).to have_http_status(:ok)
    url = JSON.parse(response.body)['presigned_url']
    resp = Faraday.put(url, file_content, 'Content-Type' => 'text/plain')
    expect(resp.status).to eq(200)

    # 5. List files in folder to verify file exists
    get '/api/storage/files', params: { prefix: folder_prefix }, headers: active_headers
    expect(response).to have_http_status(:ok)
    files = JSON.parse(response.body)['files']
    expect(files.map { |f| f['key'] }).to include(filename)

    # 6. Create a share link for the file
    post '/api/storage/share_link', params: { key: filename, expires_in: 600 }.to_json, headers: active_headers
    expect(response).to have_http_status(:ok)
    share_link = JSON.parse(response.body)['share_link']
    expect(share_link['token']).to be_present
    token = share_link['token']

    # 7. Access the file via the public share link endpoint
    get "/share_links/#{token}"
    expect(response).to have_http_status(302) # Should redirect to S3 presigned URL
    expect(response.headers['Location']).to match(%r{^https://})

    # 8. Revoke the share link
    post '/api/storage/revoke_share_link', params: { id: share_link['id'] }.to_json, headers: active_headers
    expect(response).to have_http_status(:ok)

    # 9. Access the file via the public share link endpoint (should be denied)
    get "/share_links/#{token}"
    expect(response).to have_http_status(:not_found).or have_http_status(:gone)

    # 10. Delete the file
    delete '/api/storage/files', params: { key: filename }.to_json, headers: active_headers
    expect(response).to have_http_status(:ok)

    # 11. Delete the folder
    post '/api/storage/delete_folder', params: { prefix: folder_prefix }.to_json, headers: active_headers
    expect(response).to have_http_status(:ok)
  end
end
