require 'rails_helper'
require 'tempfile'

REAL_S3 = ENV['AK'] && ENV['SK']
BUCKET = ENV['BUCKET']

RSpec.describe 'Bulk File and Folder Operations (Real S3)', type: :request, if: REAL_S3 do
  let(:user) { create(:user) }
  let(:src_folder) { "bulk_src_#{SecureRandom.hex(4)}/" }
  let(:dst_folder) { "bulk_dst_#{SecureRandom.hex(4)}/" }
  let(:move_folder) { "bulk_move_#{SecureRandom.hex(4)}/" }
  let(:file1) { "#{src_folder}file1.txt" }
  let(:file2) { "#{src_folder}file2.txt" }
  let(:file_content) { "BulkOpTest #{Time.now}" }

  it 'performs bulk file and folder operations with real S3' do
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

    # 2. Create source folder
    post '/api/storage/create_folder', params: { prefix: src_folder }.to_json, headers: active_headers
    expect(response).to have_http_status(:ok)

    # 3. Upload two files to source folder
    [file1, file2].each do |fname|
      post '/api/storage/presign_upload', params: { key: fname, content_type: 'text/plain' }.to_json, headers: active_headers
      expect(response).to have_http_status(:ok)
      url = JSON.parse(response.body)['presigned_url']
      resp = Faraday.put(url, file_content, 'Content-Type' => 'text/plain')
      expect(resp.status).to eq(200)
    end

    # 4. Bulk copy files to destination folder
    files_to_copy = [file1, file2].map { |f| { source_key: f, destination_key: f.sub(src_folder, dst_folder) } }
    post '/api/storage/copy_files', params: { files: files_to_copy }.to_json, headers: active_headers
    expect(response).to have_http_status(:ok)
    # Verify files exist in both src and dst
    get '/api/storage/files', params: { prefix: src_folder }, headers: active_headers
    src_files = JSON.parse(response.body)['files'].map { |f| f['key'] }
    expect(src_files).to include(file1, file2)
    get '/api/storage/files', params: { prefix: dst_folder }, headers: active_headers
    dst_files = JSON.parse(response.body)['files'].map { |f| f['key'] }
    expect(dst_files).to include(file1.sub(src_folder, dst_folder), file2.sub(src_folder, dst_folder))

    # 5. Bulk move files to move_folder
    files_to_move = [file1, file2].map { |f| { source_key: f, destination_key: f.sub(src_folder, move_folder) } }
    post '/api/storage/move_files', params: { files: files_to_move }.to_json, headers: active_headers
    expect(response).to have_http_status(:ok)
    # Verify files only in move_folder
    get '/api/storage/files', params: { prefix: move_folder }, headers: active_headers
    moved_files = JSON.parse(response.body)['files'].map { |f| f['key'] }
    expect(moved_files).to include(file1.sub(src_folder, move_folder), file2.sub(src_folder, move_folder))
    get '/api/storage/files', params: { prefix: src_folder }, headers: active_headers
    src_files = JSON.parse(response.body)['files'].map { |f| f['key'] }
    expect(src_files).to be_empty

    # 6. Bulk copy the move_folder to a new folder
    copy_folder = "bulk_copy_#{SecureRandom.hex(4)}/"
    post '/api/storage/copy_folders', params: { folders: [{ source_prefix: move_folder, destination_prefix: copy_folder }] }.to_json, headers: active_headers
    expect(response).to have_http_status(:ok)
    get '/api/storage/files', params: { prefix: copy_folder }, headers: active_headers
    copied_files = JSON.parse(response.body)['files'].map { |f| f['key'] }
    expect(copied_files).to include(file1.sub(src_folder, copy_folder), file2.sub(src_folder, copy_folder))

    # 7. Bulk move the copied folder to another folder
    move_folder2 = "bulk_move2_#{SecureRandom.hex(4)}/"
    post '/api/storage/move_folders', params: { folders: [{ source_prefix: copy_folder, destination_prefix: move_folder2 }] }.to_json, headers: active_headers
    expect(response).to have_http_status(:ok)
    get '/api/storage/files', params: { prefix: move_folder2 }, headers: active_headers
    moved2_files = JSON.parse(response.body)['files'].map { |f| f['key'] }
    expect(moved2_files).to include(file1.sub(src_folder, move_folder2), file2.sub(src_folder, move_folder2))
    get '/api/storage/files', params: { prefix: copy_folder }, headers: active_headers
    expect(JSON.parse(response.body)['files']).to be_empty

    # 8. Clean up: delete all test files and folders
    [src_folder, dst_folder, move_folder, move_folder2].each do |folder|
      post '/api/storage/delete_folder', params: { prefix: folder }.to_json, headers: active_headers
    end
  end
end 