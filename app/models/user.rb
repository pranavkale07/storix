class User < ApplicationRecord
  has_many :storage_credentials, dependent: :destroy

  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :provider, presence: true, inclusion: { in: %w[google_oauth2 github] }
  validates :uid, presence: true, uniqueness: { scope: :provider }

  def self.from_oauth(auth)
    Rails.logger.info "OAuth data received: provider=#{auth.provider}, uid=#{auth.uid}, email=#{auth.info.email}, name=#{auth.info.name}"

    # First try to find by provider and uid
    user = find_or_initialize_by(provider: auth.provider, uid: auth.uid)

    if user.new_record?
      # If no user found by provider/uid, check if user exists with same email
      existing_user = find_by(email: auth.info.email)

      if existing_user
        Rails.logger.info "Found existing user with same email, updating OAuth info: email=#{existing_user.email}"
        # Update existing user with OAuth information
        existing_user.provider = auth.provider
        existing_user.uid = auth.uid
        existing_user.name = auth.info.name
        user = existing_user
      else
        # Create new user
        user.email = auth.info.email
        user.name = auth.info.name
        Rails.logger.info "Creating new user: email=#{user.email}, name=#{user.name}"
      end
    else
      Rails.logger.info "Found existing user: email=#{user.email}"
    end

    user
  end
end
