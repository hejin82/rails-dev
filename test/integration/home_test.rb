require "test_helper"

class HomeTest < ActionDispatch::IntegrationTest
  test "root page renders" do
    get "/"
    assert_response :success
    assert_includes response.body, "Rails 8.1"
  end

  test "health endpoint responds" do
    get "/up"
    assert_response :success
  end
end
