/**
 * TranslateButton — 可复用的翻译触发按钮
 * TranslateButton — Reusable translation trigger button
 *
 * 点击后调用后端翻译 API，将结果展示在原文下方，不覆盖原文。
 * On click, calls backend translation API and shows result below original text.
 */
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Language, translate } from '../lib/i18n';
import apiClient from '../services/api';
import { toast } from 'sonner';

interface TranslateButtonProps {
  /** 待翻译的原始文本 / Original text to translate */
  text: string;
  /** 当前 UI 语言，作为翻译目标语言 / Current UI language as translation target */
  language: Language;
  /** 额外的 CSS 类名 / Additional CSS class names */
  className?: string;
}

export function TranslateButton({ text, language, className = '' }: TranslateButtonProps) {
  const t = (key: any) => translate(language, key);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  // 语言代码映射 / Language code mapping
  const langMap: Record<Language, string> = {
    zh: 'zh-CN',
    en: 'en',
    th: 'th',
  };

  const handleTranslate = async () => {
    // 已有翻译结果时切换显示/隐藏 / Toggle show/hide if already translated
    if (translatedText) {
      setShowOriginal(prev => !prev);
      return;
    }
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await apiClient.post('/chats/translate-text', {
        text,
        targetLanguage: langMap[language],
      });
      setTranslatedText(res.data.data?.translatedText || '');
    } catch (err: any) {
      if (err?.response?.status === 401) {
        toast.error(t('loginToTranslate'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      {/* 翻译触发按钮 / Translation trigger button */}
      <button
        onClick={handleTranslate}
        disabled={loading}
        className="mt-2 inline-flex items-center gap-1 border border-gray-200 rounded px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <><Loader2 className="w-3 h-3 animate-spin" />{t('translating')}</>
        ) : translatedText && !showOriginal ? (
          t('showOriginal')
        ) : (
          t('translate')
        )}
      </button>

      {/* 翻译结果展示在原文下方 / Translation result shown below original */}
      {translatedText && !showOriginal && (
        <p className="mt-1 text-xs text-gray-400 italic border-l-2 border-gray-200 pl-2">
          {translatedText}
        </p>
      )}
    </div>
  );
}
