import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { primaryNavigation } from '@/constants/navigation';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundSelected}
      tintColor={colors.primary}
      labelStyle={{ selected: { color: colors.primary, fontWeight: '700' }, default: { color: colors.textSecondary } }}>
      {primaryNavigation.map((item) => (
        <NativeTabs.Trigger key={item.name} name={item.name}>
          <NativeTabs.Trigger.Label>{item.label}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={item.sfIcon} md={item.materialIcon} />
        </NativeTabs.Trigger>
      ))}

      <NativeTabs.Trigger name="committees" hidden />
      <NativeTabs.Trigger name="emergency" hidden />
      <NativeTabs.Trigger name="gossip" hidden />
      <NativeTabs.Trigger name="partners" hidden />
    </NativeTabs>
  );
}
