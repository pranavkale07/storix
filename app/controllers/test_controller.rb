class TestController < ApplicationController
  skip_before_action :authenticate_user!

  def session_test
    session[:test] = "working"
    render json: { session_working: session[:test] == "working" }
  end
end
