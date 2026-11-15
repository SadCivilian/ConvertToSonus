ifeq ($(OS),Windows_NT)
    SHELL := cmd.exe
endif

# For testing (compiles the wasm and runs the server)
test:
	cd ./src/back/wasm && wasm-pack build --target web --out-dir ../../front/pkg 
	cd ./src/front/ts && tsc 
	cd ./src/back/serve && cargo r

# For building the server itself (will serve on localhost when ran)
build: 
	cd ./src/back/wasm && wasm-pack build --target web  --out-dir ../../front/pkg
	cd ./src/front/ts && tsc 
	cd ./src/back/serve && cargo build --release
