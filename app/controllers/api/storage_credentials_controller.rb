module Api
  class StorageCredentialsController < Api::BaseController
    include JwtAuthenticatable

    def destroy
      credential = current_user.storage_credentials.find(params[:id])
      if credential.destroy
        render json: { message: "Storage credential deleted successfully" }
      else
        render json: { error: "Failed to delete storage credential" }, status: :unprocessable_entity
      end
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Storage credential not found" }, status: :not_found
    end
  end
end
