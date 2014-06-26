
test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--require should \
		--harmony-generators \
		--reporter spec \
		test/test

.PHONY: test
