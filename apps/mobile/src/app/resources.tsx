import { ContentCard } from '@/components/content-card';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { demoResources } from '@/data/demo';

export default function ResourcesScreen() {
  return (
    <Screen eyebrow="PREPARE" title="Resources" subtitle="Conference documents">
      {demoResources.map((resource) => (
        <ContentCard key={resource.title} label={resource.kind} title={resource.title}>
          <ThemedText themeColor="textSecondary">
            {resource.kind === 'COMMITTEE' ? 'Committee resources coming later' : resource.audience}
          </ThemedText>
        </ContentCard>
      ))}
    </Screen>
  );
}
