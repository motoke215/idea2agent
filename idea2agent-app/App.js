import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
  Animated, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';

import { generateIdea, extractInstructions } from './src/lib/api';
import { useToast } from './src/hooks/useToast';
import { ToastContainer } from './src/components/Toast';
import Skeleton from './src/components/Skeleton';
import ResultRenderer from './src/components/ResultRenderer';
import { colors, radius } from './src/theme';

const PROVIDERS = [
  { value: 'deepseek', label: 'DeepSeek', placeholder: 'deepseek-chat' },
  { value: 'openai', label: 'OpenAI', placeholder: 'gpt-4o' },
  { value: 'custom', label: '自定义', placeholder: 'your-model-name' },
];

const EXAMPLES = [
  '帮助独立开发者追踪MRR和用户流失率的轻量级SaaS仪表板',
  '用AI自动生成每日晨报并推送通知的工具',
  '面向设计师的字体配对推荐工具，支持实时预览',
];

function TabBar({ active, onChange }) {
  return (
    <View style={s.tabBar}>
      {['输入', '结果', '配置'].map((t, i) => (
        <TouchableOpacity key={t} style={[s.tab, active === i && s.tabActive]} onPress={() => onChange(i)} activeOpacity={0.75}>
          <Text style={[s.tabText, active === i && s.tabTextActive]}>{t}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function Label({ children }) {
  return <Text style={s.label}>{children}</Text>;
}

function EmptyState() {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.4, duration: 2000, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <View style={s.emptyWrap}>
      <Animated.Text style={[s.emptyHex, { opacity: pulse }]}>⬡</Animated.Text>
      <Text style={s.emptyTitle}>在「输入」页填写想法</Text>
      <Text style={s.emptySub}>点击「开始炼金」后{'\n'}生成结果将在此展示</Text>
      <View style={s.featureGrid}>
        {[['✦','第一性原理'],['⬡','MVP矩阵'],['◈','极简PRD'],['⟳','分步指令']].map(([ic,lb])=>(
          <View key={lb} style={s.featureItem}>
            <Text style={s.featureIcon}>{ic}</Text>
            <Text style={s.featureLabel}>{lb}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function App() {
  const [tab, setTab] = useState(0);
  const [idea, setIdea] = useState('');
  const [provider, setProvider] = useState('deepseek');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [showAdv, setShowAdv] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const { toasts, addToast } = useToast();
  const scrollRef = useRef(null);

  useEffect(() => {
    AsyncStorage.getItem('cfg').then(raw => {
      if (!raw) return;
      try { const c = JSON.parse(raw); if(c.apiKey) setApiKey(c.apiKey); if(c.provider) setProvider(c.provider); if(c.model) setModel(c.model); if(c.baseUrl) setBaseUrl(c.baseUrl); } catch {}
    });
  }, []);

  const saveConfig = useCallback(() => {
    AsyncStorage.setItem('cfg', JSON.stringify({ apiKey, provider, model, baseUrl }));
  }, [apiKey, provider, model, baseUrl]);

  async function handleGenerate() {
    if (!idea.trim()) { addToast('请先输入你的产品想法 ✦', 'error'); return; }
    if (!apiKey.trim()) { addToast('请在「配置」页填写 API Key', 'error'); setTab(2); return; }
    saveConfig(); setLoading(true); setResult(''); setTab(1);
    try {
      const content = await generateIdea({ idea, apiKey, provider, baseUrl, model });
      setResult(content);
      setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 100);
    } catch (err) {
      addToast(err.message || '未知错误，请稍后再试', 'error'); setTab(0);
    } finally { setLoading(false); }
  }

  async function handleCopy() {
    await Clipboard.setStringAsync(extractInstructions(result));
    setCopied(true); addToast('开发指令已复制 ✓', 'success');
    setTimeout(() => setCopied(false), 2200);
  }

  async function handleDownload() {
    const slug = idea.slice(0,20).replace(/\s+/g,'-').replace(/[^\w\-]/g,'') || 'idea';
    const fn = `PRD-${slug}-${new Date().toISOString().slice(0,10)}.md`;
    const path = FileSystem.documentDirectory + fn;
    await FileSystem.writeAsStringAsync(path, result, { encoding: FileSystem.EncodingType.UTF8 });
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(path, { mimeType:'text/markdown', dialogTitle:'保存 PRD 文档' });
    addToast(`已准备 ${fn}`, 'info');
  }

  const cur = PROVIDERS.find(p => p.value === provider);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="dark" backgroundColor={colors.bg} />
      {/* Header */}
      <View style={s.header}>
        <View style={s.logoBox}><Text style={s.logoText}>⬡</Text></View>
        <View>
          <Text style={s.title}>灵感炼金炉</Text>
          <Text style={s.subtitle}>Idea2Agent · 将想法炼制为开发指令</Text>
        </View>
      </View>

      <TabBar active={tab} onChange={setTab} />

      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {/* ── Tab 0: Input ── */}
        {tab === 0 && (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
              <View style={s.card}>
                <Label>你的产品想法</Label>
                <TextInput value={idea} onChangeText={setIdea}
                  placeholder={"描述任意模糊的产品想法…\n\n例：帮助独立开发者追踪MRR的SaaS仪表板"}
                  placeholderTextColor={colors.inkMuted} multiline numberOfLines={7}
                  textAlignVertical="top" style={s.ideaInput} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                  {EXAMPLES.map((ex, i) => (
                    <TouchableOpacity key={i} style={s.chip} onPress={() => setIdea(ex)} activeOpacity={0.75}>
                      <Text style={s.chipText}>{ex.slice(0,14)}…</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {!apiKey && (
                <TouchableOpacity style={s.reminder} onPress={() => setTab(2)} activeOpacity={0.8}>
                  <Text style={s.reminderText}>⚙  前往「配置」页填写 API Key</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={[s.genBtn, loading && s.genBtnOff]} onPress={handleGenerate} disabled={loading} activeOpacity={0.85}>
                {loading
                  ? <><ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} /><Text style={s.genBtnText}>炼金中…</Text></>
                  : <Text style={s.genBtnText}>⬡  开始炼金</Text>}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        {/* ── Tab 1: Result ── */}
        {tab === 1 && (
          <View style={{ flex: 1 }}>
            {!loading && !result && <EmptyState />}
            {loading && <ScrollView contentContainerStyle={s.content}><View style={s.card}><Skeleton /></View></ScrollView>}
            {!loading && result && (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.actBar} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, flexDirection:'row', gap: 8 }}>
                  <TouchableOpacity style={[s.actBtn, copied && s.actBtnSuccess]} onPress={handleCopy} activeOpacity={0.8}>
                    <Text style={[s.actBtnText, copied && { color: colors.success }]}>{copied ? '✓ 已复制' : '⌘ 复制指令'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.actBtn} onPress={handleDownload} activeOpacity={0.8}>
                    <Text style={s.actBtnText}>↓ 下载 MD</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.actBtn} onPress={() => { setResult(''); setTab(0); }} activeOpacity={0.8}>
                    <Text style={s.actBtnText}>✎ 修改</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.actBtn} onPress={handleGenerate} activeOpacity={0.8}>
                    <Text style={s.actBtnText}>⟳ 重新生成</Text>
                  </TouchableOpacity>
                </ScrollView>
                <ScrollView ref={scrollRef} contentContainerStyle={s.content} style={{ flex: 1 }}>
                  <View style={[s.card, { paddingBottom: 32 }]}>
                    <View style={s.cardHead}>
                      <View style={[s.dot, { backgroundColor: colors.emberLight }]} />
                      <View style={[s.dot, { backgroundColor: colors.ember }]} />
                      <View style={[s.dot, { backgroundColor: colors.emberDark }]} />
                      <Text style={s.cardHeadText}>PRD · {new Date().toLocaleDateString('zh-CN')}</Text>
                    </View>
                    <ResultRenderer content={result} />
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        )}

        {/* ── Tab 2: Config ── */}
        {tab === 2 && (
          <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
            <View style={s.card}>
              <Label>服务商</Label>
              <View style={{ flexDirection:'row', gap: 8 }}>
                {PROVIDERS.map(p => (
                  <TouchableOpacity key={p.value} style={[s.provBtn, provider===p.value && s.provBtnOn]} onPress={() => setProvider(p.value)} activeOpacity={0.8}>
                    <Text style={[s.provText, provider===p.value && s.provTextOn]}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ marginTop: 20 }}><Label>API Key</Label></View>
              <TextInput value={apiKey} onChangeText={setApiKey} placeholder="sk-···" placeholderTextColor={colors.inkMuted} secureTextEntry autoCorrect={false} autoCapitalize="none" style={s.cfgInput} />
              <Text style={s.helper}>Key 仅存储在本设备，不会被上传</Text>

              <TouchableOpacity style={s.advToggle} onPress={() => setShowAdv(!showAdv)} activeOpacity={0.75}>
                <Text style={s.advToggleText}>{showAdv ? '▾' : '▸'} 高级选项</Text>
              </TouchableOpacity>

              {showAdv && (
                <View>
                  <Label>模型名称（留空用默认）</Label>
                  <TextInput value={model} onChangeText={setModel} placeholder={cur?.placeholder} placeholderTextColor={colors.inkMuted} autoCorrect={false} autoCapitalize="none" style={s.cfgInput} />
                  {provider === 'custom' && (
                    <>
                      <View style={{ marginTop: 12 }}><Label>Base URL</Label></View>
                      <TextInput value={baseUrl} onChangeText={setBaseUrl} placeholder="https://api.example.com" placeholderTextColor={colors.inkMuted} autoCorrect={false} autoCapitalize="none" keyboardType="url" style={s.cfgInput} />
                    </>
                  )}
                </View>
              )}

              <TouchableOpacity style={s.saveBtn} onPress={() => { saveConfig(); addToast('配置已保存 ✓', 'success'); }} activeOpacity={0.85}>
                <Text style={s.saveBtnText}>保存配置</Text>
              </TouchableOpacity>
            </View>

            <View style={{ alignItems:'center', paddingVertical: 24 }}>
              <Text style={{ fontSize: 12, color: colors.inkMuted }}>灵感炼金炉 Idea2Agent · v1.0</Text>
              <Text style={{ fontSize: 11, color: colors.inkMuted, marginTop: 4, textAlign:'center' }}>将模糊想法炼制为 PRD 与分步开发指令</Text>
            </View>
          </ScrollView>
        )}
      </View>

      <ToastContainer toasts={toasts} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection:'row', alignItems:'center', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight, gap: 12 },
  logoBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.ember, alignItems:'center', justifyContent:'center' },
  logoText: { fontSize: 18, color: '#fff' },
  title: { fontSize: 17, fontWeight: '700', color: colors.ink, letterSpacing: -0.3 },
  subtitle: { fontSize: 11, color: colors.inkMuted, marginTop: 1 },
  tabBar: { flexDirection:'row', backgroundColor: colors.bg, paddingHorizontal: 14, paddingVertical: 8, gap: 6, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems:'center' },
  tabActive: { backgroundColor: colors.emberTint },
  tabText: { fontSize: 13.5, color: colors.inkFaint, fontWeight: '500' },
  tabTextActive: { color: colors.emberTintDark, fontWeight: '700' },
  content: { padding: 14, paddingBottom: 48 },
  card: { backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 14, shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.04, shadowRadius:4, elevation:2 },
  cardHead: { flexDirection:'row', alignItems:'center', gap: 6, marginBottom: 14, paddingBottom: 12, borderBottomWidth:1, borderBottomColor: colors.borderLight },
  dot: { width: 10, height: 10, borderRadius: 5 },
  cardHeadText: { fontSize: 11.5, color: colors.inkMuted, marginLeft: 4 },
  label: { fontSize: 10.5, fontWeight:'700', color: colors.inkFaint, textTransform:'uppercase', letterSpacing: 1, marginBottom: 10 },
  ideaInput: { backgroundColor: colors.bg, borderRadius: 10, borderWidth:1, borderColor: colors.borderLight, padding: 13, fontSize: 14.5, color: colors.ink, lineHeight: 22, minHeight: 145 },
  chip: { backgroundColor: colors.bg, borderWidth:1, borderColor: colors.borderLight, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, marginRight: 8 },
  chipText: { fontSize: 12.5, color: colors.inkFaint },
  reminder: { backgroundColor: colors.emberTint, borderWidth:1, borderColor:'#fde68a', borderRadius: 14, paddingVertical: 13, paddingHorizontal: 16, marginBottom: 14, alignItems:'center' },
  reminderText: { fontSize: 13.5, color: colors.emberTintDark, fontWeight:'600' },
  genBtn: { backgroundColor: colors.ember, borderRadius: 14, paddingVertical: 16, alignItems:'center', justifyContent:'center', flexDirection:'row', shadowColor: colors.emberDark, shadowOffset:{width:0,height:4}, shadowOpacity:0.28, shadowRadius:10, elevation:6 },
  genBtnOff: { backgroundColor: colors.inkMuted, shadowOpacity: 0 },
  genBtnText: { fontSize: 16, fontWeight:'700', color:'#fff', letterSpacing: 0.3 },
  actBar: { borderBottomWidth:1, borderBottomColor: colors.borderLight, backgroundColor: colors.bg },
  actBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth:1, borderColor: colors.borderLight, backgroundColor: colors.surface },
  actBtnSuccess: { borderColor:'#a7f3d0', backgroundColor: colors.successTint },
  actBtnText: { fontSize: 13, fontWeight:'500', color: colors.inkFaint },
  cfgInput: { backgroundColor: colors.bg, borderRadius: 10, borderWidth:1, borderColor: colors.borderLight, paddingHorizontal: 13, paddingVertical: 12, fontSize: 14, color: colors.ink, marginBottom: 6, fontFamily:'monospace' },
  helper: { fontSize: 12, color: colors.inkMuted, marginBottom: 8 },
  provBtn: { flex:1, paddingVertical: 10, borderRadius: 10, borderWidth:1, borderColor: colors.borderLight, alignItems:'center', backgroundColor: colors.bg },
  provBtnOn: { backgroundColor: colors.emberTint, borderColor: colors.ember },
  provText: { fontSize: 13, color: colors.inkFaint, fontWeight:'500' },
  provTextOn: { color: colors.emberTintDark, fontWeight:'700' },
  advToggle: { paddingVertical: 10 },
  advToggleText: { fontSize: 13, color: colors.inkFaint },
  saveBtn: { backgroundColor: colors.surface, borderWidth:1, borderColor: colors.ember, borderRadius: 14, paddingVertical: 14, alignItems:'center', marginTop: 20 },
  saveBtnText: { fontSize: 15, fontWeight:'700', color: colors.ember },
  emptyWrap: { flex:1, alignItems:'center', justifyContent:'center', padding: 32 },
  emptyHex: { fontSize: 80, color: colors.borderLight, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight:'600', color: colors.inkMuted, marginBottom: 8 },
  emptySub: { fontSize: 14, color: colors.inkMuted, textAlign:'center', lineHeight: 22, marginBottom: 28 },
  featureGrid: { flexDirection:'row', flexWrap:'wrap', gap: 10, justifyContent:'center' },
  featureItem: { flexDirection:'row', alignItems:'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: colors.surface, borderRadius: 10, borderWidth:1, borderColor: colors.borderLight, width: 130 },
  featureIcon: { fontSize: 14, color: colors.ember },
  featureLabel: { fontSize: 12, color: colors.inkFaint },
});
