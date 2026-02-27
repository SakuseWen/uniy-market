import { Card, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Language, translate } from '../lib/i18n';

interface ProductTabsProps {
  description: string;
  specifications?: Record<string, string>;
  language: Language;
}

export function ProductTabs({ description, specifications, language }: ProductTabsProps) {
  const t = (key: any) => translate(language, key);

  return (
    <Card>
      <CardContent className="p-0">
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger
              value="description"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
            >
              {t('description')}
            </TabsTrigger>
            {specifications && (
              <TabsTrigger
                value="specifications"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
              >
                {t('specifications')}
              </TabsTrigger>
            )}
            <TabsTrigger
              value="comments"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
            >
              {t('commentsQA')}
            </TabsTrigger>
          </TabsList>

          {/* Description Tab */}
          <TabsContent value="description" className="p-6">
            <div className="whitespace-pre-wrap">{description}</div>
          </TabsContent>

          {/* Specifications Tab */}
          {specifications && (
            <TabsContent value="specifications" className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">{t('attribute')}</TableHead>
                    <TableHead>{t('detail')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(specifications).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell>{key}</TableCell>
                      <TableCell>{value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          )}

          {/* Comments/Q&A Tab */}
          <TabsContent value="comments" className="p-6">
            <div className="mb-4">
              <Textarea
                placeholder={t('postQuestion')}
                className="mb-2"
              />
              <Button>{t('postQuestion')}</Button>
            </div>

            <div className="text-center py-8 text-gray-500">
              {t('noCommentsYet')}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
