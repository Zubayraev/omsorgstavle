import { Redirect } from 'expo-router';

export default function BrukerLoginRedirect() {
  return <Redirect href="/auth/login" />;
}
