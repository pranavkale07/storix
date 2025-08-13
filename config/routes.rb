Rails.application.routes.draw do
  get "home/index"
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  root "home#index"

  # OAuth routes
  #get "/auth/:provider/callback", to: "oauth#callback", as: :oauth_callback
  #get "/auth/failure", to: "oauth#failure", as: :oauth_failure

  # Test route for session debugging
  get "/test/session", to: "test#session_test"

  # API routes
  namespace :api do
    # Authentication routes
    namespace :auth do
      get "me", to: "auth#me"
      delete "me", to: "auth#destroy"
      post "active_credential", to: "auth#active_credential"
      get "profile", to: "auth#profile"
    end

    # Bucket usage routes
    get "bucket_usage/:credential_id/stats", to: "bucket_usage#stats"
    get "bucket_usage/:credential_id/limits", to: "bucket_usage#get_limits"
    post "bucket_usage/:credential_id/limits", to: "bucket_usage#update_limits"

    # Storage routes
    namespace :storage do
      post "credentials", to: "storage#create_credential"
      post "start_upload", to: "storage#start_upload"
      post "presign_chunk", to: "storage#presign_chunk"
      post "complete_upload", to: "storage#complete_upload"
      get "files", to: "storage#list_files"
      delete "files", to: "storage#delete_file"
      post "presign_upload", to: "storage#presign_upload"
      post "presign_download", to: "storage#presign_download"
      post "rename_file", to: "storage#rename_file"
      delete "credentials/:id", to: "storage#destroy_credential"
      post "create_folder", to: "storage#create_folder"
      post "delete_folder", to: "storage#delete_folder"
      post "share_link", to: "storage#share_link"
      get "share_links", to: "storage#share_links"
      post "revoke_share_link", to: "storage#revoke_share_link"
      get "usage", to: "storage#usage"
      if Rails.env.development?
        post "dev_upload", to: "storage#dev_upload"
      end
      get "credentials", to: "storage#list_credentials"
      get "credentials/:id", to: "storage#show_credential"
      put "credentials/:id", to: "storage#update_credential"
      patch "credentials/:id", to: "storage#update_credential"
      post "move_files", to: "storage#move_files"
      post "copy_files", to: "storage#copy_files"
      post "move_folders", to: "storage#move_folders"
      post "copy_folders", to: "storage#copy_folders"
      post "credentials/validate", to: "storage#validate_credential"
      patch "/share_links/:id", to: "storage#update_share_link"
      delete "share_links/:id", to: "storage#destroy_share_link"
    end
  end

  get "share_links/:token", to: "share_links#show", as: :share_link

  # Route OmniAuth callback to custom controller for known providers only (must come before dummy route)
  match "/auth/:provider/callback", to: "oauth#callback", via: [:get, :post], constraints: { provider: /google_oauth2|github/ }
  # Allow OmniAuth middleware to handle these provider paths only
  match "/auth/:provider", to: proc { [404, {}, ['Not Found']] }, via: :all, constraints: { provider: /google_oauth2|github/ }

  # Serve React app for all unmatched routes (except for /api and /rails paths) Serve React app for all unmatched routes (except for /api, /rails, and /auth paths)
  get "*path", to: "home#index", constraints: lambda { |req|
    !req.xhr? &&
    req.format.html? &&
    !req.path.start_with?("/rails/") &&
    !req.path.start_with?("/api/") &&
    !req.path.match?(/^\/auth\/(google_oauth2|github)/)
  }
end
