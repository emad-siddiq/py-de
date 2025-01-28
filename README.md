# φ (py-de)

φ is an advanced notebook for scientific computation in the Python environment.

py-de  works by running a notebook on your local machine and connecting it to any backend compute using websockets with a single click. 

φ offers complete integration with state of the art LLM APIs.

<img width="1724" alt="Screenshot 2025-01-28 at 3 30 19 PM" src="https://github.com/user-attachments/assets/3671f459-a872-45d4-a118-64789e933ae4" />


1. Run the application by running the Go binary. 

2. Optionally select your backend. 
   
3. Write code.


## Build instructions

Build for dev:

```

./scripts/frontend-build-dev.sh

```

[Install Go](https://go.dev/dl/)

Make the build.sh executable:
```
chmod +x ./scripts/build.sh
```
Run the build script from the root folder:
```
./scripts/build.sh
```

# Run instructions

To run the final compiled binaries:

Run the backend:

```
./dist/backend_binary_for_your_os
```

Run the frontend:

```
./dist/frontend_binary_for_your_os
```

To run frontend to debug:

```
npm install -g http-server
cd frontend/src/typescript
npm run build
cd dist
http-server
```

## Shortcuts:

Add Code Cell: 
Add Text Cell:

Remove current code cell: 
Remove current text cell:

