import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";

import { EmptyState } from "@/components/EmptyState";
import { SportBadge, sportColor } from "@/components/SportBadge";
import { FeedPost, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function PostCard({ post, index }: { post: FeedPost; index: number }) {
  const colors = useColors();
  const { currentUser, likePost } = useApp();
  const liked = currentUser ? post.likes.includes(currentUser.id) : false;
  const sc = sportColor(post.sport);

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(300)}>
      <Pressable
        style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push({ pathname: "/team/[id]", params: { id: post.teamId } })}
      >
        <View style={styles.postHeader}>
          <View style={[styles.avatar, { backgroundColor: sc + "22" }]}>
            <Text style={[styles.avatarText, { color: sc }]}>{post.authorName[0]}</Text>
          </View>
          <View style={styles.postMeta}>
            <Text style={[styles.authorName, { color: colors.foreground }]}>{post.authorName}</Text>
            <Text style={[styles.teamName, { color: colors.mutedForeground }]}>
              {post.teamName} · {timeAgo(post.createdAt)}
            </Text>
          </View>
          <SportBadge sport={post.sport} />
        </View>

        <Text style={[styles.postContent, { color: colors.foreground }]}>{post.content}</Text>

        <View style={styles.postActions}>
          <Pressable
            style={styles.actionBtn}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              likePost(post.id);
            }}
          >
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={20}
              color={liked ? "#EF4444" : colors.mutedForeground}
            />
            <Text style={[styles.actionCount, { color: liked ? "#EF4444" : colors.mutedForeground }]}>
              {post.likes.length}
            </Text>
          </Pressable>
          <View style={[styles.typeBadge, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.typeText, { color: colors.mutedForeground }]}>{post.type}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function FeedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { feedPosts, currentUser, addFeedPost, teams } = useApp();
  const [composing, setComposing] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const myTeam = teams.find((t) => t.id === currentUser?.teamId);

  const handlePost = () => {
    if (!newPost.trim() || !currentUser) return;
    addFeedPost({
      teamId: currentUser.teamId ?? "unknown",
      teamName: myTeam?.name ?? "My Team",
      authorId: currentUser.id,
      authorName: currentUser.name,
      content: newPost.trim(),
      sport: currentUser.sport,
      type: "general",
    });
    setNewPost("");
    setComposing(false);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Welcome back,</Text>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              {currentUser?.name?.split(" ")[0] ?? "Gully Stars"}
            </Text>
          </View>
          <Pressable
            style={[styles.composeBtn, { backgroundColor: colors.primary }]}
            onPress={() => setComposing((v) => !v)}
          >
            <Ionicons name={composing ? "close" : "add"} size={22} color={colors.primaryForeground} />
          </Pressable>
        </View>

        {composing && (
          <View style={[styles.composer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.composerInput, { color: colors.foreground }]}
              placeholder="Share a match result, training update..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              value={newPost}
              onChangeText={setNewPost}
              autoFocus
            />
            <Pressable
              onPress={handlePost}
              style={[styles.sendBtn, { backgroundColor: newPost.trim() ? colors.primary : colors.secondary }]}
            >
              <Ionicons name="send" size={16} color={newPost.trim() ? colors.primaryForeground : colors.mutedForeground} />
            </Pressable>
          </View>
        )}
      </View>

      <FlatList
        data={feedPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <PostCard post={item} index={index} />}
        contentContainerStyle={[styles.list, { paddingBottom: botPad + 90 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState icon="newspaper-outline" title="No posts yet" subtitle="Follow teams to see their updates here" />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        scrollEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular" },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold" },
  composeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  composerInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    maxHeight: 100,
    lineHeight: 22,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  list: { padding: 16, gap: 12 },
  postCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginBottom: 12,
  },
  postHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  postMeta: { flex: 1 },
  authorName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  teamName: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  postContent: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  postActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionCount: { fontSize: 13, fontFamily: "Inter_500Medium" },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100, marginLeft: "auto" },
  typeText: { fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "capitalize" },
});
