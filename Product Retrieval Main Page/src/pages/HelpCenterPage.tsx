import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Mail, ShieldAlert, HelpCircle, ShoppingCart, MessageCircle, AlertTriangle, BookOpen, GraduationCap } from 'lucide-react';
import { translate } from '../lib/i18n';
import { useLanguage } from '../lib/LanguageContext';
import { Header } from '../components/Header';
import { Toaster } from '../components/ui/sonner';

export default function HelpCenterPage() {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const t = (key: any) => translate(language, key);

  const content = {
    en: {
      title: 'Help Center',
      subtitle: 'Find answers to common questions and get support',
      contactTitle: 'Contact Us',
      contactDesc: 'If you need further assistance, please reach out to the Uniy Market team:',
      contactEmail: 'shaojun.wen@student.mahidol.edu',
      contactNote: 'We typically respond within 24 hours on business days.',
      suspendedTitle: 'Account Suspended?',
      suspendedDesc: 'If your account has been suspended, please contact the administrator via the email above. Include your registered email address and a brief explanation. The admin team will review your case and respond as soon as possible.',
      safetyTitle: 'Transaction Safety',
      safetyItems: [
        'Always meet in public campus areas for face-to-face exchanges.',
        'Test electronics and verify product condition before completing payment.',
        'Never transfer money before receiving and inspecting the item.',
        'Use the in-app chat to keep a record of all communications with the seller.',
        'Report suspicious listings or users immediately using the Report button.',
      ],
      buyingTitle: 'Buying Guide',
      buyingItems: [
        'Browse products on the homepage or use the search and filter tools.',
        'Click "Contact Seller" to start a conversation before purchasing.',
        'Click "Buy / Request" to send a purchase request to the seller.',
        'Once the seller accepts, both parties confirm completion to finalize the deal.',
        'Leave a review after the transaction to help the community.',
      ],
      sellingTitle: 'Selling Guide',
      sellingItems: [
        'Complete Education Verification to unlock the ability to post products.',
        'Click "+ Post Item" and fill in title, description, price, condition, and images.',
        'Respond promptly to buyer inquiries via chat to build trust.',
        'Accept or reject purchase requests from your "My Page" deals tab.',
        'Keep your listings updated — unlist items that are no longer available.',
      ],
      eduTitle: 'Education Verification',
      eduDesc: 'Uniy Market requires education email verification to post products. This ensures all sellers are verified students or staff. Go to "My Page" and click "Education Verification" to get started. Supported domains include .edu, .ac.*, .edu.*, .school, and .university.',
      reportTitle: 'Reporting Issues',
      reportDesc: 'If you encounter inappropriate content, fraud, harassment, or fake products, use the "Report" button on any product listing or user profile. Provide a clear description and evidence images. Our admin team reviews all reports and takes action accordingly.',
      faqTitle: 'Frequently Asked Questions',
      faqs: [
        { q: 'How do I reset my password?', a: 'Click "Forgot password?" on the login page, enter your email, and follow the instructions sent to your inbox.' },
        { q: 'Why can\'t I post a product?', a: 'You need to complete Education Verification first. Go to My Page → Education Verification.' },
        { q: 'How do I delete my account?', a: 'Go to My Page → scroll down → "Delete Account". You will need to verify via email before deletion.' },
        { q: 'Can I edit a product after posting?', a: 'Yes, go to My Page → My Products → click "Edit" on the product you want to update.' },
        { q: 'What payment methods are supported?', a: 'Uniy Market is a peer-to-peer marketplace. Payment is arranged directly between buyer and seller during the exchange.' },
      ],
    },
    zh: {
      title: '帮助中心',
      subtitle: '查找常见问题的答案并获取支持',
      contactTitle: '联系我们',
      contactDesc: '如需进一步帮助，请联系 Uniy Market 团队：',
      contactEmail: 'shaojun.wen@student.mahidol.edu',
      contactNote: '我们通常在工作日 24 小时内回复。',
      suspendedTitle: '账户被禁用？',
      suspendedDesc: '如果您的账户已被暂停，请通过上方邮箱联系管理员。请附上您的注册邮箱和简要说明，管理团队将尽快审核并回复。',
      safetyTitle: '交易安全',
      safetyItems: [
        '面交时请选择校园内的公共区域。',
        '购买电子产品前请先测试并确认商品状况。',
        '在收到并检查商品之前，切勿提前转账。',
        '使用应用内聊天功能保留与卖家的所有沟通记录。',
        '发现可疑商品或用户请立即使用举报按钮。',
      ],
      buyingTitle: '购买指南',
      buyingItems: [
        '在首页浏览商品或使用搜索和筛选工具。',
        '点击"联系卖家"在购买前与卖家沟通。',
        '点击"购买/发起交易"向卖家发送购买请求。',
        '卖家接受后，双方确认完成即可结束交易。',
        '交易完成后请留下评价，帮助社区建设。',
      ],
      sellingTitle: '卖家指南',
      sellingItems: [
        '完成教育认证后即可发布商品。',
        '点击"+ 发布商品"，填写标题、描述、价格、成色和图片。',
        '及时回复买家的聊天咨询以建立信任。',
        '在"我的页面"交易管理中接受或拒绝购买请求。',
        '保持商品信息更新，已售出的商品请及时下架。',
      ],
      eduTitle: '教育认证',
      eduDesc: 'Uniy Market 要求通过教育邮箱认证才能发布商品，以确保所有卖家均为在校学生或教职工。前往"我的页面"点击"教育认证"即可开始。支持的域名包括 .edu、.ac.*、.edu.*、.school 和 .university。',
      reportTitle: '举报问题',
      reportDesc: '如果您遇到不当内容、欺诈、骚扰或虚假商品，请使用商品或用户页面上的"举报"按钮。请提供清晰的描述和证据图片，管理团队会审核所有举报并采取相应措施。',
      faqTitle: '常见问题',
      faqs: [
        { q: '如何重置密码？', a: '在登录页面点击"忘记密码？"，输入邮箱，按照收到的邮件指引操作即可。' },
        { q: '为什么我无法发布商品？', a: '您需要先完成教育认证。前往 我的页面 → 教育认证。' },
        { q: '如何注销账户？', a: '前往 我的页面 → 向下滚动 → "注销此账户"。需要通过邮箱验证后才能删除。' },
        { q: '发布后可以编辑商品吗？', a: '可以，前往 我的页面 → 我的商品 → 点击要修改的商品的"编辑"按钮。' },
        { q: '支持哪些支付方式？', a: 'Uniy Market 是点对点交易平台，付款方式由买卖双方在交易时自行协商。' },
      ],
    },
    th: {
      title: 'ศูนย์ช่วยเหลือ',
      subtitle: 'ค้นหาคำตอบสำหรับคำถามทั่วไปและรับการสนับสนุน',
      contactTitle: 'ติดต่อเรา',
      contactDesc: 'หากต้องการความช่วยเหลือเพิ่มเติม กรุณาติดต่อทีม Uniy Market:',
      contactEmail: 'shaojun.wen@student.mahidol.edu',
      contactNote: 'เรามักจะตอบกลับภายใน 24 ชั่วโมงในวันทำการ',
      suspendedTitle: 'บัญชีถูกระงับ?',
      suspendedDesc: 'หากบัญชีของคุณถูกระงับ กรุณาติดต่อผู้ดูแลระบบผ่านอีเมลด้านบน โปรดแนบอีเมลที่ลงทะเบียนและคำอธิบายสั้นๆ ทีมผู้ดูแลจะตรวจสอบและตอบกลับโดยเร็วที่สุด',
      safetyTitle: 'ความปลอดภัยในการทำธุรกรรม',
      safetyItems: [
        'พบกันในพื้นที่สาธารณะภายในวิทยาเขตเสมอ',
        'ทดสอบอุปกรณ์อิเล็กทรอนิกส์และตรวจสอบสภาพสินค้าก่อนชำระเงิน',
        'อย่าโอนเงินก่อนรับและตรวจสอบสินค้า',
        'ใช้แชทในแอปเพื่อเก็บบันทึกการสื่อสารทั้งหมดกับผู้ขาย',
        'รายงานรายการหรือผู้ใช้ที่น่าสงสัยทันทีโดยใช้ปุ่มรายงาน',
      ],
      buyingTitle: 'คู่มือการซื้อ',
      buyingItems: [
        'เรียกดูสินค้าในหน้าแรกหรือใช้เครื่องมือค้นหาและตัวกรอง',
        'คลิก "ติดต่อผู้ขาย" เพื่อเริ่มสนทนาก่อนซื้อ',
        'คลิก "ซื้อ / ส่งคำขอ" เพื่อส่งคำขอซื้อไปยังผู้ขาย',
        'เมื่อผู้ขายยอมรับ ทั้งสองฝ่ายยืนยันเสร็จสิ้นเพื่อปิดการซื้อขาย',
        'เขียนรีวิวหลังทำธุรกรรมเพื่อช่วยชุมชน',
      ],
      sellingTitle: 'คู่มือการขาย',
      sellingItems: [
        'ยืนยันอีเมลการศึกษาเพื่อปลดล็อกความสามารถในการโพสต์สินค้า',
        'คลิก "+ โพสต์สินค้า" และกรอกชื่อ คำอธิบาย ราคา สภาพ และรูปภาพ',
        'ตอบกลับคำถามของผู้ซื้อผ่านแชทอย่างรวดเร็วเพื่อสร้างความไว้วางใจ',
        'ยอมรับหรือปฏิเสธคำขอซื้อจากแท็บการซื้อขายใน "หน้าของฉัน"',
        'อัปเดตรายการสินค้าของคุณ — ถอดสินค้าที่ไม่มีจำหน่ายแล้วออก',
      ],
      eduTitle: 'การยืนยันการศึกษา',
      eduDesc: 'Uniy Market ต้องการการยืนยันอีเมลการศึกษาเพื่อโพสต์สินค้า เพื่อให้แน่ใจว่าผู้ขายทุกคนเป็นนักศึกษาหรือเจ้าหน้าที่ที่ได้รับการยืนยัน ไปที่ "หน้าของฉัน" แล้วคลิก "ยืนยันการศึกษา" โดเมนที่รองรับ ได้แก่ .edu, .ac.*, .edu.*, .school และ .university',
      reportTitle: 'การรายงานปัญหา',
      reportDesc: 'หากคุณพบเนื้อหาที่ไม่เหมาะสม การฉ้อโกง การคุกคาม หรือสินค้าปลอม ให้ใช้ปุ่ม "รายงาน" บนรายการสินค้าหรือโปรไฟล์ผู้ใช้ ให้คำอธิบายที่ชัดเจนและรูปภาพหลักฐาน ทีมผู้ดูแลจะตรวจสอบรายงานทั้งหมดและดำเนินการตามความเหมาะสม',
      faqTitle: 'คำถามที่พบบ่อย',
      faqs: [
        { q: 'ฉันจะรีเซ็ตรหัสผ่านได้อย่างไร?', a: 'คลิก "ลืมรหัสผ่าน?" ในหน้าเข้าสู่ระบบ กรอกอีเมล แล้วทำตามคำแนะนำที่ส่งไปยังกล่องจดหมายของคุณ' },
        { q: 'ทำไมฉันโพสต์สินค้าไม่ได้?', a: 'คุณต้องยืนยันการศึกษาก่อน ไปที่ หน้าของฉัน → ยืนยันการศึกษา' },
        { q: 'ฉันจะลบบัญชีได้อย่างไร?', a: 'ไปที่ หน้าของฉัน → เลื่อนลง → "ลบบัญชี" คุณต้องยืนยันผ่านอีเมลก่อนลบ' },
        { q: 'แก้ไขสินค้าหลังโพสต์ได้ไหม?', a: 'ได้ ไปที่ หน้าของฉัน → สินค้าของฉัน → คลิก "แก้ไข" บนสินค้าที่ต้องการอัปเดต' },
        { q: 'รองรับวิธีการชำระเงินอะไรบ้าง?', a: 'Uniy Market เป็นตลาดแบบ peer-to-peer การชำระเงินจะตกลงกันโดยตรงระหว่างผู้ซื้อและผู้ขายระหว่างการแลกเปลี่ยน' },
      ],
    },
  };

  const c = content[language] || content.en;

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <div className="sticky top-0 z-50">
        <Header language={language} onLanguageChange={setLanguage} />
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="text-center mb-2">
          <h1 className="text-2xl font-semibold flex items-center justify-center gap-2"><HelpCircle className="w-6 h-6 text-blue-600" />{c.title}</h1>
          <p className="text-gray-500 mt-1">{c.subtitle}</p>
        </div>

        {/* Contact */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Mail className="w-5 h-5 text-blue-600" />{c.contactTitle}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-600">{c.contactDesc}</p>
            <a href={`mailto:${c.contactEmail}`} className="text-blue-600 font-medium hover:underline">{c.contactEmail}</a>
            <p className="text-xs text-gray-400">{c.contactNote}</p>
          </CardContent>
        </Card>

        {/* Suspended Account */}
        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-orange-600" />{c.suspendedTitle}</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-gray-700">{c.suspendedDesc}</p></CardContent>
        </Card>

        {/* Transaction Safety */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-yellow-600" />{c.safetyTitle}</CardTitle></CardHeader>
          <CardContent><ul className="space-y-2">{c.safetyItems.map((item, i) => <li key={i} className="text-sm text-gray-600 flex gap-2"><span className="text-yellow-500 mt-0.5">•</span>{item}</li>)}</ul></CardContent>
        </Card>

        {/* Buying Guide */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-green-600" />{c.buyingTitle}</CardTitle></CardHeader>
          <CardContent><ol className="space-y-2">{c.buyingItems.map((item, i) => <li key={i} className="text-sm text-gray-600 flex gap-2"><span className="text-green-500 font-semibold">{i + 1}.</span>{item}</li>)}</ol></CardContent>
        </Card>

        {/* Selling Guide */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-purple-600" />{c.sellingTitle}</CardTitle></CardHeader>
          <CardContent><ol className="space-y-2">{c.sellingItems.map((item, i) => <li key={i} className="text-sm text-gray-600 flex gap-2"><span className="text-purple-500 font-semibold">{i + 1}.</span>{item}</li>)}</ol></CardContent>
        </Card>

        {/* Education Verification */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap className="w-5 h-5 text-blue-600" />{c.eduTitle}</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-gray-600">{c.eduDesc}</p></CardContent>
        </Card>

        {/* Reporting */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><MessageCircle className="w-5 h-5 text-red-500" />{c.reportTitle}</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-gray-600">{c.reportDesc}</p></CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><HelpCircle className="w-5 h-5 text-gray-600" />{c.faqTitle}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {c.faqs.map((faq, i) => (
              <div key={i}>
                <p className="text-sm font-medium text-gray-800">{faq.q}</p>
                <p className="text-sm text-gray-500 mt-1">{faq.a}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
