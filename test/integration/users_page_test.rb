require "test_helper"

class UsersPageTest < ActionDispatch::IntegrationTest
  test "renders the React users root" do
    get "/users"

    assert_response :success
    assert_includes response.body, 'id="users-root"'
    assert_includes response.body, "用户管理"
  end
end
