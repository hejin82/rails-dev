class User < ApplicationRecord
  GENDER_LABELS = {
    "male" => "男",
    "female" => "女",
    "other" => "其他"
  }.freeze

  USER_TYPE_LABELS = {
    "normal" => "普通用户",
    "admin" => "管理员"
  }.freeze

  enum :gender, { male: 0, female: 1, other: 2 }, validate: true
  enum :user_type, { normal: 0, admin: 1 }, validate: true

  validates :email,
            presence: true,
            length: { maximum: 255 },
            format: { with: URI::MailTo::EMAIL_REGEXP },
            uniqueness: { case_sensitive: false }
  validates :username,
            presence: true,
            length: { maximum: 50 },
            uniqueness: { case_sensitive: false }
  validates :birth_date, presence: true
  validate :birth_date_cannot_be_in_the_future

  def gender_label
    GENDER_LABELS[gender]
  end

  def user_type_label
    USER_TYPE_LABELS[user_type]
  end

  private

  def birth_date_cannot_be_in_the_future
    return if birth_date.blank? || birth_date <= Date.current

    errors.add(:birth_date, "不能晚于今天")
  end
end
