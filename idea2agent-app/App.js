import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
  Animated, ActivityIndicator, Modal, useColorScheme,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';
import * as Network from 'expo-network';

import { generateIdea, extractInstructions, DEFAULT_TIMEOUT, MODEL_REGISTRY, MODEL_GROUPS, PROVIDER_LABELS } from './src/lib/api';
import { useToast } from './src/hooks/useToast';
import { useHistory } from './src/hooks/useHistory';
import { ToastContainer } from './src/components/Toast';
import Skeleton from './src/components/Skeleton';
import ResultRenderer from './src/components/ResultRenderer';
import { colors, radius } from './src/theme';

/** 默认选中的模型 */
const DEFAULT_MODEL = 'deepseek-chat';

/** 硅基流动可选模型列表 */
const SILICONFLOW_MODELS = [
  { id: 'Qwen/Qwen2.5-72B-Instruct', label: 'Qwen2.5-72B' },
  { id: 'THUDM/glm-4-9b-chat', label: 'GLM-4-9B' },
  { id: '01-ai/Yi-1.5-34B-Chat', label: 'Yi-1.5-34B' },
  { id: 'deepseek-ai/DeepSeek-V2.5', label: 'DeepSeek-V2.5' },
  { id: 'meta-llama/Llama-3.3-70B-Instruct', label: 'Llama-3.3-70B' },
];

/** 示例想法 */
const EXAMPLES = [
  '帮助独立开发者追踪MRR和用户流失率的轻量级SaaS仪表板',
  '用AI自动生成每日晨报并推送通知的工具',
  '面向设计师的字体配对推荐工具，支持实时预览',
];

/* ─────────────────────────────────────────────
   下拉菜单组件
───────────────────────────────────────────── */
function ModelPicker({ selectedModel, onSelect }) {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const info = MODEL_REGISTRY[selectedModel];
  const scrollRef = useRef(null);

  const handleSelect = useCallback((modelId) => {
    onSelect(modelId);
    setVisible(false);
    setExpanded(false);
  }, [onSelect]);

  return (
    <>
      <TouchableOpacity style={s.pickerBtn} onPress={() => { setVisible(true); setExpanded(true); }} activeOpacity={0.8}>
        <View style={{ flex: 1 }}>
          <Text style={s.pickerLabel}>已选模型</Text>
          <Text style={s.pickerValue}>{info?.label || selectedModel}</Text>
        </View>
        <Text style={s.pickerArrow}>▼</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => { setVisible(false); setExpanded(false); }}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => { setVisible(false); setExpanded(false); }}>
          <View style={s.dropdownContainer}>
            <View style={s.dropdownHeader}>
              <Text style={s.dropdownTitle}>选择模型</Text>
              <TouchableOpacity onPress={() => { setVisible(false); setExpanded(false); }}>
                <Text style={s.dropdownClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView ref={scrollRef} style={s.dropdownList} showsVerticalScrollIndicator={false}>
              {MODEL_GROUPS.map(group => (
                <View key={group.group}>
                  <View style={s.groupHeader}>
                    <Text style={s.groupLabel}>{group.group}</Text>
                  </View>
                  {group.models.map(modelId => {
                    const m = MODEL_REGISTRY[modelId];
                    const isSelected = modelId === selectedModel;
                    const providerLabel = PROVIDER_LABELS[m?.provider] || m?.provider;
                    return (
                      <TouchableOpacity
                        key={modelId}
                        style={[s.modelItem, isSelected && s.modelItemSelected]}
                        onPress={() => handleSelect(modelId)}
                        activeOpacity={0.7}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[s.modelName, isSelected && s.modelNameSelected]}>{m?.label || modelId}</Text>
                          {m && (
                            <Text style={s.modelProvider}>
                              {providerLabel} · {m.defaultModel}
                              {m.isLocal && ' · 本地'}
                              {m.isCustom && ' · 自定义地址'}
                            </Text>
                          )}
                        </View>
                        {isSelected && <Text style={s.checkmark}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

/* ─────────────────────────────────────────────
   Tab 栏
───────────────────────────────────────────── */
function TabBar({ active, onChange }) {
  return (
    <View style={s.tabBar}>
      {['输入', '结果', '历史', '配置'].map((t, i) => (
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

/* ─────────────────────────────────────────────
   空状态
───────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────
   检查网络
───────────────────────────────────────────── */
async function checkNetwork() {
  try {
    const state = await Network.getNetworkStateAsync();
    if (!state.isConnected) throw new Error('当前无网络连接，请检查网络后重试');
  } catch (err) {
    if (err.message.includes('无网络')) throw err;
  }
}

/* ─────────────────────────────────────────────
   主应用
───────────────────────────────────────────── */
export default function App() {
  const colorScheme = useColorScheme();
  const [tab, setTab] = useState(0);
  const [idea, setIdea] = useState('');
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  // modelConfigs: { [modelId]: { apiKey, endpoint } }
  const [modelConfigs, setModelConfigs] = useState({});
  const [showAdv, setShowAdv] = useState(false);
  const [showSiliconflowPicker, setShowSiliconflowPicker] = useState(false);
  const [siliconflowSubModel, setSiliconflowSubModel] = useState('Qwen/Qwen2.5-72B-Instruct');
  const [loading, setLoading] = useState(false);
const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const { toasts, addToast } = useToast();
  const { loadHistory, addHistory, deleteHistory, clearHistory } = useHistory(setHistoryList);
  const scrollRef = useRef(null);

  const statusBarStyle = colorScheme === 'dark' ? 'light' : 'dark';
  const modelInfo = MODEL_REGISTRY[selectedModel] || {};
  const currentProvider = modelInfo.provider;
  const currentModelConfig = modelConfigs[selectedModel] || {};
  const currentApiKey = currentModelConfig.apiKey || '';
  const currentEndpoint = currentModelConfig.endpoint || modelInfo.endpoint || '';

  // 加载保存的配置和历史记录
  useEffect(() => {
    AsyncStorage.getItem('cfg_v3').then(raw => {
      if (!raw) return;
      try {
        const c = JSON.parse(raw);
        if (c.selectedModel && MODEL_REGISTRY[c.selectedModel]) {
          setSelectedModel(c.selectedModel);
        }
        if (c.modelConfigs) setModelConfigs(c.modelConfigs);
      } catch {}
    });
    // 加载历史记录
    loadHistory().then(list => setHistoryList(list));
  }, []);

  const saveConfig = useCallback(() => {
    AsyncStorage.setItem('cfg_v3', JSON.stringify({
      selectedModel,
      modelConfigs,
    }));
  }, [selectedModel, modelConfigs]);

  // 更新当前模型的 API Key
  const updateApiKey = useCallback((key) => {
    setModelConfigs(prev => ({
      ...prev,
      [selectedModel]: { ...(prev[selectedModel] || {}), apiKey: key, endpoint: currentEndpoint },
    }));
  }, [selectedModel, currentEndpoint]);

  // 更新当前模型的 API 地址
  const updateEndpoint = useCallback((endpoint) => {
    setModelConfigs(prev => ({
      ...prev,
      [selectedModel]: { ...(prev[selectedModel] || {}), apiKey: currentApiKey, endpoint },
    }));
  }, [selectedModel, currentApiKey]);

  async function handleGenerate() {
    if (!idea.trim()) { addToast('请先输入你的产品想法 ✦', 'error'); return; }

    const key = currentApiKey;
    if (!key && !modelInfo.isLocal) {
      addToast(`请先在「配置」页填写 ${modelInfo.label} 的 API Key`, 'error');
      setTab(2);
      return;
    }

    try { await checkNetwork(); } catch (err) { addToast(err.message, 'error'); return; }

    saveConfig();
    setLoading(true);
    setResult('');
    setTab(1);

    try {
      const content = await generateIdea({
        idea,
        modelId: selectedModel,
        providerApiKeys: { [currentProvider]: key },
        customEndpoint: currentEndpoint,
        timeout: DEFAULT_TIMEOUT,
      });
      setResult(content);
      // 保存到历史记录
      await addHistory(idea, selectedModel, content);
      setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 100);
    } catch (err) {
      addToast(err.message || '未知错误，请稍后再试', 'error');
      setTab(0);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    const text = extractInstructions(result);
    if (!text) { addToast('无法提取开发指令，请尝试重新生成', 'error'); return; }
    await Clipboard.setStringAsync(text);
    setCopied(true);
    addToast('开发指令已复制 ✓', 'success');
    setTimeout(() => setCopied(false), 2200);
  }

  async function handleDownload() {
    if (!result) return;
    const slug = idea.slice(0,20).replace(/\s+/g,'-').replace(/[^\w\-]/g,'') || 'idea';
    const fn = `PRD-${slug}-${new Date().toISOString().slice(0,10)}.md`;
    const path = FileSystem.documentDirectory + fn;
    await FileSystem.writeAsStringAsync(path, result, { encoding: FileSystem.EncodingType.UTF8 });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, {
        mimeType: 'text/markdown;charset=utf-8',
        dialogTitle: '保存 PRD 文档',
      });
    } else {
      addToast('当前设备不支持分享', 'error');
    }
    addToast(`已保存 ${fn}`, 'info');
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style={statusBarStyle} backgroundColor={colors.bg} />

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

        {/* ── Tab 0: 输入 ── */}
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

              {/* 当前模型提示 */}
              <TouchableOpacity style={s.modelHint} onPress={() => setTab(2)} activeOpacity={0.8}>
                <Text style={s.modelHintIcon}>⚙</Text>
                <Text style={s.modelHintText}>当前: {modelInfo.label}</Text>
                <Text style={s.modelHintArrow}>›</Text>
              </TouchableOpacity>

              {!currentApiKey && !modelInfo.isLocal && (
                <TouchableOpacity style={s.reminder} onPress={() => setTab(2)} activeOpacity={0.8}>
                  <Text style={s.reminderText}>⚠  缺少 API Key，请前往「配置」页填写</Text>
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

        {/* ── Tab 1: 结果 ── */}
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

        {/* ── Tab 3: 历史 ── */}
        {tab === 2 && (
          <ScrollView contentContainerStyle={s.content}>
            <View style={s.card}>
              <View style={s.cardHead}>
                <View style={[s.dot, { backgroundColor: colors.emberLight }]} />
                <View style={[s.dot, { backgroundColor: colors.ember }]} />
                <View style={[s.dot, { backgroundColor: colors.emberDark }]} />
                <Text style={s.cardHeadText}>历史记录</Text>
              </View>

              {historyList.length === 0 ? (
                <View style={s.emptyHistory}>
                  <Text style={s.emptyHistoryIcon}>📭</Text>
                  <Text style={s.emptyHistoryText}>暂无历史记录</Text>
                  <Text style={s.emptyHistorySub}>生成 PRD 后会自动保存在此处</Text>
                </View>
              ) : (
                <>
                  {historyList.map((item, index) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[s.historyItem, index === 0 && s.historyItemFirst]}
                      onPress={() => {
                        setIdea(item.idea);
                        setResult(item.content);
                        setTab(1);
                      }}
                      activeOpacity={0.75}
                    >
                      <View style={s.historyHeader}>
                        <Text style={s.historyIdea} numberOfLines={2}>{item.idea}</Text>
                        <TouchableOpacity
                          style={s.historyDeleteBtn}
                          onPress={() => deleteHistory(item.id)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Text style={s.historyDeleteText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={s.historyMeta}>
                        <Text style={s.historyModel}>
                          {MODEL_REGISTRY[item.modelId]?.label || item.modelId}
                        </Text>
                        <Text style={s.historyTime}>
                          {new Date(item.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}

                  <TouchableOpacity
                    style={s.clearBtn}
                    onPress={() => {
                      if (historyList.length > 0) {
                        clearHistory();
                        addToast('历史记录已清空', 'info');
                      }
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={s.clearBtnText}>清空全部历史</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
        )}

        {/* ── Tab 3: 配置 ── */}
        {tab === 3 && (
          <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
            <View style={s.card}>
              <Label>选择模型</Label>
              <ModelPicker selectedModel={selectedModel} onSelect={setSelectedModel} />

              {/* 当前模型信息 */}
              <View style={s.providerInfo}>
                <Text style={s.providerInfoText}>
                  {modelInfo.label || selectedModel}
                  {modelInfo.isLocal && ' · 本地部署'}
                  {modelInfo.isCustom && ' · 自定义地址'}
                </Text>
              </View>

              {/* 硅基流动子模型选择 */}
              {currentProvider === 'siliconflow' && (
                <View style={{ marginTop: 16 }}>
                  <Label>选择子模型</Label>
                  <TouchableOpacity
                    style={s.pickerBtn}
                    onPress={() => setShowSiliconflowPicker(true)}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={s.pickerValue}>{siliconflowSubModel}</Text>
                    </View>
                    <Text style={s.pickerArrow}>▼</Text>
                  </TouchableOpacity>

                  <Modal visible={showSiliconflowPicker} transparent animationType="fade" onRequestClose={() => setShowSiliconflowPicker(false)}>
                    <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowSiliconflowPicker(false)}>
                      <View style={s.dropdownContainer}>
                        <View style={s.dropdownHeader}>
                          <Text style={s.dropdownTitle}>选择硅基流动模型</Text>
                          <TouchableOpacity onPress={() => setShowSiliconflowPicker(false)}>
                            <Text style={s.dropdownClose}>✕</Text>
                          </TouchableOpacity>
                        </View>
                        <ScrollView style={s.dropdownList} showsVerticalScrollIndicator={false}>
                          {SILICONFLOW_MODELS.map(item => (
                            <TouchableOpacity
                              key={item.id}
                              style={[s.modelItem, siliconflowSubModel === item.id && s.modelItemSelected]}
                              onPress={() => {
                                setSiliconflowSubModel(item.id);
                                setShowSiliconflowPicker(false);
                              }}
                              activeOpacity={0.7}
                            >
                              <View style={{ flex: 1 }}>
                                <Text style={[s.modelName, siliconflowSubModel === item.id && s.modelNameSelected]}>{item.label}</Text>
                                <Text style={s.modelProvider}>{item.id}</Text>
                              </View>
                              {siliconflowSubModel === item.id && <Text style={s.checkmark}>✓</Text>}
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    </TouchableOpacity>
                  </Modal>
                </View>
              )}

              {/* API 地址（所有模型都显示） */}
              <View style={{ marginTop: 16 }}>
                <Label>API 地址</Label>
                <TextInput
                  value={currentEndpoint}
                  onChangeText={updateEndpoint}
                  placeholder={modelInfo.endpoint || 'https://api.example.com/v1/chat/completions'}
                  placeholderTextColor={colors.inkMuted}
                  autoCorrect={false}
                  autoCapitalize="none"
                  keyboardType="url"
                  style={s.cfgInput}
                />
                <Text style={s.helper}>
                  {modelInfo.isLocal ? '默认: http://localhost:11434/api/chat' : modelInfo.endpoint ? `默认: ${modelInfo.endpoint}` : '请填写 API 地址'}
                </Text>
              </View>

              {/* API Key 输入（非本地模型） */}
              {!modelInfo.isLocal && (
                <>
                  <View style={{ marginTop: 16 }}><Label>API Key</Label></View>
                  <TextInput
                    value={currentApiKey}
                    onChangeText={updateApiKey}
                    placeholder={currentProvider === 'anthropic' ? 'sk-ant-···' : 'sk-···'}
                    placeholderTextColor={colors.inkMuted}
                    secureTextEntry
                    autoCorrect={false}
                    autoCapitalize="none"
                    style={s.cfgInput}
                  />
                  <Text style={s.helper}>
                    API Key 仅存储在本设备
                  </Text>
                </>
              )}

              {/* 已配置的模型列表 */}
              {Object.keys(modelConfigs).length > 0 && (
                <TouchableOpacity style={s.advToggle} onPress={() => setShowAdv(!showAdv)} activeOpacity={0.75}>
                  <Text style={s.advToggleText}>
                    {showAdv ? '▾' : '▸'} 已配置的模型（{Object.keys(modelConfigs).length} 个）
                  </Text>
                </TouchableOpacity>
              )}

              {showAdv && (
                <View style={{ marginTop: 12 }}>
                  {Object.entries(modelConfigs).map(([modelId, cfg]) => {
                    if (modelId === selectedModel) return null;
                    const m = MODEL_REGISTRY[modelId];
                    return (
                      <View key={modelId} style={s.savedKeyRow}>
                        <Text style={s.savedKeyLabel}>{m?.label || modelId}</Text>
                        <Text style={s.savedKeyValue}>{cfg.apiKey ? '••••' + cfg.apiKey.slice(-4) : '未填写'}</Text>
                      </View>
                    );
                  })}
                  {Object.keys(modelConfigs).filter(m => m !== selectedModel).length === 0 && (
                    <Text style={s.helper}>暂无其他已配置的模型</Text>
                  )}
                </View>
              )}

              <TouchableOpacity
                style={s.saveBtn}
                onPress={() => { saveConfig(); addToast('配置已保存 ✓', 'success'); }}
                activeOpacity={0.85}
              >
                <Text style={s.saveBtnText}>保存配置</Text>
              </TouchableOpacity>
            </View>

            <View style={{ alignItems:'center', paddingVertical: 24 }}>
              <Text style={{ fontSize: 12, color: colors.inkMuted }}>灵感炼金炉 Idea2Agent · v1.2.0</Text>
              <Text style={{ fontSize: 11, color: colors.inkMuted, marginTop: 4, textAlign:'center' }}>
                支持 DeepSeek / OpenAI / Anthropic / Gemini / Groq / OpenRouter / Ollama
              </Text>
            </View>
          </ScrollView>
        )}
      </View>

      <ToastContainer toasts={toasts} />
    </SafeAreaView>
  );
}

/* ─────────────────────────────────────────────
   样式
───────────────────────────────────────────── */
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
  modelHint: { flexDirection:'row', alignItems:'center', backgroundColor: colors.emberTint, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14, marginBottom: 10, gap: 8 },
  modelHintIcon: { fontSize: 14 },
  modelHintText: { flex: 1, fontSize: 13, color: colors.emberTintDark, fontWeight:'600' },
  modelHintArrow: { fontSize: 18, color: colors.emberTintDark },
  reminder: { backgroundColor: '#fef2f2', borderWidth:1, borderColor:'#fecaca', borderRadius: 14, paddingVertical: 13, paddingHorizontal: 16, marginBottom: 10, alignItems:'center' },
  reminderText: { fontSize: 13.5, color: '#991b1b', fontWeight:'600' },
  genBtn: { backgroundColor: colors.ember, borderRadius: 14, paddingVertical: 16, alignItems:'center', justifyContent:'center', flexDirection:'row', shadowColor: colors.emberDark, shadowOffset:{width:0,height:4}, shadowOpacity:0.28, shadowRadius:10, elevation:6 },
  genBtnOff: { backgroundColor: colors.inkMuted, shadowOpacity: 0 },
  genBtnText: { fontSize: 16, fontWeight:'700', color:'#fff', letterSpacing: 0.3 },
  actBar: { borderBottomWidth:1, borderBottomColor: colors.borderLight, backgroundColor: colors.bg },
  actBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth:1, borderColor: colors.borderLight, backgroundColor: colors.surface },
  actBtnSuccess: { borderColor:'#a7f3d0', backgroundColor: colors.successTint },
  actBtnText: { fontSize: 13, fontWeight:'500', color: colors.inkFaint },
  cfgInput: { backgroundColor: colors.bg, borderRadius: 10, borderWidth:1, borderColor: colors.borderLight, paddingHorizontal: 13, paddingVertical: 12, fontSize: 14, color: colors.ink, marginBottom: 6, fontFamily:'monospace' },
  helper: { fontSize: 12, color: colors.inkMuted, marginBottom: 8 },
  providerInfo: { marginTop: 8, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: colors.bg, borderRadius: 8, borderWidth: 1, borderColor: colors.borderLight },
  providerInfoText: { fontSize: 12, color: colors.inkMid },
  advToggle: { paddingVertical: 12, marginTop: 4 },
  advToggleText: { fontSize: 13, color: colors.inkFaint },
  savedKeyRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  savedKeyLabel: { fontSize: 13, color: colors.inkMid },
  savedKeyValue: { fontSize: 12, color: colors.inkFaint, fontFamily:'monospace' },
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

  // 下拉菜单样式
  pickerBtn: { flexDirection:'row', alignItems:'center', backgroundColor: colors.bg, borderRadius: 12, borderWidth:1, borderColor: colors.ember, paddingHorizontal: 14, paddingVertical: 13, gap: 8 },
  pickerLabel: { fontSize: 10, color: colors.inkFaint, textTransform:'uppercase', letterSpacing: 0.5 },
  pickerValue: { fontSize: 15, fontWeight:'600', color: colors.ink, marginTop: 2 },
  pickerArrow: { fontSize: 12, color: colors.ember },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent:'center', alignItems:'center', padding: 20 },
  dropdownContainer: { backgroundColor: colors.surface, borderRadius: 18, width: '100%', maxHeight: '90%', borderWidth:1, borderColor: colors.border },
  dropdownHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth:1, borderBottomColor: colors.borderLight },
  dropdownTitle: { fontSize: 16, fontWeight:'700', color: colors.ink },
  dropdownClose: { fontSize: 18, color: colors.inkFaint, padding: 4 },
  dropdownList: { paddingVertical: 8 },
  groupHeader: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6 },
  groupLabel: { fontSize: 11, fontWeight:'700', color: colors.ember, textTransform:'uppercase', letterSpacing: 1 },
  modelItem: { flexDirection:'row', alignItems:'center', paddingHorizontal: 18, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderLight, gap: 10 },
  modelItemSelected: { backgroundColor: colors.emberTint },
  modelName: { fontSize: 14, color: colors.ink },
  modelNameSelected: { fontWeight:'600', color: colors.ember },
  modelProvider: { fontSize: 11, color: colors.inkFaint, marginTop: 2 },
  checkmark: { fontSize: 16, color: colors.ember, fontWeight:'700' },

  // 历史记录样式
  emptyHistory: { alignItems:'center', paddingVertical: 40 },
  emptyHistoryIcon: { fontSize: 48, marginBottom: 12 },
  emptyHistoryText: { fontSize: 16, fontWeight:'600', color: colors.inkMuted, marginBottom: 6 },
  emptyHistorySub: { fontSize: 13, color: colors.inkFaint, textAlign:'center' },
  historyItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  historyItemFirst: { borderTopWidth: 1, borderTopColor: colors.borderLight, marginTop: 8, paddingTop: 16 },
  historyHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 8 },
  historyIdea: { flex: 1, fontSize: 14, color: colors.ink, lineHeight: 20, paddingRight: 12 },
  historyDeleteBtn: { padding: 4 },
  historyDeleteText: { fontSize: 14, color: colors.inkFaint },
  historyMeta: { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  historyModel: { fontSize: 12, color: colors.ember, fontWeight:'500' },
  historyTime: { fontSize: 12, color: colors.inkFaint },
  clearBtn: { backgroundColor: colors.surface, borderWidth:1, borderColor: '#fecaca', borderRadius: 14, paddingVertical: 14, alignItems:'center', marginTop: 20 },
  clearBtnText: { fontSize: 14, fontWeight:'600', color: '#991b1b' },
});
