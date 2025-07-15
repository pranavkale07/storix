require 'rails_helper'

describe 'Authentication', type: :request do
  let(:user) { create(:user) }
  let(:token) { JwtService.encode(user) }
  let(:headers) { { 'Authorization' => "Bearer #{token}" } }

  it 'rejects access without JWT' do
    get '/api/auth/me'
    expect(response).to have_http_status(:unauthorized)
  end

  it 'rejects access with invalid JWT' do
    get '/api/auth/me', headers: { 'Authorization' => 'Bearer invalid.token' }
    expect(response).to have_http_status(:unauthorized)
  end

  it 'allows access with valid JWT' do
    get '/api/auth/me', headers: headers
    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body)).to include('user' => hash_including('id' => user.id, 'email' => user.email))
  end
end 