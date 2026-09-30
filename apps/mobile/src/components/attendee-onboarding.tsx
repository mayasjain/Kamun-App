import { AttendeeProfileForm } from '@/components/attendee-profile-form';
import { Screen } from '@/components/screen';

export function AttendeeOnboarding() {
  return (
    <Screen eyebrow="WELCOME TO KAMUN 2026" title="Enter your access code" subtitle="Use the code supplied by your chair or conference organiser.">
      <AttendeeProfileForm />
    </Screen>
  );
}
