#   ConvertToSonus
Converting temperature and wind speed data into sound.

##  About the Project
ConvertToSonus is a demo showcasing an engine to transform visual data from NASA into audio data, making people be able to experience these beautiful visualizations even if they lack the ability to percieve visuals.

## Used Technologies
- HTML
- CSS
- JavaScript
- TypeScript
- Rust (Both native and compiled to WebAssembly)

## Team (Team Obombo Members)
- Ada Uysal
- Emir Efe Ay
- Nisan Uzunali
- Zeynep Su Dabak

## Building
Requires [make](https://gnuwin32.sourceforge.net/packages/make.htm) (this comes built-in on basically every linux system, but windows users might have to install manually), [tsc](https://www.typescriptlang.org/) (and the derivatives required, like npm! Also, make sure it's installed globally) [Rust](https://rust-lang.org/), [Cargo](https://doc.rust-lang.org/cargo/), and [wasm-pack](https://wasm-bindgen.github.io/wasm-pack/) (make sure this is also installed globally, cargo provides an install command for this) to be installed on your system. If you have all of these and want to build from source, run the following:

```bash

git clone https://github.com/SadCivilian/ConvertToSonus
cd ConvertToSonus

# If you simply want to test (this will build unoptimized, although the WASM is always built with an optimizer, so it will just be the web server that is unoptimized), run
make test

# Otherwise if you want to build the binary, run:
make build

# You can then navigate to 127.0.0.1:8080/index.html to get started. If you chose to build the binary, running it will serve the web server and you can keep it running.

```

## License 
Licensed under the MIT License. See LICENSE for more information.
