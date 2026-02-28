import React from "react";
import { Feather } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../theme";

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function SettingItem({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  danger,
  noDivider,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  danger?: boolean;
  noDivider?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.settingItem, noDivider ? styles.noDivider : null]}>
      <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
        <Feather name={icon} size={17} color={iconColor} />
      </View>

      <View style={styles.settingTextWrap}>
        <Text style={[styles.settingTitle, danger ? styles.dangerText : null]}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>

      <Feather name="chevron-right" size={18} color="#94A3B8" />
    </Pressable>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <SectionTitle title={title} />
      {children}
    </View>
  );
}

export default function ProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="chevron-left" size={22} color={theme.colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AC</Text>
          </View>

          <Text style={styles.name}>Alex Chen</Text>
          <Text style={styles.email}>alex.c@college.edu</Text>
        </View>

        <SectionCard title="ACCOUNT">
          <SettingItem
            icon="user"
            iconBg="#DBEAFE"
            iconColor="#2563EB"
            title="Edit Profile"
            subtitle="Update your name and email"
          />
          <SettingItem
            icon="bell"
            iconBg="#F3E8FF"
            iconColor="#9333EA"
            title="Notifications"
            subtitle="Manage your alerts"
            noDivider
          />
        </SectionCard>

        <SectionCard title="PAYMENT">
          <SettingItem
            icon="credit-card"
            iconBg="#DCFCE7"
            iconColor="#16A34A"
            title="Venmo Settings"
            subtitle="Link your Venmo account"
            noDivider
          />
        </SectionCard>

        <SectionCard title="SUPPORT">
          <SettingItem
            icon="help-circle"
            iconBg="#FFEDD5"
            iconColor="#F97316"
            title="Help & Support"
            subtitle="Get help and FAQs"
          />
          <SettingItem
            icon="log-out"
            iconBg="#FEE2E2"
            iconColor="#EF4444"
            title="Log Out"
            subtitle=""
            danger
            noDivider
            onPress={() => navigation.navigate("Login")}
          />
        </SectionCard>

        <View style={styles.footer}>
          <Text style={styles.footerText}>BreakSplit v1.0.0</Text>
          <Text style={styles.footerText}>Made with 💗 for college students</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    color: "#111827",
    fontSize: 32,
    fontWeight: "800",
  },
  content: {
    padding: 16,
    paddingBottom: 28,
    gap: 14,
  },
  profileCard: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 18,
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "white",
    fontSize: 35,
    fontWeight: "800",
  },
  name: {
    marginTop: 10,
    color: "#111827",
    fontSize: 16,
    fontWeight: "800",
  },
  email: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 12,
  },
  sectionCard: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    overflow: "hidden",
  },
  sectionTitle: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 10,
    color: "#64748B",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  settingItem: {
    minHeight: 58,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  noDivider: {
    borderBottomWidth: 0,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  settingTextWrap: {
    flex: 1,
  },
  settingTitle: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
  },
  settingSubtitle: {
    marginTop: 2,
    color: "#475569",
    fontSize: 10,
  },
  dangerText: {
    color: "#EF4444",
  },
  footer: {
    marginTop: 14,
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    color: "#94A3B8",
    fontSize: 10,
  },
});
