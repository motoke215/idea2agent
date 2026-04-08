import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { colors, radius } from '../theme';

/**
 * 全局 markdown 样式：PRD 阅读区保持原有温暖风格
 */
const globalStyles = {
  body: { backgroundColor: 'transparent' },
  heading1: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.ink,
    marginTop: 20,
    marginBottom: 8,
    lineHeight: 28,
  },
  heading2: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.ink,
    marginTop: 18,
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  heading3: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.emberDark,
    marginTop: 14,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.inkMid,
    marginTop: 4,
    marginBottom: 4,
  },
  bullet_list: { marginVertical: 4 },
  ordered_list: { marginVertical: 4 },
  list_item: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.inkMid,
  },
  bullet_list_icon: {
    color: colors.ember,
    marginTop: 7,
  },
  code_inline: {
    fontFamily: 'monospace',
    fontSize: 12.5,
    backgroundColor: colors.borderLight,
    color: colors.emberDark,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  // 代码块：白底 + 浅灰边框（PRD区）
  fence: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: radius.sm,
    padding: 14,
    marginVertical: 8,
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#1a1a1a',
    lineHeight: 20,
  },
  code_block: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: radius.sm,
    padding: 14,
    marginVertical: 8,
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#1a1a1a',
    lineHeight: 20,
  },
  blockquote: {
    backgroundColor: '#fffbf2',
    borderLeftWidth: 3,
    borderLeftColor: colors.ember,
    paddingLeft: 12,
    paddingVertical: 6,
    marginVertical: 8,
    borderRadius: 4,
  },
  blockquote_paragraph: {
    fontStyle: 'italic',
    color: colors.inkLight,
    fontSize: 14,
    lineHeight: 21,
  },
  strong: { fontWeight: '700', color: colors.ink },
  hr: {
    backgroundColor: colors.borderLight,
    height: 1,
    marginVertical: 16,
  },
  em: { fontStyle: 'italic', color: colors.inkLight },
};

/** 分步指令章节的样式常量 - 白底黑字风格 */
const SI = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginVertical: 12,
    overflow: 'hidden',
    borderWidth: 0,
    borderColor: 'transparent',
  },
  stepHeader: {
    backgroundColor: colors.emberTint,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  stepHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.emberTintDark,
  },
  body: {
    backgroundColor: colors.surface,
    padding: 14,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.inkMid,
    marginBottom: 6,
  },
  code: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.sm,
    padding: 12,
    marginVertical: 6,
    fontFamily: 'monospace',
    fontSize: 12.5,
    color: colors.ink,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 8,
  },
});

/**
 * 解析并渲染分步开发指令的章节
 * 每个 Step 都是白底黑字
 */
function InstructionSection({ content }) {
  const parts = useMemo(() => {
    if (!content) return [];
    // 按 Step 分割
    const steps = content.split(/(?=\*\*Step\s+\d+)/);
    return steps.filter(Boolean);
  }, [content]);

  if (parts.length === 0) return null;

  return (
    <View style={SI.wrapper}>
      {parts.map((part, idx) => {
        const trimmed = part.trim();
        if (!trimmed) return null;

        const lines = trimmed.split('\n');
        const isStepHeading = /^\*\*Step\s+\d+/.test(trimmed);

        if (isStepHeading) {
          // Step 标题行
          const titleText = trimmed.split('\n')[0].replace(/\*\*/g, '').trim();
          return (
            <View key={idx} style={SI.stepHeader}>
              <Text style={SI.stepHeaderText}>{titleText}</Text>
            </View>
          );
        }

        // 内容体：白底黑字
        return (
          <View key={idx} style={SI.body}>
            {lines.map((line, lineIdx) => {
              const raw = line.trim();

              // 空行
              if (!raw) return <View key={lineIdx} style={{ height: 6 }} />;

              // 代码行（缩进或特殊字符开头）
              const isCode = raw.startsWith('```') ||
                raw.startsWith('    ') ||
                /^(import|export|const|let|var|function|class|def|return|if|for|while)/.test(raw) ||
                raw.startsWith('- ') && raw.length > 20;

              // 分隔线
              if (raw === '---' || raw === '***') {
                return <View key={lineIdx} style={{ height: 1, backgroundColor: colors.borderLight, marginVertical: 8 }} />;
              }

              if (isCode) {
                const display = raw.replace(/^```.*/, '').replace(/```$/, '').trim();
                if (!display) return null;
                return (
                  <View key={lineIdx} style={SI.code}>
                    <Text style={{ fontFamily: 'monospace', fontSize: 12.5, color: colors.ink, lineHeight: 20 }}>
                      {display}
                    </Text>
                  </View>
                );
              }

              // 普通文本行
              return (
                <Text key={lineIdx} style={SI.paragraph}>
                  {raw.replace(/\*\*/g, '')}
                </Text>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

/**
 * 分割内容：PRD 部分 + 分步指令部分
 */
function splitContent(content) {
  const markers = ['# ⟳ 分步开发指令', '⟳ 分步开发指令', '**Step 1'];
  for (const m of markers) {
    const idx = content.indexOf(m);
    if (idx !== -1) {
      return {
        prdPart: content.slice(0, idx).trim(),
        instrPart: content.slice(idx).trim(),
      };
    }
  }
  return { prdPart: content, instrPart: '' };
}

export default function ResultRenderer({ content }) {
  if (!content) return null;

  const { prdPart, instrPart } = splitContent(content);

  return (
    <>
      {/* PRD 主内容区 */}
      {prdPart ? (
        <Markdown style={globalStyles}> {prdPart}</Markdown>
      ) : null}

      {/* 分隔 + 分步指令白底区 */}
      {instrPart ? (
        <>
          <View style={SI.divider} />
          <InstructionSection content={instrPart} />
        </>
      ) : null}
    </>
  );
}
