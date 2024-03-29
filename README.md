## Features

With the requestShark extension, you can:

1. Capture arbitrary requests (fetch, xhr) selected by regular expression and save them locally in your browser.
2. Download saved requests as a JSON file.
3. Observe saved requests and filter them using the awesome jq filter ([jq manual](https://jqlang.github.io/jq/manual/v1.6/)) integrated as a WebAssembly (WASM) module ([jq-wasm](https://github.com/paolosimone/jq-wasm)).
4. Filter requests before saving them in the local browser database using integrated jq filters.
5. Automate mouse and keyboard events (very early prototype). Optionally, driving real mouse supported through mkb_driver ([mkb_driver](https://github.com/tsobolev/mkb_driver)) on Linux.
6. Visualize automation programs with the integrated Graphviz ([Graphviz](https://graphviz.org/)) WASM module ([hpcc-js-wasm](https://github.com/hpcc-systems/hpcc-js-wasm)).

## Installation

Clone the repository: 
```
git clone http://github.com/tsobolev/requestShark
```

Zip files inside the `src` directory to create the `requestShark.xpi` file and install the extension from the file (set `about:config xpinstall.signatures.required` to `False`):
```
./build.sh
```

Optionally, install [mkb_driver](https://github.com/tsobolev/mkb_driver).

Start a Python HTTP server with the test site:
```
./testserver.sh
```

Navigate to `localhost:9000`.

To work properly, the option "always allow on example.site" should be enabled, and the site should be reloaded after that.

## Usage

All configurations are defined in a single JSON field `config` with several sections: `variables`, `actions`, `requests`, and `fsm`.

### Variables

Any valid JSON. Will be used as the initial state for persistent `state`.

### Actions

Defines buttons to start actions from the finite-state machine (FSM).

### Requests

Allows you to define which requests should be captured and how.

### FSM

Defines chains of actions. The demo configuration loaded by default will be self-explanatory.
