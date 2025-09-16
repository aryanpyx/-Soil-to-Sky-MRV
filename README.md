# AgriLens - Crop and Practice Verification App
  
This is a project built with [Chef](https://chef.convex.dev) using [Convex](https://convex.dev) as its backend.
 You can find docs about Chef with useful information like how to deploy to production [here](https://docs.convex.dev/chef).
  
This project is connected to the Convex deployment named [`energetic-snake-860`](https://dashboard.convex.dev/d/energetic-snake-860).
  
## Project structure
  
The frontend code is in the `app` directory and is built with [Vite](https://vitejs.dev/).
  
The backend code is in the `convex` directory.
  
`npm run dev` will start the frontend and backend servers.

### Dashboard Preview

![Dashboard Part 1](https://raw.githubusercontent.com/aryanpyx/-Soil-to-Sky-MRV/c356dae3f803bf1e45f82dd32d047129256290bd/Dashboard%20part%201.png)

![Dashboard Part 2](https://raw.githubusercontent.com/aryanpyx/-Soil-to-Sky-MRV/c356dae3f803bf1e45f82dd32d047129256290bd/Dashboad%20part%202.png)


## App authentication

Chef apps use [Convex Auth](https://auth.convex.dev/) with Anonymous auth for easy sign in. You may wish to change this before deploying your app.

## Developing and deploying your app

Check out the [Convex docs](https://docs.convex.dev/) for more information on how to develop with Convex.
* If you're new to Convex, the [Overview](https://docs.convex.dev/understanding/) is a good place to start
* Check out the [Hosting and Deployment](https://docs.convex.dev/production/) docs for how to deploy your app
* Read the [Best Practices](https://docs.convex.dev/understanding/best-practices/) guide for tips on how to improve you app further

## HTTP API

User-defined http routes are defined in the `convex/router.ts` file. We split these routes into a separate file from `convex/http.ts` to allow us to prevent the LLM from modifying the authentication routes.

Try the app:-[ https://chef.show/4f6e15](https://energetic-snake-860.convex.app/)

Developed by Team APYX for NABARD HACKATHON.

Fellow Members are Aryan Pandey, Utsav Kumar and Sachin Kumar.
<img width="2048" height="2048" alt="Gemini_Generated_Image_6nkmaj6nkmaj6nkm" src="https://github.com/user-attachments/assets/a46d6799-5891-4126-a553-990f47df733c" />



