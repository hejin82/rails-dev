require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "is valid with all required fields" do
    user = User.new(
      email: "new@example.com",
      username: "new_user",
      gender: "male",
      birth_date: Date.new(1995, 6, 1),
      user_type: "normal"
    )

    assert user.valid?
  end

  test "rejects a future birth date" do
    user = User.new(
      email: "future@example.com",
      username: "future_user",
      gender: "female",
      birth_date: Date.current + 1,
      user_type: "normal"
    )

    assert_not user.valid?
    assert_includes user.errors[:birth_date], "不能晚于今天"
  end

  test "requires a valid email" do
    user = User.new(
      email: "not-an-email",
      username: "bad_email",
      gender: "other",
      birth_date: Date.new(2000, 1, 1),
      user_type: "admin"
    )

    assert_not user.valid?
    assert user.errors[:email].any?
  end

  test "exposes Chinese labels for enums" do
    assert_equal "管理员", users(:admin_user).user_type_label
    assert_equal "普通用户", users(:normal_user).user_type_label
  end
end
