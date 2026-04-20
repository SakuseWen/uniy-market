import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Language, translate } from '../lib/i18n';
import { useAuth } from '../services/authContext';
import apiClient from '../services/api';
import { Loader2, MessageCircle, Reply } from 'lucide-react';
import { TranslateButton } from './TranslateButton';
import { getImageUrl } from '../lib/config';

interface Comment {
  commentID: string;
  listingID: string;
  userID: string;
  content: string;
  parentID: string | null;
  createdAt: string;
  name: string;
  profileImage: string | null;
  replies?: Comment[];
}

interface ProductTabsProps {
  description: string;
  specifications?: Record<string, string>;
  language: Language;
  listingID?: string;
  sellerID?: string;
}

export function ProductTabs({ description, specifications, language, listingID, sellerID }: ProductTabsProps) {
  const t = (key: any) => translate(language, key);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    if (!listingID) return;
    setLoadingComments(true);
    apiClient.get(`/comments/${listingID}`)
      .then(res => setComments(res.data.comments || []))
      .catch(err => console.error('Load comments error:', err))
      .finally(() => setLoadingComments(false));
  }, [listingID]);

  const handlePostComment = async () => {
    if (!user) { navigate('/login'); return; }
    if (!newComment.trim() || !listingID) return;
    setPosting(true);
    try {
      const res = await apiClient.post('/comments', { listingID, content: newComment });
      setComments(prev => [{ ...res.data.comment, replies: [] }, ...prev]);
      setNewComment('');
    } catch (err) { console.error('Post comment error:', err); }
    finally { setPosting(false); }
  };

  const handleReply = async (parentID: string) => {
    if (!replyContent.trim() || !listingID) return;
    setPosting(true);
    try {
      const res = await apiClient.post('/comments', { listingID, content: replyContent, parentID });
      setComments(prev => prev.map(c =>
        c.commentID === parentID ? { ...c, replies: [...(c.replies || []), res.data.comment] } : c
      ));
      setReplyTo(null);
      setReplyContent('');
    } catch (err) { console.error('Reply error:', err); }
    finally { setPosting(false); }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(language === 'zh' ? 'zh-CN' : language === 'th' ? 'th-TH' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.commentID} className={`flex gap-3 ${isReply ? 'ml-12 mt-3' : 'py-4 border-b last:border-b-0'}`}>
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarImage src={comment.profileImage?.startsWith('/') ? getImageUrl(comment.profileImage) : comment.profileImage || ''} />
        <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white">
          {comment.name?.substring(0, 2).toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm">{comment.name}</span>
          {comment.userID === sellerID && (
            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{t('seller') || 'Seller'}</span>
          )}
          <span className="text-xs text-gray-400">{formatTime(comment.createdAt)}</span>
        </div>
        <p className="text-sm text-gray-700">{comment.content}</p>
        {/* 评论翻译按钮 / Comment translate button */}
        {comment.content && (
          <TranslateButton text={comment.content} language={language} className="mb-1" />
        )}
        {!isReply && user && user.userID === sellerID && (
          <button className="text-xs text-blue-600 mt-1 flex items-center gap-1" onClick={() => setReplyTo(replyTo === comment.commentID ? null : comment.commentID)}>
            <Reply className="w-3 h-3" /> {t('reply') || 'Reply'}
          </button>
        )}
        {replyTo === comment.commentID && (
          <div className="mt-2 flex gap-2">
            <Textarea value={replyContent} onChange={e => setReplyContent(e.target.value)} placeholder={t('writeReply') || 'Write a reply...'} className="text-sm" rows={2} />
            <Button size="sm" onClick={() => handleReply(comment.commentID)} disabled={posting || !replyContent.trim()}>
              {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : t('send') || 'Send'}
            </Button>
          </div>
        )}
        {comment.replies?.map(reply => renderComment(reply, true))}
      </div>
    </div>
  );

  return (
    <Card>
      <CardContent className="p-0">
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent">
              {t('description')}
            </TabsTrigger>
            {specifications && (
              <TabsTrigger value="specifications" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent">
                {t('specifications')}
              </TabsTrigger>
            )}
            <TabsTrigger value="comments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent">
              {t('commentsQA')} ({comments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="p-6">
            <div className="whitespace-pre-wrap">{description}</div>
            {/* 商品描述翻译按钮 / Product description translate button */}
            {description && (
              <TranslateButton text={description} language={language} />
            )}
          </TabsContent>

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

          <TabsContent value="comments" className="p-6">
            {/* Post comment */}
            <div className="mb-6">
              <Textarea
                placeholder={user ? (t('postQuestion') || 'Ask a question...') : (t('loginToComment') || 'Login to comment')}
                value={newComment}
                onChange={e => { if (!user) { navigate('/login'); return; } setNewComment(e.target.value); }}
                onFocus={() => { if (!user) navigate('/login'); }}
                className="mb-2"
                rows={3}
              />
              <Button onClick={handlePostComment} disabled={posting || !newComment.trim() || !user} className="gap-1">
                {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                {t('postQuestion')}
              </Button>
            </div>

            {/* Comments list */}
            {loadingComments ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">{t('noCommentsYet')}</div>
            ) : (
              <div>{comments.map(c => renderComment(c))}</div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
