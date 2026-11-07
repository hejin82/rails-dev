require "test_helper"

class HomeTest < ActionDispatch::IntegrationTest
  test "root page renders" do
    get "/"
    assert_response :success
    assert_includes response.body, "Rails 8.1"
    assert_includes response.body, 'id="react-root"'
    assert_includes response.body, 'type="module"'
  end

  test "health endpoint responds" do
    get "/up"
    assert_response :success
  end
end
