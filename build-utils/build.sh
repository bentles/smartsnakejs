
#!/bin/bash

# use browserify to bundle javascript dependencies together nicely
# thanks obama
watchify ./scripts/ffnn.js    \
		 ./scripts/ga.js      \
		 ./scripts/game.js    \
		 ./scripts/helpers.js \
		 ./scripts/main.js    \
         ./scripts/logger.js  \
		 -o ./scripts/bundle.js
