require "test_helper"

class UsersApiTest < ActionDispatch::IntegrationTest
  setup do
    User.delete_all
  end

  test "creates, lists, updates and deletes a user" do
    assert_difference("User.count", 1) do
      post "/api/users", params: {
        user: {
          email: "alice@example.com",
          username: "alice",
          gender: "female",
          birth_date: "1995-06-01",
          user_type: "admin"
        }
      }, as: :json
    end

    assert_response :created
    created = response.parsed_body
    assert_equal "alice@example.com", created["email"]
    assert_equal "管理员", created["user_type_label"]
    assert_equal "女", created["gender_label"]

    get "/api/users", as: :json
    assert_response :success
    assert_equal 1, response.parsed_body.size

    patch "/api/users/#{created['id']}", params: {
      user: { username: "alice_admin", user_type: "normal" }
    }, as: :json

    assert_response :success
    assert_equal "alice_admin", response.parsed_body["username"]
    assert_equal "普通用户", response.parsed_body["user_type_label"]

    assert_difference("User.count", -1) do
      delete "/api/users/#{created['id']}", as: :json
    end

    assert_response :no_content
  end

  test "returns validation errors for invalid data" do
    post "/api/users", params: {
      user: {
        email: "not-an-email",
        username: "",
        gender: "male",
        birth_date: Date.current + 1,
        user_type: "normal"
      }
    }, as: :json

    assert_response :unprocessable_entity
    assert response.parsed_body["errors"].any?
  end
end
