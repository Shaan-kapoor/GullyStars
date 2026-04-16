import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  RefreshControl,
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

const TYPE_LABEL: Record<string, string> = {
  result: "Result",
  training: "Training",
  general: "Update",
  milestone: "Milestone",
};

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
        activeOpacity={0.85}
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

        {!!post.imageUri && (
          <Image
            source={{ uri: post.imageUri }}
            style={styles.postImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.postActions}>
          <Pressable
            style={styles.actionBtn}
            onPress={(e) => {
              e.stopPropagation?.();
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
          <View style={[styles.typeBadge, { backgroundColor: sc + "18" }]}>
            <Text style={[styles.typeText, { color: sc }]}>{TYPE_LABEL[post.type] ?? post.type}</Text>
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
  const [pickedImage, setPickedImage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const myTeam = teams.find((t) => t.members.some((m) => m.id === currentUser?.id));

  const handlePickImage = async () => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPickedImage(result.assets[0].uri);
    }
  };

  const handlePost = () => {
    if (!newPost.trim() && !pickedImage) return;
    if (!currentUser) return;
    addFeedPost({
      teamId: myTeam?.id ?? "unknown",
      teamName: myTeam?.name ?? "My Team",
      authorId: currentUser.id,
      authorName: currentUser.name,
      content: newPost.trim(),
      imageUri: pickedImage ?? undefined,
      sport: currentUser.sport,
      type: "general",
    });
    setNewPost("");
    setPickedImage(null);
    setComposing(false);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const canPost = (newPost.trim().length > 0 || !!pickedImage) && !!currentUser;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border },
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
            style={[styles.composeBtn, { backgroundColor: composing ? colors.secondary : colors.primary }]}
            onPress={() => {
              if (!composing) setComposing(true);
              else { setComposing(false); setPickedImage(null); setNewPost(""); }
            }}
          >
            <Ionicons name={composing ? "close" : "add"} size={22} color={composing ? colors.mutedForeground : colors.primaryForeground} />
          </Pressable>
        </View>

        {composing && (
          <View style={[styles.composer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.composerInput, { color: colors.foreground }]}
              placeholder="Share a match result, photo, training update..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              value={newPost}
              onChangeText={setNewPost}
              autoFocus
            />
            {pickedImage && (
              <View style={styles.imagePreviewWrap}>
                <Image source={{ uri: pickedImage }} style={styles.imagePreview} resizeMode="cover" />
                <Pressable
                  style={[styles.removeImageBtn, { backgroundColor: colors.destructive }]}
                  onPress={() => setPickedImage(null)}
                >
                  <Ionicons name="close" size={14} color="#fff" />
                </Pressable>
              </View>
            )}
            <View style={styles.composerActions}>
              <Pressable
                style={[styles.mediaBtn, { backgroundColor: colors.secondary }]}
                onPress={handlePickImage}
              >
                <Ionicons name="image-outline" size={18} color={colors.mutedForeground} />
              </Pressable>
              <Pressable
                onPress={handlePost}
                style={[styles.sendBtn, { backgroundColor: canPost ? colors.primary : colors.secondary }]}
              >
                <Ionicons name="send" size={16} color={canPost ? colors.primaryForeground : colors.mutedForeground} />
                <Text style={[styles.sendLabel, { color: canPost ? colors.primaryForeground : colors.mutedForeground }]}>Post</Text>
              </Pressable>
            </View>
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
          <EmptyState icon="newspaper-outline" title="No posts yet" subtitle="Be the first to share a match update or photo" />
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        scrollEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, gap: 12 },
  headerRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular" },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold" },
  composeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  composer: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 12 },
  composerInput: { fontSize: 15, fontFamily: "Inter_400Regular", minHeight: 60, lineHeight: 22 },
  imagePreviewWrap: { position: "relative", alignSelf: "flex-start" },
  imagePreview: { width: 120, height: 90, borderRadius: 10 },
  removeImageBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  composerActions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  mediaBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  sendBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 100 },
  sendLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  list: { padding: 16 },
  postCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12, marginBottom: 12 },
  postHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  postMeta: { flex: 1 },
  authorName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  teamName: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  postContent: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  postImage: { width: "100%", height: 200, borderRadius: 12 },
  postActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionCount: { fontSize: 13, fontFamily: "Inter_500Medium" },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100, marginLeft: "auto" },
  typeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
});
