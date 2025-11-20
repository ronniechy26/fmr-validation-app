# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## FMR validation workflow

- Tap the center **Add** button to choose an annex. Drafts are created without linking to an existing FMR so field teams can collect data offline.
- The **Forms** tab shows both project-backed validations and a "Standalone drafts" section for items that still need QR or ABEMIS attachment.
- From the form detail view, operators can attach a draft to an FMR by scanning the QR code or typing the ABEMIS ID. Attachment status is displayed above the form sections.
- The analytics and locator tabs now include standalone drafts when calculating totals so you can monitor backlog before uploads occur.
- When connected to the new NestJS BFF, use `POST /forms` for standalone creation and `PATCH /forms/:id/attach` when scanning QR codes in the field.
- Offline state is cached via `expo-sqlite` (`storage/offline-store.ts`) so previously fetched FMR data and new drafts persist between sessions even without connectivity.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Configure the backend URL

   The mobile app reads `EXPO_PUBLIC_API_URL` for the NestJS BFF base URL. It now defaults to `http://172.16.9.22:3000`. Override if needed by creating an `.env` file (or exporting the variable in your shell) before starting Expo:

   ```bash
   EXPO_PUBLIC_API_URL=http://172.16.9.22:3000
   ```

   If you skip this step, the app defaults to `http://172.16.9.22:3000`.

3. Sign in against the BFF

   The login screen now calls the NestJS BFF (`POST /auth/login`) and stores a short-lived token for subsequent requests. Use one of the seeded users from `fmr-validation-services/src/data/users.ts` when running locally, for example:

   - `mark.baldeo@da.gov.ph` / `validation123`
   - `alyssa.cruz@da.gov.ph` / `securepass456`

3. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
