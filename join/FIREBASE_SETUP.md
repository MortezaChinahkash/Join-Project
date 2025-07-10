# Firebase Authentication Setup

## Prerequisites

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication in your Firebase project
3. Enable the following sign-in methods:
   - Email/Password
   - Anonymous (for guest login)

## Configuration Steps

### 1. Get Firebase Configuration

1. Go to your Firebase project settings
2. Click on "General" tab
3. Scroll down to "Your apps" section
4. Click on the web app icon (`</>`)
5. Copy the Firebase configuration object

### 2. Update Firebase Configuration

Open `src/environments/firebase.config.ts` and replace the placeholder values with your actual Firebase configuration:

```typescript
export const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
  measurementId: "your-measurement-id"
};
```

### 3. Enable Authentication Methods

In Firebase Console:
1. Go to Authentication → Sign-in method
2. Enable "Email/Password"
3. Enable "Anonymous" (for guest login)

### 4. Security Rules (Optional)

You can set up Firestore security rules to control access to your data based on authentication status.

## Features

- **Email/Password Authentication**: Users can register and login with email and password
- **Anonymous Authentication**: Guest users can use the app without creating an account
- **Persistent Sessions**: User sessions persist across browser refreshes
- **Error Handling**: Proper error messages for authentication failures

## Usage

The AuthService provides the following methods:

- `login(email: string, password: string)` - Login with email and password
- `register(name: string, email: string, password: string)` - Register new user
- `loginAsGuest()` - Login as anonymous user
- `logout()` - Sign out current user
- `currentUser$` - Observable to track authentication state

## Testing

You can test the authentication with the following:

1. **Register**: Create a new account with any email and password
2. **Login**: Use the registered credentials to login
3. **Guest Login**: Use the guest button to login anonymously
4. **Logout**: Use the logout button in the header dropdown

## Troubleshooting

- **"Firebase config not found"**: Make sure you've updated the firebase.config.ts file
- **"Operation not allowed"**: Check that Email/Password and Anonymous auth are enabled in Firebase Console
- **"Invalid email"**: Ensure the email format is correct
- **"Weak password"**: Firebase requires passwords to be at least 6 characters

## Security Notes

- Never commit your Firebase configuration with real values to public repositories
- Consider using environment variables for production deployments
- Review Firebase security rules before deploying to production
