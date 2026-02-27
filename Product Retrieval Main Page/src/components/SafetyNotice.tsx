import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { Language, translate } from '../lib/i18n';

interface SafetyNoticeProps {
  language: Language;
}

export function SafetyNotice({ language }: SafetyNoticeProps) {
  const t = (key: any) => translate(language, key);

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-900">{t('safetyReminder')}</AlertTitle>
      <AlertDescription className="text-orange-800">
        {t('safetyReminderText')}
        <Button variant="link" className="h-auto p-0 ml-2 text-orange-900">
          {t('readSafetyPolicy')}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
