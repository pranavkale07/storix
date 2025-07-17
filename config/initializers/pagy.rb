# config/initializers/pagy.rb
require "pagy"
require "pagy/extras/metadata"

# Set sensible defaults (optional)
Pagy::DEFAULT[:items] = 20
Pagy::DEFAULT[:page]  = 1

# Do NOT require 'pagy/extras/array' unless you want to paginate arrays
# require 'pagy/extras/array'
