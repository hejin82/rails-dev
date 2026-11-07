require "test_helper"

class TerminalPageTest < ActionDispatch::IntegrationTest
  test "renders the simulated terminal root" do
    get "/terminal"

    assert_response :success
    assert_includes response.body, 'id="terminal-root"'
    assert_includes response.body, "模拟终端"
  end
end
