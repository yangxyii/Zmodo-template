import { Redirect } from 'expo-router';
import { useAuth } from '../src/store/authStore';

export default function Index() {
  const token = useAuth((s) => s.token);
  return token ? <Redirect href="/home" /> : <Redirect href="/welcome" />;
}
