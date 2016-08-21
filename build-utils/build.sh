
#!/bin/bash

# use browserify to bundle javascript dependencies together nicely
# thanks obama
watchify ./scripts/ffnn.js    \
		 ./scripts/ga.js      \
		 ./scripts/game.js    \
		 ./scripts/helpers.js \
		 ./scripts/main.js    \
         ./scripts/logger.js  \
         ./scripts/config.js  \
         ./scripts/consts.js  \
         ./scripts/prettyprint.js \
		 -o ./scripts/bundle.js
