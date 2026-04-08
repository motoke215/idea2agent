import React from 'react';
import Markdown from 'react-native-markdown-display';
import { colors, radius } from '../theme';

const mdStyles = {
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
  fence: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    padding: 14,
    marginVertical: 8,
    fontFamily: 'monospace',
    fontSize: 12.5,
    color: colors.inkMid,
    lineHeight: 20,
  },
  code_block: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    padding: 14,
    marginVertical: 8,
    fontFamily: 'monospace',
    fontSize: 12.5,
    color: colors.inkMid,
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

export default function ResultRenderer({ content }) {
  return <Markdown style={mdStyles}>{content}</Markdown>;
}
