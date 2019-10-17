build:
	@echo "echo `node build.js | base64` | base64 -D | bash"

test:
	@DEBUG=TRUE node build.js | bash
