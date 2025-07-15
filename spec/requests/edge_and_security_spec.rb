require 'rails_helper'
require 'tempfile'

REAL_S3 = ENV['AK'] && ENV['SK']
BUCKET = ENV['BUCKET']

RSpec.describe 'Edge Cases and Security (Real S3)', type: :request, if: REAL_S3 do
  let(:user) { create(:user) }
  let(:other_user) { create(:user) }
  let(:filename) { "edge_file_#{SecureRandom.hex(4)}.txt" }
  let(:file_content) { "EdgeTest #{Time.now}" }

  it 'prevents file operations with invalid credentials' do
    # Use invalid S3 keys
    token = JwtService.encode(user)
    headers = { 'Authorization' => "Bearer #{token}", 'Content-Type' => 'application/json' }
    credential_params = {
      storage_credential: {
        access_key_id: 'INVALID',
        secret_access_key: 'INVALID',
        region: 'ap-south-1',
        bucket: BUCKET,
        provider: 's3'
      }
    }
    post '/api/storage/credentials', params: credential_params.to_json, headers: headers
    expect(response).to have_http_status(:unprocessable_entity)
    expect(JSON.parse(response.body)['errors']).to be_present
  end

  it 'denies access to share link after expiry' do
    # Create real credential and upload file
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
    # Upload file
    post '/api/storage/presign_upload', params: { key: filename, content_type: 'text/plain' }.to_json, headers: active_headers
    url = JSON.parse(response.body)['presigned_url']
    Faraday.put(url, file_content, 'Content-Type' => 'text/plain')
    # Create share link with short expiry
    post '/api/storage/share_link', params: { key: filename, expires_in: 1 }.to_json, headers: active_headers
    expect(response).to have_http_status(:ok)
    share_link = JSON.parse(response.body)['share_link']
    token = share_link['token']
    # Wait for expiry
    sleep 2
    get "/share_links/#{token}"
    expect(response).to have_http_status(:gone).or have_http_status(:not_found)
    # Clean up
    delete '/api/storage/files', params: { key: filename }.to_json, headers: active_headers
  end

  it 'prevents access to another user\'s resources' do
    # User 1 creates credential and file
    token1 = JwtService.encode(user)
    headers1 = { 'Authorization' => "Bearer #{token1}", 'Content-Type' => 'application/json' }
    credential_params = {
      storage_credential: {
        access_key_id: ENV['AK'],
        secret_access_key: ENV['SK'],
        region: 'ap-south-1',
        bucket: BUCKET,
        provider: 's3'
      }
    }
    post '/api/storage/credentials', params: credential_params.to_json, headers: headers1
    json = JSON.parse(response.body)
    token1 = json['token']
    headers1 = { 'Authorization' => "Bearer #{token1}", 'Content-Type' => 'application/json' }
    post '/api/storage/presign_upload', params: { key: filename, content_type: 'text/plain' }.to_json, headers: headers1
    url = JSON.parse(response.body)['presigned_url']
    Faraday.put(url, file_content, 'Content-Type' => 'text/plain')
    # User 2 tries to list files
    token2 = JwtService.encode(other_user)
    headers2 = { 'Authorization' => "Bearer #{token2}", 'Content-Type' => 'application/json' }
    get '/api/storage/files', headers: headers2
    expect(response).to have_http_status(:unprocessable_entity).or have_http_status(:ok)
    # User 2 tries to delete user 1's file
    delete '/api/storage/files', params: { key: filename }.to_json, headers: headers2
    expect(response).to have_http_status(:unprocessable_entity).or have_http_status(:not_found)
    # Clean up
    delete '/api/storage/files', params: { key: filename }.to_json, headers: headers1
  end

  it 'rejects tampered or expired JWTs' do
    token = JwtService.encode(user)
    tampered_token = token[0..-2] + (token[-1] == 'a' ? 'b' : 'a')
    headers = { 'Authorization' => "Bearer #{tampered_token}", 'Content-Type' => 'application/json' }
    get '/api/auth/me', headers: headers
    expect(response).to have_http_status(:unauthorized)
    # Expired token
    expired_token = JWT.encode({ user_id: user.id, exp: 1.hour.ago.to_i }, Rails.application.credentials.secret_key_base, 'HS256')
    headers = { 'Authorization' => "Bearer #{expired_token}", 'Content-Type' => 'application/json' }
    get '/api/auth/me', headers: headers
    expect(response).to have_http_status(:unauthorized)
  end
end 