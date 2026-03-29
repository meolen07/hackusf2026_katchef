import { useEffect, useRef, useState } from "react";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RecipeDetailModal } from "../components/RecipeDetailModal";
import { RecipeSuggestionCard } from "../components/RecipeSuggestionCard";
import { ScreenShell } from "../components/ScreenShell";
import { quickChatPrompts } from "../constants/appContent";
import { useAppStore } from "../store/appStore";
import { colors, radii, shadows, spacing, typography } from "../theme/tokens";
import { ChatRecipeSuggestion } from "../types/contracts";
import { AppTabParamList } from "../types/navigation";
import { formatRelativeTime } from "../utils/format";

type Props = BottomTabScreenProps<AppTabParamList, "Chatbot">;

export function ChatbotScreen(_: Props) {
  const [draft, setDraft] = useState("");
  const [expandedRecipes, setExpandedRecipes] = useState<Record<string, boolean>>({});
  const [selectedSuggestion, setSelectedSuggestion] = useState<ChatRecipeSuggestion | null>(null);
  const [historyVisible, setHistoryVisible] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWideLayout = width >= 1120;

  const chatSession = useAppStore((state) => state.chatSession);
  const chatSessions = useAppStore((state) => state.chatSessions);
  const sendMessage = useAppStore((state) => state.sendMessage);
  const openChatSession = useAppStore((state) => state.openChatSession);
  const createNewChat = useAppStore((state) => state.createNewChat);
  const deleteChatSession = useAppStore((state) => state.deleteChatSession);
  const fridgeItems = useAppStore((state) => state.fridgeItems);
  const busy = useAppStore((state) => state.busy.chat);
  const railIngredients = fridgeItems.slice(0, 8);
  const hasUserMessages = chatSession.messages.some((message) => message.role === "user");

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [chatSession.messages.length]);

  useEffect(() => {
    setDraft("");
    setExpandedRecipes({});
    setSelectedSuggestion(null);
  }, [chatSession.id]);

  async function handleSend(nextMessage?: string) {
    const content = (nextMessage ?? draft).trim();
    if (!content || busy) return;
    setDraft("");
    await sendMessage(content);
  }

  function toggleRecipeExpansion(messageId: string) {
    setExpandedRecipes((current) => ({
      ...current,
      [messageId]: !current[messageId],
    }));
  }

  async function handleOpenChatSession(sessionId: string) {
    await openChatSession(sessionId);
    setHistoryVisible(false);
  }

  async function handleCreateNewChat() {
    await createNewChat();
    setHistoryVisible(false);
  }

  async function handleDeleteChatSession(sessionId: string) {
    await deleteChatSession(sessionId);
  }

  function getChatPreview(sessionId: string) {
    const session = chatSessions.find((entry) => entry.id === sessionId);
    const lastMeaningfulMessage = session?.messages
      .slice()
      .reverse()
      .find((message) => message.role === "user" || message.content.trim().length > 0);

    if (!lastMeaningfulMessage) {
      return "Fresh chat, ready for the next idea.";
    }

    return lastMeaningfulMessage.content;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
    >
      <ScreenShell
        title="Chat with KatChef"
        titleAccessory={
          <View style={styles.headerMascotBadge}>
            <Image
              source={require("../../assets/katchef-mascot.png")}
              style={styles.headerMascot}
              resizeMode="contain"
            />
          </View>
        }
        scroll={false}
        contentStyle={styles.screenContent}
        maxWidth={1320}
        headerMaxWidth={720}
      >
        <View style={[styles.chatFrame, isWideLayout && styles.chatFrameWide]}>
          <View style={styles.chatMain}>
            <View style={styles.sessionToolbar}>
              <View style={styles.sessionSummary}>
                <Text style={styles.sessionEyebrow}>Current chat</Text>
                <Text style={styles.sessionTitle} numberOfLines={1}>
                  {chatSession.title}
                </Text>
                <Text style={styles.sessionMeta}>
                  {chatSessions.length} saved chat{chatSessions.length === 1 ? "" : "s"}
                </Text>
              </View>

              <View style={styles.sessionActions}>
                <Pressable
                  onPress={() => setHistoryVisible(true)}
                  disabled={busy}
                  style={[styles.sessionButton, busy && styles.sessionButtonDisabled]}
                >
                  <Text style={styles.sessionButtonText}>History</Text>
                </Pressable>
                <Pressable
                  onPress={() => void handleCreateNewChat()}
                  disabled={busy}
                  style={[styles.sessionButton, styles.sessionButtonPrimary, busy && styles.sessionButtonDisabled]}
                >
                  <Text style={[styles.sessionButtonText, styles.sessionButtonPrimaryText]}>New chat</Text>
                </Pressable>
              </View>
            </View>

            <ScrollView
              ref={scrollRef}
              style={styles.chatScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
              keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
              contentContainerStyle={styles.chatList}
            >
              {!hasUserMessages ? (
                <View style={styles.starterCard}>
                  <View style={styles.starterHeader}>
                    <Text style={styles.starterEyebrow}>Start here</Text>
                    <Text style={styles.starterTitle}>Ask for a quick dinner, a rescue plan, or a smarter way to use what you already saved.</Text>
                    <Text style={styles.starterBody}>
                      KatChef is strongest when it stays grounded in your real fridge, your time, and the least annoying path to dinner.
                    </Text>
                  </View>
                  <View style={styles.starterMetrics}>
                    <View style={styles.starterMetric}>
                      <Text style={styles.starterMetricValue}>{fridgeItems.length}</Text>
                      <Text style={styles.starterMetricLabel}>ingredients loaded</Text>
                    </View>
                    <View style={styles.starterMetric}>
                      <Text style={styles.starterMetricValue}>{chatSessions.length}</Text>
                      <Text style={styles.starterMetricLabel}>saved chats</Text>
                    </View>
                  </View>
                </View>
              ) : null}

              {!isWideLayout ? (
                <View style={styles.promptRow}>
                  {quickChatPrompts.map((prompt) => (
                    <Pressable
                      key={prompt}
                      onPress={() => handleSend(prompt)}
                      style={styles.promptChip}
                    >
                      <Text style={styles.promptText}>{prompt}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              {chatSession.messages.map((message) => {
                const suggestions = message.suggestions ?? [];
                const isExpanded = expandedRecipes[message.id] ?? false;
                const visibleSuggestions = isExpanded ? suggestions : suggestions.slice(0, 4);
                const hiddenCount = Math.max(suggestions.length - visibleSuggestions.length, 0);

                return (
                  <View
                    key={message.id}
                    style={[
                      styles.messageWrap,
                      message.role === "user" ? styles.userWrap : styles.assistantWrap,
                    ]}
                  >
                    <View
                      style={[
                        styles.messageBubble,
                        message.role === "user" ? styles.userBubble : styles.assistantBubble,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageRole,
                          message.role === "user" ? styles.userRole : styles.assistantRole,
                        ]}
                      >
                        {message.role === "user" ? "You" : "KatChef"}
                      </Text>
                      <Text
                        style={[
                          styles.messageText,
                          message.role === "user" ? styles.userText : styles.assistantText,
                        ]}
                      >
                        {message.content}
                      </Text>
                    </View>

                    {suggestions.length > 0 ? (
                      <View style={styles.recipeGroup}>
                        <View style={styles.recipeGroupHeader}>
                          <Text style={styles.recipeGroupTitle}>
                            {suggestions.length} recipe{suggestions.length === 1 ? "" : "s"} ready
                          </Text>
                          <Text style={styles.recipeGroupCaption}>
                            {isExpanded ? "Full list open" : "Showing the strongest first picks"}
                          </Text>
                        </View>

                        {visibleSuggestions.map((suggestion) => (
                          <RecipeSuggestionCard
                            key={`${message.id}-${suggestion.title}`}
                            suggestion={suggestion}
                            onPress={() => setSelectedSuggestion(suggestion)}
                          />
                        ))}

                        {suggestions.length > 4 ? (
                          <Pressable
                            onPress={() => toggleRecipeExpansion(message.id)}
                            style={styles.recipeToggle}
                          >
                            <Text style={styles.recipeToggleText}>
                              {isExpanded
                                ? "Show fewer recipes"
                                : `Show ${hiddenCount} more recipe${hiddenCount === 1 ? "" : "s"}`}
                            </Text>
                          </Pressable>
                        ) : null}
                      </View>
                    ) : null}

                    {message.tips?.length ? (
                      <View style={styles.tipCard}>
                        {message.tips.map((tip) => (
                          <Text key={`${message.id}-${tip}`} style={styles.tipLine}>
                            • {tip}
                          </Text>
                        ))}
                      </View>
                    ) : null}
                  </View>
                );
              })}

              {busy ? (
                <View style={[styles.messageWrap, styles.assistantWrap]}>
                  <View style={[styles.messageBubble, styles.assistantBubble, styles.typingBubble]}>
                    <Text style={[styles.messageRole, styles.assistantRole]}>KatChef</Text>
                    <Text style={styles.assistantText}>Thinking through the fridge like a very opinionated sous-chef...</Text>
                  </View>
                </View>
              ) : null}
            </ScrollView>

            <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Ask for dinner ideas, swaps, or rescue plans..."
                placeholderTextColor={colors.muted}
                style={styles.input}
                multiline
                textAlignVertical="top"
                returnKeyType="default"
                blurOnSubmit={false}
              />
              <Pressable
                onPress={() => handleSend()}
                disabled={busy}
                style={[styles.sendButton, busy && styles.sendButtonDisabled]}
              >
                <Text style={styles.sendButtonText}>{busy ? "..." : "Send"}</Text>
              </Pressable>
            </View>
          </View>

          {isWideLayout ? (
            <View style={styles.chatRail}>
              <View style={styles.railCard}>
                <Text style={styles.railEyebrow}>Quick prompts</Text>
                <Text style={styles.railTitle}>Start without typing from scratch</Text>
                <View style={styles.railPromptList}>
                  {quickChatPrompts.map((prompt) => (
                    <Pressable
                      key={prompt}
                      onPress={() => handleSend(prompt)}
                      style={styles.railPromptButton}
                    >
                      <MaterialCommunityIcons name="lightning-bolt-outline" size={16} color={colors.coralDeep} />
                      <Text style={styles.railPromptText}>{prompt}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.railCard}>
                <Text style={styles.railEyebrow}>Loaded context</Text>
                <Text style={styles.railTitle}>
                  {fridgeItems.length > 0 ? `${fridgeItems.length} ingredients already in memory` : "No ingredients loaded yet"}
                </Text>
                <Text style={styles.railBody}>
                  KatChef uses your saved fridge to keep recipes realistic and avoid generic advice.
                </Text>
                {railIngredients.length > 0 ? (
                  <View style={styles.railChipRow}>
                    {railIngredients.map((item) => (
                      <View key={item.id} style={styles.railChip}>
                        <Text style={styles.railChipText}>{item.name}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}
        </View>

        <RecipeDetailModal
          suggestion={selectedSuggestion}
          visible={Boolean(selectedSuggestion)}
          onClose={() => setSelectedSuggestion(null)}
        />

        <Modal
          transparent
          animationType="fade"
          visible={historyVisible}
          onRequestClose={() => setHistoryVisible(false)}
        >
          <View style={styles.historyModalRoot}>
            <Pressable style={styles.historyBackdrop} onPress={() => setHistoryVisible(false)} />
            <View style={styles.historySheet}>
              <View style={styles.historyHandle} />
              <View style={styles.historyHeader}>
                <View style={styles.historyHeaderCopy}>
                  <Text style={styles.historyEyebrow}>History</Text>
                  <Text style={styles.historyTitle}>Pick up an earlier chat</Text>
                  <Text style={styles.historyBody}>
                    Jump back into saved sessions or start fresh when the fridge mood changes.
                  </Text>
                </View>

                <Pressable onPress={() => void handleCreateNewChat()} style={styles.historyNewChatButton}>
                  <Text style={styles.historyNewChatText}>New chat</Text>
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.historyList}
              >
                {chatSessions.map((session) => {
                  const isActive = session.id === chatSession.id;

                  return (
                    <Pressable
                      key={session.id}
                      onPress={() => void handleOpenChatSession(session.id)}
                      style={[styles.historyCard, isActive && styles.historyCardActive]}
                    >
                    <View style={styles.historyCardTop}>
                        <Text style={styles.historyCardTitle} numberOfLines={1}>
                          {session.title}
                        </Text>
                        <View style={styles.historyCardActions}>
                          <Text style={styles.historyCardTime}>
                            {formatRelativeTime(session.updatedAt)}
                          </Text>
                          <Pressable
                            onPress={(event) => {
                              event.stopPropagation();
                              void handleDeleteChatSession(session.id);
                            }}
                            disabled={busy}
                            hitSlop={8}
                            style={[styles.historyDeleteButton, busy && styles.historyDeleteButtonDisabled]}
                          >
                            <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.coralDeep} />
                          </Pressable>
                        </View>
                      </View>
                      <Text style={styles.historyCardPreview} numberOfLines={2}>
                        {getChatPreview(session.id)}
                      </Text>
                      {isActive ? (
                        <View style={styles.historyBadge}>
                          <Text style={styles.historyBadgeText}>Open now</Text>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </ScreenShell>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
    minHeight: 0,
  },
  headerMascot: {
    width: 34,
    height: 34,
    transform: [{ scale: 1.2 }],
  },
  headerMascotBadge: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.88)",
    borderWidth: 1,
    borderColor: colors.border,
    marginLeft: 2,
    marginTop: 2,
    ...shadows.soft,
  },
  chatFrame: {
    flex: 1,
    minHeight: 0,
    gap: spacing.md,
  },
  chatFrameWide: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  chatMain: {
    flex: 1,
    minHeight: 0,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,253,249,0.88)",
    padding: spacing.md + 2,
    gap: spacing.md,
    ...shadows.card,
  },
  chatRail: {
    width: 336,
    gap: spacing.md,
  },
  railCard: {
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.soft,
  },
  railEyebrow: {
    fontFamily: typography.bodyBold,
    fontSize: 11,
    color: colors.green,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  railTitle: {
    fontFamily: typography.heading,
    fontSize: 18,
    color: colors.ink,
  },
  railBody: {
    fontFamily: typography.body,
    color: colors.muted,
    lineHeight: 20,
    marginTop: -4,
  },
  railPromptList: {
    gap: spacing.sm,
  },
  railPromptButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.creamSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  railPromptText: {
    flex: 1,
    fontFamily: typography.bodyBold,
    color: colors.ink,
    lineHeight: 18,
  },
  railChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  railChip: {
    borderRadius: radii.pill,
    backgroundColor: colors.greenSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },
  railChipText: {
    fontFamily: typography.bodyBold,
    fontSize: 12,
    color: colors.green,
  },
  chatScroll: {
    flex: 1,
    minHeight: 0,
  },
  chatList: {
    flexGrow: 1,
    gap: spacing.md,
    paddingBottom: spacing.xl + 4,
  },
  starterCard: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.soft,
  },
  starterHeader: {
    gap: spacing.xs,
  },
  starterEyebrow: {
    fontFamily: typography.bodyBold,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: colors.green,
  },
  starterTitle: {
    fontFamily: typography.heading,
    fontSize: 22,
    lineHeight: 29,
    color: colors.ink,
    maxWidth: 740,
  },
  starterBody: {
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.inkSoft,
    maxWidth: 720,
  },
  starterMetrics: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  starterMetric: {
    minWidth: 140,
    flexGrow: 1,
    backgroundColor: colors.creamSoft,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: 2,
  },
  starterMetricValue: {
    fontFamily: typography.heading,
    fontSize: 22,
    color: colors.ink,
  },
  starterMetricLabel: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.muted,
  },
  sessionToolbar: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    flexWrap: "wrap",
  },
  sessionSummary: {
    flex: 1,
    minWidth: 220,
    backgroundColor: "rgba(255,255,255,0.86)",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.md,
    gap: 3,
  },
  sessionEyebrow: {
    fontFamily: typography.bodyBold,
    fontSize: 11,
    color: colors.green,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sessionTitle: {
    fontFamily: typography.heading,
    fontSize: 19,
    color: colors.ink,
  },
  sessionMeta: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.muted,
  },
  sessionActions: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  sessionButton: {
    minHeight: 42,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.88)",
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionButtonPrimary: {
    backgroundColor: colors.coral,
    borderColor: colors.coral,
  },
  sessionButtonDisabled: {
    opacity: 0.6,
  },
  sessionButtonText: {
    fontFamily: typography.bodyBold,
    fontSize: 13,
    color: colors.ink,
  },
  sessionButtonPrimaryText: {
    color: colors.white,
  },
  promptRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  promptChip: {
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  promptText: {
    fontFamily: typography.bodyBold,
    fontSize: 13,
    color: colors.ink,
  },
  messageWrap: {
    gap: spacing.sm,
  },
  userWrap: {
    alignItems: "flex-end",
  },
  assistantWrap: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "92%",
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm + 3,
  },
  userBubble: {
    backgroundColor: colors.coral,
    ...shadows.soft,
  },
  assistantBubble: {
    backgroundColor: "rgba(255,255,255,0.82)",
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  messageRole: {
    fontFamily: typography.bodyBold,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  userRole: {
    color: "#FFEDE7",
  },
  assistantRole: {
    color: colors.green,
  },
  messageText: {
    fontFamily: typography.body,
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: colors.white,
  },
  assistantText: {
    color: colors.ink,
  },
  typingBubble: {
    opacity: 0.92,
  },
  recipeGroup: {
    alignSelf: "stretch",
    gap: spacing.sm,
  },
  recipeGroupHeader: {
    gap: 4,
    paddingHorizontal: spacing.xs,
    marginTop: 2,
  },
  recipeGroupTitle: {
    fontFamily: typography.heading,
    fontSize: 17,
    color: colors.ink,
  },
  recipeGroupCaption: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.muted,
  },
  recipeToggle: {
    alignSelf: "center",
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  recipeToggleText: {
    fontFamily: typography.bodyBold,
    fontSize: 13,
    color: colors.coralDeep,
  },
  tipCard: {
    gap: 6,
    backgroundColor: colors.greenSoft,
    borderRadius: radii.lg,
    padding: spacing.md,
    alignSelf: "stretch",
    borderWidth: 1,
    borderColor: "rgba(59,156,104,0.1)",
  },
  tipLine: {
    fontFamily: typography.body,
    color: colors.ink,
    lineHeight: 20,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    zIndex: 2,
    ...shadows.soft,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    fontFamily: typography.body,
    fontSize: 15,
    color: colors.ink,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  sendButton: {
    borderRadius: radii.md,
    backgroundColor: colors.coral,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontFamily: typography.bodyBold,
    color: colors.white,
    fontSize: 14,
  },
  historyModalRoot: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  historyBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(46, 41, 36, 0.24)",
  },
  historySheet: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 640,
    maxHeight: "82%",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.float,
  },
  historyHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
  },
  historyHeader: {
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  historyHeaderCopy: {
    flex: 1,
    minWidth: 220,
    gap: 4,
  },
  historyEyebrow: {
    fontFamily: typography.bodyBold,
    fontSize: 12,
    color: colors.green,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  historyTitle: {
    fontFamily: typography.heading,
    fontSize: 24,
    color: colors.ink,
  },
  historyBody: {
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
  },
  historyNewChatButton: {
    borderRadius: radii.pill,
    backgroundColor: colors.coral,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
  },
  historyNewChatText: {
    fontFamily: typography.bodyBold,
    fontSize: 13,
    color: colors.white,
  },
  historyList: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  historyCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.8)",
    padding: spacing.md,
    gap: spacing.xs,
  },
  historyCardActive: {
    borderColor: colors.coral,
    backgroundColor: "#FFF2EE",
  },
  historyCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  historyCardTitle: {
    flex: 1,
    fontFamily: typography.heading,
    fontSize: 17,
    color: colors.ink,
  },
  historyCardTime: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.muted,
  },
  historyCardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  historyDeleteButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 30,
    height: 30,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.creamSoft,
  },
  historyDeleteButtonDisabled: {
    opacity: 0.5,
  },
  historyCardPreview: {
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkSoft,
  },
  historyBadge: {
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    backgroundColor: colors.greenSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  historyBadgeText: {
    fontFamily: typography.bodyBold,
    fontSize: 12,
    color: colors.green,
  },
});
