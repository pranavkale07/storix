require 'rails_helper'

describe JwtService do
  let(:user) { create(:user) }

  it 'encodes and decodes a token with user_id' do
    token = described_class.encode(user)
    payload = JWT.decode(token, Rails.application.credentials.secret_key_base, true, { algorithm: 'HS256' }).first
    expect(payload['user_id']).to eq(user.id)
  end

  it 'includes extra payload if provided' do
    token = described_class.encode(user, foo: 'bar')
    payload = JWT.decode(token, Rails.application.credentials.secret_key_base, true, { algorithm: 'HS256' }).first
    expect(payload['foo']).to eq('bar')
  end

  it 'sets expiry to 24 hours from now' do
    token = described_class.encode(user)
    payload = JWT.decode(token, Rails.application.credentials.secret_key_base, true, { algorithm: 'HS256' }).first
    expect(Time.at(payload['exp'])).to be_within(5).of(24.hours.from_now)
  end
end
