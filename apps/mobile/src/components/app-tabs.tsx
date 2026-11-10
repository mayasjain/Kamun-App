import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTheme } from '@/hooks/use-theme';
import { primaryNavigation } from '@/constants/navigation';

export default function AppTabs() {
  const colors = useTheme();

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundSelected}
      tintColor={colors.primary}
      labelStyle={{ selected: { color: colors.primary, fontWeight: '500' }, default: { color: colors.textSecondary } }}>
      {primaryNavigation.map((item) => (
        <NativeTabs.Trigger key={item.name} name={item.name}>
          <NativeTabs.Trigger.Label>{item.label}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={item.sfIcon} md={item.materialIcon} />
        </NativeTabs.Trigger>
      ))}

      <NativeTabs.Trigger name="privacy" hidden />
      <NativeTabs.Trigger name="committees" hidden />
      <NativeTabs.Trigger name="emergency" hidden />
      <NativeTabs.Trigger name="gossip" hidden />
      <NativeTabs.Trigger name="memes" hidden />
      <NativeTabs.Trigger name="partners" hidden />
      <NativeTabs.Trigger name="secretariat" hidden />
    </NativeTabs>
  );
}
