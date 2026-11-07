module Api
  class UsersController < ApplicationController
    before_action :set_user, only: %i[show update destroy]

    def index
      render json: User.order(created_at: :desc).map { |user| user_json(user) }
    end

    def show
      render json: user_json(@user)
    end

    def create
      user = User.new(user_params)

      if user.save
        render json: user_json(user), status: :created
      else
        render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      if @user.update(user_params)
        render json: user_json(@user)
      else
        render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      @user.destroy!
      head :no_content
    end

    private

    def set_user
      @user = User.find(params[:id])
    end

    def user_params
      params.require(:user).permit(:email, :username, :gender, :birth_date, :user_type)
    end

    def user_json(user)
      {
        id: user.id,
        email: user.email,
        username: user.username,
        gender: user.gender,
        gender_label: user.gender_label,
        birth_date: user.birth_date.iso8601,
        user_type: user.user_type,
        user_type_label: user.user_type_label
      }
    end
  end
end
