class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :email, null: false
      t.string :username, null: false
      t.integer :gender, null: false, default: 0
      t.date :birth_date, null: false
      t.integer :user_type, null: false, default: 0

      t.timestamps
    end

    add_index :users, :email, unique: true
    add_index :users, :username, unique: true
  end
end
