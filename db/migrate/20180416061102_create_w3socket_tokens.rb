class CreateW3socketTokens < ActiveRecord::Migration
  def change
    create_table :w3socket_tokens do |t|
    	t.string :token
      t.timestamps null: false
    end
  end
end
