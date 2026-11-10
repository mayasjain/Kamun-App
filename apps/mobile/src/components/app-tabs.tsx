import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTheme } from '@/hooks/use-theme';
import { primaryNavigation } from '@/constants/navigation';

export default function AppTabs() {
  const colors = useTheme();
  const [reduceTransparency, setReduceTransparency] = useState(true);
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let active = true;
    void AccessibilityInfo.isReduceTransparencyEnabled().then(value => {
      if (active) setReduceTransparency(value);
    }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduceTransparency);
    return () => { active = false; subscription.remove(); };
  }, []);
  const glass = Platform.OS === 'ios' && !reduceTransparency;

  return (
    <NativeTabs
      minimizeBehavior="onScrollDown"
      backgroundColor={glass ? 'rgba(255, 255, 255, 0.35)' : colors.background}
      blurEffect={glass ? 'systemChromeMaterialLight' : 'none'}
      indicatorColor={colors.backgroundSelected}
      tintColor={colors.primary}
      labelStyle={{ selected: { color: colors.primary, fontWeight: '500' }, default: { color: colors.textSecondary } }}>
      {primaryNavigation.map((item) => (
        <NativeTabs.Trigger key={item.name} name={item.name}>
          <NativeTabs.Trigger.Label>{item.label}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={item.sfIcon} md={item.materialIcon} />
        </NativeTabs.Trigger>
      ))}

      <NativeTabs.Trigger name="coffee" hidden />
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
