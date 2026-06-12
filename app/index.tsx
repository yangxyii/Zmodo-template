import { Redirect } from 'expo-router';

export default function Index() {
  // Generated apps always open on the welcome screen so the first impression is
  // the onboarding flow (welcome -> login -> home), regardless of any session
  // token left over in Expo Go's shared storage from a previous preview.
  return <Redirect href="/welcome" />;
}
